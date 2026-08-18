/**
 * OpenExpense — label and price twins
 *
 * A title or amount edit applies to the selected row only, unless that row
 * shares both the same name and the same dollar amount with other entries.
 * Those matches are "twins": Change All can retitle and reprice them together.
 * Empty titles, leftover form placeholders, and a bare "untitled" never match,
 * which is what used to turn a blank rename into a mass edit.
 */
import { Utils } from './utils.js';

const PLACEHOLDER_TITLES = new Set([
    'untitled',
    'e.g. coffee, zoom, gas',
    'e.g. paycheck, refund',
    'find or add a group',
    'find or add a category'
]);

/** Folded name used to decide whether two entries are the same text. */
export function titleKey(title) {
    return String(title ?? '').replace(/\s+/g, ' ').trim().toLowerCase();
}

export function amountCents(entry) {
    return Utils.toCents(Utils.getPrice(entry));
}

/**
 * True for a title that is not a real label: blank, the old untitled fallback,
 * or a form placeholder that leaked into the field.
 */
export function isPlaceholderTitle(title) {
    const key = titleKey(title);
    return !key || PLACEHOLDER_TITLES.has(key);
}

export function sameLabelAndPrice(a, b) {
    if (!a || !b) return false;
    if (isPlaceholderTitle(a.title) || isPlaceholderTitle(b.title)) return false;
    return titleKey(a.title) === titleKey(b.title) && amountCents(a) === amountCents(b);
}

/**
 * Every other entry that matches both the name and the amount of `target`.
 * `skip` is the row already being edited so it is not counted as a twin.
 */
export function findTwinRefs(events, target, { skip } = {}) {
    if (!target || isPlaceholderTitle(target.title)) return [];

    const refs = [];
    Object.keys(events || {}).forEach((date) => {
        const list = Array.isArray(events[date]) ? events[date] : [];
        list.forEach((entry, index) => {
            if (skip && skip.date === date && Number(skip.index) === index) return;
            if (!sameLabelAndPrice(target, entry)) return;
            refs.push({ date, index, entry });
        });
    });
    return refs;
}

/** Write a new title and price onto the listed refs. Nothing else changes. */
export function applyTitlePrice(events, refs, { title, price } = {}) {
    const nextTitle = String(title ?? '').replace(/\s+/g, ' ').trim();
    if (!nextTitle || !Array.isArray(refs) || !refs.length) return events;

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
        const row = { ...next[date][index], title: nextTitle };
        if (price != null && price !== '' && Number.isFinite(Number(price))) {
            row.price = Number(price);
        } else {
            delete row.price;
        }
        next[date][index] = row;
    });

    return next;
}

/** Title and/or price actually changed on this edit. */
export function labelOrPriceChanged(original, updated) {
    if (!original || !updated) return false;
    return titleKey(original.title) !== titleKey(updated.title)
        || amountCents(original) !== amountCents(updated);
}
