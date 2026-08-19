/**
 * OpenExpense — monthly summary math
 *
 * Pure functions over `events`. The sidebar, snapshot dials, and statement PDF
 * exporter all consume computeMonthlySummary(). Year cards are year-to-date
 * through the viewed month. Month totals are the calendar register for that
 * month, including future scheduled copies. Axis labels use formatAxisMoney.
 */
import { Utils } from './utils.js';
import {
    computePlanner,
    describePlan,
    growthPotentialPct,
    incomeUsed,
    runwayDays,
    sanitizePlan,
    spendUsed,
    weekBounds,
    windowTotals
} from './plan.js';

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
                category: e.category || '',
                group: e.group || '',
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

/** Divide a monetary total and round once at the cent boundary. */
function averageMoney(total, divisor) {
    const count = Number(divisor);
    if (!Number.isFinite(count) || count <= 0) return 0;
    return Utils.fromCents(Math.round(Utils.toCents(total) / count));
}

function monthTotal(events, y, m, kind = 'expense') {
    return sumItems(collectMonthItems(events, y, m, kind)).total;
}

function yearMonthTotals(events, y, kind = 'expense') {
    const totals = new Array(12).fill(0);
    Object.keys(events).forEach(date => {
        if (!date.startsWith(`${y}-`)) return;
        const monthIdx = parseInt(date.split('-')[1], 10) - 1;
        // The normal import path validates date keys, but this pure function is
        // also public to the headless engine. Reject malformed month indexes
        // here instead of writing a non-array property such as totals[-1].
        if (!Number.isInteger(monthIdx) || monthIdx < 0 || monthIdx >= totals.length) return;
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
    const yearAvg = averageMoney(yearTotal, ytdActiveMonths);

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
    const dailyPace = averageMoney(Utils.fromCents(elapsedCents), daysElapsed);
    // The calendar is the source of truth. Recurring copies are already
    // seeded, so do not invent a rest-of-month pace on top of logged bills.
    const projectedTotal = stats.total;
    const dayDivisor = isCurrentMonth ? Math.max(1, daysElapsed) : daysInMonth;
    const avgPerDay = averageMoney(
        Utils.fromCents(isCurrentMonth ? elapsedCents : Utils.toCents(stats.total)),
        dayDivisor
    );

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

/**
 * Short axis labels for a banking chart: $5k, $10k, $1.2m. Intermediate
 * cents and a long $3,364.42 would crowd a 60px plot.
 */
export function formatAxisMoney(value) {
    const n = Utils.fromCents(Utils.toCents(value));
    const abs = Math.abs(n);
    const sign = n < 0 ? '-' : '';
    if (abs >= 1000000) {
        const m = abs / 1000000;
        const body = m >= 10 || Number.isInteger(m) ? String(Math.round(m)) : m.toFixed(1).replace(/\.0$/, '');
        return `${sign}$${body}m`;
    }
    if (abs >= 1000) {
        const k = abs / 1000;
        const body = k >= 10 || Number.isInteger(k) ? String(Math.round(k)) : k.toFixed(1).replace(/\.0$/, '');
        return `${sign}$${body}k`;
    }
    if (abs === 0) return '$0';
    return `${sign}$${Math.round(abs)}`;
}

/** Two or three ticks from 0 to a rounded ceiling. */
export function axisTicks(max) {
    const n = Math.max(0, Number(max) || 0);
    if (n <= 0) return [0, 0, 0];
    const raw = n / 2;
    const mag = 10 ** Math.floor(Math.log10(raw));
    const step = Math.ceil(raw / mag) * mag;
    const top = step * 2;
    return [0, step, top];
}

/**
 * Keep start, end, and one middle point. The middle is the month being viewed
 * when `anchorIndex` names one, so the figure on the dial is also a point on
 * the chart; otherwise it is the peak or valley furthest from the start.
 */
export function reduceSeries(points = [], { anchorIndex = null } = {}) {
    const rows = (points || []).map((point, index) => ({
        label: point?.label ?? '',
        value: Number(point?.value) || 0,
        index: point?.index ?? index
    }));
    if (rows.length <= 3) return rows;
    const start = rows[0];
    const end = rows[rows.length - 1];

    const anchor = anchorIndex == null
        ? null
        : rows.find((row) => row.index === anchorIndex);
    if (anchor && anchor.index !== start.index && anchor.index !== end.index) {
        return [start, anchor, end];
    }

    let extreme = rows[1];
    let score = -1;
    for (let i = 1; i < rows.length - 1; i += 1) {
        const mag = Math.abs(rows[i].value - start.value);
        if (mag > score) {
            score = mag;
            extreme = rows[i];
        }
    }
    if (extreme.index === start.index || extreme.index === end.index || score <= 0) {
        return [start, end];
    }
    return [start, extreme, end];
}

/** Jan–Dec labels, then start / viewed month (or peak) / end. */
export function yearSeriesPoints(monthTotals = [], year = 2000, { anchorIndex = null } = {}) {
    const y = Number(year) || 2000;
    const points = Array.from({ length: 12 }, (_, index) => ({
        label: new Date(y, index, 1).toLocaleString('en-US', { month: 'short' }),
        value: Number(monthTotals[index]) || 0,
        index
    }));
    return reduceSeries(points, { anchorIndex });
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

/**
 * Settled cash carried in from before a month started: deposited income minus
 * paid spending on every earlier date, up to today.
 *
 * This is the reserve the month leans on. Keeping it separate from the month's
 * own cash flow is the whole point — one number answers "what did I arrive
 * with", the other answers "how is this month going", and a single combined
 * figure cannot say which of the two is running out.
 */
export function savingsCarriedInto(events, monthStartKey, asOf = new Date()) {
    const asOfKey = dateKeyOf(asOf);
    let incoming = 0;
    let outgoing = 0;

    Object.keys(events || {}).forEach((date) => {
        if (date >= monthStartKey || date > asOfKey) return;
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
    return averageMoney(Utils.fromCents(sum), count);
}

/**
 * Cash snapshot for Overview, Planner, and calendar week math.
 * UI modules keep this object in a local named `snap`.
 *
 * The cash line is deposited income, what is left after the month's spending,
 * and the savings carried in behind that. `currentFunds` is the lifetime
 * settled figure (embed hosts). Projected income is the viewed month’s
 * scheduled income. Year totals stop at the viewed month. A ledger `plan` can
 * withhold tax and hold savings; the default plan leaves every existing
 * figure identical. Does not persist.
 */
export function computeNetSnapshot(events, currentDate, asOf = new Date(), plan) {
    const rules = sanitizePlan(plan);
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

    // Only income actually marked deposited counts as cash in hand; a paycheck
    // still on the calendar is a plan, not money, and spending it would be the
    // easiest way for this figure to lie. A scheduled-income rule can widen
    // that on purpose from Budgeting settings.
    const monthStartKey = Utils.dateKey(currentDate.getFullYear(), currentDate.getMonth(), 1);
    const savings = savingsCarriedInto(events, monthStartKey, asOf);
    const usedSpend = spendUsed(spend, rules);
    const usedIncome = incomeUsed(income, rules);
    const planner = computePlanner({
        incomeUsed: usedIncome,
        spendUsed: usedSpend,
        spendItems: spend.allItems || [],
        dailyTotals: spend.dailyTotals || [],
        daysInMonth: spend.daysInMonth,
        daysElapsed: spend.daysElapsed,
        currentDate,
        asOf,
        plan: rules
    });
    const leftToSpend = planner.leftToSpend;
    // Optional bank amount is display-only. Leftover math stays the cash line.
    const currentSavings = rules.currentSavings;
    const growthPct = growthPotentialPct(leftToSpend, currentSavings);
    // A month that outruns its deposits is covered by the reserve behind it.
    const savingsAfterMonth = addMoney(savings.net, leftToSpend);
    const runwayCash = addMoney(savings.net, Math.max(0, leftToSpend));

    const week = weekBounds(asOf);
    const weekWindow = windowTotals(events, week.start, week.end, rules);
    const weeklyLeft = subMoney(weekWindow.net, rules.weeklySavings);

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
        savingsFunds: savings.net,
        savingsAfterMonth,
        deposited: income.paid,
        leftToSpend,
        currentSavings,
        growthPct,
        drawsOnSavings: leftToSpend < 0,
        projectedIncome: income.total,
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
        plan: rules,
        planCaption: describePlan(rules),
        spendUsed: usedSpend,
        incomeUsed: usedIncome,
        weeklySavings: rules.weeklySavings,
        weeklyReserve: planner.weeklyReserve,
        reserveOn: planner.reserveOn,
        weekStart: week.start,
        weekEnd: week.end,
        weekIncome: weekWindow.incomeUsed,
        weekSpend: weekWindow.spendUsed,
        weekNet: weekWindow.net,
        weeklyLeft,
        taxWithheld: planner.taxWithheld,
        afterTax: planner.afterTax,
        pctHold: planner.pctHold,
        savingsHold: planner.savingsHold,
        spendableIncome: planner.spendableIncome,
        daysLeft: planner.daysLeft,
        dailySafe: planner.dailySafe,
        weeklySafe: planner.weeklySafe,
        avgDailyBurn: planner.avgDailyBurn,
        runwayCash,
        runwayDays: runwayDays(runwayCash, planner.avgDailyBurn),
        ratioNeedsSpent: planner.ratioNeedsSpent,
        ratioWantsSpent: planner.ratioWantsSpent,
        ratioOtherSpent: planner.ratioOtherSpent,
        ratioNeedsCap: planner.ratioNeedsCap,
        ratioWantsCap: planner.ratioWantsCap,
        ratioSaveCap: planner.ratioSaveCap,
        weekBuckets: planner.weekBuckets,
        unpaidRecurring: planner.unpaidRecurring,
        unpaidRecurringCount: planner.unpaidRecurringCount
    };
}

export function formatDelta(value) {
    if (value == null || !Number.isFinite(Number(value))) return '—';
    const n = Number(value);
    const sign = n > 0 ? '+' : '';
    return `${sign}${n.toFixed(1)}%`;
}
