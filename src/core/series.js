/**
 * OpenExpense — recurring expense and income series
 *
 * Groups same-title entries, updates or shifts every copy, and removes a
 * series. Repeat cadence is weekly, monthly (default), every 2 months, or
 * quarterly. Used by the day editor and calendar pills.
 */
import { Utils } from './utils.js';

export const REPEAT = {
    weekly: { id: 'weekly', days: 7, label: 'Weekly', short: 'Weekly' },
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
    if (key === 'weekly' || key === 'week') return 'weekly';
    if (key === 'bimonthly' || key === 'bimonth') return 'bimonthly';
    if (key === 'quarterly' || key === 'quarter') return 'quarterly';
    return 'monthly';
}

export function repeatMonths(value) {
    return REPEAT[normalizeRepeat(value)].months || 0;
}

export function repeatLabel(value, short = false) {
    const rec = REPEAT[normalizeRepeat(value)];
    return short ? rec.short : rec.label;
}

/** About a year of copies: 52 weeks, or 12 months at the monthly step. */
export function seriesCopyCount(value) {
    const id = normalizeRepeat(value);
    if (id === 'weekly') return 52;
    const step = REPEAT[id].months || 1;
    return Math.max(1, Math.floor(12 / step));
}

export function nextOccurrenceKey(startKey, cadence, index) {
    const [y, m, d] = String(startKey).split('-').map(Number);
    const id = normalizeRepeat(cadence);

    if (id === 'weekly') {
        const dt = new Date(Date.UTC(y, m - 1, d));
        dt.setUTCDate(dt.getUTCDate() + 7 * index);
        return Utils.dateKey(dt.getUTCFullYear(), dt.getUTCMonth(), dt.getUTCDate());
    }

    const step = REPEAT[id].months || 1;
    let nextM = m + (step * index);
    let nextY = y;
    if (nextM > 12) {
        nextY += Math.floor((nextM - 1) / 12);
        nextM = ((nextM - 1) % 12) + 1;
    }
    const daysInNextMonth = new Date(nextY, nextM, 0).getDate();
    const nextD = Math.min(d, daysInNextMonth);
    return `${nextY}-${Utils.pad(nextM)}-${Utils.pad(nextD)}`;
}

const WEEKDAY_NAMES = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

export function weekdayFromKey(key) {
    const [y, m, d] = String(key).split('-').map(Number);
    return new Date(Date.UTC(y, m - 1, d)).getUTCDay();
}

export function weekdayName(weekday) {
    return WEEKDAY_NAMES[Number(weekday)] || WEEKDAY_NAMES[0];
}

export function isSameSeries(a, b) {
    return !!a?.recurring && !!b?.recurring
        && Utils.entryKind(a) === Utils.entryKind(b)
        && normalizeTitle(a.title) === normalizeTitle(b.title)
        && normalizeRepeat(a.repeat) === normalizeRepeat(b.repeat);
}

export function addDaysToKey(key, days) {
    const [y, m, d] = String(key).split('-').map(Number);
    const dt = new Date(Date.UTC(y, m - 1, d));
    dt.setUTCDate(dt.getUTCDate() + Number(days || 0));
    return Utils.dateKey(dt.getUTCFullYear(), dt.getUTCMonth(), dt.getUTCDate());
}

export function daysBetweenKeys(fromKey, toKey) {
    const [y1, m1, d1] = String(fromKey).split('-').map(Number);
    const [y2, m2, d2] = String(toKey).split('-').map(Number);
    return Math.round((Date.UTC(y2, m2 - 1, d2) - Date.UTC(y1, m1 - 1, d1)) / 86400000);
}

function seriesEntry(updated, paid) {
    const row = {
        title: String(updated.title || '').trim(),
        note: String(updated.note || '').trim(),
        price: updated.price,
        recurring: true,
        paid: !!paid,
        kind: Utils.entryKind(updated)
    };
    if (row.kind === 'expense') delete row.kind;
    row.repeat = normalizeRepeat(updated.repeat);
    return row;
}

/** Add about a year of future copies from startKey. Existing matches are left alone. */
export function seedRecurringCopies(events, baseEvent, startKey) {
    const nextEvents = { ...events };
    const cadence = normalizeRepeat(baseEvent.repeat);
    const copies = seriesCopyCount(cadence);
    const kind = Utils.entryKind(baseEvent);

    for (let i = 1; i <= copies; i++) {
        const nextKey = nextOccurrenceKey(startKey, cadence, i);
        const list = nextEvents[nextKey] ? [...nextEvents[nextKey]] : [];
        const exists = list.some((e) => (
            normalizeTitle(e.title) === normalizeTitle(baseEvent.title)
            && e.recurring === true
            && Utils.entryKind(e) === kind
            && normalizeRepeat(e.repeat) === cadence
        ));
        if (!exists) {
            list.push({ ...baseEvent, paid: false, repeat: cadence });
            nextEvents[nextKey] = list;
        }
    }

    return nextEvents;
}

/**
 * Patch every copy of a series. Title, amount, note, and kind stay in sync.
 * A date change shifts every copy by the same number of days. Paid stays
 * on each day, except the edited copy which uses the form value.
 */
export function updateSeriesOccurrences(events, original, fromKey, editIndex, updated, toKey) {
    const destKey = toKey || fromKey;
    const delta = destKey === fromKey ? 0 : daysBetweenKeys(fromKey, destKey);
    const copies = [];

    Object.keys(events || {}).forEach((key) => {
        (events[key] || []).forEach((entry, idx) => {
            const edited = key === fromKey && idx === editIndex;
            if (edited || isSameSeries(original, entry)) {
                copies.push({ key, entry, edited });
            }
        });
    });

    const next = removeSeriesOccurrences(events, original);

    copies.forEach(({ key, entry, edited }) => {
        const newKey = delta ? addDaysToKey(key, delta) : key;
        if (!next[newKey]) next[newKey] = [];
        else next[newKey] = [...next[newKey]];
        next[newKey].push(seriesEntry(updated, edited ? updated.paid : entry.paid));
    });

    return next;
}

/** Drop the old cadence and grow a new series from destKey. */
export function rebuildSeriesFrom(events, original, destKey, updated) {
    const row = seriesEntry(updated, updated.paid);
    const next = removeSeriesOccurrences(events, original);
    if (!next[destKey]) next[destKey] = [];
    else next[destKey] = [...next[destKey]];
    next[destKey].push(row);
    return seedRecurringCopies(next, row, destKey);
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

export function countSeriesWeekday(events, item, weekday) {
    const wd = Number(weekday);
    let count = 0;
    Object.keys(events || {}).forEach((key) => {
        if (weekdayFromKey(key) !== wd) return;
        (events[key] || []).forEach((entry) => {
            if (isSameSeries(item, entry)) count += 1;
        });
    });
    return count;
}

/** Remove series copies that fall on one weekday. Other weekdays stay. */
export function removeSeriesWeekday(events, item, weekday) {
    const wd = Number(weekday);
    const next = { ...events };
    Object.keys(next).forEach((key) => {
        if (weekdayFromKey(key) !== wd) return;
        const filtered = (next[key] || []).filter((entry) => !isSameSeries(item, entry));
        if (filtered.length) next[key] = filtered;
        else delete next[key];
    });
    return next;
}

export function groupExpenses(list) {
    const map = new Map();
    (list || []).forEach((e, i) => {
        const kind = Utils.entryKind(e);
        const key = `${kind}:${normalizeTitle(e.title)}`;
        if (!map.has(key)) {
            map.set(key, { key, title: e.title?.trim() || 'Untitled', kind, items: [] });
        }
        map.get(key).items.push({ e, i });
    });

    return [...map.values()].map((group) => {
        const total = group.items.reduce((sum, row) => sum + Utils.getPrice(row.e), 0);
        return {
            ...group,
            total,
            count: group.items.length,
            kind: group.kind,
            recurring: group.items.some((row) => row.e.recurring),
            repeat: normalizeRepeat(group.items.find((row) => row.e.recurring)?.e.repeat),
            allPaid: group.items.every((row) => row.e.paid)
        };
    }).sort((a, b) => {
        if (a.recurring !== b.recurring) return a.recurring ? -1 : 1;
        return b.total - a.total;
    });
}
