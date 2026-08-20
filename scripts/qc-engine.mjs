/**
 * Quality checks for the headless host engine.
 * Run: npm test
 */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { categorize } from '../src/engine/categorize.js';
import { mapTransaction, mergeTransactions } from '../src/engine/map.js';
import { budgetStatus, detectRecurring, flagAnomalies } from '../src/engine/insights.js';
import { createSession } from '../src/engine/session.js';
import { sanitizeEntry } from '../src/core/ledger-file.js';
import { shouldShowNotFound } from '../src/core/routes.js';
import { parseReceipt } from '../src/features/receipt-parse.js';
import { normalizeParentOrigin } from '../src/engine/bridge.js';
import { readFile } from 'node:fs/promises';

test('categorizer maps messy merchant strings', () => {
    assert.equal(categorize({ merchant: "SQ *TRADER JOE'S #123" }).category, 'Groceries');
    assert.equal(categorize({ name: 'ACME PAYROLL DIRECT DEP' }).kind, 'income');
    assert.equal(categorize({ merchant: 'Unknown Shop' }).category, 'Other');
});

test('mapTransaction accepts Plaid-like spend and income', () => {
    const spend = mapTransaction({
        amount: 45.2,
        merchant: "Trader Joe's",
        date: '2026-08-17',
        transaction_id: 'tx_1'
    });
    assert.equal(spend.date, '2026-08-17');
    assert.equal(spend.entry.title, "Trader Joe's");
    assert.equal(spend.entry.price, 45.2);
    assert.equal(spend.entry.kind, undefined);
    assert.equal(spend.entry.category, 'Groceries');
    assert.equal(spend.entry.sourceId, 'tx_1');

    const income = mapTransaction({
        amount: -961,
        merchant: 'Payroll',
        date: '2026-08-21',
        transaction_id: 'tx_2'
    });
    assert.equal(income.entry.kind, 'income');
    assert.equal(income.entry.price, 961);
});

test('mergeTransactions updates the same sourceId instead of duplicating', () => {
    const first = mergeTransactions({}, [{
        amount: 10,
        merchant: 'Coffee',
        date: '2026-08-17',
        transaction_id: 'abc'
    }]);
    const next = mergeTransactions(first, [{
        amount: 12,
        merchant: 'Coffee',
        date: '2026-08-17',
        transaction_id: 'abc'
    }]);
    assert.equal(next['2026-08-17'].length, 1);
    assert.equal(next['2026-08-17'][0].price, 12);
});

test('session set/get/import stay sanitized', () => {
    const session = createSession();
    session.importTransactions([
        { amount: 20, merchant: 'Uber', date: '2026-08-17', transaction_id: 'u1' },
        { amount: 20, merchant: 'Uber', date: '2026-08-24', transaction_id: 'u2' }
    ]);
    const state = session.get();
    assert.equal(state.events['2026-08-17'][0].category, 'Transit');
    assert.deepEqual(detectRecurring(state.events), ['uber']);
    assert.equal(session.getSnapshot(new Date(2026, 7, 17)).monthOut, 40);
    session.set({ events: { constructor: [{ title: 'nope', price: 1 }] } });
    assert.equal(Object.hasOwn(session.get().events, 'constructor'), false);
});

test('headless session carries goals into planner analytics', () => {
    const session = createSession({
        events: {
            '2026-08-01': [{ title: 'Pay', price: 1000, kind: 'income', paid: true }]
        },
        plan: { currentSavings: 100 },
        goals: [{
            id: '11111111111111111111111111111111',
            title: 'Emergency fund',
            targetDate: '2026-09-18',
            targetAmount: 500,
            createdAt: 1
        }]
    });
    assert.equal(session.get().goals.length, 1);
    const result = session.getSnapshot(new Date(2026, 7, 19));
    assert.equal(result.goalAssessment.goals[0].title, 'Emergency fund');
    assert.equal(result.goalAssessment.goals[0].currentAllocation, 100);
});

test('budget and anomaly helpers stay local', () => {
    const events = {
        '2026-08-01': [{ title: 'Rent', price: 100 }],
        '2026-08-08': [{ title: 'Rent', price: 100 }],
        '2026-08-15': [{ title: 'Rent', price: 400 }]
    };
    const budget = budgetStatus(events, { cap: 500, date: new Date(2026, 7, 17) });
    assert.equal(budget.total, 600);
    assert.equal(budget.over, true);
    assert.equal(flagAnomalies(events).length, 1);
});

test('sanitize keeps host fields and drops unknown ones', () => {
    const row = sanitizeEntry({
        title: 'Coffee',
        price: 4,
        category: 'Coffee',
        source: 'bank',
        sourceId: 'tx_9',
        evil: '<script>'
    });
    assert.equal(row.category, 'Coffee');
    assert.equal(row.source, 'bank');
    assert.equal(row.sourceId, 'tx_9');
    assert.equal(row.evil, undefined);
});

test('embed.html is a public path', () => {
    assert.equal(shouldShowNotFound('/embed.html'), false);
    assert.equal(shouldShowNotFound('/engine.js'), false);
});

test('parent origins are https or local http, never wildcards', () => {
    assert.equal(normalizeParentOrigin('https://bank.example'), 'https://bank.example');
    assert.equal(normalizeParentOrigin('https://bank.example/app?x=1'), 'https://bank.example');
    assert.equal(normalizeParentOrigin('http://localhost:3000'), 'http://localhost:3000');
    assert.equal(normalizeParentOrigin('http://127.0.0.1'), 'http://127.0.0.1');
    assert.equal(normalizeParentOrigin('http://evil.example'), '');
    assert.equal(normalizeParentOrigin('*'), '');
    assert.equal(normalizeParentOrigin('null'), '');
    assert.equal(normalizeParentOrigin('https://user:pass@bank.example'), '');
    assert.equal(normalizeParentOrigin('javascript:alert(1)'), '');
});

test('404 and embed pages carry the home CSP', async () => {
    const csp = /http-equiv="Content-Security-Policy"/;
    const home = await readFile(new URL('../index.html', import.meta.url), 'utf8');
    const missing = await readFile(new URL('../404.html', import.meta.url), 'utf8');
    const embed = await readFile(new URL('../embed.html', import.meta.url), 'utf8');
    assert.match(home, csp);
    assert.match(missing, csp);
    assert.match(embed, csp);
    assert.match(missing, /href="\/icons\/icon\.svg"/);
});

test('receipt dates reject calendar rollovers', () => {
    assert.equal(parseReceipt('Invoice date: 2026-02-28\nTotal $10.00').date, '2026-02-28');
    assert.equal(parseReceipt('Invoice date: 2026-02-31\nTotal $10.00').date, null);
    assert.equal(parseReceipt('Invoice date: 2028-02-29\nTotal $10.00').date, '2028-02-29');
});

test('categorize still reports a tag group for matched merchants', () => {
    // tags is part of the embed API surface; it must not silently go empty.
    assert.deepEqual(categorize({ merchant: "SQ *TRADER JOE'S #123" }).tags, ['Food']);
    assert.deepEqual(categorize({ merchant: 'Shell gas' }).tags, ['Travel']);
    assert.deepEqual(categorize({ name: 'ACME PAYROLL DIRECT DEP' }).tags, ['Income']);
    assert.deepEqual(categorize({ merchant: 'Unknown Shop' }).tags, []);
});

test('a host-supplied category still reports its group', () => {
    assert.deepEqual(categorize({ merchant: 'Anything', category: 'Coffee' }).tags, ['Food']);
    assert.deepEqual(categorize({ merchant: 'Anything', category: 'Boat fuel' }).tags, []);
});
