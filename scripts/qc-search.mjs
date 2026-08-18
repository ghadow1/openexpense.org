import test from 'node:test';
import assert from 'node:assert/strict';
import { parseQuery, isEmptyQuery, searchEntries } from '../src/core/search.js';

const events = {
    '2026-08-03': [
        { title: 'Starbucks', price: 6.5, category: 'Coffee', paid: true },
        { title: 'Rent', price: 1800, category: 'Housing', recurring: true, repeat: 'monthly' }
    ],
    '2026-08-14': [
        { title: 'Trader Joes', price: 82.4, category: 'Groceries', paid: true },
        { title: 'Electric bill', price: 95, category: 'Utilities' }
    ],
    '2026-09-02': [
        { title: 'Paycheck', price: 3200, category: 'Paycheck', kind: 'income', paid: true },
        { title: 'Coffee beans', price: 18, category: 'Groceries', note: 'for the office' }
    ],
    '2025-12-25': [
        { title: 'Gift', price: 40, category: 'Shopping', paid: true }
    ]
};

const titles = (result) => result.rows.map((row) => row.title).sort();

test('free text searches titles and notes', () => {
    assert.deepEqual(titles(searchEntries(events, 'coffee')), ['Coffee beans', 'Starbucks']);
    assert.deepEqual(titles(searchEntries(events, 'office')), ['Coffee beans']);
});

test('free text is case insensitive', () => {
    assert.equal(searchEntries(events, 'STARBUCKS').total, 1);
    assert.equal(searchEntries(events, 'sTaRbUcKs').total, 1);
});

test('extra words narrow the search rather than widening it', () => {
    assert.equal(searchEntries(events, 'coffee').total, 2);
    assert.equal(searchEntries(events, 'coffee beans').total, 1);
    assert.equal(searchEntries(events, 'coffee nonsense').total, 0);
});

test('a quoted phrase is kept together', () => {
    const parsed = parseQuery('"coffee beans" rent');
    assert.deepEqual(parsed.text, ['coffee beans', 'rent']);
});

test('cat: filters by category', () => {
    assert.deepEqual(titles(searchEntries(events, 'cat:groceries')), ['Coffee beans', 'Trader Joes']);
    assert.equal(searchEntries(events, 'cat:housing').total, 1);
});

test('a category with a space can be quoted', () => {
    const parsed = parseQuery('cat:"eating out"');
    assert.deepEqual(parsed.categories, ['eating out']);
});

test('amount bounds filter by price', () => {
    assert.deepEqual(titles(searchEntries(events, '>1000')), ['Paycheck', 'Rent']);
    assert.deepEqual(titles(searchEntries(events, '<20')), ['Coffee beans', 'Starbucks']);
    assert.deepEqual(titles(searchEntries(events, '>50 <100')), ['Electric bill', 'Trader Joes']);
});

test('is: flags filter state and kind', () => {
    assert.deepEqual(titles(searchEntries(events, 'is:unpaid')), ['Coffee beans', 'Electric bill', 'Rent']);
    assert.deepEqual(titles(searchEntries(events, 'is:income')), ['Paycheck']);
    assert.deepEqual(titles(searchEntries(events, 'is:recurring')), ['Rent']);
    assert.equal(searchEntries(events, 'is:expense').total, 6);
});

test('a date token scopes to a year, a month, or a day', () => {
    assert.equal(searchEntries(events, '2026').total, 6);
    assert.equal(searchEntries(events, '2026-08').total, 4);
    assert.equal(searchEntries(events, '2026-08-03').total, 2);
    assert.equal(searchEntries(events, '2025').total, 1);
});

test('filters combine', () => {
    assert.deepEqual(titles(searchEntries(events, 'cat:groceries 2026-08')), ['Trader Joes']);
    assert.deepEqual(titles(searchEntries(events, 'is:unpaid >90')), ['Electric bill', 'Rent']);
});

test('results come back newest first', () => {
    const rows = searchEntries(events, 'is:paid').rows;
    const dates = rows.map((row) => row.date);
    assert.deepEqual(dates, [...dates].sort().reverse());
});

test('an empty query returns nothing rather than the whole ledger', () => {
    // Showing every entry the moment the box is focused would be useless noise.
    for (const blank of ['', '   ', null, undefined]) {
        const result = searchEntries(events, blank);
        assert.equal(result.total, 0);
        assert.equal(result.rows.length, 0);
    }
    assert.equal(isEmptyQuery(parseQuery('')), true);
    assert.equal(isEmptyQuery(parseQuery('coffee')), false);
});

test('totals describe every match, not just the visible page', () => {
    const many = {};
    for (let day = 1; day <= 28; day++) {
        many[`2026-08-${String(day).padStart(2, '0')}`] = [{ title: 'Coffee', price: 5 }];
    }
    const result = searchEntries(many, 'coffee', { limit: 10 });

    assert.equal(result.rows.length, 10, 'only a page is rendered');
    assert.equal(result.total, 28, 'but the count covers every match');
    assert.equal(result.sum, 140, 'and so does the sum');
    assert.equal(result.truncated, true);
});

test('the sum stays exact across many small amounts', () => {
    const pennies = {};
    for (let day = 1; day <= 10; day++) {
        pennies[`2026-08-${String(day).padStart(2, '0')}`] = [{ title: 'Tip', price: 0.1 }];
    }
    assert.equal(searchEntries(pennies, 'tip').sum, 1);
});

test('an unparseable token is treated as text instead of erroring', () => {
    for (const odd of ['cat:', '>', '>>10', 'is:nonsense', '::', '2026-13-99']) {
        assert.doesNotThrow(() => searchEntries(events, odd), `${odd} should not throw`);
    }
    // "is:nonsense" is not a flag, so it should search as plain text.
    assert.equal(searchEntries(events, 'is:nonsense').total, 0);
});

test('search survives a malformed ledger', () => {
    assert.equal(searchEntries(null, 'coffee').total, 0);
    assert.equal(searchEntries({ '2026-08-01': null }, 'coffee').total, 0);
    assert.equal(searchEntries({ '2026-08-01': [null, 7, 'x'] }, 'coffee').total, 0);
});

test('an uncategorized entry is findable as uncategorized', () => {
    const loose = { '2026-08-01': [{ title: 'Mystery', price: 10 }] };
    assert.equal(searchEntries(loose, 'cat:uncategorized').total, 1);
});

test('rows carry enough to open the entry they came from', () => {
    const [row] = searchEntries(events, 'starbucks').rows;
    assert.equal(row.date, '2026-08-03');
    assert.equal(row.index, 0);
    assert.equal(events[row.date][row.index].title, 'Starbucks');
});
