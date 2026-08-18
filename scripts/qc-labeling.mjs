/**
 * Quality check: name+amount twins, placeholder titles, Change All writes.
 * Run: npm test
 */
import test from 'node:test';
import assert from 'node:assert/strict';
import {
    amountCents,
    applyTitlePrice,
    findTwinRefs,
    isPlaceholderTitle,
    labelOrPriceChanged,
    sameLabelAndPrice,
    titleKey
} from '../src/core/labeling.js';

const ledger = {
    '2026-08-17': [
        { title: 'Coffee', price: 5 },
        { title: 'Rent', price: 1450 }
    ],
    '2026-08-24': [
        { title: 'Coffee', price: 5 },
        { title: 'Coffee', price: 6 }
    ],
    '2026-09-01': [
        { title: '', price: 5 },
        { title: 'Untitled', price: 5 },
        { title: 'e.g. Coffee, Zoom, Gas', price: 5 }
    ]
};

test('title keys fold case and space so twins still match', () => {
    assert.equal(titleKey('  Coffee '), titleKey('coffee'));
    assert.notEqual(titleKey('Coffee'), titleKey('Tea'));
});

test('placeholder titles never count as a real label', () => {
    assert.equal(isPlaceholderTitle(''), true);
    assert.equal(isPlaceholderTitle('   '), true);
    assert.equal(isPlaceholderTitle('Untitled'), true);
    assert.equal(isPlaceholderTitle('e.g. Coffee, Zoom, Gas'), true);
    assert.equal(isPlaceholderTitle('e.g. Paycheck, Refund'), true);
    assert.equal(isPlaceholderTitle('Coffee'), false);
});

test('twins require both the same name and the same dollar amount', () => {
    const coffee = ledger['2026-08-17'][0];
    assert.equal(sameLabelAndPrice(coffee, ledger['2026-08-24'][0]), true);
    assert.equal(sameLabelAndPrice(coffee, ledger['2026-08-24'][1]), false, 'same name, different price');
    assert.equal(sameLabelAndPrice(coffee, ledger['2026-08-17'][1]), false, 'different name');
    assert.equal(sameLabelAndPrice(coffee, { title: '', price: 5 }), false);
    assert.equal(amountCents({ price: 5.5 }), 550);
});

test('findTwinRefs skips the edited row and every placeholder', () => {
    const twins = findTwinRefs(ledger, { title: 'Coffee', price: 5 }, {
        skip: { date: '2026-08-17', index: 0 }
    });
    assert.equal(twins.length, 1);
    assert.equal(twins[0].date, '2026-08-24');
    assert.equal(twins[0].index, 0);

    assert.deepEqual(findTwinRefs(ledger, { title: '', price: 5 }), []);
    assert.deepEqual(findTwinRefs(ledger, { title: 'Untitled', price: 5 }), []);
});

test('Change All rewrites only title and price on the matches', () => {
    const refs = findTwinRefs(ledger, { title: 'Coffee', price: 5 });
    const next = applyTitlePrice(ledger, refs, { title: 'Latte', price: 6.5 });
    assert.equal(next['2026-08-17'][0].title, 'Latte');
    assert.equal(next['2026-08-17'][0].price, 6.5);
    assert.equal(next['2026-08-24'][0].title, 'Latte');
    assert.equal(next['2026-08-24'][0].price, 6.5);
    assert.equal(next['2026-08-24'][1].title, 'Coffee');
    assert.equal(next['2026-08-24'][1].price, 6);
    assert.equal(next['2026-08-17'][1].title, 'Rent');
    assert.equal(next['2026-08-17'][1].price, 1450);
});

test('a unique name or amount is not a mass edit', () => {
    assert.equal(labelOrPriceChanged(
        { title: 'Coffee', price: 5 },
        { title: 'Coffee', price: 5 }
    ), false);
    assert.equal(labelOrPriceChanged(
        { title: 'Coffee', price: 5 },
        { title: 'Latte', price: 5 }
    ), true);
    assert.equal(findTwinRefs(ledger, { title: 'Rent', price: 1450 }).length, 1);
    assert.equal(findTwinRefs(ledger, { title: 'Coffee', price: 6 }).length, 1);
});
