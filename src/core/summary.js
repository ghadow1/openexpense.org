/**
 * OpenExpense — monthly summary math
 *
 * Pure functions over `events`. The sidebar, snapshot chips, and PDF
 * exporter all consume computeMonthlySummary(). Year cards are year-to-date
 * through the viewed month. Month totals are the calendar register for that
 * month. Money display goes through Utils.formatMoney.
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
        const cents = Utils.toCents(item.amount);
        total += cents;
        activeDays.add(item.date);
        if (item.paid) {
            paid += cents;
            paidCount += 1;
        } else {
            pending += cents;
            pendingCount += 1;
        }
        if (item.recurring) recurring += cents;
        else oneTime += cents;

        const label = item.title.trim() || 'Untitled';
        const prev = byTitle.get(label) || { title: label, amount: 0, count: 0 };
        prev.amount += cents;
        prev.count += 1;
        byTitle.set(label, prev);
    });

    return {
        total: Utils.fromCents(total),
        paid: Utils.fromCents(paid),
        pending: Utils.fromCents(pending),
        paidCount,
        pendingCount,
        recurring: Utils.fromCents(recurring),
        oneTime: Utils.fromCents(oneTime),
        itemCount: items.length,
        activeDays: activeDays.size,
        byTitle: [...byTitle.values()]
            .map((row) => ({ ...row, amount: Utils.fromCents(row.amount) }))
            .sort((a, b) => b.amount - a.amount)
    };
}

function addMoney(...values) {
    return Utils.fromCents(values.reduce((sum, value) => sum + Utils.toCents(value), 0));
}

function subMoney(left, right) {
    return Utils.fromCents(Utils.toCents(left) - Utils.toCents(right));
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
            const cents = Utils.toCents(Utils.getPrice(e));
            if (cents > 0) totals[monthIdx] += cents;
        });
    });
    return totals.map((cents) => Utils.fromCents(cents));
}

function deltaPercent(current, previous) {
    if (previous <= 0) return current > 0 ? null : 0;
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
        prev.amount += Utils.toCents(item.amount);
        prev.count += 1;
        byDate.set(item.date, prev);
    });

    const days = [];
    for (let d = 1; d <= daysInMonth; d++) {
        const date = `${y}-${Utils.pad(m + 1)}-${Utils.pad(d)}`;
        const row = byDate.get(date) || { amount: 0, count: 0 };
        days.push({ day: d, date, amount: Utils.fromCents(row.amount), count: row.count });
    }
    return days;
}

/** Expense vs income totals for one calendar day. */
export function sumDay(dayEvents) {
    let expense = 0;
    let income = 0;
    (dayEvents || []).forEach((e) => {
        const cents = Utils.toCents(Utils.getPrice(e));
        if (cents <= 0) return;
        if (Utils.entryKind(e) === 'income') income += cents;
        else expense += cents;
    });
    return {
        expense: Utils.fromCents(expense),
        income: Utils.fromCents(income),
        net: Utils.fromCents(income - expense)
    };
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
        totals[wd] += Utils.toCents(item.amount);
        counts[wd] += 1;
    });
    return { totals: totals.map((cents) => Utils.fromCents(cents)), counts };
}

export function computeMonthlySummary(events, currentDate, kind = 'expense', asOf = new Date()) {
    const face = kind === 'income' ? 'income' : 'expense';
    const y = currentDate.getFullYear();
    const m = currentDate.getMonth();
    const today = asOf instanceof Date && !Number.isNaN(asOf.getTime()) ? asOf : new Date();

    const items = collectMonthItems(events, y, m, face);
    const stats = sumItems(items);
    const prevY = m - 1 < 0 ? y - 1 : y;
    const prevM = m - 1 < 0 ? 11 : m - 1;
    const actualPrevTotal = monthTotal(events, prevY, prevM, face);

    const monthTotals = yearMonthTotals(events, y, face);
    const ytdTotals = monthTotals.slice(0, m + 1);
    const ytdActiveMonths = ytdTotals.filter((value) => value > 0).length;
    const yearScheduled = addMoney(...monthTotals);
    const yearTotal = addMoney(...ytdTotals);
    const yearAvg = ytdActiveMonths ? yearTotal / ytdActiveMonths : 0;

    const daysInMonth = new Date(y, m + 1, 0).getDate();
    const isCurrentMonth = y === today.getFullYear() && m === today.getMonth();
    const daysElapsed = isCurrentMonth ? today.getDate() : daysInMonth;
    const asOfKey = isCurrentMonth
        ? dateKeyOf(today)
        : `${y}-${Utils.pad(m + 1)}-${Utils.pad(daysInMonth)}`;
    let elapsedCents = 0;
    let futureCents = 0;
    items.forEach((item) => {
        const cents = Utils.toCents(item.amount);
        if (item.date <= asOfKey) elapsedCents += cents;
        else futureCents += cents;
    });
    const dailyPace = daysElapsed > 0 ? Utils.fromCents(elapsedCents) / daysElapsed : 0;
    // The calendar is the source of truth. Recurring copies are already
    // seeded, so do not invent a rest-of-month pace on top of logged bills.
    const projectedTotal = stats.total;
    const dayDivisor = isCurrentMonth ? Math.max(1, daysElapsed) : daysInMonth;
    const avgPerDay = dayDivisor
        ? Utils.fromCents(isCurrentMonth ? elapsedCents : Utils.toCents(stats.total)) / dayDivisor
        : 0;

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
        avgPerEntry: stats.itemCount
            ? Utils.fromCents(Math.round(Utils.toCents(stats.total) / stats.itemCount))
            : 0,
        avgPerDay,
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
        yearScheduled,
        ytdActiveMonths,
        ytdThroughMonth: m,
        daysInMonth,
        daysElapsed,
        dailyPace,
        oneTimePace: 0,
        impliedUnscheduled: 0,
        elapsedTotal: Utils.fromCents(elapsedCents),
        futureTotal: Utils.fromCents(futureCents),
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
    const n = Utils.fromCents(Utils.toCents(value));
    const abs = Math.abs(n);
    const sign = n > 0 ? '+' : n < 0 ? '-' : '';
    if (abs >= 10000) return `${sign}$${(abs / 1000).toFixed(1)}k`;
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
            const cents = Utils.toCents(Utils.getPrice(e));
            if (cents <= 0) return;
            if (Utils.entryKind(e) === 'income') incoming += cents;
            else outgoing += cents;
        });
    });

    return {
        incoming: Utils.fromCents(incoming),
        outgoing: Utils.fromCents(outgoing),
        net: Utils.fromCents(incoming - outgoing)
    };
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
            const cents = Utils.toCents(Utils.getPrice(e));
            if (cents <= 0) return;
            total += cents;
            count += 1;
        });
    });

    return { total: Utils.fromCents(total), count };
}

function averageActiveNets(incomeTotals, spendTotals, throughMonth = 11) {
    let sum = 0;
    let count = 0;
    const end = Math.min(11, Math.max(-1, throughMonth));
    for (let i = 0; i <= end; i++) {
        const incoming = Utils.toCents(incomeTotals[i] || 0);
        const outgoing = Utils.toCents(spendTotals[i] || 0);
        if (incoming <= 0 && outgoing <= 0) continue;
        sum += incoming - outgoing;
        count += 1;
    }
    return count ? Utils.fromCents(sum) / count : 0;
}

/**
 * Homepage snapshot. Current funds are settled cash. Projected income is
 * the viewed month’s scheduled income (recurring copies already on the
 * calendar). Year totals and monthly averages stop at the viewed month so
 * later recurring copies do not inflate “expense months.” Does not persist.
 */
export function computeNetSnapshot(events, currentDate, asOf = new Date()) {
    const spend = computeMonthlySummary(events, currentDate, 'expense', asOf);
    const income = computeMonthlySummary(events, currentDate, 'income', asOf);
    const funds = settledFundsThrough(events, asOf);
    const asOfKey = dateKeyOf(asOf);
    const dueSoon = pendingInWindow(events, asOfKey, addDaysKey(asOfKey, 7), 'expense');
    const incomeSoon = pendingInWindow(events, asOfKey, addDaysKey(asOfKey, 7), 'income');
    const monthNet = subMoney(income.total, spend.total);
    const yearNet = subMoney(income.yearTotal, spend.yearTotal);
    const savingsRate = income.total > 0
        ? (monthNet / income.total) * 100
        : null;
    const growth = scoreGrowthPotential({ income, spend, monthNet, savingsRate, currentFunds: funds.net });

    return {
        monthIn: income.total,
        monthOut: spend.total,
        monthNet,
        yearNet,
        monthAvg: averageActiveNets(income.monthTotals, spend.monthTotals, currentDate.getMonth()),
        monthLabel: spend.shortMonth,
        ytdIn: income.yearTotal,
        ytdOut: spend.yearTotal,
        currentFunds: funds.net,
        fundsIn: funds.incoming,
        fundsOut: funds.outgoing,
        projectedIncome: income.total,
        incomeReceived: income.paid,
        incomeDue: income.pending,
        incomeDueCount: income.pendingCount,
        incomeSoon: incomeSoon.total,
        incomeSoonCount: incomeSoon.count,
        incomeRecurring: income.recurring,
        spendPaid: spend.paid,
        spendRecurring: spend.recurring,
        dueSoon: dueSoon.total,
        dueSoonCount: dueSoon.count,
        leftToPay: spend.pending,
        leftToPayCount: spend.pendingCount,
        savingsRate,
        growth
    };
}

function clamp(value, lo, hi) {
    return Math.min(hi, Math.max(lo, value));
}

/**
 * Growth potential — CFPB-style well-being (control, buffer, on-track)
 * plus a CFP keep-rate of about 15–20%. Always framed as progress.
 * Factors sum to 100.
 */
function scoreGrowthPotential({ income, spend, monthNet, savingsRate, currentFunds }) {
    let pay = 0;
    if (income.total > 0) pay += 10;
    if (income.recurring > 0 && income.total > 0) {
        pay += 6 + Math.round(6 * clamp(income.recurring / income.total, 0, 1));
    } else if (income.total > 0) {
        pay += 3;
    }
    if (income.paid > 0) pay += 4;
    pay = clamp(pay, 0, 22);

    let keep;
    if (!(income.total > 0)) {
        keep = spend.itemCount ? 8 : 4;
    } else if (savingsRate >= 20) keep = 24;
    else if (savingsRate >= 15) keep = 21;
    else if (savingsRate >= 10) keep = 17;
    else if (savingsRate >= 5) keep = 13;
    else if (savingsRate >= 0) keep = 10;
    else keep = 7;

    let buffer;
    if (currentFunds >= 2500) buffer = 20;
    else if (currentFunds >= 1000) buffer = 17;
    else if (currentFunds >= 250) buffer = 14;
    else if (currentFunds > 0) buffer = 10;
    else if (income.total > 0 || spend.itemCount) buffer = 6;
    else buffer = 3;

    let steward;
    if (!spend.itemCount) steward = income.itemCount ? 9 : 5;
    else if (spend.total <= 0) steward = 9;
    else steward = 6 + Math.round(12 * clamp(spend.paid / spend.total, 0, 1));

    const active = (spend.activeDays || 0) + (income.activeDays || 0);
    const sources = (income.allMerchants || []).length;
    let rhythm = 4;
    if (active >= 1) rhythm += 3;
    if (active >= 4) rhythm += 3;
    if (income.recurring > 0) rhythm += 3;
    if (sources >= 2) rhythm += 3;
    rhythm = clamp(rhythm, 0, 16);

    const factors = [
        { id: 'pay', label: 'Pay engine', score: pay, max: 22, hint: 'Scheduled and recurring income' },
        { id: 'keep', label: 'Keep rate', score: keep, max: 24, hint: 'Share of income still yours' },
        { id: 'buffer', label: 'Cash buffer', score: buffer, max: 20, hint: 'Settled funds you can choose with' },
        { id: 'steward', label: 'Bill care', score: steward, max: 18, hint: 'Paying what is on the calendar' },
        { id: 'rhythm', label: 'Money rhythm', score: rhythm, max: 16, hint: 'Showing up and planning ahead' }
    ];
    const score = factors.reduce((sum, row) => sum + row.score, 0);

    let label = 'Getting started';
    if (score >= 80) label = 'Compounding';
    else if (score >= 65) label = 'Strong runway';
    else if (score >= 45) label = 'On the rise';
    else if (score >= 25) label = 'Building momentum';

    const STRENGTH = {
        pay: 'Recurring pay on the calendar is a net-worth engine.',
        keep: 'Keeping a share of income is how wealth compounds.',
        buffer: 'Settled cash gives you room to choose the next step.',
        steward: 'Caring for bills, one by one, builds financial calm.',
        rhythm: 'A steady calendar habit is a growth practice.'
    };
    const best = [...factors].sort((a, b) => (b.score / b.max) - (a.score / a.max))[0];
    const blurb = score < 25
        ? 'Log a paycheck or a bill to light up your growth meter. Every entry counts.'
        : STRENGTH[best.id];

    return { score, label, blurb, monthNet, factors };
}

export function formatDelta(value) {
    if (value == null || !Number.isFinite(Number(value))) return '—';
    const n = Number(value);
    const sign = n > 0 ? '+' : '';
    return `${sign}${n.toFixed(1)}%`;
}
