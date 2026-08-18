/**
 * OpenExpense — day-list mutations
 *
 * Reorder, move, duplicate, and toggle paid. Array order on a date key is
 * the on-screen order. No extra fields — sanitizeLedger already keeps
 * unknown keys out of the file.
 */
import { Utils } from './utils.js';
import { isValidDateKey } from './ledger-file.js';
import { normalizeGroup } from './groups.js';

function cloneEntry(entry) {
    return JSON.parse(JSON.stringify(entry || {}));
}

function dayList(events, dateKey) {
    return Array.isArray(events?.[dateKey]) ? events[dateKey] : [];
}

export function reorderDay(events, dateKey, fromIndex, toIndex) {
    const list = [...dayList(events, dateKey)];
    const from = Number(fromIndex);
    const to = Number(toIndex);
    if (!isValidDateKey(dateKey) || from === to) return events;
    if (from < 0 || to < 0 || from >= list.length || to >= list.length) return events;
    const [item] = list.splice(from, 1);
    list.splice(to, 0, item);
    return { ...events, [dateKey]: list };
}

export function moveIndexes(events, fromKey, indexes, toKey) {
    if (!isValidDateKey(fromKey) || !isValidDateKey(toKey)) return events;
    const from = [...dayList(events, fromKey)];
    const wanted = [...new Set((indexes || []).map(Number))]
        .filter((i) => i >= 0 && i < from.length)
        .sort((a, b) => a - b);
    if (!wanted.length) return events;

    if (fromKey === toKey) {
        if (wanted.length !== 1) return events;
        return reorderDay(events, fromKey, wanted[0], Math.min(wanted[0], from.length - 1));
    }

    const moved = wanted.map((i) => from[i]);
    for (let i = wanted.length - 1; i >= 0; i -= 1) from.splice(wanted[i], 1);

    const next = { ...events };
    if (from.length) next[fromKey] = from;
    else delete next[fromKey];
    next[toKey] = [...dayList(next, toKey), ...moved];
    return next;
}

export function moveOccurrence(events, fromKey, index, toKey) {
    return moveIndexes(events, fromKey, [index], toKey);
}

export function togglePaidAt(events, dateKey, index) {
    const list = [...dayList(events, dateKey)];
    const i = Number(index);
    if (!list[i]) return events;
    const row = { ...list[i], paid: !list[i].paid };
    if (!row.paid) delete row.paid;
    list[i] = row;
    return { ...events, [dateKey]: list };
}

/** Same-day copy of visible fields. Recurring is not seeded again. */
export function duplicateAt(events, dateKey, index) {
    const list = [...dayList(events, dateKey)];
    const i = Number(index);
    if (!list[i]) return events;
    const copy = cloneEntry(list[i]);
    copy.recurring = false;
    delete copy.repeat;
    copy.paid = false;
    delete copy.paid;
    list.splice(i + 1, 0, copy);
    return { ...events, [dateKey]: list };
}

export function collectTitleMemory(events) {
    const byTitle = new Map();
    Object.keys(events || {}).sort().forEach((dateKey) => {
        dayList(events, dateKey).forEach((entry) => {
            const title = String(entry.title || '').trim();
            if (!title) return;
            const norm = title.toLowerCase();
            const prev = byTitle.get(norm) || { title, count: 0 };
            prev.title = title;
            prev.count += 1;
            prev.lastKey = dateKey;
            if (entry.price != null && entry.price !== '') prev.price = entry.price;
            prev.kind = Utils.entryKind(entry);
            prev.recurring = !!entry.recurring;
            if (entry.recurring) prev.repeat = entry.repeat;
            byTitle.set(norm, prev);
        });
    });
    return [...byTitle.values()].sort((a, b) => {
        if (a.lastKey !== b.lastKey) return a.lastKey < b.lastKey ? 1 : -1;
        return b.count - a.count;
    });
}

export function suggestTitles(events, { kind, query = '', limit = 6 } = {}) {
    const q = String(query || '').trim().toLowerCase();
    return collectTitleMemory(events)
        .filter((row) => !kind || row.kind === kind)
        .filter((row) => !q || row.title.toLowerCase().includes(q))
        .slice(0, limit);
}

/**
 * File the listed rows under one group. Price, date, title, category, paid,
 * and recurring stay as they are — only `group` is written.
 */
export function assignGroupToIndexes(events, dateKey, indexes, group) {
    const label = normalizeGroup(group);
    const list = [...dayList(events, dateKey)];
    const wanted = [...new Set((indexes || []).map(Number))]
        .filter((i) => i >= 0 && i < list.length);
    if (!label || !wanted.length || !isValidDateKey(dateKey)) return events;

    let changed = false;
    wanted.forEach((i) => {
        if (normalizeGroup(list[i]?.group) === label) return;
        list[i] = { ...list[i], group: label };
        changed = true;
    });
    return changed ? { ...events, [dateKey]: list } : events;
}

/** Remove a row from its group. Every other field is left alone. */
export function clearGroupAt(events, dateKey, index) {
    return clearGroupAtIndexes(events, dateKey, [index]);
}

export function clearGroupAtIndexes(events, dateKey, indexes) {
    const list = [...dayList(events, dateKey)];
    const wanted = [...new Set((indexes || []).map(Number))]
        .filter((i) => i >= 0 && i < list.length && normalizeGroup(list[i]?.group));
    if (!wanted.length || !isValidDateKey(dateKey)) return events;

    wanted.forEach((i) => {
        const row = { ...list[i] };
        delete row.group;
        list[i] = row;
    });
    return { ...events, [dateKey]: list };
}

export function matchRememberedTitle(events, title, kind) {
    const q = String(title || '').trim().toLowerCase();
    if (!q) return null;
    return collectTitleMemory(events).find((row) => (
        row.title.toLowerCase() === q && (!kind || row.kind === kind)
    )) || null;
}
