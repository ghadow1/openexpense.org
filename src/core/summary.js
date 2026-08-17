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
                repeat: e.recurring ? (e.repeat || 'monthly') : null,
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

function dailyTotals(items, y, m, daysInMonth) {
    const byDate = new Map();
    items.forEach(item => {
        const prev = byDate.get(item.date) || { amount: 0, count: 0 };
        prev.amount += item.amount;
        prev.count += 1;
        byDate.set(item.date, prev);
    });

    const days = [];
    for (let d = 1; d <= daysInMonth; d++) {
        const date = `${y}-${Utils.pad(m + 1)}-${Utils.pad(d)}`;
        const row = byDate.get(date) || { amount: 0, count: 0 };
        days.push({ day: d, date, amount: row.amount, count: row.count });
    }
    return days;
}

/** Expense vs income totals for one calendar day. */
export function sumDay(dayEvents) {
    let expense = 0;
    let income = 0;
    (dayEvents || []).forEach((e) => {
        const amount = Utils.getPrice(e);
        if (!Number.isFinite(amount) || amount <= 0) return;
        if (Utils.entryKind(e) === 'income') income += amount;
        else expense += amount;
    });
    return { expense, income, net: income - expense };
}

/** Calendar corner: net up / down / even, not raw spend or income. */
export function dayNetBadge(dayEvents) {
    const { expense, income, net } = sumDay(dayEvents);
    if (expense <= 0 && income <= 0) return null;
    return {
        expense,
        income,
        net,
        amount: Math.abs(net),
        direction: net > 0 ? 'up' : net < 0 ? 'down' : 'even'
    };
}

function weekdayTotals(items) {
    const totals = new Array(7).fill(0);
    const counts = new Array(7).fill(0);
    items.forEach(item => {
        const [yy, mm, dd] = item.date.split('-').map(Number);
        const wd = new Date(Date.UTC(yy, mm - 1, dd)).getUTCDay();
        totals[wd] += item.amount;
        counts[wd] += 1;
    });
    return { totals, counts };
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
        allMerchants: stats.byTitle,
        dailyTotals: dailyTotals(items, y, m, daysInMonth),
        weekdayTotals: weekdayTotals(items),
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

/** Snapshot chips: keep large nets readable on tablet and phone. */
export function formatChipMoney(value) {
    const n = Number(value) || 0;
    const abs = Math.abs(n);
    const sign = n > 0 ? '+' : n < 0 ? '-' : '';
    if (abs >= 10000) return `${sign}$${(abs / 1000).toFixed(1)}k`;
    if (abs >= 1000) return `${sign}$${abs.toFixed(0)}`;
    return `${sign}${Utils.formatMoney(abs)}`;
}

function dateKeyOf(date) {
    return Utils.dateKey(date.getFullYear(), date.getMonth(), date.getDate());
}

function addDaysKey(key, days) {
    const [y, m, d] = String(key).split('-').map(Number);
    const dt = new Date(Date.UTC(y, m - 1, d));
    dt.setUTCDate(dt.getUTCDate() + Number(days || 0));
    return Utils.dateKey(dt.getUTCFullYear(), dt.getUTCMonth(), dt.getUTCDate());
}

/** Paid income minus paid spend on or before asOf. Pending and future dates do not count. */
export function settledFundsThrough(events, asOf = new Date()) {
    const asOfKey = dateKeyOf(asOf);
    let incoming = 0;
    let outgoing = 0;

    Object.keys(events || {}).forEach((date) => {
        if (date > asOfKey) return;
        (events[date] || []).forEach((e) => {
            if (!e.paid) return;
            const amount = Utils.getPrice(e);
            if (!Number.isFinite(amount) || amount <= 0) return;
            if (Utils.entryKind(e) === 'income') incoming += amount;
            else outgoing += amount;
        });
    });

    return { incoming, outgoing, net: incoming - outgoing };
}

/** Unpaid entries in an inclusive date window, optionally one kind. */
export function pendingInWindow(events, fromKey, toKey, kind) {
    let total = 0;
    let count = 0;

    Object.keys(events || {}).forEach((date) => {
        if (date < fromKey || date > toKey) return;
        (events[date] || []).forEach((e) => {
            if (e.paid) return;
            if (kind && Utils.entryKind(e) !== kind) return;
            const amount = Utils.getPrice(e);
            if (!Number.isFinite(amount) || amount <= 0) return;
            total += amount;
            count += 1;
        });
    });

    return { total, count };
}

/**
 * Homepage snapshot. Current funds are settled cash. Projected income is
 * the viewed month’s scheduled income (recurring copies already on the
 * calendar). Cashflow and monthly avg stay month/year nets. Does not persist.
 */
export function computeNetSnapshot(events, currentDate, asOf = new Date()) {
    const spend = computeMonthlySummary(events, currentDate, 'expense');
    const income = computeMonthlySummary(events, currentDate, 'income');
    const funds = settledFundsThrough(events, asOf);
    const asOfKey = dateKeyOf(asOf);
    const dueSoon = pendingInWindow(events, asOfKey, addDaysKey(asOfKey, 7), 'expense');
    const savingsRate = income.total > 0
        ? ((income.total - spend.total) / income.total) * 100
        : null;

    return {
        monthIn: income.total,
        monthOut: spend.total,
        monthNet: income.total - spend.total,
        yearNet: (income.yearTotal || 0) - (spend.yearTotal || 0),
        monthAvg: (income.yearAvg || 0) - (spend.yearAvg || 0),
        monthLabel: spend.shortMonth,
        currentFunds: funds.net,
        fundsIn: funds.incoming,
        fundsOut: funds.outgoing,
        projectedIncome: income.total,
        incomeReceived: income.paid,
        incomeDue: income.pending,
        dueSoon: dueSoon.total,
        dueSoonCount: dueSoon.count,
        leftToPay: spend.pending,
        savingsRate
    };
}

export function formatDelta(value) {
    const n = Number(value || 0);
    const sign = n > 0 ? '+' : '';
    return `${sign}${n.toFixed(1)}%`;
}
