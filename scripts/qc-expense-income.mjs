/**
 * Quality check: expense vs income paths (kind, summary, weekly series).
 * Run: npm test
 */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { Utils } from '../src/core/utils.js';
import { sanitizeLedger, sanitizeEntry } from '../src/core/ledger-file.js';
import { computeMonthlySummary } from '../src/core/summary.js';
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
