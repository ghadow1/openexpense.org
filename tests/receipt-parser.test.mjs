import assert from 'node:assert/strict';
import test from 'node:test';

import { ReceiptParser } from '../src/features/receipt-parser.js';

test('parses a PDF-style Zoom invoice without OCR engine dependencies', () => {
    const lines = [
        'Zoom Communications, Inc.',
        'Invoice Date: Jun 3, 2026',
        'Charge Name: Zoom Workplace Pro',
        'Subtotal $15.99',
        'Taxes & Fees $1.00',
        'Amount Due $16.99'
    ];
    const parsed = ReceiptParser.parse(lines.join('\n'), lines, 0.95);

    assert.equal(parsed.merchant, 'Zoom Communications, Inc.');
    assert.equal(parsed.date, '2026-06-03');
    assert.equal(parsed.total, 16.99);
    assert.equal(parsed.tax, 1);
    assert.deepEqual(parsed.items, ['Zoom Workplace Pro']);
    assert.equal(parsed.lowConfidence, false);
});

test('sums receipt row totals without double-counting subtotal and tax summary lines', () => {
    const lines = [
        'Corner Market',
        'Apples $2.00 $2.00',
        'Bread $3.00 $3.00',
        'Subtotal $5.00',
        'Tax $0.50',
        'Total $5.50'
    ];

    assert.equal(ReceiptParser.collectInvoiceAmounts(lines), 5);
    assert.equal(ReceiptParser.sumInvoiceRowTotals(lines), 5);
    assert.equal(ReceiptParser.parse(lines.join('\n'), lines).total, 5.5);
});

test('normalizes common OCR substitutions and fuzzy month names', () => {
    const lines = ReceiptParser.normalizeLines(['Zooml', 'TOTAL 12|34', 'Date Juiy 15, 2026']);

    assert.deepEqual(lines, ['Zoom', 'TOTAL 12.34', 'Date Juiy 15, 2026']);
    assert.equal(ReceiptParser.parseDate(lines.join('\n'), lines), '2026-07-15');
});

test('marks OCR parses below the confidence threshold as low confidence', () => {
    const parsed = ReceiptParser.parse('Local Cafe\nTotal $8.25', undefined, 0.42);

    assert.equal(parsed.merchant, 'Local Cafe');
    assert.equal(parsed.total, 8.25);
    assert.equal(parsed.lowConfidence, true);
});
