/**
 * OpenExpense — savings-goal normalization and feasibility math
 *
 * Goals are ordered by priority. Current savings and monthly surplus flow
 * through that order once, so two goals cannot both claim the same dollars.
 * Required pace follows CFPB savings-plan guidance: amount still needed ÷
 * time remaining. Week, month, and year holds are that period's share,
 * capped at the remaining amount — never a daily rate stretched across
 * 30.44 or 365.25 days.
 */
import { Utils } from './utils.js';
import { FILE_LIMITS } from './limits.js';

export const GOAL_STATES = Object.freeze({
    NO_AMOUNT: 'no-amount',
    COMPLETE: 'complete',
    AHEAD: 'ahead',
    ACHIEVABLE: 'achievable',
    BEHIND: 'behind',
    UNACHIEVABLE: 'unachievable'
});

export const GOAL_HORIZONS = Object.freeze({
    WEEKLY: 'weekly',
    MONTHLY: 'monthly',
    YEARLY: 'yearly',
    CUSTOM: 'custom'
});

export const GOAL_PACE_VIEWS = Object.freeze({
    DAY: 'day',
    WEEK: 'week',
    MONTH: 'month',
    YEAR: 'year'
});

const GOAL_ID = /^[a-f0-9]{32}$/;
const DATE_KEY = /^\d{4}-\d{2}-\d{2}$/;
const AVERAGE_DAYS_PER_MONTH = 365.25 / 12;
const AVERAGE_DAYS_PER_YEAR = 365.25;
const DAYS_PER_WEEK = 7;
const MAX_GOAL_NOTE = 200;
const HORIZON_IDS = new Set(Object.values(GOAL_HORIZONS));

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

function localDate(asOf = new Date()) {
    const date = asOf instanceof Date && !Number.isNaN(asOf.getTime())
        ? asOf
        : new Date();
    return new Date(date.getFullYear(), date.getMonth(), date.getDate());
}

function dateKeyFromLocal(date) {
    return Utils.dateKey(date.getFullYear(), date.getMonth(), date.getDate());
}

export function calendarDaysInMonth(asOf = new Date()) {
    const date = localDate(asOf);
    return new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate();
}

export function calendarDaysInYear(asOf = new Date()) {
    const date = localDate(asOf);
    const year = date.getFullYear();
    return (Date.UTC(year + 1, 0, 1) - Date.UTC(year, 0, 1)) / 86400000;
}

export function daysLeftInMonth(asOf = new Date()) {
    const date = localDate(asOf);
    return calendarDaysInMonth(date) - date.getDate() + 1;
}

export function addCalendarDays(asOf, days) {
    const date = localDate(asOf);
    date.setDate(date.getDate() + Number(days || 0));
    return dateKeyFromLocal(date);
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

export function normalizeGoalHorizon(value) {
    const key = String(value || '').trim().toLowerCase();
    return HORIZON_IDS.has(key) ? key : '';
}

/**
 * Last day of this month when enough time remains; otherwise the next
 * month-end, next week, or the same calendar day next year.
 */
export function targetDateForHorizon(horizon, asOf = new Date()) {
    const date = localDate(asOf);
    const id = normalizeGoalHorizon(horizon) || GOAL_HORIZONS.CUSTOM;
    if (id === GOAL_HORIZONS.WEEKLY) {
        date.setDate(date.getDate() + 7);
        return dateKeyFromLocal(date);
    }
    if (id === GOAL_HORIZONS.MONTHLY) {
        const lastThis = new Date(date.getFullYear(), date.getMonth() + 1, 0);
        const end = lastThis.getDate() - date.getDate() >= 2
            ? lastThis
            : new Date(date.getFullYear(), date.getMonth() + 2, 0);
        return dateKeyFromLocal(end);
    }
    if (id === GOAL_HORIZONS.YEARLY) {
        const next = new Date(date.getFullYear() + 1, date.getMonth(), date.getDate());
        if (next.getMonth() !== date.getMonth()) {
            return dateKeyFromLocal(new Date(date.getFullYear() + 1, date.getMonth() + 1, 0));
        }
        return dateKeyFromLocal(next);
    }
    return dateKeyFromLocal(date);
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
    const horizon = normalizeGoalHorizon(raw.horizon);
    if (horizon) goal.horizon = horizon;
    const note = String(raw.note || '').replace(/\s+/g, ' ').trim().slice(0, MAX_GOAL_NOTE);
    if (note) goal.note = note;
    const alreadySaved = Number(raw.alreadySaved);
    if (Number.isFinite(alreadySaved) && alreadySaved > 0 && alreadySaved <= FILE_LIMITS.maxPrice) {
        goal.alreadySaved = Utils.fromCents(Utils.toCents(alreadySaved));
    }
    if (raw.includeBankSavings === false) goal.includeBankSavings = false;
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
    // Inclusive of today so end-of-month goals match days left on the
    // leftover gauge. Yesterday and earlier are already past due.
    return Math.max(0, Math.round(target - today) + 1);
}

function money(value) {
    return Utils.fromCents(Math.max(0, Math.round(value)));
}

function emptyAssessment(goal, daysRemaining) {
    return {
        ...goal,
        horizon: goal.horizon || GOAL_HORIZONS.CUSTOM,
        state: GOAL_STATES.NO_AMOUNT,
        daysRemaining,
        weeksRemaining: daysRemaining / 7,
        monthsRemaining: daysRemaining / AVERAGE_DAYS_PER_MONTH,
        yearsRemaining: daysRemaining / AVERAGE_DAYS_PER_YEAR,
        currentAllocation: 0,
        requiredDaily: 0,
        requiredWeekly: 0,
        requiredMonthly: 0,
        requiredThisMonth: 0,
        requiredYearly: 0,
        monthlyAllocation: 0,
        projectedAmount: 0,
        shortfall: 0,
        progress: 0,
        expectedProgress: 0,
        projectedDate: '',
        leftoverAfterGoal: 0
    };
}

function expectedLinearProgress(goal, daysRemaining) {
    const created = Number(goal.createdAt);
    if (!Number.isFinite(created) || created <= 0) return 0;
    const span = goalDaysRemaining(goal.targetDate, new Date(created));
    if (span <= 0) return daysRemaining <= 0 ? 1 : 0;
    const elapsed = Math.max(0, span - daysRemaining);
    return Math.min(1, elapsed / span);
}

function classifyGoal({
    remainingCents,
    projectedCents,
    targetCents,
    currentAllocationCents,
    daysRemaining,
    expectedProgress
}) {
    if (targetCents <= 0) return GOAL_STATES.NO_AMOUNT;
    if (remainingCents <= 0 || currentAllocationCents >= targetCents) return GOAL_STATES.COMPLETE;
    // Still time left: leftover of $0 is behind, not impossible.
    if (daysRemaining <= 0) return GOAL_STATES.UNACHIEVABLE;
    if (projectedCents >= targetCents) {
        const fundedShare = targetCents > 0 ? currentAllocationCents / targetCents : 0;
        return fundedShare > expectedProgress + 0.05
            ? GOAL_STATES.AHEAD
            : GOAL_STATES.ACHIEVABLE;
    }
    return GOAL_STATES.BEHIND;
}

/**
 * Date a leftover amount is finished if a monthly contribution continues.
 * Uses the viewed month's length so the lab matches the hold math.
 */
export function finishDateAtMonthlyPace(remainingAmount, monthlyAmount, asOf = new Date()) {
    const remaining = Math.max(0, Utils.toCents(remainingAmount));
    const monthly = Math.max(0, Utils.toCents(monthlyAmount));
    if (remaining <= 0) {
        return { date: dateKeyFromLocal(localDate(asOf)), months: 0, days: 0 };
    }
    if (monthly <= 0) return { date: '', months: null, days: null };
    const daysInMonth = calendarDaysInMonth(asOf);
    const days = Math.ceil(remaining * daysInMonth / monthly);
    return {
        date: addCalendarDays(asOf, days),
        months: remaining / monthly,
        days
    };
}

function periodShare(remainingCents, periodDays, paceDays) {
    return remainingCents * Math.min(1, periodDays / paceDays);
}

export function requiredPaceForAmount(remainingAmount, daysRemaining, asOf = new Date()) {
    const remaining = Math.max(0, Utils.toCents(remainingAmount));
    const paceDays = Math.max(1, Number(daysRemaining) || 0);
    const requiredDaily = remaining / paceDays;
    return {
        daily: money(requiredDaily),
        weekly: money(periodShare(remaining, DAYS_PER_WEEK, paceDays)),
        monthly: money(periodShare(remaining, calendarDaysInMonth(asOf), paceDays)),
        yearly: money(periodShare(remaining, calendarDaysInYear(asOf), paceDays))
    };
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
    let totalRequiredDailyCents = 0;
    let totalRequiredWeeklyCents = 0;
    let totalRequiredYearlyCents = 0;
    let totalAllocatedMonthlyCents = 0;
    const daysInMonth = calendarDaysInMonth(asOf);
    const daysInYear = calendarDaysInYear(asOf);

    const rows = goals.map((goal) => {
        const daysRemaining = goalDaysRemaining(goal.targetDate, asOf);
        const targetCents = Utils.toCents(goal.targetAmount);
        if (targetCents <= 0) {
            return emptyAssessment(goal, daysRemaining);
        }

        const seededCents = Math.min(targetCents, Utils.toCents(goal.alreadySaved));
        const bankEligible = goal.includeBankSavings !== false;
        const fromBankCents = bankEligible
            ? Math.min(savingsCents, Math.max(0, targetCents - seededCents))
            : 0;
        if (bankEligible) savingsCents -= fromBankCents;
        const currentAllocationCents = seededCents + fromBankCents;
        const remainingCents = Math.max(0, targetCents - currentAllocationCents);
        const paceDays = Math.max(1, daysRemaining);
        const requiredDailyCents = remainingCents / paceDays;
        const requiredWeeklyCents = periodShare(remainingCents, DAYS_PER_WEEK, paceDays);
        const requiredYearlyCents = periodShare(remainingCents, daysInYear, paceDays);
        const requiredThisMonthCents = periodShare(remainingCents, daysInMonth, paceDays);
        const requiredThisMonthCeil = Math.ceil(requiredThisMonthCents);
        const monthlyAllocationCents = daysRemaining > 0
            ? Math.min(monthlyCents, requiredThisMonthCeil)
            : 0;
        monthlyCents -= monthlyAllocationCents;
        totalRequiredMonthlyCents += requiredThisMonthCeil;
        totalRequiredDailyCents += requiredDailyCents;
        totalRequiredWeeklyCents += requiredWeeklyCents;
        totalRequiredYearlyCents += requiredYearlyCents;
        totalAllocatedMonthlyCents += monthlyAllocationCents;

        const projectedFromPace = paceDays <= daysInMonth
            ? monthlyAllocationCents
            : Math.round(monthlyAllocationCents * paceDays / daysInMonth);
        const projectedCents = Math.min(
            targetCents,
            currentAllocationCents + Math.max(0, projectedFromPace)
        );
        const shortfallCents = Math.max(0, targetCents - projectedCents);
        const expectedProgress = expectedLinearProgress(goal, daysRemaining);
        const state = classifyGoal({
            remainingCents,
            projectedCents,
            targetCents,
            currentAllocationCents,
            daysRemaining,
            expectedProgress
        });
        const finish = finishDateAtMonthlyPace(
            Utils.fromCents(remainingCents),
            Utils.fromCents(monthlyAllocationCents),
            asOf
        );

        return {
            ...goal,
            horizon: goal.horizon || GOAL_HORIZONS.CUSTOM,
            state,
            daysRemaining,
            weeksRemaining: daysRemaining / 7,
            monthsRemaining: daysRemaining / AVERAGE_DAYS_PER_MONTH,
            yearsRemaining: daysRemaining / AVERAGE_DAYS_PER_YEAR,
            currentAllocation: money(currentAllocationCents),
            requiredDaily: money(requiredDailyCents),
            requiredWeekly: money(requiredWeeklyCents),
            requiredMonthly: money(requiredThisMonthCeil),
            requiredThisMonth: money(requiredThisMonthCeil),
            requiredYearly: money(requiredYearlyCents),
            monthlyAllocation: money(monthlyAllocationCents),
            projectedAmount: money(projectedCents),
            shortfall: money(shortfallCents),
            progress: targetCents > 0 ? Math.min(1, currentAllocationCents / targetCents) : 0,
            expectedProgress,
            projectedDate: remainingCents <= 0
                ? dateKeyFromLocal(localDate(asOf))
                : finish.date,
            leftoverAfterGoal: money(monthlyCents)
        };
    });

    return {
        goals: rows,
        totalRequiredMonthly: money(totalRequiredMonthlyCents),
        totalRequiredDaily: money(totalRequiredDailyCents),
        totalRequiredWeekly: money(totalRequiredWeeklyCents),
        totalRequiredYearly: money(totalRequiredYearlyCents),
        totalAllocatedMonthly: money(totalAllocatedMonthlyCents),
        unallocatedMonthlySurplus: money(monthlyCents),
        unallocatedCurrentSavings: money(savingsCents)
    };
}

export function goalPaceAmount(goal, pace = GOAL_PACE_VIEWS.MONTH) {
    if (pace === GOAL_PACE_VIEWS.DAY) return Number(goal.requiredDaily) || 0;
    if (pace === GOAL_PACE_VIEWS.WEEK) return Number(goal.requiredWeekly) || 0;
    if (pace === GOAL_PACE_VIEWS.YEAR) return Number(goal.requiredYearly) || 0;
    return Number(goal.requiredMonthly) || 0;
}

export function goalPaceLabel(pace = GOAL_PACE_VIEWS.MONTH) {
    if (pace === GOAL_PACE_VIEWS.DAY) return 'day';
    if (pace === GOAL_PACE_VIEWS.WEEK) return 'week';
    if (pace === GOAL_PACE_VIEWS.YEAR) return 'this year';
    return 'this month';
}

const AT_RISK_STATES = new Set([
    GOAL_STATES.UNACHIEVABLE,
    GOAL_STATES.BEHIND
]);

/** Priced goals that current surplus cannot finish on time. */
export function atRiskGoals(assessment) {
    return (assessment?.goals || []).filter((goal) => (
        Number(goal.targetAmount) > 0
        && (
            AT_RISK_STATES.has(goal.state)
            || Number(goal.shortfall) > 0
        )
    ));
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
