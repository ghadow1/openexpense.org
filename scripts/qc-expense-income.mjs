/**
 * Quality check: expense vs income paths (kind, summary, weekly series).
 * Run: npm test
 */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { Utils } from '../src/core/utils.js';
import { sanitizeLedger, sanitizeEntry } from '../src/core/ledger-file.js';
import { computeMonthlySummary, computeNetSnapshot, sumDay, dayNetBadge, formatChipMoney } from '../src/core/summary.js';
import {
    normalizeRepeat, nextOccurrenceKey, seriesCopyCount,
    removeSeriesOccurrences, removeSeriesWeekday, groupExpenses,
    weekdayFromKey, weekdayName, countSeriesWeekday,
    addDaysToKey, daysBetweenKeys, updateSeriesOccurrences, rebuildSeriesFrom,
    countSeriesOccurrences
} from '../src/core/series.js';

function entry({ title, price, kind, recurring = false, repeat, paid = true }) {
    const row = { title, price, paid };
    if (kind === 'income') row.kind = 'income';
    if (recurring) {
        row.recurring = true;
        row.repeat = normalizeRepeat(repeat);
    }
    return row;
}

const ledger = {
    name: 'QC household',
    events: {
        '2026-08-17': [
            entry({ title: 'Coffee', price: 5, recurring: true, repeat: 'weekly' }),
            entry({ title: 'Paycheck', price: 800, kind: 'income', recurring: true, repeat: 'weekly' }),
            entry({ title: 'Rent', price: 1450, recurring: true, repeat: 'monthly' })
        ],
        '2026-08-24': [
            entry({ title: 'Coffee', price: 5, recurring: true, repeat: 'weekly' }),
            entry({ title: 'Paycheck', price: 800, kind: 'income', recurring: true, repeat: 'weekly' })
        ]
    }
};

test('expense is the default kind; income is explicit', () => {
    assert.equal(Utils.entryKind({ title: 'Coffee' }), 'expense');
    assert.equal(Utils.entryKind({ title: 'Paycheck', kind: 'income' }), 'income');
    assert.equal(Utils.entryKind({ title: 'X', kind: 'expense' }), 'expense');
    const cleaned = sanitizeEntry({ title: 'Paycheck', kind: 'income', price: 10, recurring: true, repeat: 'weekly' });
    assert.equal(cleaned.kind, 'income');
    assert.equal(cleaned.repeat, 'weekly');
    assert.equal(sanitizeEntry({ title: 'Coffee', price: 5 }).kind, undefined);
});

test('one events map keeps expense and income on the same day', () => {
    const cleaned = sanitizeLedger(ledger);
    assert.equal(cleaned.events['2026-08-17'].length, 3);
    assert.equal(cleaned.events['2026-08-17'].filter((e) => e.kind === 'income').length, 1);
    assert.equal(cleaned.events['2026-08-17'].filter((e) => e.kind !== 'income').length, 2);
});

test('monthly summary splits expense and income paths', () => {
    const date = new Date(2026, 7, 17);
    const spend = computeMonthlySummary(ledger.events, date, 'expense');
    const income = computeMonthlySummary(ledger.events, date, 'income');
    assert.equal(spend.kind, 'expense');
    assert.equal(income.kind, 'income');
    assert.equal(spend.total, 5 + 5 + 1450);
    assert.equal(income.total, 800 + 800);
    assert.ok(spend.allItems.every((item) => item.kind === 'expense'));
    assert.ok(income.allItems.every((item) => item.kind === 'income'));
});

test('snapshot chips compact large nets', () => {
    assert.equal(formatChipMoney(18980.38), '+$19.0k');
    assert.equal(formatChipMoney(-3364.42), '-$3364.42');
    assert.equal(formatChipMoney(12.5), '+$12.50');
    assert.equal(formatChipMoney(0), '$0.00');
});

test('dashboard snapshot nets income against spend', () => {
    const asOf = new Date(2026, 7, 24);
    const snap = computeNetSnapshot(ledger.events, new Date(2026, 7, 17), asOf);
    assert.equal(snap.monthIn, 1600);
    assert.equal(snap.monthOut, 1460);
    assert.equal(snap.monthNet, 140);
    assert.equal(snap.yearNet, 140);
    assert.equal(snap.monthAvg, 140);
    assert.equal(snap.monthLabel, 'Aug');
    assert.equal(snap.currentFunds, 140);
    assert.equal(snap.projectedIncome, 1600);
    assert.equal(snap.deposited, 1600);
    assert.equal(snap.leftToPay, 0);
    assert.equal(snap.dueSoon, 0);
    assert.equal(Math.round(snap.savingsRate), 9);
});

test('unpaid paychecks are expected income, not unpaid bills', () => {
    const events = {
        '2026-08-01': [entry({ title: 'mTicket', price: 195, paid: true })],
        '2026-08-06': [entry({ title: 'Rental', price: 400, paid: true })],
        '2026-08-15': [entry({ title: 'Kayla Birthday', price: 100, paid: true })],
        '2026-08-17': [
            entry({ title: 'Mint', price: 130.22, paid: false }),
            entry({ title: 'Coffee', price: 300, paid: false })
        ],
        '2026-08-21': [entry({ title: 'Paycheck', price: 961.40, kind: 'income', paid: false })],
        '2026-08-28': [entry({ title: 'Paycheck', price: 961.40, kind: 'income', paid: false })]
    };
    const asOf = new Date(2026, 7, 17);
    const snap = computeNetSnapshot(events, asOf, asOf);
    assert.equal(snap.leftToPay, 430.22);
    assert.equal(snap.leftToPayCount, 2);
    assert.equal(snap.incomeDue, 1922.80);
    assert.equal(snap.incomeDueCount, 2);
    assert.equal(snap.incomeSoon, 961.40);
    assert.equal(snap.incomeSoonCount, 1);
    assert.notEqual(snap.leftToPay, snap.incomeDue);
});

test('monthly average uses each month net, not income avg minus spend avg', () => {
    const events = {
        '2026-01-01': [entry({ title: 'Paycheck', price: 4000, kind: 'income', paid: true })],
        '2026-01-02': [entry({ title: 'Rent', price: 1000, paid: true })],
        '2026-02-02': [entry({ title: 'Rent', price: 1000, paid: true })],
        '2026-03-02': [entry({ title: 'Rent', price: 1000, paid: true })]
    };
    const snap = computeNetSnapshot(events, new Date(2026, 2, 2), new Date(2026, 2, 2));
    assert.equal(snap.monthAvg, (3000 - 1000 - 1000) / 3);
});

test('estimated month total does not double-count future calendar copies', () => {
    const events = {
        '2026-08-07': [entry({ title: 'Paycheck', price: 961, kind: 'income', paid: true })],
        '2026-08-14': [entry({ title: 'Paycheck', price: 961, kind: 'income', paid: true })],
        '2026-08-21': [entry({ title: 'Paycheck', price: 961, kind: 'income', paid: false })],
        '2026-08-28': [entry({ title: 'Paycheck', price: 961, kind: 'income', paid: false })]
    };
    const asOf = new Date(2026, 7, 17);
    const income = computeMonthlySummary(events, asOf, 'income', asOf);
    assert.equal(income.total, 3844);
    assert.ok(income.projectedTotal <= income.total + 0.001);
    assert.equal(income.projectedTotal, 3844);
});

test('money totals stay on whole cents', () => {
    const events = {
        '2026-08-01': [
            entry({ title: 'A', price: 0.1, paid: true }),
            entry({ title: 'B', price: 0.2, paid: true })
        ]
    };
    const spend = computeMonthlySummary(events, new Date(2026, 7, 1), 'expense');
    assert.equal(spend.total, 0.3);
    assert.equal(Utils.getPrice({ price: 10.005 }), 10.01);
});

test('current funds ignore pending and future paid entries', () => {
    const events = {
        '2026-08-01': [entry({ title: 'Paycheck', price: 1000, kind: 'income', paid: true })],
        '2026-08-10': [entry({ title: 'Groceries', price: 400, paid: true })],
        '2026-08-20': [entry({ title: 'Rent', price: 400, paid: false })],
        '2026-09-01': [entry({ title: 'Paycheck', price: 1000, kind: 'income', paid: true })]
    };
    const asOf = new Date(2026, 7, 17);
    const snap = computeNetSnapshot(events, asOf, asOf);
    assert.equal(snap.currentFunds, 600);
    assert.equal(snap.projectedIncome, 1000);
    assert.equal(snap.dueSoon, 400);
    assert.equal(snap.dueSoonCount, 1);
    assert.equal(snap.leftToPay, 400);
});

/**
 * The cash model the overview reports: deposits are money that has landed,
 * what is left of them is this month's spending money, and the reserve behind
 * it is whatever earlier months settled at.
 */
const cashLedger = {
    // Earlier months settle into the reserve.
    '2026-06-01': [entry({ title: 'Paycheck', price: 3000, kind: 'income', paid: true })],
    '2026-06-10': [entry({ title: 'Rent', price: 1200, paid: true })],
    '2026-07-01': [entry({ title: 'Paycheck', price: 3000, kind: 'income', paid: true })],
    '2026-07-10': [entry({ title: 'Rent', price: 2400, paid: true })],
    // The month on screen.
    '2026-08-01': [entry({ title: 'Paycheck', price: 2000, kind: 'income', paid: true })],
    '2026-08-05': [entry({ title: 'Groceries', price: 500, paid: true })],
    '2026-08-12': [entry({ title: 'Rent', price: 900, paid: false })],
    '2026-08-28': [entry({ title: 'Bonus', price: 1000, kind: 'income', paid: false })]
};
const cashAsOf = new Date(2026, 7, 17);

test('deposited counts only income marked deposited', () => {
    const snap = computeNetSnapshot(cashLedger, cashAsOf, cashAsOf);
    // The $1000 bonus is on the calendar but has not landed, so it is not cash.
    assert.equal(snap.deposited, 2000);
    assert.equal(snap.incomeDue, 1000);
    assert.equal(snap.projectedIncome, 3000, 'scheduled income still counts both');
    assert.equal(snap.deposited + snap.incomeDue, snap.projectedIncome);
});

test('left to spend is the deposits less everything the month spends', () => {
    const snap = computeNetSnapshot(cashLedger, cashAsOf, cashAsOf);
    // 2000 deposited - (500 paid + 900 still owed).
    assert.equal(snap.leftToSpend, 600);
    assert.equal(snap.drawsOnSavings, false);
});

test('savings funds are what earlier months settled at, not this month', () => {
    const snap = computeNetSnapshot(cashLedger, cashAsOf, cashAsOf);
    // June 3000-1200, July 3000-2400. August is deliberately excluded.
    assert.equal(snap.savingsFunds, 2400);
    assert.equal(snap.savingsAfterMonth, 3000, 'the month adds its leftover back');
});

test('a month that outruns its deposits draws on savings', () => {
    const events = {
        '2026-07-01': [entry({ title: 'Paycheck', price: 1000, kind: 'income', paid: true })],
        '2026-08-01': [entry({ title: 'Paycheck', price: 500, kind: 'income', paid: true })],
        '2026-08-06': [entry({ title: 'Repair', price: 800, paid: true })]
    };
    const snap = computeNetSnapshot(events, cashAsOf, cashAsOf);
    assert.equal(snap.deposited, 500);
    assert.equal(snap.leftToSpend, -300);
    assert.equal(snap.drawsOnSavings, true);
    assert.equal(snap.savingsFunds, 1000);
    // The overdraft comes out of the reserve rather than vanishing.
    assert.equal(snap.savingsAfterMonth, 700);
});

test('savings funds ignore future dates and undeposited income', () => {
    const events = {
        '2026-07-01': [entry({ title: 'Paycheck', price: 900, kind: 'income', paid: true })],
        // Not deposited, so not cash, even though it is in the past.
        '2026-07-02': [entry({ title: 'Refund', price: 5000, kind: 'income', paid: false })],
        // Dated after asOf, so it has not happened yet.
        '2026-07-30': [entry({ title: 'Ghost', price: 4000, kind: 'income', paid: true })]
    };
    const snap = computeNetSnapshot(events, cashAsOf, new Date(2026, 6, 15));
    assert.equal(snap.savingsFunds, 900);
});

test('an empty ledger reports zeroes rather than nothing', () => {
    const snap = computeNetSnapshot({}, cashAsOf, cashAsOf);
    assert.equal(snap.deposited, 0);
    assert.equal(snap.leftToSpend, 0);
    assert.equal(snap.savingsFunds, 0);
    assert.equal(snap.savingsAfterMonth, 0);
    assert.equal(snap.drawsOnSavings, false);
});

test('the cash figures keep their identities', () => {
    const snap = computeNetSnapshot(cashLedger, cashAsOf, cashAsOf);
    assert.equal(snap.leftToSpend, snap.deposited - snap.monthOut);
    assert.equal(snap.savingsAfterMonth, snap.savingsFunds + snap.leftToSpend);
    assert.equal(snap.drawsOnSavings, snap.leftToSpend < 0);
    // Savings is a slice of settled cash, never more than all of it.
    assert.ok(snap.savingsFunds <= snap.currentFunds + snap.monthOut);
});

test('cash figures stay exact in cents', () => {
    const events = {
        '2026-07-01': [entry({ title: 'In', price: 0.1, kind: 'income', paid: true })],
        '2026-08-01': [entry({ title: 'Pay', price: 0.2, kind: 'income', paid: true })],
        '2026-08-02': [entry({ title: 'Out', price: 0.1, paid: true })]
    };
    const snap = computeNetSnapshot(events, cashAsOf, cashAsOf);
    assert.equal(snap.leftToSpend, 0.1);
    assert.equal(snap.savingsFunds, 0.1);
    assert.equal(snap.savingsAfterMonth, 0.2);
});

test('sumDay splits spend down and income up', () => {
    const totals = sumDay([
        entry({ title: 'Coffee', price: 5 }),
        entry({ title: 'Paycheck', price: 800, kind: 'income' }),
        entry({ title: 'Rent', price: 1450 })
    ]);
    assert.equal(totals.expense, 1455);
    assert.equal(totals.income, 800);
    assert.equal(totals.net, 800 - 1455);
});

test('calendar day badge uses net up or down', () => {
    const down = dayNetBadge([
        entry({ title: 'Coffee', price: 5 }),
        entry({ title: 'Paycheck', price: 800, kind: 'income' }),
        entry({ title: 'Rent', price: 1450 })
    ]);
    assert.equal(down.direction, 'down');
    assert.equal(down.amount, 655);
    assert.notEqual(down.amount, down.expense);

    const up = dayNetBadge([
        entry({ title: 'Paycheck', price: 800, kind: 'income' }),
        entry({ title: 'Coffee', price: 5 })
    ]);
    assert.equal(up.direction, 'up');
    assert.equal(up.amount, 795);
    assert.notEqual(up.amount, up.income);

    const even = dayNetBadge([
        entry({ title: 'Paycheck', price: 50, kind: 'income' }),
        entry({ title: 'Coffee', price: 50 })
    ]);
    assert.equal(even.direction, 'even');
    assert.equal(even.amount, 0);
});

test('monthly summary includes a full-month daily breakdown', () => {
    const date = new Date(2026, 7, 17);
    const spend = computeMonthlySummary(ledger.events, date, 'expense');
    assert.equal(spend.daysInMonth, 31);
    assert.equal(spend.dailyTotals.length, 31);
    const day17 = spend.dailyTotals.find((d) => d.date === '2026-08-17');
    const day24 = spend.dailyTotals.find((d) => d.date === '2026-08-24');
    assert.equal(day17.amount, 1455);
    assert.equal(day17.count, 2);
    assert.equal(day24.amount, 5);
    assert.equal(spend.dailyTotals.filter((d) => d.amount === 0).length, 29);
    assert.ok(spend.allMerchants.some((m) => m.title === 'Rent' && m.amount === 1450));
    assert.equal(spend.weekdayTotals.totals[1], 1460);
    assert.equal(spend.weekdayTotals.totals[0], 0);
});

test('PDF text sanitizer keeps latin and drops diamond markers', async () => {
    const { safePdfText } = await import('../src/core/pdf-theme.js');
    assert.equal(safePdfText('August ◆'), 'August ');
    assert.equal(safePdfText('Paid — pending'), 'Paid - pending');
    assert.equal(safePdfText('Coffee ×2'), 'Coffee x2');
});

test('brochure PDF builds for the viewed month', async () => {
    const { exportMonthlySummaryPdf } = await import('../src/core/summary-pdf.js');
    const date = new Date(2026, 7, 17);
    const spend = computeMonthlySummary(ledger.events, date, 'expense');
    const { blob, filename } = await exportMonthlySummaryPdf({
        summary: spend,
        ledgerName: 'QC household',
        isDark: false
    });
    assert.match(filename, /august-2026-spending-report\.pdf$/);
    assert.ok(blob.size > 2000);
    const income = computeMonthlySummary(ledger.events, date, 'income');
    const incomePdf = await exportMonthlySummaryPdf({
        summary: income,
        ledgerName: 'QC household',
        isDark: true
    });
    assert.match(incomePdf.filename, /income-report\.pdf$/);
    assert.ok(incomePdf.blob.size > 2000);
});

test('weekly copies stay on the weekday for both kinds', () => {
    assert.equal(seriesCopyCount('weekly'), 52);
    assert.equal(nextOccurrenceKey('2026-08-17', 'weekly', 1), '2026-08-24');
    assert.equal(nextOccurrenceKey('2026-08-17', 'monthly', 1), '2026-09-17');
    assert.equal(nextOccurrenceKey('2026-01-31', 'monthly', 1), '2026-02-28');
});

test('weekday delete removes only that weekday of a series', () => {
    const events = {
        '2026-08-01': [entry({ title: 'Rent', price: 1450, recurring: true, repeat: 'monthly' })],
        '2026-09-01': [entry({ title: 'Rent', price: 1450, recurring: true, repeat: 'monthly' })],
        '2026-10-01': [entry({ title: 'Rent', price: 1450, recurring: true, repeat: 'monthly' })]
    };
    const item = events['2026-08-01'][0];
    assert.equal(weekdayName(weekdayFromKey('2026-08-01')), 'Saturday');
    assert.equal(countSeriesWeekday(events, item, weekdayFromKey('2026-08-01')), 1);
    const next = removeSeriesWeekday(events, item, weekdayFromKey('2026-08-01'));
    assert.equal(next['2026-08-01'], undefined);
    assert.equal(next['2026-09-01'].some((e) => e.title === 'Rent'), true);
    assert.equal(next['2026-10-01'].some((e) => e.title === 'Rent'), true);
});

test('weekday delete on a weekly series removes every matching weekday', () => {
    const item = ledger.events['2026-08-17'][0];
    assert.equal(weekdayName(weekdayFromKey('2026-08-17')), 'Monday');
    const next = removeSeriesWeekday(ledger.events, item, weekdayFromKey('2026-08-17'));
    assert.equal(next['2026-08-17']?.some((e) => e.title === 'Coffee'), false);
    assert.equal(next['2026-08-24']?.some((e) => e.title === 'Coffee'), false);
    assert.equal(next['2026-08-17'].some((e) => e.title === 'Paycheck'), true);
    assert.equal(next['2026-08-17'].some((e) => e.title === 'Rent'), true);
});

test('removing a weekly expense series does not touch income', () => {
    const next = removeSeriesOccurrences(ledger.events, {
        title: 'Coffee', recurring: true, repeat: 'weekly'
    });
    assert.equal(next['2026-08-17'].some((e) => e.title === 'Coffee'), false);
    assert.equal(next['2026-08-17'].some((e) => e.title === 'Paycheck' && e.kind === 'income'), true);
    assert.equal(next['2026-08-17'].some((e) => e.title === 'Rent'), true);
    assert.equal(next['2026-08-24'].every((e) => e.kind === 'income'), true);
});

test('editing one recurring copy updates price on every copy', () => {
    const original = ledger.events['2026-08-17'][0];
    const next = updateSeriesOccurrences(
        ledger.events,
        original,
        '2026-08-17',
        0,
        { ...original, price: 6 },
        '2026-08-17'
    );
    assert.equal(next['2026-08-17'].find((e) => e.title === 'Coffee').price, 6);
    assert.equal(next['2026-08-24'].find((e) => e.title === 'Coffee').price, 6);
    assert.equal(next['2026-08-17'].find((e) => e.title === 'Paycheck').price, 800);
    assert.equal(next['2026-08-17'].find((e) => e.title === 'Rent').price, 1450);
});

test('shifting one recurring date moves every copy by the same days', () => {
    assert.equal(addDaysToKey('2026-08-17', 1), '2026-08-18');
    assert.equal(daysBetweenKeys('2026-08-17', '2026-08-20'), 3);
    const original = ledger.events['2026-08-17'][0];
    const next = updateSeriesOccurrences(
        ledger.events,
        original,
        '2026-08-17',
        0,
        { ...original, price: 5 },
        '2026-08-18'
    );
    assert.equal(next['2026-08-17']?.some((e) => e.title === 'Coffee'), false);
    assert.equal(next['2026-08-18'].some((e) => e.title === 'Coffee' && e.price === 5), true);
    assert.equal(next['2026-08-25'].some((e) => e.title === 'Coffee'), true);
    assert.equal(next['2026-08-24']?.some((e) => e.title === 'Coffee'), false);
    assert.equal(next['2026-08-17'].some((e) => e.title === 'Paycheck'), true);
});

test('series update keeps paid on each day except the edited copy', () => {
    const events = {
        '2026-08-17': [entry({ title: 'Rent', price: 1450, recurring: true, repeat: 'monthly', paid: true })],
        '2026-09-17': [entry({ title: 'Rent', price: 1450, recurring: true, repeat: 'monthly', paid: false })]
    };
    const original = events['2026-08-17'][0];
    const next = updateSeriesOccurrences(
        events,
        original,
        '2026-08-17',
        0,
        { ...original, price: 1500, paid: true },
        '2026-08-17'
    );
    assert.equal(next['2026-08-17'][0].price, 1500);
    assert.equal(next['2026-08-17'][0].paid, true);
    assert.equal(next['2026-09-17'][0].price, 1500);
    assert.equal(next['2026-09-17'][0].paid, false);
});

test('changing cadence rebuilds the series from the edited day', () => {
    const original = ledger.events['2026-08-17'][2];
    const next = rebuildSeriesFrom(
        ledger.events,
        original,
        '2026-08-17',
        { ...original, repeat: 'weekly', price: 1450 }
    );
    assert.equal(next['2026-08-17'].some((e) => e.title === 'Rent' && e.repeat === 'weekly'), true);
    assert.equal(next['2026-08-24'].some((e) => e.title === 'Rent' && e.repeat === 'weekly'), true);
    assert.equal(countSeriesOccurrences(next, { title: 'Rent', recurring: true, repeat: 'weekly' }) > 2, true);
    assert.equal(next['2026-08-17'].some((e) => e.title === 'Coffee'), true);
});

function cents(value) {
    return Utils.toCents(value);
}

test('month tables keep paid, pending, and net identities', () => {
    const date = new Date(2026, 7, 17);
    const spend = computeMonthlySummary(ledger.events, date, 'expense', date);
    const income = computeMonthlySummary(ledger.events, date, 'income', date);
    const snap = computeNetSnapshot(ledger.events, date, date);

    assert.equal(cents(spend.paid) + cents(spend.pending), cents(spend.total));
    assert.equal(cents(spend.recurring) + cents(spend.oneTime), cents(spend.total));
    assert.equal(cents(income.paid) + cents(income.pending), cents(income.total));
    assert.equal(cents(snap.spendPaid) + cents(snap.leftToPay), cents(snap.monthOut));
    assert.equal(cents(snap.deposited) + cents(snap.incomeDue), cents(snap.monthIn));
    assert.equal(cents(snap.monthIn) - cents(snap.monthOut), cents(snap.monthNet));
    assert.equal(cents(snap.ytdIn) - cents(snap.ytdOut), cents(snap.yearNet));
    assert.equal(snap.monthOut, spend.total);
    assert.equal(snap.monthIn, income.total);
});

test('year to date ignores later recurring copies', () => {
    const events = {
        '2026-08-01': [entry({ title: 'Rent', price: 1400, recurring: true, repeat: 'monthly', paid: true })],
        '2026-09-01': [entry({ title: 'Rent', price: 1400, recurring: true, repeat: 'monthly', paid: false })],
        '2026-10-01': [entry({ title: 'Rent', price: 1400, recurring: true, repeat: 'monthly', paid: false })],
        '2026-11-01': [entry({ title: 'Rent', price: 1400, recurring: true, repeat: 'monthly', paid: false })],
        '2026-12-01': [entry({ title: 'Rent', price: 1400, recurring: true, repeat: 'monthly', paid: false })]
    };
    const date = new Date(2026, 7, 17);
    const spend = computeMonthlySummary(events, date, 'expense', date);
    assert.equal(spend.total, 1400);
    assert.equal(spend.yearTotal, 1400);
    assert.equal(spend.yearAvg, 1400);
    assert.equal(spend.yearScheduled, 7000);
    assert.equal(spend.ytdActiveMonths, 1);
    assert.deepEqual(spend.monthTotals.slice(7), [1400, 1400, 1400, 1400, 1400]);
});

test('estimated month total does not replay early bills across the rest of the month', () => {
    const events = {
        '2026-08-01': [entry({ title: 'Rent', price: 1800, recurring: true, repeat: 'monthly', paid: true })],
        '2026-08-02': [entry({ title: 'Car', price: 450, recurring: true, repeat: 'monthly', paid: true })],
        '2026-08-03': [entry({ title: 'Insurance', price: 200, recurring: true, repeat: 'monthly', paid: true })],
        '2026-08-05': [entry({ title: 'Utilities', price: 250, recurring: true, repeat: 'monthly', paid: true })],
        '2026-08-07': [entry({ title: 'Groceries', price: 200, recurring: true, repeat: 'weekly', paid: true })],
        '2026-08-10': [entry({ title: 'Phone', price: 80, recurring: true, repeat: 'monthly', paid: true })],
        '2026-08-14': [entry({ title: 'Groceries', price: 200, recurring: true, repeat: 'weekly', paid: true })],
        '2026-08-16': [entry({ title: 'Coffee', price: 50, paid: true })],
        '2026-08-21': [entry({ title: 'Groceries', price: 200, recurring: true, repeat: 'weekly', paid: false })],
        '2026-08-28': [entry({ title: 'Groceries', price: 200, recurring: true, repeat: 'weekly', paid: false })]
    };
    const date = new Date(2026, 7, 17);
    const spend = computeMonthlySummary(events, date, 'expense', date);
    assert.equal(spend.total, 3630);
    assert.equal(spend.projectedTotal, 3630);
    assert.ok(spend.avgPerDay < 250, `daily average ${spend.avgPerDay} used active days instead of calendar days`);
});

test('same-title expense and income stay separate groups', () => {
    const groups = groupExpenses([
        entry({ title: 'Transfer', price: 20 }),
        entry({ title: 'Transfer', price: 20, kind: 'income' })
    ]);
    assert.equal(groups.length, 2);
    assert.deepEqual(groups.map((g) => g.kind).sort(), ['expense', 'income']);
});
