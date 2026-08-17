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
    removeSeriesOccurrences, groupExpenses,
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
    assert.equal(formatChipMoney(-3364.42), '-$3364');
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
    assert.equal(snap.incomeReceived, 1600);
    assert.equal(snap.leftToPay, 0);
    assert.equal(snap.dueSoon, 0);
    assert.equal(Math.round(snap.savingsRate), 9);
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

test('same-title expense and income stay separate groups', () => {
    const groups = groupExpenses([
        entry({ title: 'Transfer', price: 20 }),
        entry({ title: 'Transfer', price: 20, kind: 'income' })
    ]);
    assert.equal(groups.length, 2);
    assert.deepEqual(groups.map((g) => g.kind).sort(), ['expense', 'income']);
});
