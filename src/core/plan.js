/**
 * OpenExpense — weekly savings and budgeting rules
 *
 * A `plan` rides on the ledger next to `budgets`, so export, import, and
 * autosave carry the same rules that Overview uses for left-to-spend.
 * Defaults match the original cash line: deposited income minus every
 * logged bill, with no weekly reserve.
 */
import { Utils } from './utils.js';

export const PLAN_DEFAULTS = Object.freeze({
    weeklySavings: 0,
    reserveSavings: true,
    spendBasis: 'logged',
    incomeBasis: 'deposited'
});

export function sanitizePlan(raw) {
    const src = raw && typeof raw === 'object' && !Array.isArray(raw) ? raw : {};
    const weekly = Number(src.weeklySavings);
    return {
        weeklySavings: Number.isFinite(weekly) && weekly > 0 ? Utils.fromCents(Utils.toCents(weekly)) : 0,
        reserveSavings: src.reserveSavings !== false,
        spendBasis: src.spendBasis === 'paid' ? 'paid' : 'logged',
        incomeBasis: src.incomeBasis === 'scheduled' ? 'scheduled' : 'deposited'
    };
}

export function planIsDefault(plan) {
    const p = sanitizePlan(plan);
    return p.weeklySavings === PLAN_DEFAULTS.weeklySavings
        && p.reserveSavings === PLAN_DEFAULTS.reserveSavings
        && p.spendBasis === PLAN_DEFAULTS.spendBasis
        && p.incomeBasis === PLAN_DEFAULTS.incomeBasis;
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
        net: Utils.fromCents(Utils.toCents(usedIncome) - Utils.toCents(usedSpend))
    };
}

export function describePlan(plan) {
    const p = sanitizePlan(plan);
    const spend = p.spendBasis === 'paid' ? 'paid bills only' : 'all logged bills';
    const income = p.incomeBasis === 'scheduled' ? 'all scheduled income' : 'deposited income';
    if (p.weeklySavings > 0 && p.reserveSavings) {
        return `${income} minus ${spend}, after the weekly savings reserve`;
    }
    return `${income} minus ${spend}`;
}
