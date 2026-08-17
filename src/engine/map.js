/**
 * OpenExpense — bank payload → calendar entry
 *
 * Accepts a generic or Plaid-like row. Does not call any bank API.
 */
import { Utils } from '../core/utils.js';
import { isValidDateKey, sanitizeEntry, sanitizeLedger } from '../core/ledger-file.js';
import { categorize } from './categorize.js';

function dateFrom(raw) {
    const value = raw?.date || raw?.authorized_date || raw?.posted_at || '';
    const text = String(value).slice(0, 10);
    if (isValidDateKey(text)) return text;
    const dt = new Date(value);
    if (Number.isNaN(dt.getTime())) return '';
    return Utils.dateKey(dt.getFullYear(), dt.getMonth(), dt.getDate());
}

function amountFrom(raw) {
    const n = Number(raw?.amount ?? raw?.price);
    if (!Number.isFinite(n) || n === 0) return 0;
    return Utils.fromCents(Utils.toCents(Math.abs(n)));
}

function kindFrom(raw) {
    if (raw?.kind === 'income' || raw?.kind === 'expense') return raw.kind;
    if (raw?.type === 'credit' || raw?.inflow === true) return 'income';
    if (Number(raw?.amount) < 0) return 'income';
    return 'expense';
}

function titleFrom(raw) {
    return String(raw?.title || raw?.merchant || raw?.merchant_name || raw?.name || raw?.description || '')
        .replace(/\s+/g, ' ')
        .trim();
}

/** One raw bank row → { date, entry } or null. */
export function mapTransaction(raw) {
    if (!raw || typeof raw !== 'object') return null;
    const date = dateFrom(raw);
    const title = titleFrom(raw);
    const amount = amountFrom(raw);
    if (!date || !title || amount <= 0) return null;

    const hint = categorize(raw);
    const kind = kindFrom(raw);
    const entry = sanitizeEntry({
        title,
        price: amount,
        kind: kind === 'income' || hint.kind === 'income' ? 'income' : undefined,
        paid: raw.pending === true ? false : raw.paid !== false,
        note: raw.note,
        recurring: !!raw.recurring,
        repeat: raw.repeat,
        category: raw.category || hint.category,
        source: raw.source || 'bank',
        sourceId: raw.sourceId || raw.transaction_id || raw.id
    });
    return entry ? { date, entry } : null;
}

export function mapTransactions(list) {
    return (Array.isArray(list) ? list : []).map(mapTransaction).filter(Boolean);
}

function sameRow(a, b) {
    if (a.sourceId && b.sourceId) return a.sourceId === b.sourceId;
    return a.title === b.title
        && Utils.toCents(a.price) === Utils.toCents(b.price)
        && (a.kind || 'expense') === (b.kind || 'expense');
}

/** Merge mapped rows into an events map. Same sourceId on a day updates in place. */
export function mergeTransactions(events, list) {
    const next = { ...(events || {}) };
    for (const row of mapTransactions(list)) {
        const day = Array.isArray(next[row.date]) ? [...next[row.date]] : [];
        const index = day.findIndex((item) => sameRow(item, row.entry));
        if (index >= 0) day[index] = { ...day[index], ...row.entry };
        else day.push(row.entry);
        next[row.date] = day;
    }
    return sanitizeLedger({ events: next })?.events || {};
}
