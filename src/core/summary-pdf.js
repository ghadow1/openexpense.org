import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import { formatDelta, formatMoney } from './summary.js';
import { Utils } from './utils.js';
import {
    drawPill,
    drawSectionLabel,
    getPdfTheme,
    getActiveFontName,
    loadPdfFonts,
    setDocFont,
    setDocFontItalic
} from './pdf-theme.js';

const PAGE = { w: 612, h: 792 };
const MARGIN = 48;
const FOOTER_Y = PAGE.h - 26;
const FOOTER_RULE_Y = PAGE.h - 42;
const CONTENT_W = PAGE.w - MARGIN * 2;
const BOTTOM = FOOTER_RULE_Y - 14;

const GAP = {
    afterHeader: 20,
    afterFigures: 14,
    afterProgress: 22,
    afterSectionLabel: 10,
    section: 22,
    block: 14,
    tight: 8
};

/** Fixed column grid — shared across every section so values line up. */
const COL = {
    dateW: 72,
    labelW: 188,
    valueW: 92,
    metaW: 88,
    gutter: 20,
    rowH: 28,
    get dateX() { return MARGIN; },
    get descX() { return MARGIN + this.dateW; },
    get valueR() { return MARGIN + this.labelW + this.valueW; },
    get metaX() { return this.valueR + this.gutter; },
    get metaW_full() { return CONTENT_W - this.labelW - this.valueW - this.gutter; },
    get descW() { return this.valueR - this.descX - 8; },
    get nameW() { return this.valueR - MARGIN - 8; },
    get detailX() { return this.metaX; },
    get detailW() { return this.metaW_full; }
};

function setFill(doc, hex) { doc.setFillColor(hex); }
function setDraw(doc, hex) { doc.setDrawColor(hex); }
function setText(doc, hex) { doc.setTextColor(hex); }

function paintPage(doc, c) {
    setFill(doc, c.page);
    doc.rect(0, 0, PAGE.w, PAGE.h, 'F');
}

function beginPage(state, pageNumber = state.doc.getNumberOfPages()) {
    state.doc.setPage(pageNumber);
    paintPage(state.doc, state.colors);
    if (pageNumber > 1) drawContinuationHeader(state);
}

function ensureSpace(state, needed) {
    if (state.y + needed <= BOTTOM) return;
    state.doc.addPage();
    beginPage(state);
    state.y = MARGIN + 20;
}

function drawContinuationHeader(state) {
    const { doc, colors: c, summary, ledgerName, theme } = state;
    setDocFont(doc, theme, 'bold', 9);
    setText(doc, c.text);
    doc.text(summary.monthLabel, MARGIN, MARGIN + 8);
    setDocFont(doc, theme, 'normal', 8);
    setText(doc, c.muted);
    doc.text(ledgerName || 'Expense ledger', MARGIN + CONTENT_W, MARGIN + 8, { align: 'right' });
    setDraw(doc, c.border);
    doc.setLineWidth(0.4);
    doc.line(MARGIN, MARGIN + 14, MARGIN + CONTENT_W, MARGIN + 14);
}

function drawReportHeader(state) {
    const { doc, colors: c, summary, ledgerName, theme } = state;
    const y = MARGIN;

    setDocFont(doc, theme, 'bold', 11);
    setText(doc, c.text);
    doc.text('OpenExpense.org', MARGIN, y);

    const generated = new Date().toLocaleString('en-US', { dateStyle: 'medium', timeStyle: 'short' });
    setDocFont(doc, theme, 'normal', 8);
    setText(doc, c.muted);
    doc.text(generated, MARGIN + CONTENT_W, y, { align: 'right' });

    setDocFont(doc, theme, 'bold', 22);
    setText(doc, c.text);
    doc.text(summary.monthLabel, MARGIN, y + 28);

    setDocFont(doc, theme, 'normal', 9);
    setText(doc, c.muted);
    const sub = ledgerName
        ? `${ledgerName} · Expense totals only — money out, not income.`
        : 'Expense totals only — money out, not income.';
    doc.text(sub, MARGIN, y + 44, { maxWidth: CONTENT_W });

    if (summary.isCurrentMonth && summary.itemCount) {
        const badge = 'Live';
        setDocFont(doc, theme, 'bold', 7);
        const badgeW = doc.getTextWidth(badge) + 14;
        const badgeH = 14;
        const badgeX = MARGIN + CONTENT_W - badgeW;
        const badgeY = y + 18;
        drawPill(doc, badgeX, badgeY, badgeW, badgeH, { fill: c.successBg, stroke: c.success, lineWidth: 0.35 });
        setText(doc, c.success);
        doc.text(badge, badgeX + badgeW / 2, badgeY + 10, { align: 'center' });
    }

    setDraw(doc, c.border);
    doc.setLineWidth(0.5);
    doc.line(MARGIN, y + 54, MARGIN + CONTENT_W, y + 54);

    state.y = y + 54 + GAP.afterHeader;
}

function drawFigureStrip(state, summary) {
    ensureSpace(state, 58);
    const { doc, colors: c, theme } = state;
    const y = state.y;
    const stripH = 40;

    setDraw(doc, c.border);
    doc.setLineWidth(0.4);
    doc.line(MARGIN, y, MARGIN + CONTENT_W, y);
    doc.line(MARGIN, y + stripH, MARGIN + CONTENT_W, y + stripH);

    const figures = [
        { label: 'Total spent', value: formatMoney(summary.total), emphasis: true },
        { label: 'Paid', value: formatMoney(summary.paid) },
        { label: 'Pending', value: formatMoney(summary.pending) },
        { label: 'Entries', value: String(summary.itemCount || 0) }
    ];
    const colW = CONTENT_W / figures.length;

    figures.forEach((fig, i) => {
        const cx = MARGIN + colW * i + colW / 2;
        if (i > 0) {
            doc.line(MARGIN + colW * i, y + 6, MARGIN + colW * i, y + stripH - 6);
        }

        setDocFont(doc, theme, 'bold', fig.emphasis ? 18 : 13);
        setText(doc, fig.emphasis ? c.text : c.textSecondary);
        doc.text(fig.value, cx, y + 18, { align: 'center' });

        setDocFont(doc, theme, 'normal', 8);
        setText(doc, c.muted);
        doc.text(fig.label, cx, y + 32, { align: 'center' });
    });

    state.y = y + stripH + GAP.afterFigures;
}

function drawProgress(state, summary) {
    ensureSpace(state, 40);
    const { doc, colors: c, theme } = state;

    setDocFont(doc, theme, 'bold', 8);
    setText(doc, c.muted);
    doc.text('Settlement', MARGIN, state.y);

    const pct = summary.total ? `${Math.round(summary.pctPaid)}% settled` : 'No spend yet';
    setDocFont(doc, theme, 'normal', 8);
    setText(doc, c.textSecondary);
    doc.text(pct, MARGIN + CONTENT_W, state.y, { align: 'right' });

    state.y += 10;
    const barH = 5;
    const barY = state.y;

    setFill(doc, c.border);
    doc.roundedRect(MARGIN, barY, CONTENT_W, barH, c.radius.bar, c.radius.bar, 'F');

    if (summary.total > 0) {
        const paidW = CONTENT_W * (summary.pctPaid / 100);
        const pendingW = CONTENT_W - paidW;
        if (paidW > 0.5) {
            setFill(doc, c.paid);
            doc.roundedRect(MARGIN, barY, paidW, barH, c.radius.bar, c.radius.bar, 'F');
        }
        if (pendingW > 0.5) {
            setFill(doc, c.pending);
            doc.roundedRect(MARGIN + paidW, barY, pendingW, barH, c.radius.bar, c.radius.bar, 'F');
        }
    }

    state.y = barY + barH + GAP.afterProgress;
}

function buildMonthMetricRows(summary) {
    const deltaHint = summary.prevMonthTotal > 0 || summary.total > 0
        ? `${formatDelta(summary.monthDelta)} vs last month`
        : 'No prior month data';

    const rows = [
        ['Avg per active day', formatMoney(summary.avgPerDay),
            summary.activeDays ? `${summary.activeDays} days with spend` : '—'],
        ['Avg per entry', formatMoney(summary.avgPerEntry),
            summary.itemCount ? `${summary.itemCount} entries` : '—'],
        ['Month trend',
            summary.prevMonthTotal || summary.total ? formatDelta(summary.monthDelta) : '—',
            deltaHint],
        ['Recurring', formatMoney(summary.recurring),
            summary.oneTime ? `${formatMoney(summary.oneTime)} one-time` : '—']
    ];

    if (summary.isCurrentMonth && summary.itemCount) {
        rows.push(['Projected', formatMoney(summary.projectedTotal),
            `${formatMoney(summary.dailyPace)}/day · ${summary.daysElapsed}/${summary.daysInMonth} days`]);
    }

    if (summary.largest) {
        rows.push(['Largest expense', formatMoney(summary.largest.amount),
            `${summary.largest.title} · ${summary.largest.date}`]);
    }

    return rows;
}

function buildYearMetricRows(summary) {
    return [
        ['Year total', formatMoney(summary.yearTotal ?? 0), String(summary.year)],
        ['Avg month', formatMoney(summary.yearAvg ?? 0), `${summary.year} average`]
    ];
}

function tableBase(state, { horizontal = true } = {}) {
    const c = state.colors;
    const theme = state.theme;
    const hLine = horizontal ? { top: 0, right: 0, bottom: 0.35, left: 0 } : undefined;
    return {
        margin: { left: MARGIN, right: MARGIN, top: MARGIN + 20, bottom: PAGE.h - BOTTOM },
        theme: 'plain',
        showHead: 'everyPage',
        styles: {
            font: getActiveFontName(theme),
            fontSize: 9,
            cellPadding: { top: 8, right: 4, bottom: 8, left: 0 },
            fillColor: c.page,
            textColor: c.text,
            lineColor: c.border,
            lineWidth: hLine ?? 0.25,
            overflow: 'linebreak'
        },
        headStyles: {
            fillColor: c.page,
            textColor: c.muted,
            fontStyle: 'bold',
            fontSize: 8,
            cellPadding: { top: 6, right: 4, bottom: 6, left: 0 },
            lineWidth: horizontal ? { top: 0, right: 0, bottom: 0.5, left: 0 } : 0.25
        },
        bodyStyles: { fillColor: c.page, textColor: c.text },
        alternateRowStyles: { fillColor: c.page },
        willDrawPage: (data) => {
            if (data.pageNumber === 1) return;
            beginPage(state, data.pageNumber);
        }
    };
}

function drawRowRule(doc, c, y) {
    setDraw(doc, c.border);
    doc.setLineWidth(0.35);
    doc.line(MARGIN, y, MARGIN + CONTENT_W, y);
}

/** Symmetrical 3-column metric rows: label | value | detail. */
function drawMetricRows(state, rows) {
    const { doc, theme, colors: c } = state;
    if (!rows.length) return;

    drawRowRule(doc, c, state.y);
    state.y += 8;

    for (const row of rows) {
        const [label, value, detail] = row;
        ensureSpace(state, COL.rowH + 6);

        const baseline = state.y + 14;

        setDocFont(doc, theme, 'normal', 9);
        setText(doc, c.muted);
        doc.text(String(label), MARGIN, baseline, { maxWidth: COL.labelW - 4 });

        setDocFont(doc, theme, 'bold', 10);
        setText(doc, c.text);
        doc.text(String(value), COL.valueR, baseline, { align: 'right' });

        setDocFont(doc, theme, 'normal', 8);
        setText(doc, c.muted);
        doc.text(detail || '—', COL.detailX, baseline, { maxWidth: COL.detailW });

        state.y += COL.rowH;
        drawRowRule(doc, c, state.y);
        state.y += 6;
    }

    state.y += GAP.tight;
}

/** Symmetrical 2-column rows — value column aligns with summary metrics. */
function drawTwoColRows(state, rows) {
    const { doc, theme, colors: c } = state;
    if (!rows.length) return;

    drawRowRule(doc, c, state.y);
    state.y += 8;

    for (const row of rows) {
        const [label, value] = row;
        ensureSpace(state, COL.rowH + 6);

        const baseline = state.y + 14;

        setDocFont(doc, theme, 'normal', 9);
        setText(doc, c.text);
        doc.text(String(label), MARGIN, baseline, { maxWidth: COL.labelW + COL.detailW + COL.gutter - 4 });

        setDocFont(doc, theme, 'bold', 9);
        setText(doc, c.text);
        doc.text(String(value), COL.valueR, baseline, { align: 'right' });

        state.y += COL.rowH;
        drawRowRule(doc, c, state.y);
        state.y += 6;
    }

    state.y += GAP.tight;
}

function drawSubLabel(state, text) {
    const { doc, theme, colors: c } = state;
    setDocFont(doc, theme, 'bold', 7);
    setText(doc, c.muted);
    doc.text(text.toUpperCase(), MARGIN, state.y);
    state.y += GAP.afterSectionLabel;
}

/** Column header row — labels align to the shared grid. */
function drawColumnHeader(state, columns) {
    const { doc, theme, colors: c } = state;
    drawRowRule(doc, c, state.y);
    state.y += 10;

    for (const col of columns) {
        setDocFont(doc, theme, 'bold', 8);
        setText(doc, c.muted);
        const x = col.align === 'right' ? col.r ?? col.x + (col.w ?? 0) : col.x;
        doc.text(col.label, x, state.y + 10, { align: col.align || 'left', maxWidth: col.w });
    }

    state.y += 18;
    drawRowRule(doc, c, state.y);
    state.y += 6;
}

function drawMerchantRows(state, merchants) {
    const { doc, theme, colors: c } = state;
    const max = merchants[0]?.amount || 1;
    const countR = COL.valueR - 8;

    drawColumnHeader(state, [
        { label: 'Merchant', x: MARGIN, w: COL.nameW },
        { label: 'Count', x: countR, w: 56, align: 'right' },
        { label: 'Spent', x: COL.valueR, w: COL.valueW, align: 'right' },
        { label: 'Share', x: MARGIN + CONTENT_W, w: COL.metaW_full, align: 'right' }
    ]);

    for (const item of merchants) {
        ensureSpace(state, COL.rowH + 6);
        const baseline = state.y + 14;
        const pct = Math.round((item.amount / max) * 100);
        const count = `${item.count} entr${item.count === 1 ? 'y' : 'ies'}`;

        setDocFont(doc, theme, 'bold', 9);
        setText(doc, c.text);
        doc.text(String(item.title), MARGIN, baseline, { maxWidth: countR - MARGIN - 12 });

        setDocFont(doc, theme, 'normal', 8);
        setText(doc, c.muted);
        doc.text(count, countR, baseline, { align: 'right' });

        setDocFont(doc, theme, 'bold', 9);
        setText(doc, c.text);
        doc.text(formatMoney(item.amount), COL.valueR, baseline, { align: 'right' });

        setDocFont(doc, theme, 'normal', 8);
        setText(doc, c.muted);
        doc.text(`${pct}%`, MARGIN + CONTENT_W, baseline, { align: 'right' });

        state.y += COL.rowH;
        drawRowRule(doc, c, state.y);
        state.y += 6;
    }

    state.y += GAP.tight;
}

function drawExpenseRows(state, items) {
    const { doc, theme, colors: c } = state;

    drawColumnHeader(state, [
        { label: 'Date', x: COL.dateX, w: COL.dateW },
        { label: 'Description', x: COL.descX, w: COL.descW },
        { label: 'Spent', x: COL.valueR, w: COL.valueW, align: 'right' },
        { label: 'Type', x: MARGIN + CONTENT_W, w: COL.metaW_full, align: 'right' }
    ]);

    for (const item of items) {
        ensureSpace(state, COL.rowH + 6);
        const baseline = state.y + 14;
        const type = item.recurring ? 'Recurring' : 'One-time';

        setDocFont(doc, theme, 'normal', 9);
        setText(doc, c.muted);
        doc.text(String(item.date), COL.dateX, baseline, { maxWidth: COL.dateW });

        setDocFont(doc, theme, 'normal', 9);
        setText(doc, c.text);
        doc.text(String(item.title), COL.descX, baseline, { maxWidth: COL.descW });

        setDocFont(doc, theme, 'bold', 9);
        setText(doc, c.text);
        doc.text(formatMoney(item.amount), COL.valueR, baseline, { align: 'right' });

        setDocFont(doc, theme, 'normal', 8);
        setText(doc, c.muted);
        doc.text(type, MARGIN + CONTENT_W, baseline, { align: 'right' });

        state.y += COL.rowH;
        drawRowRule(doc, c, state.y);
        state.y += 6;
    }

    state.y += GAP.tight;
}

function runTable(state, head, body, opts = {}) {
    ensureSpace(state, 36);
    const tableOpts = {
        ...tableBase(state, { horizontal: opts.horizontal !== false }),
        startY: state.y,
        body,
        ...opts
    };
    if (head) tableOpts.head = [head];
    autoTable(state.doc, tableOpts);
    state.y = (state.doc.lastAutoTable?.finalY ?? state.y) + (opts.gap ?? GAP.block);
}

function drawMetricsTable(state, summary) {
    ensureSpace(state, 80);
    const { doc, theme, colors: c } = state;

    drawSectionLabel(doc, theme, c, MARGIN, state.y, CONTENT_W, 'Summary');
    state.y += 20;

    drawSubLabel(state, 'This month');
    drawMetricRows(state, buildMonthMetricRows(summary));

    state.y += 6;
    drawSubLabel(state, String(summary.year));
    drawMetricRows(state, buildYearMetricRows(summary));

    state.y += GAP.block;
}

function drawYearChart(state, summary) {
    const { doc, colors: c, theme } = state;
    const totals = summary.monthTotals || new Array(12).fill(0);
    const max = Math.max(...totals, 1);
    const barAreaH = 44;
    const barGap = 3;
    const barW = (CONTENT_W - barGap * 11) / 12;

    ensureSpace(state, barAreaH + 40);
    drawSectionLabel(doc, theme, c, MARGIN, state.y, CONTENT_W, `${summary.year} overview`);
    state.y += 20;

    const y0 = state.y + barAreaH;
    setDraw(doc, c.border);
    doc.setLineWidth(0.4);
    doc.line(MARGIN, y0 + 3, MARGIN + CONTENT_W, y0 + 3);

    totals.forEach((amt, i) => {
        const x = MARGIN + i * (barW + barGap);
        const h = Math.max(3, (amt / max) * (barAreaH - 4));
        const isCur = i === summary.month;

        setFill(doc, isCur ? c.accent : c.border);
        doc.roundedRect(x, y0 - h, barW, h, 1.5, 1.5, 'F');

        setDocFont(doc, theme, isCur ? 'bold' : 'normal', 6);
        setText(doc, isCur ? c.accent : c.muted);
        const label = new Date(summary.year, i).toLocaleString('default', { month: 'narrow' });
        doc.text(label, x + barW / 2, y0 + 12, { align: 'center' });
    });

    state.y = y0 + 24;

    drawSubLabel(state, 'Monthly breakdown');
    const monthTotals = summary.monthTotals || new Array(12).fill(0);
    drawTwoColRows(state, monthTotals.map((amt, i) => {
        const label = new Date(summary.year, i).toLocaleString('default', { month: 'long' });
        return [i === summary.month ? `${label} ◆` : label, formatMoney(amt)];
    }));

    state.y += GAP.block;
}

function drawMerchants(state, merchants) {
    ensureSpace(state, 40);
    const { doc, theme, colors: c } = state;
    drawSectionLabel(doc, theme, c, MARGIN, state.y, CONTENT_W, 'Top spend');
    state.y += 20;
    drawMerchantRows(state, merchants);
    state.y += GAP.block;
}

function drawTransactions(state, summary) {
    const items = summary.allItems || [];
    ensureSpace(state, 40);
    const { doc, theme, colors: c } = state;
    drawSectionLabel(doc, theme, c, MARGIN, state.y, CONTENT_W, 'This month');
    state.y += 20;

    if (!items.length) {
        setDocFontItalic(doc, theme, 9);
        setText(doc, c.muted);
        doc.text('No expenses logged this month.', MARGIN, state.y + 4);
        state.y += 20;
        return;
    }

    const pending = items.filter(i => !i.paid);
    const paid = items.filter(i => i.paid);

    if (pending.length) {
        setDocFont(doc, theme, 'bold', 8);
        setText(doc, c.accent);
        doc.text(`${pending.length} pending`, MARGIN, state.y);
        state.y += 12;
        drawExpenseRows(state, pending);
    }

    if (paid.length) {
        state.y += 4;
        setDocFont(doc, theme, 'bold', 8);
        setText(doc, c.muted);
        doc.text(`${paid.length} paid`, MARGIN, state.y);
        state.y += 12;
        drawExpenseRows(state, paid);
    }

    state.y += GAP.block;
}

function drawFooters(doc, theme, summary) {
    const pages = doc.getNumberOfPages();
    for (let i = 1; i <= pages; i++) {
        doc.setPage(i);

        setDraw(doc, theme.border);
        doc.setLineWidth(0.4);
        doc.line(MARGIN, FOOTER_RULE_Y, MARGIN + CONTENT_W, FOOTER_RULE_Y);

        setDocFont(doc, theme, 'normal', 7);
        setText(doc, theme.muted);
        doc.text(summary.monthLabel, MARGIN, FOOTER_Y);
        doc.text('OpenExpense.org', PAGE.w / 2, FOOTER_Y, { align: 'center' });
        doc.text(`Page ${i} of ${pages}`, MARGIN + CONTENT_W, FOOTER_Y, { align: 'right' });
    }
}

function buildFilename(summary, ledgerName) {
    const base = Utils.sanitizeFilename(ledgerName) || 'ledger';
    const month = summary.monthLabel.toLowerCase().replace(/\s+/g, '-');
    return `${base}-${month}-spending-report.pdf`;
}

export async function exportMonthlySummaryPdf({ summary, ledgerName, isDark }) {
    const theme = getPdfTheme(isDark);
    const doc = new jsPDF({ unit: 'pt', format: 'letter', compress: true });
    await loadPdfFonts(doc);

    const state = {
        doc,
        colors: theme,
        theme,
        summary,
        ledgerName: Utils.sanitizeFilename(ledgerName),
        y: 0
    };

    beginPage(state, 1);
    drawReportHeader(state);
    drawFigureStrip(state, summary);
    drawProgress(state, summary);
    drawMetricsTable(state, summary);
    drawYearChart(state, summary);

    const merchants = summary.topMerchants || [];
    if (merchants.length) drawMerchants(state, merchants);

    drawTransactions(state, summary);
    drawFooters(doc, theme, summary);

    return { blob: doc.output('blob'), filename: buildFilename(summary, ledgerName) };
}
