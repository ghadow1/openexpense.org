/**
 * OpenExpense — CSV export
 *
 * The encrypted pair is the backup; this is the copy you hand to a spreadsheet,
 * an accountant, or a tax form. It is deliberately plain text, so the download
 * says so plainly rather than letting someone assume it is protected.
 */
import { getState } from '../core/store.js';
import { Utils } from '../core/utils.js';
import { searchEntries, parseQuery, isEmptyQuery } from '../core/search.js';
import { categoryInfo } from '../core/categories.js';
import { ledgerFileBase } from '../core/ledger-file.js';
import { Toast } from '../ui/toast.js';
import { confirmDialog } from '../ui/confirm.js';
import { Ledger } from './ledger.js';

const COLUMNS = ['Date', 'Title', 'Amount', 'Type', 'Category', 'Group', 'Status', 'Recurring', 'Note'];

/**
 * Escape one CSV field.
 *
 * The leading apostrophe on =, +, - and @ is not cosmetic: without it a title
 * like "=1+1" is run as a formula when the file is opened in Excel or Sheets,
 * which is a real way to get a spreadsheet to execute a stranger's text.
 */
export function csvCell(value) {
    const text = String(value ?? '');
    const guarded = /^[=+\-@\t\r]/.test(text) ? `'${text}` : text;
    return /[",\n\r]/.test(guarded) ? `"${guarded.replace(/"/g, '""')}"` : guarded;
}

export function toCsv(rows) {
    const lines = [COLUMNS.join(',')];
    for (const row of rows) {
        lines.push([
            row.date,
            row.title,
            row.amount.toFixed(2),
            row.kind === 'income' ? 'Income' : 'Expense',
            categoryInfo(row.category, row.kind).label,
            row.group || '',
            row.paid ? (row.kind === 'income' ? 'Received' : 'Paid') : 'Unpaid',
            row.recurring ? 'Yes' : 'No',
            row.note
        ].map(csvCell).join(','));
    }
    // Excel needs the BOM to read UTF-8 names correctly.
    return `\uFEFF${lines.join('\r\n')}\r\n`;
}

/** Every entry in the ledger, oldest first, as search rows. */
export function allRows(events) {
    const rows = [];
    for (const date of Object.keys(events || {}).sort()) {
        const list = events[date];
        if (!Array.isArray(list)) continue;
        list.forEach((entry, index) => {
            if (!entry || typeof entry !== 'object') return;
            rows.push({
                date,
                index,
                title: entry.title || 'Untitled',
                amount: Utils.getPrice(entry),
                category: entry.category || '',
                group: entry.group || '',
                kind: Utils.entryKind(entry),
                paid: !!entry.paid,
                recurring: !!entry.recurring,
                note: entry.note || ''
            });
        });
    }
    return rows;
}

async function download(rows, suffix) {
    if (!rows.length) {
        Toast.show('Nothing to export.', 'info');
        return;
    }

    const ok = await confirmDialog({
        title: `Export ${rows.length} row${rows.length === 1 ? '' : 's'} as CSV?`,
        message: 'A CSV is plain text. Anyone who opens the file can read every row, so keep it somewhere you trust, or use Export for the encrypted backup instead.',
        confirmText: 'Download CSV',
        cancelText: 'Cancel'
    });
    if (!ok?.confirmed) return;

    const base = ledgerFileBase(getState().ledgerName);
    const stamp = Utils.dateKey(new Date().getFullYear(), new Date().getMonth(), new Date().getDate());
    const blob = new Blob([toCsv(rows)], { type: 'text/csv;charset=utf-8' });
    Ledger.downloadFallback(blob, `${base}-${suffix}${stamp}.csv`);
    Toast.show(`Saved ${rows.length} row${rows.length === 1 ? '' : 's'} as CSV. It is not encrypted.`, 'success', 5200);
}

/** Export whatever the current search matches, not just the visible page. */
export function exportSearchCsv(query) {
    const parsed = parseQuery(query);
    if (isEmptyQuery(parsed)) {
        download(allRows(getState().events), '');
        return;
    }
    const result = searchEntries(getState().events, parsed, { limit: Infinity });
    download(result.rows, 'search-');
}
