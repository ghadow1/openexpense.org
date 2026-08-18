/**
 * Weekly savings plan and the rules that change left-to-spend.
 */
import test from 'node:test';
import assert from 'node:assert/strict';
import {
    PLAN_DEFAULTS,
    describePlan,
    incomeUsed,
    monthReserve,
    planIsDefault,
    sanitizePlan,
    spendUsed,
    weekBounds,
    windowTotals
} from '../src/core/plan.js';

test('sanitizePlan restores the original cash-line defaults', () => {
    assert.deepEqual(sanitizePlan(undefined), PLAN_DEFAULTS);
    assert.deepEqual(sanitizePlan([]), PLAN_DEFAULTS);
    assert.deepEqual(sanitizePlan('x'), PLAN_DEFAULTS);
    assert.equal(planIsDefault({}), true);
    assert.equal(planIsDefault({ weeklySavings: 25 }), false);
});

test('sanitizePlan keeps only known rule values', () => {
    const clean = sanitizePlan({
        weeklySavings: 40.125,
        reserveSavings: false,
        spendBasis: 'paid',
        incomeBasis: 'scheduled',
        extra: true,
        __proto__: { weeklySavings: 9 }
    });
    assert.equal(clean.weeklySavings, 40.13);
    assert.equal(clean.reserveSavings, false);
    assert.equal(clean.spendBasis, 'paid');
    assert.equal(clean.incomeBasis, 'scheduled');
    assert.equal(clean.extra, undefined);
});

test('August reserve is weekly times 31 / 7', () => {
    assert.equal(monthReserve(70, new Date(2026, 7, 18)), 310);
    assert.equal(monthReserve(0, new Date(2026, 7, 18)), 0);
    assert.equal(monthReserve(50, new Date(2026, 1, 1)), 200);
});

test('weekBounds is Sunday through Saturday', () => {
    const week = weekBounds(new Date(2026, 7, 18));
    assert.equal(week.start, '2026-08-16');
    assert.equal(week.end, '2026-08-22');
});

test('spend and income bases pick paid or the full register', () => {
    const spend = { paid: 10, pending: 5, total: 15 };
    const income = { paid: 40, pending: 20, total: 60 };
    assert.equal(spendUsed(spend, {}), 15);
    assert.equal(spendUsed(spend, { spendBasis: 'paid' }), 10);
    assert.equal(incomeUsed(income, {}), 40);
    assert.equal(incomeUsed(income, { incomeBasis: 'scheduled' }), 60);
});

test('windowTotals applies the same bases inside a date range', () => {
    const events = {
        '2026-08-16': [{ title: 'Pay', price: 400, kind: 'income', paid: true }],
        '2026-08-18': [{ title: 'Food', price: 80, paid: false }],
        '2026-08-23': [{ title: 'Later', price: 10, paid: true }]
    };
    const logged = windowTotals(events, '2026-08-16', '2026-08-22', {});
    assert.equal(logged.spendUsed, 80);
    assert.equal(logged.incomeUsed, 400);
    assert.equal(logged.net, 320);

    const paid = windowTotals(events, '2026-08-16', '2026-08-22', { spendBasis: 'paid' });
    assert.equal(paid.spendUsed, 0);
    assert.equal(paid.net, 400);
});

test('describePlan names the active rules', () => {
    assert.match(describePlan({}), /deposited income minus all logged bills/);
    assert.match(describePlan({ spendBasis: 'paid', incomeBasis: 'scheduled' }), /scheduled income minus paid bills/);
});
