/**
 * OpenExpense — planner rules and leftover math
 *
 * A `plan` rides on the ledger next to `budgets`. Defaults match the original
 * cash line: deposited income minus every logged bill, with nothing withheld.
 *
 * Waterfall (each step is whole cents):
 *   counted income
 *   − tax withhold  = after-tax income
 *   − savings hold  = spendable income
 *   − counted spend = left to spend
 *
 * Savings hold is the weekly month-equivalent (when reserve is on), plus a
 * fixed monthly goal, plus a percent of after-tax income. The 50/30/20
 * (or custom) ratios are a scoreboard against after-tax income — they do
 * not withhold a second time. See docs/DATA-FORMAT.md for the citations.
 */
import { Utils } from './utils.js';

export const PLAN_DEFAULTS = Object.freeze({
    weeklySavings: 0,
    reserveSavings: true,
    spendBasis: 'logged',
    incomeBasis: 'deposited',
    taxWithholdPct: 0,
    savingsPct: 0,
    savingsFixed: 0,
    ratioNeeds: 50,
    ratioWants: 30,
    ratioSave: 20
});

/**
 * Warren / CFPB "needs" are the bills that keep housing, food at home,
 * getting to work, and health going. Mapped onto this app's labels.
 */
export const RATIO_NEEDS = Object.freeze([
    'Housing', 'Utilities', 'Health', 'Transit', 'Groceries'
]);

/**
 * Warren / CFPB "wants" are lifestyle and discretionary spend. Subscriptions
 * sit here (Netflix is a want; the electric bill is a need).
 */
export const RATIO_WANTS = Object.freeze([
    'Dining', 'Coffee', 'Entertainment', 'Shopping', 'Travel', 'Subscriptions'
]);

const NEEDS = new Set(RATIO_NEEDS.map((label) => label.toLowerCase()));
const WANTS = new Set(RATIO_WANTS.map((label) => label.toLowerCase()));

function addMoney(...values) {
    return Utils.fromCents(values.reduce((sum, value) => sum + Utils.toCents(value), 0));
}

function subMoney(left, right) {
    return Utils.fromCents(Utils.toCents(left) - Utils.toCents(right));
}

function clampPct(value, max = 100) {
    const n = Number(value);
    if (!Number.isFinite(n) || n <= 0) return 0;
    return Math.min(max, Utils.fromCents(Utils.toCents(n)));
}

function clampInt(value, fallback, min, max) {
    const n = Number(value);
    if (!Number.isFinite(n)) return fallback;
    return Math.max(min, Math.min(max, Math.round(n)));
}

export function percentOf(amount, pct) {
    const p = Number(pct) || 0;
    const base = Number(amount) || 0;
    if (p <= 0 || base === 0) return 0;
    return Utils.fromCents(Utils.toCents(base * p / 100));
}

function sanitizeRatios(src) {
    let needs = clampInt(src.ratioNeeds, 50, 0, 100);
    let wants = clampInt(src.ratioWants, 30, 0, 100);
    let save = clampInt(src.ratioSave, 20, 0, 100);
    const sum = needs + wants + save;
    if (sum <= 0) return { ratioNeeds: 50, ratioWants: 30, ratioSave: 20 };
    if (sum === 100) return { ratioNeeds: needs, ratioWants: wants, ratioSave: save };
    const scaledNeeds = Math.round(needs / sum * 100);
    const scaledWants = Math.round(wants / sum * 100);
    return {
        ratioNeeds: scaledNeeds,
        ratioWants: scaledWants,
        ratioSave: Math.max(0, 100 - scaledNeeds - scaledWants)
    };
}

export function sanitizePlan(raw) {
    const src = raw && typeof raw === 'object' && !Array.isArray(raw) ? raw : {};
    const weekly = Number(src.weeklySavings);
    const fixed = Number(src.savingsFixed);
    return {
        weeklySavings: Number.isFinite(weekly) && weekly > 0 ? Utils.fromCents(Utils.toCents(weekly)) : 0,
        reserveSavings: src.reserveSavings !== false,
        spendBasis: src.spendBasis === 'paid' ? 'paid' : 'logged',
        incomeBasis: src.incomeBasis === 'scheduled' ? 'scheduled' : 'deposited',
        taxWithholdPct: Math.min(50, clampPct(src.taxWithholdPct, 50)),
        savingsPct: Math.min(100, clampPct(src.savingsPct, 100)),
        savingsFixed: Number.isFinite(fixed) && fixed > 0 ? Utils.fromCents(Utils.toCents(fixed)) : 0,
        ...sanitizeRatios(src)
    };
}

export function planIsDefault(plan) {
    const p = sanitizePlan(plan);
    return p.weeklySavings === PLAN_DEFAULTS.weeklySavings
        && p.reserveSavings === PLAN_DEFAULTS.reserveSavings
        && p.spendBasis === PLAN_DEFAULTS.spendBasis
        && p.incomeBasis === PLAN_DEFAULTS.incomeBasis
        && p.taxWithholdPct === PLAN_DEFAULTS.taxWithholdPct
        && p.savingsPct === PLAN_DEFAULTS.savingsPct
        && p.savingsFixed === PLAN_DEFAULTS.savingsFixed
        && p.ratioNeeds === PLAN_DEFAULTS.ratioNeeds
        && p.ratioWants === PLAN_DEFAULTS.ratioWants
        && p.ratioSave === PLAN_DEFAULTS.ratioSave;
}

export function spendUsed(spend, plan) {
    return sanitizePlan(plan).spendBasis === 'paid' ? spend.paid : spend.total;
}

export function incomeUsed(income, plan) {
    return sanitizePlan(plan).incomeBasis === 'scheduled' ? income.total : income.paid;
}

/** Month-equivalent of the weekly savings target (days-in-month / 7). */
export function monthReserve(weeklySavings, currentDate) {
    const weekly = Number(weeklySavings) || 0;
    if (weekly <= 0 || !currentDate) return 0;
    const days = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0).getDate();
    return Utils.fromCents(Utils.toCents(weekly * (days / 7)));
}

/** Sunday–Saturday that contains asOf. */
export function weekBounds(asOf = new Date()) {
    const d = asOf instanceof Date ? asOf : new Date(asOf);
    const start = new Date(d.getFullYear(), d.getMonth(), d.getDate() - d.getDay());
    const end = new Date(start.getFullYear(), start.getMonth(), start.getDate() + 6);
    return {
        start: Utils.dateKey(start.getFullYear(), start.getMonth(), start.getDate()),
        end: Utils.dateKey(end.getFullYear(), end.getMonth(), end.getDate())
    };
}

export function windowTotals(events, start, end, plan) {
    const p = sanitizePlan(plan);
    let spendPaid = 0;
    let spendPending = 0;
    let incomePaid = 0;
    let incomePending = 0;

    Object.keys(events || {}).forEach((date) => {
        if (date < start || date > end) return;
        (events[date] || []).forEach((entry) => {
            const cents = Utils.toCents(Utils.getPrice(entry));
            if (cents <= 0) return;
            if (Utils.entryKind(entry) === 'income') {
                if (entry.paid) incomePaid += cents;
                else incomePending += cents;
            } else if (entry.paid) {
                spendPaid += cents;
            } else {
                spendPending += cents;
            }
        });
    });

    const spend = {
        paid: Utils.fromCents(spendPaid),
        pending: Utils.fromCents(spendPending),
        total: Utils.fromCents(spendPaid + spendPending)
    };
    const income = {
        paid: Utils.fromCents(incomePaid),
        pending: Utils.fromCents(incomePending),
        total: Utils.fromCents(incomePaid + incomePending)
    };
    const usedSpend = spendUsed(spend, p);
    const usedIncome = incomeUsed(income, p);

    return {
        spend,
        income,
        spendUsed: usedSpend,
        incomeUsed: usedIncome,
        net: subMoney(usedIncome, usedSpend)
    };
}

/**
 * Days still on the viewed month, including today. A future month has every
 * day left; a closed month has none.
 */
export function remainingDays(currentDate, asOf = new Date()) {
    if (!currentDate) return 0;
    const y = currentDate.getFullYear();
    const m = currentDate.getMonth();
    const days = new Date(y, m + 1, 0).getDate();
    const today = asOf instanceof Date && !Number.isNaN(asOf.getTime()) ? asOf : new Date();
    if (today.getFullYear() < y || (today.getFullYear() === y && today.getMonth() < m)) return days;
    if (today.getFullYear() > y || (today.getFullYear() === y && today.getMonth() > m)) return 0;
    return days - today.getDate() + 1;
}

/** leftover ÷ remaining days. Negative leftover is an over-pace per day. */
export function dailySafeSpend(leftToSpend, daysLeft) {
    const days = Number(daysLeft) || 0;
    if (days <= 0) return 0;
    return Utils.fromCents(Math.round(Utils.toCents(leftToSpend) / days));
}

/** Cash ÷ daily burn, one decimal. Null when there is no burn. */
export function runwayDays(cash, dailyBurn) {
    const burn = Utils.toCents(dailyBurn);
    if (burn <= 0) return null;
    return Math.round((Utils.toCents(cash) / burn) * 10) / 10;
}

export function ratioBucket(category) {
    const key = String(category ?? '').replace(/\s+/g, ' ').trim().toLowerCase();
    if (NEEDS.has(key)) return 'needs';
    if (WANTS.has(key)) return 'wants';
    return 'other';
}

export function classifyRatioSpend(items = [], plan) {
    const p = sanitizePlan(plan);
    let needs = 0;
    let wants = 0;
    let other = 0;
    for (const item of items) {
        if (p.spendBasis === 'paid' && !item.paid) continue;
        const cents = Utils.toCents(item.amount);
        if (cents <= 0) continue;
        const bucket = ratioBucket(item.category);
        if (bucket === 'needs') needs += cents;
        else if (bucket === 'wants') wants += cents;
        else other += cents;
    }
    return {
        needs: Utils.fromCents(needs),
        wants: Utils.fromCents(wants),
        other: Utils.fromCents(other)
    };
}

/**
 * Calendar weeks of the viewed month: days 1–7, 8–14, 15–21, 22–28, 29–end.
 * Each week's spend target is spendable × (days in the week / days in the month),
 * with leftover cents parked on the last week so the targets sum.
 */
export function monthWeekBuckets(dailyTotals = [], daysInMonth, spendableIncome) {
    const length = Number(daysInMonth) || 0;
    const spendableCents = Utils.toCents(spendableIncome);
    const weeks = [];
    let assigned = 0;

    for (let start = 1, index = 1; start <= length; start += 7, index += 1) {
        const end = Math.min(start + 6, length);
        const days = end - start + 1;
        let spent = 0;
        for (let day = start; day <= end; day += 1) {
            spent += Utils.toCents(dailyTotals[day - 1]?.amount || 0);
        }
        const last = end === length;
        const target = last
            ? Math.max(0, spendableCents - assigned)
            : Math.round(spendableCents * days / length);
        assigned += target;
        weeks.push({
            label: `W${index}`,
            start,
            end,
            days,
            amount: Utils.fromCents(spent),
            target: Utils.fromCents(target)
        });
    }
    return weeks;
}

export function unpaidRecurring(items = [], plan) {
    const p = sanitizePlan(plan);
    let total = 0;
    let count = 0;
    for (const item of items) {
        if (!item.recurring || item.paid) continue;
        if (p.spendBasis === 'paid') continue;
        const cents = Utils.toCents(item.amount);
        if (cents <= 0) continue;
        total += cents;
        count += 1;
    }
    return { total: Utils.fromCents(total), count };
}

/**
 * Apply the waterfall and every derived planner figure. Snapshot math calls
 * this so Overview, Income, Expenses, and Planner share one set of numbers.
 */
export function computePlanner({
    incomeUsed: incoming = 0,
    spendUsed: outgoing = 0,
    spendItems = [],
    dailyTotals = [],
    daysInMonth = 0,
    daysElapsed = 0,
    currentDate,
    asOf = new Date(),
    plan
} = {}) {
    const rules = sanitizePlan(plan);
    const taxWithheld = percentOf(incoming, rules.taxWithholdPct);
    const afterTax = subMoney(incoming, taxWithheld);
    const weeklyReserve = monthReserve(rules.weeklySavings, currentDate);
    const reserveOn = rules.reserveSavings && weeklyReserve > 0;
    const pctHold = percentOf(afterTax, rules.savingsPct);
    const savingsHold = addMoney(reserveOn ? weeklyReserve : 0, rules.savingsFixed, pctHold);
    const spendableIncome = subMoney(afterTax, savingsHold);
    const leftToSpend = subMoney(spendableIncome, outgoing);

    const daysLeft = remainingDays(currentDate, asOf);
    const dailySafe = dailySafeSpend(leftToSpend, daysLeft);
    const weeklySafe = Utils.fromCents(Utils.toCents(dailySafe) * Math.min(7, Math.max(0, daysLeft)));
    const burnDays = Math.max(1, Number(daysElapsed) || Number(daysInMonth) || 1);
    const avgDailyBurn = Utils.fromCents(Math.round(Utils.toCents(outgoing) / burnDays));
    const spent = classifyRatioSpend(spendItems, rules);
    const weekBuckets = monthWeekBuckets(dailyTotals, daysInMonth, spendableIncome);
    const recurring = unpaidRecurring(spendItems, rules);

    return {
        plan: rules,
        taxWithheld,
        afterTax,
        weeklyReserve,
        reserveOn,
        pctHold,
        savingsHold,
        spendableIncome,
        leftToSpend,
        daysLeft,
        dailySafe,
        weeklySafe,
        avgDailyBurn,
        ratioNeedsSpent: spent.needs,
        ratioWantsSpent: spent.wants,
        ratioOtherSpent: spent.other,
        ratioNeedsCap: percentOf(afterTax, rules.ratioNeeds),
        ratioWantsCap: percentOf(afterTax, rules.ratioWants),
        ratioSaveCap: percentOf(afterTax, rules.ratioSave),
        weekBuckets,
        unpaidRecurring: recurring.total,
        unpaidRecurringCount: recurring.count
    };
}

export function describePlan(plan) {
    const p = sanitizePlan(plan);
    const spend = p.spendBasis === 'paid' ? 'paid bills only' : 'all logged bills';
    const income = p.incomeBasis === 'scheduled' ? 'all scheduled income' : 'deposited income';
    const parts = [`${income} minus ${spend}`];
    if (p.taxWithholdPct > 0) parts.push(`${p.taxWithholdPct}% withheld`);
    if (p.savingsFixed > 0 || p.savingsPct > 0 || (p.weeklySavings > 0 && p.reserveSavings)) {
        parts.push('after the savings hold');
    }
    return parts.join(', ');
}
