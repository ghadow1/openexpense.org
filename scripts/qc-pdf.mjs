/**
 * Quality check: crash-proof PDF frame + invoice-style monthly statement.
 * Run: npm test
 */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { computeMonthlySummary } from '../src/core/summary.js';
import {
    clampRadius,
    pdfHex,
    pdfNum,
    pdfSafeText,
    canDrawBox,
    fillBox,
    fillPortion
} from '../src/core/pdf-frame.js';
import { exportMonthlySummaryPdf } from '../src/core/summary-pdf.js';
import { jsPDF } from 'jspdf';

function entry({ title, price, kind, recurring = false, paid = true, date }) {
    const row = { title, price, paid };
    if (kind === 'income') row.kind = 'income';
    if (recurring) row.recurring = true;
    if (date) row.date = date;
    return row;
}

async function haystack(blob) {
    const buf = Buffer.from(await blob.arrayBuffer());
    return buf.toString('latin1');
}

test('pdf-frame clamps radius and rejects dirty colors', () => {
    assert.equal(clampRadius(0.7, 8, 3), 0.35);
    assert.equal(clampRadius(8, 8, 3), 3);
    assert.equal(clampRadius(0.4, 8, 3), 0);
    assert.equal(pdfHex('#ABC'), '#aabbcc');
    assert.equal(pdfHex('navy', '#111827'), '#111827');
    assert.equal(pdfHex(undefined, '#002244'), '#002244');
    assert.equal(pdfNum(Number.NaN, 4), 4);
    assert.equal(pdfSafeText('Rent ◆ — “due”'), 'Rent - "due"');
    assert.equal(canDrawBox(0.5, 8), false);
    assert.equal(canDrawBox(8, 8), true);
});

test('thin rounded fills never throw in jsPDF', () => {
    const doc = new jsPDF({ unit: 'pt', format: 'letter' });
    assert.equal(fillBox(doc, 40, 40, 0.7, 8, '#002244', 3), true);
    assert.equal(fillBox(doc, 40, 50, 0.2, 8, undefined, 4), false);
    assert.equal(fillPortion(doc, 40, 60, 200, 8, 0.002, '#002244', '#e5e7eb', 3), true);
    assert.equal(fillPortion(doc, 40, 70, 200, 8, 0, '#002244', '#e5e7eb', 3), false);
});

test('empty month still produces a valid one-page statement', async () => {
    const summary = computeMonthlySummary({}, new Date(2026, 7, 1), 'expense');
    const { blob, filename } = await exportMonthlySummaryPdf({
        summary,
        ledgerName: 'Empty book',
        isDark: false,
        compress: false
    });
    assert.match(filename, /empty-book-august-2026-spending-report\.pdf$/);
    assert.ok(blob.size > 1500);
    const raw = await haystack(blob);
    assert.match(raw, /Spending statement/);
    assert.match(raw, /No spending is recorded/);
    assert.match(raw, /\$0\.00/);
    assert.match(raw, /Nothing uploaded/);
    assert.doesNotMatch(raw, /Page 2 of/);
});

test('dark theme and a tiny paid share still export', async () => {
    const events = {
        '2026-08-03': [
            entry({ title: 'Stamp', price: 0.01, paid: true }),
            entry({ title: 'Rent', price: 2400, paid: false, recurring: true })
        ]
    };
    const summary = computeMonthlySummary(events, new Date(2026, 7, 18), 'expense');
    assert.equal(summary.paid, 0.01);
    const { blob, filename } = await exportMonthlySummaryPdf({
        summary,
        ledgerName: 'Thin bar',
        isDark: true,
        compress: false
    });
    assert.match(filename, /thin-bar-august-2026-spending-report\.pdf$/);
    assert.ok(blob.size > 2000);
    const raw = await haystack(blob);
    assert.match(raw, /Spending statement/);
    assert.match(raw, /\$0\.01/);
    assert.match(raw, /\$2,400\.00/);
    assert.match(raw, /Unpaid/);
    assert.match(raw, /OE-EXP-202608/);
});

test('income statement uses deposited / expected copy', async () => {
    const events = {
        '2026-08-17': [
            entry({ title: 'Paycheck', price: 800, kind: 'income', recurring: true, paid: true }),
            entry({ title: 'Bonus', price: 200, kind: 'income', paid: false })
        ]
    };
    const summary = computeMonthlySummary(events, new Date(2026, 7, 17), 'income');
    const { blob, filename } = await exportMonthlySummaryPdf({
        summary,
        ledgerName: 'QC household',
        isDark: false,
        compress: false
    });
    assert.match(filename, /august-2026-income-report\.pdf$/);
    const raw = await haystack(blob);
    assert.match(raw, /Income statement/);
    assert.match(raw, /Deposited/);
    assert.match(raw, /Expected/);
    assert.match(raw, /\$800\.00/);
    assert.match(raw, /\$200\.00/);
    assert.match(raw, /\$1,000\.00/);
    assert.match(raw, /OE-INC-202608/);
});

test('long registers paginate and repeat the column heads', async () => {
    const events = {};
    for (let day = 1; day <= 28; day += 1) {
        events[`2026-08-${String(day).padStart(2, '0')}`] = [
            entry({ title: `Coffee ${day}`, price: 4.5, paid: day % 2 === 0 }),
            entry({ title: `Fare ${day}`, price: 3.25, paid: true })
        ];
    }
    const summary = computeMonthlySummary(events, new Date(2026, 7, 18), 'expense');
    assert.equal(summary.itemCount, 56);
    const { blob } = await exportMonthlySummaryPdf({
        summary,
        ledgerName: 'Busy August',
        isDark: false,
        compress: false
    });
    const raw = await haystack(blob);
    assert.match(raw, /Line items \\\(continued\\\)/);
    assert.match(raw, /Page 2 of/);
    assert.match(raw, /Coffee 1/);
    assert.match(raw, /Fare 28/);
});
