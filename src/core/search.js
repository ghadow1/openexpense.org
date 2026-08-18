/**
 * OpenExpense — ledger search
 *
 * Once a ledger holds a few years, paging the calendar is no way to find
 * anything. This is the query side of that: a small filter language over the
 * whole ledger, kept pure so it can be tested without a browser.
 *
 * The language is deliberately tiny, because it has to be guessable from the
 * placeholder text alone:
 *
 *   coffee              free text over title and note
 *   cat:groceries       a category (quoted for spaces: cat:"eating out")
 *   >20  <100           amount bounds
 *   is:unpaid           unpaid, paid, income, expense, or recurring
 *   2026-08             a date prefix — a year, a month, or an exact day
 *
 * Anything unparseable falls back to free text rather than erroring, so typing
 * a stray character never blanks the results.
 */
import { Utils } from './utils.js';
import { categoryInfo } from './categories.js';

const IS_FLAGS = new Set(['paid', 'unpaid', 'income', 'expense', 'recurring', 'once']);
const DATE_TOKEN = /^\d{4}(-\d{2}(-\d{2})?)?$/;

/**
 * Split on spaces, keeping "quoted phrases" together. A quoted value attached
 * to a field has to stay with it, or cat:"eating out" would split into a
 * broken field and a stray word.
 */
function tokenize(raw) {
    const out = [];
    const pattern = /([a-z]+:"[^"]*")|"([^"]*)"|(\S+)/gi;
    let match;
    while ((match = pattern.exec(String(raw ?? '')))) {
        if (match[1]) out.push({ value: match[1], quoted: false });
        else if (match[2] != null) out.push({ value: match[2], quoted: true });
        else if (match[3]) out.push({ value: match[3], quoted: false });
    }
    return out.filter((token) => token.value !== '');
}

export function parseQuery(raw) {
    const query = {
        text: [],
        categories: [],
        groups: [],
        dates: [],
        min: null,
        max: null,
        paid: null,
        kind: null,
        recurring: null
    };

    for (const { value, quoted } of tokenize(raw)) {
        if (quoted) {
            query.text.push(value.toLowerCase());
            continue;
        }

        const field = value.match(/^(cat|category):(.*)$/i);
        if (field) {
            const name = field[2].replace(/^"|"$/g, '').trim();
            if (name) query.categories.push(name.toLowerCase());
            continue;
        }

        const groupField = value.match(/^(group|grp):(.*)$/i);
        if (groupField) {
            const name = groupField[2].replace(/^"|"$/g, '').trim();
            if (name) query.groups.push(name.toLowerCase());
            continue;
        }

        const flag = value.match(/^is:(.*)$/i);
        if (flag && IS_FLAGS.has(flag[1].toLowerCase())) {
            switch (flag[1].toLowerCase()) {
                case 'paid': query.paid = true; break;
                case 'unpaid': query.paid = false; break;
                case 'income': query.kind = 'income'; break;
                case 'expense': query.kind = 'expense'; break;
                case 'recurring': query.recurring = true; break;
                case 'once': query.recurring = false; break;
            }
            continue;
        }

        const bound = value.match(/^([<>])=?(\d+(?:\.\d+)?)$/);
        if (bound) {
            const amount = Number(bound[2]);
            if (bound[1] === '>') query.min = amount;
            else query.max = amount;
            continue;
        }

        if (DATE_TOKEN.test(value)) {
            query.dates.push(value);
            continue;
        }

        query.text.push(value.toLowerCase());
    }

    return query;
}

/** True when the query asks for nothing, so callers can skip the whole scan. */
export function isEmptyQuery(query) {
    return !query.text.length
        && !query.categories.length
        && !query.groups.length
        && !query.dates.length
        && query.min == null
        && query.max == null
        && query.paid == null
        && query.kind == null
        && query.recurring == null;
}

function matches(entry, date, query) {
    if (query.kind != null && Utils.entryKind(entry) !== query.kind) return false;
    if (query.paid != null && !!entry.paid !== query.paid) return false;
    if (query.recurring != null && !!entry.recurring !== query.recurring) return false;

    if (query.dates.length && !query.dates.some((prefix) => date.startsWith(prefix))) return false;

    if (query.categories.length) {
        const label = categoryInfo(entry.category, Utils.entryKind(entry)).label.toLowerCase();
        if (!query.categories.some((want) => label.includes(want))) return false;
    }

    if (query.groups.length) {
        const label = String(entry.group || '').toLowerCase();
        if (!label || !query.groups.some((want) => label.includes(want))) return false;
    }

    const amount = Utils.getPrice(entry);
    if (query.min != null && !(amount > query.min)) return false;
    if (query.max != null && !(amount < query.max)) return false;

    if (query.text.length) {
        const haystack = `${entry.title || ''} ${entry.note || ''} ${entry.category || ''} ${entry.group || ''}`.toLowerCase();
        // Every word must appear: added words should narrow, never widen.
        if (!query.text.every((word) => haystack.includes(word))) return false;
    }

    return true;
}

/**
 * Search the whole ledger, newest first.
 *
 * @returns {{rows: Array, total: number, sum: number, truncated: boolean}}
 *   `total` and `sum` describe every match, not just the returned page, so the
 *   caller can honestly say "142 matches, $2,310" while rendering only 50.
 */
export function searchEntries(events, raw, { limit = 50 } = {}) {
    // Anything that is not already a parsed query goes through the parser, so a
    // null or undefined search box reads as "no query" rather than throwing.
    const query = raw && typeof raw === 'object' && Array.isArray(raw.text) ? raw : parseQuery(raw);
    const rows = [];
    let total = 0;
    let cents = 0;

    if (!events || typeof events !== 'object' || isEmptyQuery(query)) {
        return { rows, total: 0, sum: 0, truncated: false, query };
    }

    for (const date of Object.keys(events).sort().reverse()) {
        const list = events[date];
        if (!Array.isArray(list)) continue;

        list.forEach((entry, index) => {
            if (!entry || typeof entry !== 'object') return;
            if (!matches(entry, date, query)) return;

            total += 1;
            const amount = Utils.getPrice(entry);
            cents += Utils.toCents(amount);
            if (rows.length >= limit) return;

            rows.push({
                date,
                index,
                title: entry.title || 'Untitled',
                amount,
                category: entry.category || '',
                group: entry.group || '',
                kind: Utils.entryKind(entry),
                paid: !!entry.paid,
                recurring: !!entry.recurring,
                note: entry.note || ''
            });
        });
    }

    return {
        rows,
        total,
        sum: Utils.fromCents(cents),
        truncated: total > rows.length,
        query
    };
}
