import test from 'node:test';
import assert from 'node:assert/strict';
import {
    CATEGORIES, QUICK_PICKS, UNCATEGORIZED,
    categoryInfo, categoriesFor, suggestCategory, resolveCategory,
    categoryHistory, rollUpCategories, budgetProgress
} from '../src/core/categories.js';
import { sanitizeBudgets, FILE_LIMITS } from '../src/core/ledger-file.js';

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

const MONTH = { daysElapsed: 15, daysInMonth: 30 };

test('a budget reports what is spent, left, and how far through the cap', () => {
    const rows = rollUpCategories([{ amount: 120, category: 'Groceries' }]);
    const [row] = budgetProgress(rows, { Groceries: 400 }, MONTH);

    assert.equal(row.label, 'Groceries');
    assert.equal(row.spent, 120);
    assert.equal(row.limit, 400);
    assert.equal(row.remaining, 280);
    assert.equal(row.used, 30);
    assert.equal(row.overBy, 0);
});

test('a budget with no spending yet is still reported', () => {
    // Otherwise a category you set a limit on and then ignored would vanish.
    const [row] = budgetProgress([], { Groceries: 400 }, MONTH);
    assert.equal(row.spent, 0);
    assert.equal(row.remaining, 400);
    assert.equal(row.state, 'on-track');
});

test('going over a cap reports the overage, not a clamped bar', () => {
    const rows = rollUpCategories([{ amount: 450, category: 'Groceries' }]);
    const [row] = budgetProgress(rows, { Groceries: 400 }, MONTH);
    assert.equal(row.state, 'over');
    assert.equal(row.overBy, 50);
    assert.equal(row.remaining, -50);
    assert.ok(row.used > 100);
});

test('a cap nearly used up reads as close', () => {
    const rows = rollUpCategories([{ amount: 330, category: 'Groceries' }]);
    const [row] = budgetProgress(rows, { Groceries: 400 }, MONTH);
    assert.equal(row.state, 'close');
});

test('pace separates halfway-through-the-month from spending too fast', () => {
    // Same 60% of the cap, read differently depending on the day of the month.
    const rows = rollUpCategories([{ amount: 240, category: 'Groceries' }]);

    const early = budgetProgress(rows, { Groceries: 400 }, { daysElapsed: 5, daysInMonth: 30 })[0];
    assert.equal(early.state, 'ahead', '60% of a cap on day 5 is running hot');

    const late = budgetProgress(rows, { Groceries: 400 }, { daysElapsed: 25, daysInMonth: 30 })[0];
    assert.equal(late.state, 'on-track', '60% of a cap on day 25 is fine');
});

test('pace does not cry wolf in the first days of a month', () => {
    // On day 1 almost any spending outruns the month; that is not a signal.
    const rows = rollUpCategories([{ amount: 40, category: 'Groceries' }]);
    const row = budgetProgress(rows, { Groceries: 400 }, { daysElapsed: 1, daysInMonth: 30 })[0];
    assert.equal(row.state, 'on-track');
});

test('budgets sort trouble to the top', () => {
    const rows = rollUpCategories([
        { amount: 450, category: 'Groceries' },
        { amount: 10, category: 'Coffee' },
        { amount: 170, category: 'Transit' }
    ]);
    const states = budgetProgress(
        rows,
        { Groceries: 400, Coffee: 100, Transit: 200 },
        MONTH
    ).map((row) => row.state);

    assert.equal(states[0], 'over');
    assert.equal(states[1], 'close');
});

test('budget matching ignores casing', () => {
    const rows = rollUpCategories([{ amount: 50, category: 'groceries' }]);
    const [row] = budgetProgress(rows, { Groceries: 400 }, MONTH);
    assert.equal(row.spent, 50, 'a differently-cased category should still count');
});

test('a budget with no period still reports usage', () => {
    const rows = rollUpCategories([{ amount: 200, category: 'Groceries' }]);
    const [row] = budgetProgress(rows, { Groceries: 400 });
    assert.equal(row.used, 50);
    assert.equal(row.state, 'on-track');
});

test('nonsense budgets are dropped rather than rendered', () => {
    const rows = budgetProgress([], { Groceries: 0, Coffee: -5, Transit: 'abc', Travel: 100 });
    assert.deepEqual(rows.map((row) => row.label), ['Travel']);
});

test('sanitizeBudgets keeps only positive numbers under a real label', () => {
    const clean = sanitizeBudgets({
        Groceries: 400,
        Coffee: '75.5',
        Bad: -1,
        Zero: 0,
        Wordy: 'abc',
        '   ': 50
    });
    assert.deepEqual(clean, { Groceries: 400, Coffee: 75.5 });
});

test('sanitizeBudgets refuses prototype-polluting keys', () => {
    const clean = sanitizeBudgets({ __proto__: 5, constructor: 5, prototype: 5, Groceries: 400 });
    assert.deepEqual(Object.keys(clean), ['Groceries']);
    assert.equal({}.polluted, undefined);
});

test('sanitizeBudgets survives junk input', () => {
    for (const junk of [null, undefined, 'text', 42, [1, 2]]) {
        assert.deepEqual(sanitizeBudgets(junk), {});
    }
});

test('sanitizeBudgets caps how many budgets a file can carry', () => {
    const many = {};
    for (let i = 0; i < FILE_LIMITS.maxBudgets + 25; i++) many[`Cat ${i}`] = 10;
    assert.equal(Object.keys(sanitizeBudgets(many)).length, FILE_LIMITS.maxBudgets);
});

test('budgets survive the export and import round trip', async () => {
    const { encryptBundle, decryptBundle } = await import('../src/core/bundle.js');
    const { sanitizeLedger } = await import('../src/core/ledger-file.js');

    const ledger = {
        name: 'Home',
        events: { '2026-08-05': [{ title: 'Groceries', price: 40, category: 'Groceries' }] },
        budgets: { Groceries: 400, Transit: 120 },
        savedAt: 1780000000000
    };

    const { enc, keyFile } = await encryptBundle(ledger);
    const back = sanitizeLedger(await decryptBundle(enc, keyFile));
    assert.deepEqual(back.budgets, { Groceries: 400, Transit: 120 });
    assert.equal(back.events['2026-08-05'][0].category, 'Groceries');
});

test('a ledger with no budgets does not grow an empty budgets key', async () => {
    const { sanitizeLedger } = await import('../src/core/ledger-file.js');
    const clean = sanitizeLedger({ name: 'Home', events: {}, savedAt: 1 });
    assert.equal('budgets' in clean, false, 'an empty map should stay absent from the file');
});

test('a budget-only change still counts as a change worth saving', async () => {
    // The autosave signature used to cover name and events only, so editing a
    // budget and nothing else would have been deduped away and never written.
    const { sanitizeLedger } = await import('../src/core/ledger-file.js');
    const base = { name: 'Home', events: {}, savedAt: 1 };
    const before = sanitizeLedger({ ...base });
    const after = sanitizeLedger({ ...base, budgets: { Groceries: 400 } });
    assert.notDeepEqual(before, after);
});

test('backfill files uncategorized entries from their titles', async () => {
    const { backfillCategories } = await import('../src/core/categories.js');
    const { events, filled } = backfillCategories({
        '2026-08-01': [{ title: 'Starbucks', price: 5 }, { title: 'Rent', price: 1800 }],
        '2026-08-02': [{ title: 'Netflix', price: 15 }]
    });
    assert.equal(filled, 3);
    assert.equal(events['2026-08-01'][0].category, 'Coffee');
    assert.equal(events['2026-08-01'][1].category, 'Housing');
    assert.equal(events['2026-08-02'][0].category, 'Subscriptions');
});

test('backfill never overwrites a category the user already set', async () => {
    const { backfillCategories } = await import('../src/core/categories.js');
    const { events, filled } = backfillCategories({
        '2026-08-01': [{ title: 'Starbucks', price: 5, category: 'Dining' }]
    });
    assert.equal(filled, 0);
    assert.equal(events['2026-08-01'][0].category, 'Dining');
});

test('backfill leaves an unrecognised entry alone rather than filing it as Other', async () => {
    const { backfillCategories } = await import('../src/core/categories.js');
    const { events, filled } = backfillCategories({
        '2026-08-01': [{ title: 'Zzyzx', price: 5 }]
    });
    assert.equal(filled, 0);
    assert.equal('category' in events['2026-08-01'][0], false);
});

test('backfill follows the user past choices before the keyword rules', async () => {
    const { backfillCategories } = await import('../src/core/categories.js');
    const { events } = backfillCategories({
        '2026-07-01': [{ title: 'Starbucks', price: 5, category: 'Dining' }],
        '2026-08-01': [{ title: 'Starbucks', price: 5 }]
    });
    assert.equal(events['2026-08-01'][0].category, 'Dining', 'a past correction should win');
});

test('backfill does not mutate the ledger it was given', async () => {
    const { backfillCategories } = await import('../src/core/categories.js');
    const original = { '2026-08-01': [{ title: 'Starbucks', price: 5 }] };
    const snapshot = JSON.parse(JSON.stringify(original));
    backfillCategories(original);
    assert.deepEqual(original, snapshot);
});

test('backfill returns the original ledger when there is nothing to do', async () => {
    const { backfillCategories } = await import('../src/core/categories.js');
    const original = { '2026-08-01': [{ title: 'Zzyzx', price: 5 }] };
    const result = backfillCategories(original);
    assert.equal(result.events, original, 'an unchanged ledger should skip a pointless save');
});

test('backfill respects income and expense separately', async () => {
    const { backfillCategories } = await import('../src/core/categories.js');
    const { events } = backfillCategories({
        '2026-08-01': [{ title: 'Paycheck', price: 3000, kind: 'income' }]
    });
    assert.equal(events['2026-08-01'][0].category, 'Paycheck');
});

test('backfill survives a malformed ledger', async () => {
    const { backfillCategories } = await import('../src/core/categories.js');
    assert.doesNotThrow(() => backfillCategories(null));
    assert.doesNotThrow(() => backfillCategories({ '2026-08-01': null }));
    assert.doesNotThrow(() => backfillCategories({ '2026-08-01': [null, 5, 'x'] }));
});

test('the suggestion shown on the form respects a past correction', async () => {
    // The picker used to suggest from the keyword rules alone and then hand
    // that down as an explicit choice, so resolveCategory short-circuited and
    // the user's own past filing was never applied.
    const { cachedCategoryHistory } = await import('../src/core/categories.js');
    const events = { '2026-07-01': [{ title: 'Starbucks', price: 5, category: 'Dining' }] };

    const shown = resolveCategory({
        title: 'Starbucks',
        kind: 'expense',
        history: cachedCategoryHistory(events)
    });
    assert.equal(shown, 'Dining', 'the form should offer what this user actually does');
});

test('cached history refreshes when the ledger changes', async () => {
    const { cachedCategoryHistory } = await import('../src/core/categories.js');
    const first = { '2026-07-01': [{ title: 'Starbucks', category: 'Dining' }] };
    assert.equal(cachedCategoryHistory(first).get('starbucks'), 'Dining');

    // A patch always replaces the events object, which is what invalidates it.
    const second = { '2026-07-01': [{ title: 'Starbucks', category: 'Travel' }] };
    assert.equal(cachedCategoryHistory(second).get('starbucks'), 'Travel');

    // The same object twice must not be rescanned into a different answer.
    assert.equal(cachedCategoryHistory(second), cachedCategoryHistory(second));
});
