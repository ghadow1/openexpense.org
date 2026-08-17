import { Utils } from './utils.js';

export function normalizeTitle(title) {
    return String(title || '').trim().toLowerCase() || 'untitled';
}

export function isSameSeries(a, b) {
    return !!a?.recurring && !!b?.recurring && normalizeTitle(a.title) === normalizeTitle(b.title);
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
            allPaid: group.items.every((row) => row.e.paid)
        };
    }).sort((a, b) => {
        if (a.recurring !== b.recurring) return a.recurring ? -1 : 1;
        return b.total - a.total;
    });
}
