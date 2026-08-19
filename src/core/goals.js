/**
 * OpenExpense — savings-goal normalization and feasibility math
 *
 * Goals are ordered by priority. Current savings and monthly surplus flow
 * through that order once, so two goals cannot both claim the same dollars.
 * Required pace follows CFPB savings-plan guidance: amount still needed ÷
 * time remaining.
 */
import { Utils } from './utils.js';
import { FILE_LIMITS } from './limits.js';

export const GOAL_STATES = Object.freeze({
    NO_AMOUNT: 'no-amount',
    ACHIEVABLE: 'achievable',
    UNACHIEVABLE: 'unachievable'
});

const GOAL_ID = /^[a-f0-9]{32}$/;
const DATE_KEY = /^\d{4}-\d{2}-\d{2}$/;
const AVERAGE_DAYS_PER_MONTH = 365.25 / 12;

function validDateKey(value) {
    const key = String(value || '');
    if (!DATE_KEY.test(key)) return false;
    const [year, month, day] = key.split('-').map(Number);
    const date = new Date(Date.UTC(year, month - 1, day));
    return date.getUTCFullYear() === year
        && date.getUTCMonth() === month - 1
        && date.getUTCDate() === day;
}

function normalizeGoalId(value) {
    const id = String(value || '').trim().toLowerCase();
    return GOAL_ID.test(id) ? id : '';
}

export function createGoalId() {
    const bytes = new Uint8Array(16);
    if (globalThis.crypto?.getRandomValues) {
        globalThis.crypto.getRandomValues(bytes);
        return [...bytes].map((byte) => byte.toString(16).padStart(2, '0')).join('');
    }
    // Tests and older non-secure contexts still get a bounded local identity.
    return Array.from({ length: 4 }, () => (
        Math.floor(Math.random() * 0x100000000).toString(16).padStart(8, '0')
    )).join('');
}

export function sanitizeGoal(raw) {
    if (!raw || typeof raw !== 'object' || Array.isArray(raw)) return null;
    const title = String(raw.title || '').replace(/\s+/g, ' ').trim().slice(0, FILE_LIMITS.maxGoalTitle);
    const targetDate = String(raw.targetDate || '').trim();
    if (!title || !validDateKey(targetDate)) return null;

    const goal = {
        id: normalizeGoalId(raw.id) || createGoalId(),
        title,
        targetDate
    };
    const target = Number(raw.targetAmount);
    if (Number.isFinite(target) && target > 0 && target <= FILE_LIMITS.maxPrice) {
        goal.targetAmount = Utils.fromCents(Utils.toCents(target));
    }
    const createdAt = Number(raw.createdAt);
    goal.createdAt = Number.isFinite(createdAt) && createdAt > 0 ? Math.floor(createdAt) : Date.now();
    return goal;
}

export function sanitizeGoals(raw) {
    if (!Array.isArray(raw)) return [];
    const goals = [];
    const ids = new Set();
    for (const candidate of raw) {
        if (goals.length >= FILE_LIMITS.maxGoals) break;
        const goal = sanitizeGoal(candidate);
        if (!goal || ids.has(goal.id)) continue;
        ids.add(goal.id);
        goals.push(goal);
    }
    return goals;
}

function utcDayNumber(value) {
    const key = value instanceof Date
        ? Utils.dateKey(value.getFullYear(), value.getMonth(), value.getDate())
        : String(value || '');
    if (!validDateKey(key)) return null;
    const [year, month, day] = key.split('-').map(Number);
    return Date.UTC(year, month - 1, day) / 86400000;
}

export function goalDaysRemaining(targetDate, asOf = new Date()) {
    const target = utcDayNumber(targetDate);
    const today = utcDayNumber(asOf);
    if (target == null || today == null) return 0;
    return Math.max(0, Math.round(target - today));
}

function money(value) {
    return Utils.fromCents(Math.max(0, Math.round(value)));
}

/**
 * Allocate savings and monthly surplus in goal order.
 *
 * @param {object[]} rawGoals
 * @param {object} inputs
 * @param {number} inputs.currentSavings Existing bank savings available to earmark.
 * @param {number} inputs.monthlySurplus Income remaining after counted expenses.
 * @param {Date} [inputs.asOf]
 */
export function assessGoals(rawGoals, {
    currentSavings = 0,
    monthlySurplus = 0,
    asOf = new Date()
} = {}) {
    const goals = sanitizeGoals(rawGoals);
    let savingsCents = Math.max(0, Utils.toCents(currentSavings));
    let monthlyCents = Math.max(0, Utils.toCents(monthlySurplus));
    let totalRequiredMonthlyCents = 0;
    let totalAllocatedMonthlyCents = 0;

    const rows = goals.map((goal) => {
        const targetCents = Utils.toCents(goal.targetAmount);
        const daysRemaining = goalDaysRemaining(goal.targetDate, asOf);
        if (targetCents <= 0) {
            return {
                ...goal,
                state: GOAL_STATES.NO_AMOUNT,
                daysRemaining,
                currentAllocation: 0,
                requiredDaily: 0,
                requiredMonthly: 0,
                monthlyAllocation: 0,
                projectedAmount: 0,
                shortfall: 0,
                progress: 0
            };
        }

        const currentAllocationCents = Math.min(savingsCents, targetCents);
        savingsCents -= currentAllocationCents;
        const remainingCents = Math.max(0, targetCents - currentAllocationCents);
        const paceDays = Math.max(1, daysRemaining);
        const requiredDailyCents = remainingCents / paceDays;
        const requiredMonthlyCents = requiredDailyCents * AVERAGE_DAYS_PER_MONTH;
        const monthlyAllocationCents = daysRemaining > 0
            ? Math.min(monthlyCents, Math.ceil(requiredMonthlyCents))
            : 0;
        monthlyCents -= monthlyAllocationCents;
        totalRequiredMonthlyCents += Math.ceil(requiredMonthlyCents);
        totalAllocatedMonthlyCents += monthlyAllocationCents;

        const monthsRemaining = daysRemaining / AVERAGE_DAYS_PER_MONTH;
        const projectedCents = Math.min(
            targetCents,
            currentAllocationCents + Math.round(monthlyAllocationCents * monthsRemaining)
        );
        const shortfallCents = Math.max(0, targetCents - projectedCents);
        const achievable = projectedCents >= targetCents;
        return {
            ...goal,
            state: achievable ? GOAL_STATES.ACHIEVABLE : GOAL_STATES.UNACHIEVABLE,
            daysRemaining,
            currentAllocation: money(currentAllocationCents),
            requiredDaily: money(requiredDailyCents),
            requiredMonthly: money(requiredMonthlyCents),
            monthlyAllocation: money(monthlyAllocationCents),
            projectedAmount: money(projectedCents),
            shortfall: money(shortfallCents),
            progress: targetCents > 0 ? Math.min(1, currentAllocationCents / targetCents) : 0
        };
    });

    return {
        goals: rows,
        totalRequiredMonthly: money(totalRequiredMonthlyCents),
        totalAllocatedMonthly: money(totalAllocatedMonthlyCents),
        unallocatedMonthlySurplus: money(monthlyCents),
        unallocatedCurrentSavings: money(savingsCents)
    };
}

export function goalMilestones(rawGoals, year) {
    return sanitizeGoals(rawGoals)
        .filter((goal) => Number(goal.targetDate.slice(0, 4)) === Number(year))
        .map((goal) => ({
            index: Number(goal.targetDate.slice(5, 7)) - 1,
            label: goal.title,
            date: goal.targetDate
        }));
}
