/**
 * Quality check: day-list reorder, move, duplicate, paid, title memory.
 * Run: npm test
 */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import {
    assignGroupToIndexes,
    clearGroupAt,
    clearGroupAtIndexes,
    collectTitleMemory,
    duplicateAt,
    matchRememberedTitle,
    moveIndexes,
    moveOccurrence,
    reorderDay,
    suggestTitles,
    togglePaidAt
} from '../src/core/day-entries.js';

const coffee = { title: 'Coffee', price: 5, paid: true };
const rent = { title: 'Rent', price: 1450, recurring: true, repeat: 'monthly' };
const pay = { title: 'Paycheck', price: 800, kind: 'income' };

function ledger() {
    return {
        '2026-08-17': [{ ...coffee }, { ...rent }],
        '2026-08-18': [{ ...pay }]
    };
}

test('reorderDay swaps two entries and leaves other days alone', () => {
    const next = reorderDay(ledger(), '2026-08-17', 0, 1);
    assert.equal(next['2026-08-17'][0].title, 'Rent');
    assert.equal(next['2026-08-17'][1].title, 'Coffee');
    assert.equal(next['2026-08-18'][0].title, 'Paycheck');
});

test('reorderDay ignores out-of-range indexes', () => {
    const events = ledger();
    assert.equal(reorderDay(events, '2026-08-17', 0, 9), events);
    assert.equal(reorderDay(events, '2026-08-17', 0, 0), events);
});

test('moveOccurrence relocates one copy and keeps array order on the destination', () => {
    const next = moveOccurrence(ledger(), '2026-08-17', 0, '2026-08-18');
    assert.equal(next['2026-08-17'].length, 1);
    assert.equal(next['2026-08-17'][0].title, 'Rent');
    assert.equal(next['2026-08-18'].map((e) => e.title).join(','), 'Paycheck,Coffee');
});

test('moveIndexes can move a same-title group to another day', () => {
    const events = {
        '2026-08-17': [{ ...coffee }, { ...rent }, { ...coffee, price: 6 }],
        '2026-08-19': []
    };
    const next = moveIndexes(events, '2026-08-17', [0, 2], '2026-08-19');
    assert.equal(next['2026-08-17'][0].title, 'Rent');
    assert.equal(next['2026-08-19'].length, 2);
    assert.equal(next['2026-08-19'][0].price, 5);
    assert.equal(next['2026-08-19'][1].price, 6);
});

test('togglePaidAt flips only that row', () => {
    const next = togglePaidAt(ledger(), '2026-08-17', 0);
    assert.equal(next['2026-08-17'][0].paid, undefined);
    assert.equal(next['2026-08-17'][1].recurring, true);
    const back = togglePaidAt(next, '2026-08-17', 0);
    assert.equal(back['2026-08-17'][0].paid, true);
});

test('duplicateAt inserts a one-off clone after the original', () => {
    const next = duplicateAt(ledger(), '2026-08-17', 1);
    assert.equal(next['2026-08-17'].length, 3);
    assert.equal(next['2026-08-17'][2].title, 'Rent');
    assert.equal(next['2026-08-17'][2].recurring, false);
    assert.equal(next['2026-08-17'][2].repeat, undefined);
    assert.equal(next['2026-08-17'][1].recurring, true);
});

test('title memory ranks recent titles and can prefill an amount', () => {
    const events = {
        '2026-08-10': [{ title: 'Coffee', price: 4 }],
        '2026-08-17': [{ title: 'Coffee', price: 5.5 }],
        '2026-08-18': [{ title: 'Paycheck', price: 800, kind: 'income' }]
    };
    const memory = collectTitleMemory(events);
    assert.equal(memory[0].title, 'Paycheck');
    const coffee = matchRememberedTitle(events, 'coffee', 'expense');
    assert.equal(coffee.price, 5.5);
    const chips = suggestTitles(events, { kind: 'expense', limit: 4 });
    assert.equal(chips.some((row) => row.title === 'Coffee'), true);
    assert.equal(chips.some((row) => row.kind === 'income'), false);
});

test('assigning a group writes only the group field', () => {
    const events = {
        '2026-08-17': [
            { title: 'Coffee', price: 5, paid: true, category: 'Dining' },
            { title: 'Rent', price: 1450, recurring: true, repeat: 'monthly' }
        ]
    };
    const next = assignGroupToIndexes(events, '2026-08-17', [0, 1], 'Bella');
    assert.equal(next['2026-08-17'][0].group, 'Bella');
    assert.equal(next['2026-08-17'][1].group, 'Bella');
    assert.equal(next['2026-08-17'][0].price, 5);
    assert.equal(next['2026-08-17'][0].paid, true);
    assert.equal(next['2026-08-17'][0].category, 'Dining');
    assert.equal(next['2026-08-17'][1].recurring, true);
    assert.equal(next['2026-08-17'][1].title, 'Rent');
});

test('ungrouping clears only the group', () => {
    const events = {
        '2026-08-17': [
            { title: 'Coffee', price: 5, group: 'Bella', category: 'Dining', paid: true },
            { title: 'Vet', price: 90, group: 'Bella' }
        ]
    };
    const one = clearGroupAt(events, '2026-08-17', 0);
    assert.equal(one['2026-08-17'][0].group, undefined);
    assert.equal(one['2026-08-17'][0].title, 'Coffee');
    assert.equal(one['2026-08-17'][0].price, 5);
    assert.equal(one['2026-08-17'][0].category, 'Dining');
    assert.equal(one['2026-08-17'][0].paid, true);
    assert.equal(one['2026-08-17'][1].group, 'Bella');

    const both = clearGroupAtIndexes(one, '2026-08-17', [1]);
    assert.equal(both['2026-08-17'][1].group, undefined);
    assert.equal(both['2026-08-17'][1].price, 90);
});

test('day rows keep the amount off the action toolbar', async () => {
    const source = await readFile(
        join(dirname(fileURLToPath(import.meta.url)), '../src/features/modal.js'),
        'utf8'
    );
    assert.match(source, /event-row-body/, 'identity and actions need a stacked body');
    assert.match(source, /event-amount/, 'the dollar amount is its own node');
    assert.match(source, /row-actions/, 'paid / copy / edit / delete stay in a toolbar');
    assert.doesNotMatch(
        source,
        /titleRow\.appendChild\(badge\)/,
        'amount must not sit in the same wrap as the title pills'
    );
});
