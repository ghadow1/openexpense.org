/**
 * OpenExpense — recurring expense series
 *
 * Groups same-title entries and removes every recurring copy of a payment.
 * Repeat cadence is monthly (default), every 2 months, or quarterly.
 * Used by the day editor and calendar pills.
 */
import { Utils } from './utils.js';

export const REPEAT = {
    monthly: { id: 'monthly', months: 1, label: 'Monthly', short: 'Monthly' },
    bimonthly: { id: 'bimonthly', months: 2, label: 'Every 2 months', short: 'Bi-monthly' },
    quarterly: { id: 'quarterly', months: 3, label: 'Quarterly', short: 'Quarterly' }
};

export function normalizeTitle(title) {
    return String(title || '').trim().toLowerCase() || 'untitled';
}

/** Legacy expenses with no `repeat` field are treated as monthly. */
export function normalizeRepeat(value) {
    const key = String(value || '').toLowerCase().replace(/[\s_-]/g, '');
    if (key === 'bimonthly' || key === 'bimonth') return 'bimonthly';
    if (key === 'quarterly' || key === 'quarter') return 'quarterly';
    return 'monthly';
}

export function repeatMonths(value) {
    return REPEAT[normalizeRepeat(value)].months;
}

export function repeatLabel(value, short = false) {
    const rec = REPEAT[normalizeRepeat(value)];
    return short ? rec.short : rec.label;
}

function isSameSeries(a, b) {
    return !!a?.recurring && !!b?.recurring
        && normalizeTitle(a.title) === normalizeTitle(b.title)
        && normalizeRepeat(a.repeat) === normalizeRepeat(b.repeat);
}

export function countSeriesOccurrences(events, item) {
    let count = 0;
    Object.values(events || {}).forEach((list) => {
        (list || []).forEach((entry) => {
            if (isSameSeries(item, entry)) count += 1;
        });
    });
    return count;
}

export function removeSeriesOccurrences(events, item) {
    const next = { ...events };
    Object.keys(next).forEach((key) => {
        const filtered = (next[key] || []).filter((entry) => !isSameSeries(item, entry));
        if (filtered.length) next[key] = filtered;
        else delete next[key];
    });
    return next;
}

export function groupExpenses(list) {
    const map = new Map();
    (list || []).forEach((e, i) => {
        const key = normalizeTitle(e.title);
        if (!map.has(key)) {
            map.set(key, { key, title: e.title?.trim() || 'Untitled', items: [] });
        }
        map.get(key).items.push({ e, i });
    });

    return [...map.values()].map((group) => {
        const total = group.items.reduce((sum, row) => sum + Utils.getPrice(row.e), 0);
        return {
            ...group,
            total,
            count: group.items.length,
            recurring: group.items.some((row) => row.e.recurring),
            repeat: normalizeRepeat(group.items.find((row) => row.e.recurring)?.e.repeat),
            allPaid: group.items.every((row) => row.e.paid)
        };
    }).sort((a, b) => {
        if (a.recurring !== b.recurring) return a.recurring ? -1 : 1;
        return b.total - a.total;
    });
}
