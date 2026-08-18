import test from 'node:test';
import assert from 'node:assert/strict';
import {
    CATEGORIES, QUICK_PICKS, UNCATEGORIZED,
    categoryInfo, categoriesFor, suggestCategory, resolveCategory,
    categoryHistory, rollUpCategories
} from '../src/core/categories.js';

test('every quick pick is a real category of its kind', () => {
    for (const [kind, labels] of Object.entries(QUICK_PICKS)) {
        for (const label of labels) {
            const found = CATEGORIES.find((cat) => cat.label === label);
            assert.ok(found, `${label} is offered but not defined`);
            assert.equal(found.kind, kind, `${label} is offered under the wrong kind`);
        }
    }
});

test('an empty category reads as uncategorized rather than guessing', () => {
    for (const blank of [undefined, null, '', '   ']) {
        const info = categoryInfo(blank);
        assert.equal(info.uncategorized, true);
        assert.equal(info.label, UNCATEGORIZED);
    }
});

test('a known label resolves regardless of casing', () => {
    for (const label of ['Groceries', 'groceries', 'GROCERIES', '  Groceries  ']) {
        const info = categoryInfo(label);
        assert.equal(info.label, 'Groceries', `${label} should resolve`);
        assert.equal(info.known, true);
    }
});

test('a category from another tool keeps its label and a stable colour', () => {
    const first = categoryInfo('Boat maintenance');
    assert.equal(first.label, 'Boat maintenance', 'a custom label must not be rewritten');
    assert.equal(first.known, false);
    assert.equal(first.uncategorized, false);

    // Stable across calls, or the list would flicker between renders.
    assert.equal(categoryInfo('Boat maintenance').tone, first.tone);
});

test('keyword rules read common merchants', () => {
    const cases = [
        ['Trader Joes', 'Groceries'],
        ['Starbucks', 'Coffee'],
        ['Chipotle', 'Dining'],
        ['Shell gas', 'Transit'],
        ['Netflix', 'Subscriptions'],
        ['Rent', 'Housing'],
        ['CVS Pharmacy', 'Health'],
        ['Amazon order', 'Shopping']
    ];
    for (const [title, expected] of cases) {
        assert.equal(suggestCategory({ title }), expected, `${title} should read as ${expected}`);
    }
});

test('the more specific rule wins over the general one', () => {
    // Both rules match the text; Dining is listed first for exactly this case.
    assert.equal(suggestCategory({ title: 'Uber Eats' }), 'Dining');
    assert.equal(suggestCategory({ title: 'Uber ride home' }), 'Transit');
});

test('an unrecognised title gets no guess at all', () => {
    // Returning null rather than Other keeps "unsure" distinct from "misc", so
    // the form can stay empty instead of filing everything under one bucket.
    assert.equal(suggestCategory({ title: 'Zzyzx' }), null);
    assert.equal(suggestCategory({ title: '' }), null);
});

test('income and expense rules do not cross over', () => {
    assert.equal(suggestCategory({ title: 'Paycheck', kind: 'income' }), 'Paycheck');
    assert.equal(suggestCategory({ title: 'Paycheck', kind: 'expense' }), null);
    assert.equal(suggestCategory({ title: 'Groceries', kind: 'income' }), null);
});

test('an explicit choice beats both history and keywords', () => {
    const history = new Map([['starbucks', 'Dining']]);
    assert.equal(
        resolveCategory({ category: 'Travel', title: 'Starbucks', history }),
        'Travel'
    );
});

test('a past correction beats the keyword rule', () => {
    // The user filed Starbucks under Dining before, so stop saying Coffee.
    const history = new Map([['starbucks', 'Dining']]);
    assert.equal(resolveCategory({ title: 'Starbucks', history }), 'Dining');
    assert.equal(resolveCategory({ title: 'Starbucks' }), 'Coffee');
});

test('category history reads the last choice per title', () => {
    const history = categoryHistory({
        '2026-01-05': [{ title: 'Starbucks', category: 'Coffee' }],
        '2026-02-05': [{ title: 'starbucks', category: 'Dining' }],
        '2026-03-05': [{ title: 'Rent' }]
    });
    assert.equal(history.get('starbucks'), 'Dining', 'the newer choice should win');
    assert.equal(history.has('rent'), false, 'an entry with no category teaches nothing');
});

test('category history survives a malformed ledger', () => {
    assert.equal(categoryHistory(null).size, 0);
    assert.equal(categoryHistory({ '2026-01-01': null }).size, 0);
    assert.equal(categoryHistory({ '2026-01-01': [null, 42, 'x'] }).size, 0);
});

test('a resolved category is capped to the stored field width', () => {
    const long = 'x'.repeat(120);
    assert.equal(resolveCategory({ category: long }).length, 40);
});

test('the roll-up totals each category and its share', () => {
    const rows = rollUpCategories([
        { amount: 60, category: 'Groceries', kind: 'expense' },
        { amount: 30, category: 'Groceries', kind: 'expense' },
        { amount: 10, category: 'Coffee', kind: 'expense' }
    ]);
    assert.equal(rows.length, 2);
    assert.deepEqual(
        rows.map((r) => [r.label, r.amount, r.count, Math.round(r.share)]),
        [['Groceries', 90, 2, 90], ['Coffee', 10, 1, 10]]
    );
});

test('the roll-up gathers uncategorized spend into one visible row', () => {
    const rows = rollUpCategories([
        { amount: 25, category: '', kind: 'expense' },
        { amount: 15, kind: 'expense' },
        { amount: 60, category: 'Rent money', kind: 'expense' }
    ]);
    const unknown = rows.find((row) => row.uncategorized);
    assert.ok(unknown, 'uncategorized spend should be reported, not dropped');
    assert.equal(unknown.amount, 40);
    assert.equal(unknown.count, 2);
});

test('the roll-up stays exact on repeating cents', () => {
    // Float addition would drift here; the roll-up works in cents.
    const rows = rollUpCategories(
        Array.from({ length: 3 }, () => ({ amount: 0.1, category: 'Coffee' }))
    );
    assert.equal(rows[0].amount, 0.3);
});

test('shares add up to 100 percent', () => {
    const rows = rollUpCategories([
        { amount: 33.33, category: 'A' },
        { amount: 33.33, category: 'B' },
        { amount: 33.34, category: 'C' }
    ]);
    const sum = rows.reduce((acc, row) => acc + row.share, 0);
    assert.ok(Math.abs(sum - 100) < 0.001, `shares summed to ${sum}`);
});

test('the roll-up ignores zero and negative amounts', () => {
    const rows = rollUpCategories([
        { amount: 0, category: 'Coffee' },
        { amount: -5, category: 'Coffee' },
        { amount: 5, category: 'Coffee' }
    ]);
    assert.equal(rows.length, 1);
    assert.equal(rows[0].amount, 5);
    assert.equal(rows[0].count, 1);
});

test('an empty roll-up does not divide by zero', () => {
    assert.deepEqual(rollUpCategories([]), []);
    assert.deepEqual(rollUpCategories(), []);
});

test('categoriesFor offers quick picks first and never repeats one', () => {
    for (const kind of ['expense', 'income']) {
        const { quick, rest } = categoriesFor(kind);
        assert.ok(quick.length, `${kind} should have quick picks`);
        for (const label of quick) {
            assert.equal(rest.includes(label), false, `${label} appears twice`);
        }
        const all = [...quick, ...rest];
        assert.equal(new Set(all).size, all.length, 'duplicate categories offered');
    }
});
