/**
 * OpenExpense — lite recurring and budget helpers
 *
 * No UI. Hosts call these after mapping bank rows.
 */
import { Utils } from '../core/utils.js';
import { computeMonthlySummary, computeNetSnapshot } from '../core/summary.js';

function titleKey(entry) {
    return `${Utils.entryKind(entry)}:${String(entry.title || '').trim().toLowerCase()}`;
}

/** Titles that appear at least twice with the same amount. */
export function detectRecurring(events) {
    const counts = new Map();
    Object.values(events || {}).forEach((list) => {
        (list || []).forEach((entry) => {
            const amount = Utils.toCents(Utils.getPrice(entry));
            if (amount <= 0) return;
            const key = `${titleKey(entry)}:${amount}`;
            counts.set(key, (counts.get(key) || 0) + 1);
        });
    });
    return [...counts.entries()]
        .filter(([, count]) => count >= 2)
        .map(([key]) => key.split(':')[1]);
}

/** Amounts more than 3× the median of the same title. */
export function flagAnomalies(events) {
    const byTitle = new Map();
    Object.entries(events || {}).forEach(([date, list]) => {
        (list || []).forEach((entry) => {
            const amount = Utils.getPrice(entry);
            if (amount <= 0) return;
            const key = titleKey(entry);
            const rows = byTitle.get(key) || [];
            rows.push({ date, title: entry.title, amount });
            byTitle.set(key, rows);
        });
    });

    const flagged = [];
    byTitle.forEach((rows) => {
        if (rows.length < 3) return;
        const sorted = rows.map((row) => row.amount).sort((a, b) => a - b);
        const mid = sorted[Math.floor(sorted.length / 2)];
        if (mid <= 0) return;
        rows.forEach((row) => {
            if (row.amount > mid * 3) flagged.push(row);
        });
    });
    return flagged;
}

export function budgetStatus(events, { cap, date = new Date(), kind = 'expense' } = {}) {
    const summary = computeMonthlySummary(events, date, kind);
    const limit = Number(cap);
    if (!Number.isFinite(limit) || limit <= 0) {
        return { total: summary.total, cap: null, remaining: null, over: false };
    }
    const remaining = Utils.fromCents(Utils.toCents(limit) - Utils.toCents(summary.total));
    return { total: summary.total, cap: limit, remaining, over: remaining < 0 };
}

/** Host-facing alias of `computeNetSnapshot`. Name is frozen for embedders. */
export function snapshot(events, date = new Date(), plan, goals = []) {
    return computeNetSnapshot(events || {}, date, date, plan, goals);
}
