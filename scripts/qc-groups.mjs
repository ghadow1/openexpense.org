/**
 * Groups are typed, not picked from a list, so the thing worth testing is that
 * a typed vocabulary does not fragment: "bella", "Bella " and "Bella" have to
 * end up as one group, and the ledger's own spelling has to win.
 */
import test from 'node:test';
import assert from 'node:assert/strict';
import {
    cachedGroupHistory,
    canonicalGroup,
    collectGroups,
    groupHistory,
    groupKey,
    normalizeGroup,
    rollUpGroups,
    suggestGroupFor,
    suggestGroups
} from '../src/core/groups.js';
import { sanitizeEntry, FILE_LIMITS } from '../src/core/ledger-file.js';

const ledger = {
    '2026-08-01': [
        { title: 'Dog food', price: 42, group: 'Bella' },
        { title: 'Coffee', price: 5 }
    ],
    '2026-08-04': [
        { title: 'Vet', price: 180, group: 'Bella' },
        { title: 'Hotel', price: 300, group: 'Rome trip' }
    ],
    '2026-08-09': [
        { title: 'Flights', price: 600, group: 'Rome trip' },
        { title: 'Paint', price: 60, group: 'Rental' }
    ]
};

test('normalizing folds whitespace and caps length', () => {
    assert.equal(normalizeGroup('  Rome   trip  '), 'Rome trip');
    assert.equal(normalizeGroup('\tBella\n'), 'Bella');
    assert.equal(normalizeGroup(null), '');
    assert.equal(normalizeGroup('x'.repeat(200)).length, FILE_LIMITS.maxGroup);
});

test('two spellings of one group share a key', () => {
    assert.equal(groupKey('Bella'), groupKey(' bella '));
    assert.notEqual(groupKey('Bella'), groupKey('Bello'));
});

test('collecting returns each group once, most recent first', () => {
    const rows = collectGroups(ledger);
    assert.deepEqual(rows.map((row) => row.label), ['Rome trip', 'Rental', 'Bella']);

    const bella = rows.find((row) => row.key === 'bella');
    assert.equal(bella.count, 2);
    assert.equal(bella.total, 222);
});

test('collecting survives a malformed ledger', () => {
    assert.deepEqual(collectGroups(null), []);
    assert.deepEqual(collectGroups({ '2026-08-01': null }), []);
    assert.deepEqual(collectGroups({ '2026-08-01': [null, 7, {}] }), []);
});

test('the last spelling used is the one offered', () => {
    const rows = collectGroups({
        '2026-08-01': [{ title: 'a', group: 'bella' }],
        '2026-08-05': [{ title: 'b', group: 'Bella' }]
    });
    assert.equal(rows.length, 1, 'casing should not fork a group');
    assert.equal(rows[0].label, 'Bella');
    assert.equal(rows[0].count, 2);
});

test('typing filters the suggestions, and a prefix match outranks recency', () => {
    const events = {
        '2026-08-01': [{ title: 'a', group: 'Rental' }],
        // More recent, so recency alone would put it first.
        '2026-08-20': [{ title: 'b', group: 'Home rental' }]
    };
    const hits = suggestGroups(events, { query: 'rent' });
    assert.deepEqual(hits.map((row) => row.label), ['Rental', 'Home rental']);

    // A match anywhere still counts; it just sorts behind the prefix matches.
    assert.deepEqual(suggestGroups(events, { query: 'home' }).map((r) => r.label), ['Home rental']);
});

test('an empty query offers the recent groups', () => {
    const hits = suggestGroups(ledger, { query: '  ' });
    assert.deepEqual(hits.map((row) => row.label), ['Rome trip', 'Rental', 'Bella']);
    assert.equal(suggestGroups(ledger, { query: '', limit: 2 }).length, 2);
});

test('a query matching nothing suggests nothing, which is how a group is created', () => {
    assert.deepEqual(suggestGroups(ledger, { query: 'Sailing' }), []);
});

test('typed casing snaps to the spelling already in the ledger', () => {
    assert.equal(canonicalGroup(ledger, 'bella'), 'Bella');
    assert.equal(canonicalGroup(ledger, '  ROME TRIP '), 'Rome trip');
    // An unknown group is kept as typed: that is the create half of the field.
    assert.equal(canonicalGroup(ledger, 'Sailing'), 'Sailing');
    assert.equal(canonicalGroup(ledger, '   '), '');
});

test('a title remembers the group it was filed under', () => {
    const history = groupHistory(ledger);
    assert.equal(suggestGroupFor('Dog food', history), 'Bella');
    assert.equal(suggestGroupFor('dog food', history), 'Bella');
    assert.equal(suggestGroupFor('Coffee', history), '', 'ungrouped titles suggest nothing');
    assert.equal(suggestGroupFor('', history), '');
    assert.equal(suggestGroupFor('Dog food', null), '');
});

test('the most recent filing of a title wins', () => {
    const history = groupHistory({
        '2026-08-01': [{ title: 'Fuel', group: 'Rental' }],
        '2026-08-08': [{ title: 'Fuel', group: 'Rome trip' }]
    });
    assert.equal(suggestGroupFor('Fuel', history), 'Rome trip');
});

test('history is rebuilt only when the ledger object changes', () => {
    const first = cachedGroupHistory(ledger);
    assert.equal(cachedGroupHistory(ledger), first, 'same ledger should reuse the map');
    assert.notEqual(cachedGroupHistory({ ...ledger }), first);
});

test('the rollup totals each group and shares out the grouped spend', () => {
    const { rows, total, ungrouped } = rollUpGroups([
        { amount: 100, group: 'Bella', date: '2026-08-09' },
        { amount: 50, group: 'bella', date: '2026-08-01' },
        { amount: 50, group: 'Rome trip', date: '2026-08-04' },
        { amount: 25, group: '', date: '2026-08-05' }
    ]);

    assert.equal(total, 200);
    assert.equal(ungrouped, 1, 'entries with no group are counted, not filed');
    assert.deepEqual(rows.map((row) => row.label), ['Bella', 'Rome trip']);
    assert.equal(rows[0].amount, 150);
    assert.equal(rows[0].count, 2);
    assert.equal(Math.round(rows[0].share), 75);
    assert.equal(Math.round(rows[1].share), 25);
});

test('the breakdown shows the same spelling as the rest of the app', () => {
    // The regression: whichever item happened to be last decided the label, so
    // the sidebar could say "bella" while the entry rows said "Bella".
    const { rows } = rollUpGroups([
        { amount: 10, group: 'bella', date: '2026-08-01' },
        { amount: 10, group: 'Bella', date: '2026-08-20' }
    ]);
    assert.equal(rows.length, 1);
    assert.equal(rows[0].label, 'Bella');
});

test('the rollup keeps cents exact', () => {
    const { rows, total } = rollUpGroups([
        { amount: 0.1, group: 'A' },
        { amount: 0.2, group: 'A' }
    ]);
    assert.equal(rows[0].amount, 0.3);
    assert.equal(total, 0.3);
});

test('the rollup survives junk and an all-ungrouped month', () => {
    assert.deepEqual(rollUpGroups(null).rows, []);
    const bare = rollUpGroups([{ amount: 10 }, { amount: 5, group: '  ' }]);
    assert.deepEqual(bare.rows, []);
    assert.equal(bare.ungrouped, 2);
    assert.equal(bare.total, 0);
});

test('a group survives the sanitizer that entries are saved through', () => {
    const kept = sanitizeEntry({ title: 'Vet', price: 90, group: '  Bella  ' });
    assert.equal(kept.group, 'Bella');

    // Same collapsing as the field, so an imported group lands on the same key.
    assert.equal(sanitizeEntry({ title: 'x', group: 'Rome   trip' }).group, 'Rome trip');
    assert.equal(sanitizeEntry({ title: 'x', group: '   ' }).group, undefined);
    assert.equal(sanitizeEntry({ title: 'x' }).group, undefined);
    assert.equal(sanitizeEntry({ title: 'x', group: 'g'.repeat(90) }).group.length, FILE_LIMITS.maxGroup);
});
