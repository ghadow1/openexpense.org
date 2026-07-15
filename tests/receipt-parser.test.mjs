import assert from 'node:assert/strict';
import test from 'node:test';

import { ReceiptParser } from '../src/features/receipt-parser.js';

test('parses a common invoice-style receipt', () => {
    const lines = [
        'Zoom Communications, Inc.',
        'Invoice Date: July 2, 2026',
        'Charge Name: Zoom Workplace Pro',
        'Subtotal $140.00',
        'Taxes & Fees $9.90',
        'Amount Due: $149.90'
    ];
    const parsed = ReceiptParser.parse(lines.join('\n'), lines, 0.91);

    assert.equal(parsed.merchant, 'Zoom Communications, Inc.');
    assert.equal(parsed.date, '2026-07-02');
    assert.equal(parsed.total, 149.90);
    assert.equal(parsed.tax, 9.90);
    assert.deepEqual(parsed.items, ['Zoom Workplace Pro']);
    assert.equal(parsed.lowConfidence, false);
});

test('infers a retail total from the strongest total line', () => {
    const lines = [
        'WHOLE FOODS MARKET',
        '123 Market Street',
        'Organic Apples $5.49',
        'Coffee Beans $12.99',
        'Subtotal $18.48',
        'Tax $1.11',
        'TOTAL $19.59'
    ];
    const parsed = ReceiptParser.parse(lines.join('\n'), lines, 0.76);

    assert.equal(parsed.merchant, 'Whole Foods');
    assert.equal(parsed.total, 19.59);
    assert.equal(parsed.tax, 1.11);
    assert.equal(parsed.lowConfidence, false);
});

test('normalizes OCR-friendly money and low-confidence values', () => {
    assert.deepEqual(ReceiptParser.allMoneyOnLine('Balance due 12,34'), [12.34]);
    assert.equal(ReceiptParser.moneyOnLine('Line total $7.50 $8.25'), 8.25);

    const parsed = ReceiptParser.parse('Receipt\nTotal $8.25', ['Receipt', 'Total $8.25'], 0.42);
    assert.equal(parsed.total, 8.25);
    assert.equal(parsed.lowConfidence, true);
});
