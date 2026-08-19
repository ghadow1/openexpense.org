/**
 * Monthly statement PDF - invoice-grade register, not a brochure collage.
 *
 * Layout (US Letter, Helvetica):
 *   1. Letterhead + period / reference
 *   2. Account summary tiles + settlement bar
 *   3. Line-item register (repeats column heads on overflow pages)
 *   4. Totals box + on-device privacy note
 *
 * All drawing goes through pdf-frame so a thin bar or empty month cannot
 * throw inside jsPDF (roundedRect radius, undefined colors, dirty text).
 */
import { jsPDF } from 'jspdf';
import { Utils } from './utils.js';
import { getPdfTheme } from './pdf-theme.js';
import {
    PDF_BOTTOM,
    PDF_CONTENT_W,
    PDF_MARGIN,
    PDF_PAGE_H,
    PDF_PAGE_W,
    fillBox,
    fillPage,
    fillPortion,
    fillRule,
    paintBox,
    pdfNum,
    pdfSafeText,
    setPdfFont,
    setPdfTextColor,
    strokeBox,
    wrapPdfLines,
    writePdfText
} from './pdf-frame.js';

const MONTHS = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
];
const WEEKDAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

const COPY = {
    expense: {
        document: 'Spending statement',
        subject: 'Spending for the selected month',
        totalLabel: 'Statement total',
        settledLabel: 'Paid',
        openLabel: 'Unpaid',
        settledHint: 'already paid',
        openHint: 'still unpaid',
        settlementCaption: "Share of this month's spending that is already paid",
        typeRecurring: 'Recurring',
        typeOneOff: 'One-off',
        statusPaid: 'Paid',
        statusOpen: 'Unpaid',
        emptyBody: 'No spending is recorded in this month. The statement is still valid - add entries on the calendar and export again.',
        registerTitle: 'Line items',
        registerHint: 'Every spending entry in the period, oldest first.',
        totalsPaid: 'Paid',
        totalsOpen: 'Unpaid',
        totalsAll: 'Statement total',
        compositionTitle: 'Composition',
        compositionRecurring: 'Recurring',
        compositionOneOff: 'One-off'
    },
    income: {
        document: 'Income statement',
        subject: 'Income for the selected month',
        totalLabel: 'Statement total',
        settledLabel: 'Deposited',
        openLabel: 'Expected',
        settledHint: 'already received',
        openHint: 'still expected',
        settlementCaption: "Share of this month's income that is already deposited",
        typeRecurring: 'Recurring',
        typeOneOff: 'One-off',
        statusPaid: 'Deposited',
        statusOpen: 'Expected',
        emptyBody: 'No income is recorded in this month. The statement is still valid - add income on the calendar and export again.',
        registerTitle: 'Line items',
        registerHint: 'Every income entry in the period, oldest first.',
        totalsPaid: 'Deposited',
        totalsOpen: 'Expected',
        totalsAll: 'Statement total',
        compositionTitle: 'Composition',
        compositionRecurring: 'Recurring',
        compositionOneOff: 'One-off'
    }
};

function copyFor(kind) {
    return kind === 'income' ? COPY.income : COPY.expense;
}

/** Invoice money: whole cents, thousands separators, two decimals. */
function money(dollars) {
    const cents = Utils.toCents(dollars);
    const sign = cents < 0 ? '-' : '';
    const abs = Math.abs(cents);
    const whole = Math.floor(abs / 100);
    const frac = String(abs % 100).padStart(2, '0');
    return `${sign}$${whole.toLocaleString('en-US')}.${frac}`;
}

function slug(value) {
    return pdfSafeText(value).toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') || 'ledger';
}

function pad2(n) {
    return String(n).padStart(2, '0');
}

function lastDayOfMonth(year, monthIndex) {
    return new Date(year, monthIndex + 1, 0).getDate();
}

function issuedStamp(date = new Date()) {
    const month = MONTHS[date.getMonth()] || 'January';
    return `${date.getDate()} ${month} ${date.getFullYear()}`;
}

function periodLabel(year, monthIndex) {
    const month = MONTHS[monthIndex] || 'January';
    return `1-${lastDayOfMonth(year, monthIndex)} ${month} ${year}`;
}

function referenceCode(year, monthIndex, kind) {
    const prefix = kind === 'income' ? 'INC' : 'EXP';
    return `OE-${prefix}-${year}${pad2(monthIndex + 1)}`;
}

function weekdayName(year, monthIndex, day) {
    const date = new Date(year, monthIndex, day);
    if (Number.isNaN(date.getTime())) return '';
    return WEEKDAYS[date.getDay()] || '';
}

function filenameFor(ledgerName, year, monthIndex, kind) {
    const month = (MONTHS[monthIndex] || 'month').toLowerCase();
    const face = kind === 'income' ? 'income' : 'spending';
    return `${slug(ledgerName)}-${month}-${year}-${face}-report.pdf`;
}

function dayFromItem(item) {
    const key = String(item?.date || '');
    const part = key.split('-')[2];
    const day = Number(part);
    if (Number.isFinite(day) && day >= 1 && day <= 31) return day;
    return Math.max(1, Math.min(31, pdfNum(item?.day, 1)));
}

function sortedEntries(summary) {
    const year = pdfNum(summary?.year);
    const monthIndex = pdfNum(summary?.month);
    const items = Array.isArray(summary?.allItems) ? summary.allItems : [];
    return items
        .map((item, index) => {
            const day = dayFromItem(item);
            return {
                index,
                day,
                date: `${pad2(day)} ${String(MONTHS[monthIndex] || '').slice(0, 3)}`,
                weekday: weekdayName(year, monthIndex, day),
                title: pdfSafeText(item.title) || 'Untitled entry',
                amount: Utils.fromCents(Utils.toCents(item.amount)),
                recurring: Boolean(item.recurring),
                paid: Boolean(item.paid)
            };
        })
        .sort((a, b) => a.day - b.day || a.index - b.index);
}

function statementTone(theme) {
    return {
        paper: theme.page,
        ink: theme.text,
        mute: theme.muted,
        soft: theme.textSecondary,
        card: theme.card,
        cardLine: theme.border,
        brand: theme.brandNavy,
        brandInk: theme.brandInk,
        brandMute: theme.brandMuted,
        headFill: theme.cardAlt,
        zebra: theme.cardAlt,
        track: theme.cardAlt,
        barFill: theme.brandNavy,
        barMute: theme.accentTint,
        rule: theme.border
    };
}

function pageOf(doc) {
    return doc.getNumberOfPages();
}

export async function exportMonthlySummaryPdf({ summary, ledgerName, isDark, compress = true }) {
    const kind = summary?.kind === 'income' ? 'income' : 'expense';
    const copy = copyFor(kind);
    const year = pdfNum(summary?.year, new Date().getFullYear());
    const monthIndex = Math.max(0, Math.min(11, pdfNum(summary?.month, 0)));
    const monthName = MONTHS[monthIndex] || 'January';
    const theme = getPdfTheme(Boolean(isDark), kind);
    const tone = statementTone(theme);
    const font = theme.fontFallback;
    const name = pdfSafeText(ledgerName) || 'Untitled ledger';
    const rows = sortedEntries(summary);

    const total = Utils.fromCents(Utils.toCents(summary?.total));
    const paid = Utils.fromCents(Utils.toCents(summary?.paid));
    const unpaid = Utils.fromCents(Utils.toCents(summary?.pending));
    const recurringTotal = Utils.fromCents(Utils.toCents(summary?.recurring));
    const oneOffTotal = Utils.fromCents(Utils.toCents(summary?.oneTime));
    const paidRatio = total > 0 ? Utils.toCents(paid) / Utils.toCents(total) : 0;
    const recShare = total > 0 ? Utils.toCents(recurringTotal) / Utils.toCents(total) : 0;

    const doc = new jsPDF({ unit: 'pt', format: 'letter', compress: compress !== false });
    try {
        doc.setProperties({
            title: `${copy.document} - ${monthName} ${year}`,
            subject: copy.subject,
            author: 'OpenExpense',
            creator: 'OpenExpense',
            keywords: 'statement, invoice, ledger'
        });
    } catch {
        /* properties are optional */
    }

    const ink = (style, size, color) => {
        setPdfFont(doc, font, style, size);
        setPdfTextColor(doc, color || tone.ink);
    };
    const text = (value, x, y, options) => writePdfText(doc, value, x, y, options);

    const paintPaper = () => fillPage(doc, tone.paper);

    const footerForPage = (page) => {
        const pages = pageOf(doc);
        fillBox(doc, 0, PDF_PAGE_H - 40, PDF_PAGE_W, 40, tone.paper);
        fillRule(doc, PDF_MARGIN, PDF_PAGE_H - 40, PDF_CONTENT_W, tone.rule, 0.5);
        ink('normal', 7.5, tone.mute);
        text('OpenExpense  ·  Generated on this device  ·  Nothing uploaded', PDF_MARGIN, PDF_PAGE_H - 22);
        text(`Page ${page} of ${pages}`, PDF_PAGE_W - PDF_MARGIN, PDF_PAGE_H - 22, { align: 'right' });
    };

    const paintAllFooters = () => {
        const pages = pageOf(doc);
        for (let page = 1; page <= pages; page += 1) {
            doc.setPage(page);
            footerForPage(page);
        }
    };

    paintPaper();

    /* —— Letterhead —— */
    fillBox(doc, 0, 0, PDF_PAGE_W, 100, tone.brand);
    ink('bold', 11, tone.brandInk);
    text('OPENEXPENSE', PDF_MARGIN, 36);
    ink('normal', 8, tone.brandMute);
    text('Encrypted local ledger', PDF_MARGIN, 50);

    ink('bold', 18, tone.brandInk);
    text(copy.document, PDF_PAGE_W - PDF_MARGIN, 38, { align: 'right' });
    ink('normal', 9, tone.brandMute);
    text(copy.subject, PDF_PAGE_W - PDF_MARGIN, 56, { align: 'right' });

    const metaTop = 124;
    const meta = [
        ['Issued', issuedStamp()],
        ['Period', periodLabel(year, monthIndex)],
        ['Ledger', name],
        ['Reference', referenceCode(year, monthIndex, kind)]
    ];
    const metaW = PDF_CONTENT_W / meta.length;
    meta.forEach((pair, i) => {
        const x = PDF_MARGIN + i * metaW;
        ink('bold', 7, tone.mute);
        text(pair[0].toUpperCase(), x, metaTop);
        ink('normal', 10, tone.ink);
        text(pair[1], x, metaTop + 16, { maxWidth: metaW - 10 });
    });
    fillRule(doc, PDF_MARGIN, metaTop + 28, PDF_CONTENT_W, tone.rule, 0.7);

    /* —— Account summary —— */
    let y = metaTop + 48;
    ink('bold', 11, tone.ink);
    text('Account summary', PDF_MARGIN, y);
    ink('normal', 8, tone.soft);
    text(`${monthName} ${year}  ·  ${rows.length} line item${rows.length === 1 ? '' : 's'}`, PDF_MARGIN + 118, y);

    y += 14;
    const tiles = [
        { label: copy.totalLabel, value: money(total), hint: `${rows.length} ${rows.length === 1 ? 'entry' : 'entries'}` },
        { label: copy.settledLabel, value: money(paid), hint: copy.settledHint },
        { label: copy.openLabel, value: money(unpaid), hint: copy.openHint },
        { label: 'Line items', value: String(rows.length), hint: rows.length ? 'in this period' : 'none this month' }
    ];
    const gap = 8;
    const tileW = (PDF_CONTENT_W - gap * 3) / 4;
    tiles.forEach((tile, i) => {
        const x = PDF_MARGIN + i * (tileW + gap);
        paintBox(doc, x, y, tileW, 58, tone.card, tone.cardLine, 4);
        ink('bold', 7, tone.mute);
        text(tile.label.toUpperCase(), x + 10, y + 16);
        ink('bold', 13, tone.ink);
        text(tile.value, x + 10, y + 36, { maxWidth: tileW - 18 });
        ink('normal', 7.5, tone.soft);
        text(tile.hint, x + 10, y + 50, { maxWidth: tileW - 18 });
    });

    y += 72;
    paintBox(doc, PDF_MARGIN, y, PDF_CONTENT_W, 46, tone.card, tone.cardLine, 4);
    ink('bold', 8, tone.mute);
    text('SETTLEMENT', PDF_MARGIN + 12, y + 16);
    ink('normal', 9, tone.ink);
    text(`${Math.round(paidRatio * 100)}% ${copy.settledHint}`, PDF_MARGIN + 88, y + 16);
    fillPortion(doc, PDF_MARGIN + 12, y + 26, PDF_CONTENT_W - 24, 8, paidRatio, tone.barFill, tone.track, 3);
    ink('normal', 7.5, tone.soft);
    text(copy.settlementCaption, PDF_MARGIN + 12, y + 42);

    y += 60;
    if (Utils.toCents(total) > 0) {
        paintBox(doc, PDF_MARGIN, y, PDF_CONTENT_W, 42, tone.card, tone.cardLine, 4);
        ink('bold', 8, tone.mute);
        text(copy.compositionTitle.toUpperCase(), PDF_MARGIN + 12, y + 16);
        const mixX = PDF_MARGIN + 110;
        const mixW = 220;
        fillPortion(doc, mixX, y + 10, mixW, 10, recShare, tone.barFill, tone.barMute, 4);
        ink('normal', 8, tone.ink);
        text(`${copy.compositionRecurring}  ${money(recurringTotal)}`, mixX + mixW + 14, y + 18);
        text(`${copy.compositionOneOff}  ${money(oneOffTotal)}`, mixX + mixW + 150, y + 18);
        y += 56;
    }

    /* —— Register —— */
    const cols = {
        date: PDF_MARGIN + 10,
        desc: PDF_MARGIN + 92,
        type: PDF_MARGIN + 338,
        status: PDF_MARGIN + 414,
        amount: PDF_PAGE_W - PDF_MARGIN - 10
    };
    const descWidth = 230;

    const drawRegisterHead = (top) => {
        fillBox(doc, PDF_MARGIN, top, PDF_CONTENT_W, 22, tone.headFill, 0);
        strokeBox(doc, PDF_MARGIN, top, PDF_CONTENT_W, 22, tone.cardLine, 0, 0.4);
        ink('bold', 7.5, tone.mute);
        text('DATE', cols.date, top + 14);
        text('DESCRIPTION', cols.desc, top + 14);
        text('TYPE', cols.type, top + 14);
        text('STATUS', cols.status, top + 14);
        text('AMOUNT', cols.amount, top + 14, { align: 'right' });
        return top + 22;
    };

    const startRegisterPage = () => {
        paintPaper();
        fillBox(doc, 0, 0, PDF_PAGE_W, 44, tone.brand);
        ink('bold', 9, tone.brandInk);
        text('OPENEXPENSE', PDF_MARGIN, 22);
        ink('normal', 8, tone.brandMute);
        text(
            `${copy.document}  ·  ${periodLabel(year, monthIndex)}  ·  ${referenceCode(year, monthIndex, kind)}`,
            PDF_PAGE_W - PDF_MARGIN,
            22,
            { align: 'right' }
        );
        ink('bold', 11, tone.ink);
        text(`${copy.registerTitle}  (continued)`, PDF_MARGIN, 64);
        return drawRegisterHead(74);
    };

    ink('bold', 11, tone.ink);
    text(copy.registerTitle, PDF_MARGIN, y);
    ink('normal', 8, tone.soft);
    text(copy.registerHint, PDF_MARGIN + 72, y);
    y += 10;
    y = drawRegisterHead(y);

    if (!rows.length) {
        paintBox(doc, PDF_MARGIN, y, PDF_CONTENT_W, 52, tone.card, tone.cardLine, 0);
        ink('normal', 9, tone.soft);
        const emptyLines = wrapPdfLines(doc, copy.emptyBody, PDF_CONTENT_W - 24, 3);
        emptyLines.forEach((line, i) => text(line, PDF_MARGIN + 12, y + 20 + i * 12));
        y += 64;
    } else {
        rows.forEach((row, index) => {
            const titleLines = wrapPdfLines(doc, row.title, descWidth, 2);
            const rowH = Math.max(24, 12 + titleLines.length * 11);
            if (y + rowH > PDF_BOTTOM) {
                doc.addPage();
                y = startRegisterPage();
            }
            if (index % 2 === 1) fillBox(doc, PDF_MARGIN, y, PDF_CONTENT_W, rowH, tone.zebra, 0);
            strokeBox(doc, PDF_MARGIN, y, PDF_CONTENT_W, rowH, tone.cardLine, 0, 0.3);
            ink('normal', 8.5, tone.ink);
            text(row.date, cols.date, y + 14);
            ink('normal', 7, tone.soft);
            if (row.weekday) text(row.weekday.slice(0, 3), cols.date, y + 24);
            ink('normal', 9, tone.ink);
            titleLines.forEach((line, i) => text(line, cols.desc, y + 14 + i * 11));
            ink('normal', 8, tone.soft);
            text(row.recurring ? copy.typeRecurring : copy.typeOneOff, cols.type, y + 14);
            ink('normal', 8, row.paid ? tone.ink : tone.soft);
            text(row.paid ? copy.statusPaid : copy.statusOpen, cols.status, y + 14);
            ink('bold', 9, tone.ink);
            text(money(row.amount), cols.amount, y + 14, { align: 'right' });
            y += rowH;
        });
    }

    /* —— Totals —— */
    // 16pt top gap + 78pt box; reserve the exact geometry before paging.
    const totalsH = 94;
    if (y + totalsH > PDF_BOTTOM) {
        doc.addPage();
        y = startRegisterPage();
    }
    y += 16;
    const boxW = 240;
    const boxX = PDF_PAGE_W - PDF_MARGIN - boxW;
    paintBox(doc, boxX, y, boxW, 78, tone.card, tone.cardLine, 4);
    const lines = [
        [copy.totalsPaid, money(paid), false],
        [copy.totalsOpen, money(unpaid), false],
        [copy.totalsAll, money(total), true]
    ];
    lines.forEach((line, i) => {
        const ly = y + 18 + i * 20;
        ink(line[2] ? 'bold' : 'normal', line[2] ? 10 : 8.5, line[2] ? tone.ink : tone.soft);
        text(line[0], boxX + 12, ly);
        ink(line[2] ? 'bold' : 'normal', line[2] ? 11 : 9, tone.ink);
        text(line[1], boxX + boxW - 12, ly, { align: 'right' });
    });

    ink('normal', 8, tone.soft);
    const note = wrapPdfLines(
        doc,
        'This statement was built on this device from the open ledger. Figures are the same totals shown in the app. Nothing was uploaded to create this file.',
        PDF_CONTENT_W - boxW - 24,
        4
    );
    note.forEach((line, i) => text(line, PDF_MARGIN, y + 18 + i * 12));

    paintAllFooters();

    const blob = doc.output('blob');
    return {
        blob,
        filename: filenameFor(name, year, monthIndex, kind)
    };
}
