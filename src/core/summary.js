/**
 * OpenExpense — monthly summary math
 *
 * Pure functions over `events`. The sidebar and PDF exporter both consume
 * computeMonthlySummary(); money display goes through Utils.formatMoney.
 */
import { Utils } from './utils.js';

function monthKey(y, m) {
    return `${y}-${Utils.pad(m + 1)}`;
}

function collectMonthItems(events, y, m, kind = 'expense') {
    const key = monthKey(y, m);
    const items = [];

    Object.keys(events).forEach(date => {
        if (!date.startsWith(key)) return;
        events[date].forEach((e, index) => {
            if (Utils.entryKind(e) !== kind) return;
            const amount = Utils.getPrice(e);
            if (amount <= 0) return;
            items.push({
                title: e.title || 'Untitled',
                amount,
                date,
                index,
                paid: !!e.paid,
                recurring: !!e.recurring,
                note: e.note || '',
                kind
            });
        });
    });

    return items;
}

function sumItems(items) {
    let total = 0;
    let paid = 0;
    let pending = 0;
    let paidCount = 0;
    let pendingCount = 0;
    let recurring = 0;
    let oneTime = 0;
    const activeDays = new Set();
    const byTitle = new Map();

    items.forEach(item => {
        total += item.amount;
        activeDays.add(item.date);
        if (item.paid) {
            paid += item.amount;
            paidCount += 1;
        } else {
            pending += item.amount;
            pendingCount += 1;
        }
        if (item.recurring) recurring += item.amount;
        else oneTime += item.amount;

        const label = item.title.trim() || 'Untitled';
        const prev = byTitle.get(label) || { title: label, amount: 0, count: 0 };
        prev.amount += item.amount;
        prev.count += 1;
        byTitle.set(label, prev);
    });

    return {
        total,
        paid,
        pending,
        paidCount,
        pendingCount,
        recurring,
        oneTime,
        itemCount: items.length,
        activeDays: activeDays.size,
        byTitle: [...byTitle.values()].sort((a, b) => b.amount - a.amount)
    };
}

function monthTotal(events, y, m, kind = 'expense') {
    return sumItems(collectMonthItems(events, y, m, kind)).total;
}

function yearMonthTotals(events, y, kind = 'expense') {
    const totals = new Array(12).fill(0);
    Object.keys(events).forEach(date => {
        if (!date.startsWith(`${y}-`)) return;
        const monthIdx = parseInt(date.split('-')[1], 10) - 1;
        events[date].forEach(e => {
            if (Utils.entryKind(e) !== kind) return;
            const amount = Utils.getPrice(e);
            if (amount > 0) totals[monthIdx] += amount;
        });
    });
    return totals;
}

function deltaPercent(current, previous) {
    if (previous <= 0) return current > 0 ? 100 : 0;
    return ((current - previous) / previous) * 100;
}

function largestItem(items) {
    if (!items.length) return null;
    return items.reduce((best, item) => (item.amount > best.amount ? item : best), items[0]);
}

export function computeMonthlySummary(events, currentDate, kind = 'expense') {
    const face = kind === 'income' ? 'income' : 'expense';
    const y = currentDate.getFullYear();
    const m = currentDate.getMonth();
    const today = new Date();

    const items = collectMonthItems(events, y, m, face);
    const stats = sumItems(items);
    const prevY = m - 1 < 0 ? y - 1 : y;
    const prevM = m - 1 < 0 ? 11 : m - 1;
    const actualPrevTotal = monthTotal(events, prevY, prevM, face);

    const monthTotals = yearMonthTotals(events, y, face);
    const activeMonths = monthTotals.filter(v => v > 0).length || 1;
    const yearTotal = monthTotals.reduce((a, b) => a + b, 0);
    const yearAvg = yearTotal / activeMonths;

    const daysInMonth = new Date(y, m + 1, 0).getDate();
    const isCurrentMonth = y === today.getFullYear() && m === today.getMonth();
    const daysElapsed = isCurrentMonth ? today.getDate() : daysInMonth;
    const dailyPace = daysElapsed > 0 ? stats.total / daysElapsed : 0;
    const projectedTotal = isCurrentMonth ? dailyPace * daysInMonth : stats.total;

    const pctPaid = stats.total ? (stats.paid / stats.total) * 100 : 0;
    const pctPending = stats.total ? (stats.pending / stats.total) * 100 : 0;

    const pendingItems = items.filter(i => !i.paid).sort((a, b) => a.date.localeCompare(b.date) || b.amount - a.amount);
    const paidItems = items.filter(i => i.paid).sort((a, b) => a.date.localeCompare(b.date) || b.amount - a.amount);

    return {
        kind: face,
        year: y,
        month: m,
        monthLabel: currentDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' }),
        shortMonth: currentDate.toLocaleDateString('en-US', { month: 'short' }),
        ...stats,
        pctPaid,
        pctPending,
        avgPerEntry: stats.itemCount ? stats.total / stats.itemCount : 0,
        avgPerDay: stats.activeDays ? stats.total / stats.activeDays : 0,
        largest: largestItem(items),
        topMerchants: stats.byTitle.slice(0, 4),
        prevMonthTotal: actualPrevTotal,
        monthDelta: deltaPercent(stats.total, actualPrevTotal),
        monthTotals,
        yearTotal,
        yearAvg,
        daysInMonth,
        daysElapsed,
        dailyPace,
        projectedTotal,
        isCurrentMonth,
        pendingItems,
        paidItems,
        allItems: [...pendingItems, ...paidItems]
    };
}

export function formatMoney(value) {
    return Utils.formatMoney(value);
}

export function formatDelta(value) {
    const n = Number(value || 0);
    const sign = n > 0 ? '+' : '';
    return `${sign}${n.toFixed(1)}%`;
}
