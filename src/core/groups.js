/**
 * Groups are the user's own vocabulary: "Bella", "Rome trip", "Rental".
 * Categories answer what a thing was, groups answer what it belonged to, and
 * only the user knows the second one, so there is no canonical list here.
 *
 * Everything in this module exists to keep that vocabulary from fragmenting.
 * A field you type into will collect "Bella", "bella" and "Bella " as three
 * groups unless something folds them back together, so matching is done on a
 * normalized key while the label the user actually typed is what gets shown.
 */
import { FILE_LIMITS } from './limits.js';
import { Utils } from './utils.js';

/** Trims and collapses runs of whitespace, then caps to the stored length. */
export function normalizeGroup(raw) {
    return String(raw ?? '')
        .replace(/\s+/g, ' ')
        .trim()
        .slice(0, FILE_LIMITS.maxGroup);
}

/** The key two spellings of the same group have in common. */
export function groupKey(raw) {
    return normalizeGroup(raw).toLowerCase();
}

/**
 * Every group in the ledger, most recently used first, then most used.
 * Each row carries the label as last spelled, so a rename by retyping wins.
 */
export function collectGroups(events) {
    const byKey = new Map();

    Object.keys(events || {}).sort().forEach((dateKey) => {
        const day = Array.isArray(events[dateKey]) ? events[dateKey] : [];
        day.forEach((entry) => {
            const label = normalizeGroup(entry?.group);
            if (!label) return;
            const key = label.toLowerCase();
            const prev = byKey.get(key) || { key, label, count: 0, total: 0, lastKey: '' };
            prev.count += 1;
            prev.total += Math.abs(Utils.getPrice(entry) || 0);
            if (dateKey >= prev.lastKey) {
                prev.lastKey = dateKey;
                prev.label = label;
            }
            byKey.set(key, prev);
        });
    });

    return [...byKey.values()].sort((a, b) => {
        if (a.lastKey !== b.lastKey) return a.lastKey < b.lastKey ? 1 : -1;
        return b.count - a.count;
    });
}

/**
 * Groups matching what has been typed so far. A match anywhere in the label
 * beats nothing, but a prefix match is what the typist usually means, so those
 * sort first.
 */
export function suggestGroups(events, { query = '', limit = 6 } = {}) {
    const q = groupKey(query);
    const rows = collectGroups(events);
    if (!q) return rows.slice(0, limit);

    const hits = rows.filter((row) => row.key.includes(q));
    hits.sort((a, b) => {
        const aStarts = a.key.startsWith(q) ? 0 : 1;
        const bStarts = b.key.startsWith(q) ? 0 : 1;
        return aStarts - bStarts;
    });
    return hits.slice(0, limit);
}

/**
 * The spelling already in the ledger for what was typed, so "bella" joins
 * "Bella" instead of starting a second group beside it. Unknown groups are
 * returned as typed, which is how a new one gets created.
 */
export function canonicalGroup(events, raw) {
    const label = normalizeGroup(raw);
    if (!label) return '';
    const match = collectGroups(events).find((row) => row.key === label.toLowerCase());
    return match ? match.label : label;
}

/**
 * Every entry that shares a group, optionally skipping the row already open.
 * Used so an edit can rename or ungroup the whole set, or only that row.
 */
export function findGroupRefs(events, group, { skip } = {}) {
    const key = groupKey(group);
    if (!key) return [];

    const refs = [];
    Object.keys(events || {}).forEach((date) => {
        const list = Array.isArray(events[date]) ? events[date] : [];
        list.forEach((entry, index) => {
            if (skip && skip.date === date && Number(skip.index) === index) return;
            if (groupKey(entry?.group) !== key) return;
            refs.push({ date, index, entry });
        });
    });
    return refs;
}

/** Write or clear `group` on the listed refs. Title, price, and date stay put. */
export function applyGroupLabel(events, refs, group) {
    if (!Array.isArray(refs) || !refs.length) return events;

    const label = normalizeGroup(group);
    const next = { ...events };
    const cloned = new Set();

    refs.forEach((ref) => {
        const date = ref?.date;
        const index = Number(ref?.index);
        if (!date || !Array.isArray(next[date])) return;
        if (index < 0 || index >= next[date].length) return;
        if (!cloned.has(date)) {
            next[date] = [...next[date]];
            cloned.add(date);
        }
        const row = { ...next[date][index] };
        if (label) row.group = label;
        else delete row.group;
        next[date][index] = row;
    });
    return next;
}

/**
 * What this title was filed under last time. Buying "Dog food" once and
 * grouping it under "Bella" should mean the next one arrives pre-filled.
 */
export function groupHistory(events) {
    const byTitle = new Map();

    Object.keys(events || {}).sort().forEach((dateKey) => {
        const day = Array.isArray(events[dateKey]) ? events[dateKey] : [];
        day.forEach((entry) => {
            const title = String(entry?.title || '').trim().toLowerCase();
            const label = normalizeGroup(entry?.group);
            if (!title || !label) return;
            byTitle.set(title, label);
        });
    });

    return byTitle;
}

/** Memoized per events object, since this runs on every keystroke in the field. */
let historySource = null;
let historyCache = null;

export function cachedGroupHistory(events) {
    if (events !== historySource) {
        historySource = events;
        historyCache = groupHistory(events);
    }
    return historyCache;
}

/** The group to offer for a title, or '' when nothing has been filed under it. */
export function suggestGroupFor(title, history) {
    const key = String(title || '').trim().toLowerCase();
    if (!key || !history) return '';
    return history.get(key) || '';
}

/**
 * Spend per group for the sidebar. Entries with no group are left out rather
 * than pooled into an "Ungrouped" row, because unlike a category the absence
 * of a group is normal and a row counting it would dwarf the real ones.
 */
export function rollUpGroups(items) {
    const byKey = new Map();
    let groupedCents = 0;
    let ungrouped = 0;

    (items || []).forEach((item) => {
        const label = normalizeGroup(item?.group);
        const cents = Math.round(Math.abs(Number(item?.amount) || 0) * 100);
        if (!label) {
            ungrouped += 1;
            return;
        }
        const key = label.toLowerCase();
        const prev = byKey.get(key) || { key, label, cents: 0, count: 0, lastDate: '' };
        prev.cents += cents;
        prev.count += 1;
        // Same rule as collectGroups: the most recent spelling is the one the
        // rest of the app shows, so the breakdown must not disagree with it.
        const date = String(item?.date || '');
        if (date >= prev.lastDate) {
            prev.lastDate = date;
            prev.label = label;
        }
        byKey.set(key, prev);
        groupedCents += cents;
    });

    const rows = [...byKey.values()]
        .map((row) => ({
            label: row.label,
            amount: row.cents / 100,
            count: row.count,
            share: groupedCents ? (row.cents / groupedCents) * 100 : 0
        }))
        .sort((a, b) => b.amount - a.amount || a.label.localeCompare(b.label));

    return { rows, total: groupedCents / 100, ungrouped };
}
