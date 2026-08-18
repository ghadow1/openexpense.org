import test from 'node:test';
import assert from 'node:assert/strict';
import { csvCell, toCsv, allRows } from '../src/features/csv-export.js';

const rows = (events) => allRows(events);

test('a plain value needs no quoting', () => {
    assert.equal(csvCell('Coffee'), 'Coffee');
    assert.equal(csvCell(12.5), '12.5');
    assert.equal(csvCell(null), '');
});

test('commas, quotes and newlines are escaped', () => {
    assert.equal(csvCell('Coffee, black'), '"Coffee, black"');
    assert.equal(csvCell('He said "hi"'), '"He said ""hi"""');
    assert.equal(csvCell('line one\nline two'), '"line one\nline two"');
});

test('a value that a spreadsheet would run as a formula is neutralised', () => {
    // Opening a CSV where a title starts with = hands the spreadsheet a formula
    // to execute. Every such lead character gets an apostrophe in front.
    for (const dangerous of ['=1+1', '+1', '-1', '@SUM(A1)', '=cmd|calc']) {
        const cell = csvCell(dangerous);
        assert.ok(cell.startsWith("'") || cell.startsWith('"\''), `${dangerous} was left executable as ${cell}`);
    }
});

test('a formula that also needs quoting gets both treatments', () => {
    assert.equal(csvCell('=1+1,2'), '"\'=1+1,2"');
});

test('a negative amount is still written as a number, not as text', () => {
    // The guard applies to cell text, and amounts are formatted before it, so
    // a real negative figure must survive as a usable number.
    const csv = toCsv([{
        date: '2026-08-01', title: 'Refund', amount: -12.5, kind: 'income',
        category: 'Refund', paid: true, recurring: false, note: ''
    }]);
    assert.match(csv, /,'-12\.50,/, 'a leading minus is escaped for the spreadsheet');
});

test('the header row names every column', () => {
    const csv = toCsv([]);
    assert.match(csv, /Date,Title,Amount,Type,Category,Status,Recurring,Note/);
});

test('the file starts with a BOM so Excel reads UTF-8 names', () => {
    assert.equal(toCsv([]).charCodeAt(0), 0xFEFF);
});

test('rows render with resolved category and readable status', () => {
    const csv = toCsv([
        {
            date: '2026-08-03', title: 'Starbucks', amount: 6.5, kind: 'expense',
            category: 'Coffee', paid: true, recurring: false, note: 'morning'
        },
        {
            date: '2026-08-04', title: 'Mystery', amount: 3, kind: 'expense',
            category: '', paid: false, recurring: true, note: ''
        }
    ]);
    const lines = csv.trim().split('\r\n');
    assert.equal(lines[1], '2026-08-03,Starbucks,6.50,Expense,Coffee,Paid,No,morning');
    assert.equal(lines[2], '2026-08-04,Mystery,3.00,Expense,Uncategorized,Unpaid,Yes,');
});

test('income rows say Received rather than Paid', () => {
    const csv = toCsv([{
        date: '2026-08-01', title: 'Paycheck', amount: 3200, kind: 'income',
        category: 'Paycheck', paid: true, recurring: true, note: ''
    }]);
    assert.match(csv, /Income,Paycheck,Received,Yes/);
});

test('every entry in the ledger is exported, oldest first', () => {
    const out = rows({
        '2026-09-01': [{ title: 'Later', price: 1 }],
        '2026-08-01': [{ title: 'A', price: 1 }, { title: 'B', price: 2 }],
        '2025-01-01': [{ title: 'Oldest', price: 5 }]
    });
    assert.deepEqual(out.map((row) => row.title), ['Oldest', 'A', 'B', 'Later']);
});

test('exporting survives a malformed ledger', () => {
    assert.deepEqual(allRows(null), []);
    assert.deepEqual(allRows({ '2026-08-01': null }), []);
    assert.deepEqual(allRows({ '2026-08-01': [null, 5] }), []);
});

test('an entry with no price exports as 0.00 rather than blank', () => {
    const csv = toCsv(rows({ '2026-08-01': [{ title: 'Note only' }] }));
    assert.match(csv, /2026-08-01,Note only,0\.00,/);
});

test('lines end with CRLF, which is what spreadsheets expect', () => {
    const csv = toCsv(rows({ '2026-08-01': [{ title: 'A', price: 1 }] }));
    assert.ok(csv.endsWith('\r\n'));
    assert.equal(csv.split('\r\n').filter(Boolean).length, 2);
});
