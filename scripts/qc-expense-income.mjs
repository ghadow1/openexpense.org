/**
 * Quality check: expense vs income paths (kind, summary, weekly series).
 * Run: npm test
 */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { Utils } from '../src/core/utils.js';
import { sanitizeLedger, sanitizeEntry } from '../src/core/ledger-file.js';
import { computeMonthlySummary, sumDay } from '../src/core/summary.js';
import {
    normalizeRepeat, nextOccurrenceKey, seriesCopyCount,
    removeSeriesOccurrences, groupExpenses
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

test('same-title expense and income stay separate groups', () => {
    const groups = groupExpenses([
        entry({ title: 'Transfer', price: 20 }),
        entry({ title: 'Transfer', price: 20, kind: 'income' })
    ]);
    assert.equal(groups.length, 2);
    assert.deepEqual(groups.map((g) => g.kind).sort(), ['expense', 'income']);
});
