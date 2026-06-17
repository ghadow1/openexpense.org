import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import { formatDelta, formatMoney } from './summary.js';
import { Utils } from './utils.js';

const PAGE = { w: 612, h: 792 };
const MARGIN = 56;
const FOOTER_Y = PAGE.h - 36;
const CONTENT_W = PAGE.w - MARGIN * 2;
const BOTTOM = FOOTER_Y - 24;
const BAND_H = 68;

/** Vertical rhythm between major blocks */
const SPACE = {
    afterBand: 28,
    titleBlock: 32,
    afterHero: 20,
    afterKpi: 22,
    beforeStatus: 6,
    afterStatus: 28,
    section: 24,
    afterSection: 8
};

/** @param {[number, number, number]} rgb */
function rgbHex([r, g, b]) {
    return `#${[r, g, b].map(v => v.toString(16).padStart(2, '0')).join('')}`;
}

const PALETTE = {
    light: {
        page: [255, 255, 255],
        band: [79, 70, 229],
        bandText: [255, 255, 255],
        bandSub: [224, 231, 255],
        bandMeta: [199, 210, 254],
        card: [248, 250, 252],
        cardAlt: [241, 245, 249],
        border: [226, 232, 240],
        text: [15, 23, 42],
        muted: [100, 116, 139],
        accent: [79, 70, 229],
        paid: [22, 163, 74],
        owed: [234, 88, 12],
        danger: [220, 38, 38],
        success: [22, 163, 74]
    },
    dark: {
        page: [18, 18, 20],
        band: [59, 130, 246],
        bandText: [255, 255, 255],
        bandSub: [219, 234, 254],
        bandMeta: [191, 219, 254],
        card: [39, 39, 42],
        cardAlt: [32, 32, 36],
        border: [63, 63, 70],
        text: [250, 250, 250],
        muted: [161, 161, 170],
        accent: [96, 165, 250],
        paid: [34, 197, 94],
        owed: [251, 146, 60],
        danger: [248, 113, 113],
        success: [34, 197, 94]
    }
};

function themeColors(isDark) {
    const raw = isDark ? PALETTE.dark : PALETTE.light;
    const map = {};
    for (const [k, v] of Object.entries(raw)) map[k] = rgbHex(v);
    return map;
}

function paintPage(doc, c) {
    doc.setFillColor(c.page);
    doc.rect(0, 0, PAGE.w, PAGE.h, 'F');
}

function setFill(doc, hex) { doc.setFillColor(hex); }
function setDraw(doc, hex) { doc.setDrawColor(hex); }
function setText(doc, hex) { doc.setTextColor(hex); }

function ensureSpace(state, needed) {
    if (state.y + needed <= BOTTOM) return;
    state.doc.addPage();
    paintPage(state.doc, state.colors);
    state.paintedPages.add(state.doc.getNumberOfPages());
    drawPageHeader(state);
    state.y = MARGIN + 28;
}

function drawPageHeader(state) {
    const { doc, colors: c, summary, ledgerName } = state;
    if (doc.getNumberOfPages() === 1) return;

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    setText(doc, c.muted);
    const left = summary.monthLabel;
    const right = ledgerName || 'Expense ledger';
    doc.text(left, MARGIN, MARGIN + 14);
    doc.text(right, MARGIN + CONTENT_W, MARGIN + 14, { align: 'right' });

    setDraw(doc, c.border);
    doc.setLineWidth(0.5);
    doc.line(MARGIN, MARGIN + 20, MARGIN + CONTENT_W, MARGIN + 20);
}

function drawHeaderBand(state) {
    const { doc, colors: c } = state;
    const padX = MARGIN;

    setFill(doc, c.band);
    doc.rect(0, 0, PAGE.w, BAND_H, 'F');

    // Subtle bottom edge for depth
    setFill(doc, c.accent);
    doc.rect(0, BAND_H - 2, PAGE.w, 2, 'F');

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(13);
    setText(doc, c.bandText);
    doc.text('OpenExpense', padX, 28);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9);
    setText(doc, c.bandSub);
    doc.text('Monthly Spending Report', padX, 44);

    const generated = new Date().toLocaleString('en-US', { dateStyle: 'medium', timeStyle: 'short' });
    doc.setFontSize(8);
    setText(doc, c.bandMeta);
    doc.text(generated, PAGE.w - padX, 36, { align: 'right' });

    state.y = BAND_H + SPACE.afterBand;
}

function drawReportMeta(state) {
    const { doc, colors: c, summary, ledgerName } = state;
    const top = state.y;

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(22);
    setText(doc, c.text);
    doc.text(summary.monthLabel, MARGIN, top);

    if (ledgerName) {
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(10);
        setText(doc, c.muted);
        doc.text(ledgerName, MARGIN + CONTENT_W, top - 1, { align: 'right' });
    }

    doc.setFont('helvetica', 'italic');
    doc.setFontSize(9);
    setText(doc, c.muted);
    doc.text('Expense totals only — money out, not income.', MARGIN, top + 18);

    state.y = top + SPACE.titleBlock;
}

function drawSpendingHero(state, summary) {
    const pad = 22;
    const h = 96;
    ensureSpace(state, h + SPACE.afterHero);
    const { doc, colors: c } = state;
    const x = MARGIN;
    const y = state.y;
    const w = CONTENT_W;

    setFill(doc, c.card);
    setDraw(doc, c.border);
    doc.setLineWidth(0.6);
    doc.roundedRect(x, y, w, h, 10, 10, 'FD');

    const stripeInset = 14;
    setFill(doc, c.accent);
    doc.roundedRect(x + 10, y + stripeInset, 4, h - stripeInset * 2, 2, 2, 'F');

    const tx = x + pad;

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    setText(doc, c.muted);
    doc.text('TOTAL SPENT THIS MONTH', tx, y + 24);

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(32);
    setText(doc, c.text);
    doc.text(formatMoney(summary.total), tx, y + 54);

    const meta = summary.itemCount
        ? `${summary.itemCount} expense${summary.itemCount === 1 ? '' : 's'} across ${summary.activeDays} day${summary.activeDays === 1 ? '' : 's'}`
        : 'No expenses recorded this month';
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9);
    setText(doc, c.muted);
    doc.text(meta, tx, y + 74);

    if (summary.isCurrentMonth && summary.itemCount) {
        const badgeW = 62;
        const badgeH = 18;
        const badgeX = x + w - badgeW - 16;
        const badgeY = y + 16;
        setFill(doc, c.accent);
        doc.roundedRect(badgeX, badgeY, badgeW, badgeH, 9, 9, 'F');
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(7);
        setText(doc, c.bandText);
        doc.text('IN PROGRESS', badgeX + badgeW / 2, badgeY + 12, { align: 'center' });
    }

    state.y = y + h + SPACE.afterHero;
}

function drawKpiRow(state, summary) {
    const gap = 14;
    const h = 58;
    ensureSpace(state, h + SPACE.afterKpi);
    const { doc, colors: c } = state;
    const w = (CONTENT_W - gap * 2) / 3;
    const items = [
        { label: 'Paid out', value: formatMoney(summary.paid), color: c.paid },
        { label: 'Still owed', value: formatMoney(summary.pending), color: c.owed },
        { label: 'Avg expense', value: formatMoney(summary.avgPerEntry), color: c.accent }
    ];

    items.forEach((item, i) => {
        const x = MARGIN + i * (w + gap);
        const y = state.y;

        setFill(doc, c.card);
        setDraw(doc, c.border);
        doc.setLineWidth(0.5);
        doc.roundedRect(x, y, w, h, 8, 8, 'FD');

        setFill(doc, item.color);
        doc.circle(x + 16, y + 18, 3.5, 'F');

        doc.setFont('helvetica', 'normal');
        doc.setFontSize(7);
        setText(doc, c.muted);
        doc.text(item.label.toUpperCase(), x + 26, y + 20);

        doc.setFont('helvetica', 'bold');
        doc.setFontSize(15);
        setText(doc, c.text);
        doc.text(item.value, x + 16, y + 42);
    });

    state.y += h + SPACE.afterKpi;
}

function drawSettlementBar(state, summary) {
    ensureSpace(state, 52);
    const { doc, colors: c } = state;
    state.y += SPACE.beforeStatus;

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8);
    setText(doc, c.muted);
    doc.text('PAYMENT STATUS', MARGIN, state.y);
    const pct = summary.total ? `${Math.round(summary.pctPaid)}% paid out` : 'No spending yet';
    doc.text(pct, MARGIN + CONTENT_W, state.y, { align: 'right' });
    state.y += 12;

    const barH = 8;
    const barY = state.y;
    setDraw(doc, c.border);
    doc.setLineWidth(0.5);
    setFill(doc, c.border);
    doc.roundedRect(MARGIN, barY, CONTENT_W, barH, 4, 4, 'FD');

    const paidW = CONTENT_W * (summary.pctPaid / 100);
    const owedW = CONTENT_W - paidW;
    if (paidW > 0.5) {
        setFill(doc, c.paid);
        doc.rect(MARGIN + 1, barY + 1, Math.max(0, paidW - 1), barH - 2, 'F');
    }
    if (owedW > 0.5) {
        setFill(doc, c.owed);
        doc.rect(MARGIN + paidW, barY + 1, owedW - 1, barH - 2, 'F');
    }

    state.y = barY + barH + SPACE.afterStatus;
}

function drawSoftDivider(state) {
    const { doc, colors: c } = state;
    state.y += 4;
    setDraw(doc, c.border);
    doc.setLineWidth(0.5);
    doc.line(MARGIN, state.y, MARGIN + CONTENT_W, state.y);
    state.y += SPACE.section;
}

function sectionHeading(state, title, subtitle) {
    ensureSpace(state, 40);
    const { doc, colors: c } = state;

    setFill(doc, c.accent);
    doc.roundedRect(MARGIN, state.y, 3, 18, 1, 1, 'F');

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(12);
    setText(doc, c.text);
    doc.text(title, MARGIN + 12, state.y + 12);

    if (subtitle) {
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(8);
        setText(doc, c.muted);
        doc.text(subtitle, MARGIN + 12, state.y + 24);
        state.y += 34;
    } else {
        state.y += 22;
    }
}

function drawInsightGrid(state, stats) {
    const cols = 2;
    const gap = 10;
    const boxW = (CONTENT_W - gap) / cols;
    const boxH = 44;
    const rows = Math.ceil(stats.length / cols);
    ensureSpace(state, rows * (boxH + gap) + 4);

    const { doc, colors: c } = state;
    stats.forEach((stat, i) => {
        const col = i % cols;
        const row = Math.floor(i / cols);
        const x = MARGIN + col * (boxW + gap);
        const y = state.y + row * (boxH + gap);

        setFill(doc, c.card);
        setDraw(doc, c.border);
        doc.setLineWidth(0.4);
        doc.roundedRect(x, y, boxW, boxH, 5, 5, 'FD');

        doc.setFont('helvetica', 'normal');
        doc.setFontSize(7);
        setText(doc, c.muted);
        doc.text(stat.label.toUpperCase(), x + 10, y + 12);

        doc.setFont('helvetica', 'bold');
        doc.setFontSize(11);
        const tone = stat.tone === 'up' ? c.danger : stat.tone === 'down' ? c.success : c.text;
        setText(doc, tone);
        doc.text(stat.value, x + 10, y + 26);

        if (stat.hint) {
            doc.setFont('helvetica', 'normal');
            doc.setFontSize(7);
            setText(doc, c.muted);
            doc.text(stat.hint, x + 10, y + 36, { maxWidth: boxW - 14 });
        }
    });

    state.y += rows * (boxH + gap) + 8;
}

function tableBase(state) {
    const c = state.colors;
    return {
        margin: { left: MARGIN, right: MARGIN, top: MARGIN },
        theme: 'plain',
        styles: {
            font: 'helvetica',
            fontSize: 9,
            cellPadding: { top: 7, right: 10, bottom: 7, left: 10 },
            fillColor: c.card,
            textColor: c.text,
            lineColor: c.border,
            lineWidth: 0.35
        },
        headStyles: {
            fillColor: c.band,
            textColor: c.bandText,
            fontStyle: 'bold',
            fontSize: 8
        },
        bodyStyles: { textColor: c.text, fillColor: c.card },
        alternateRowStyles: { fillColor: c.cardAlt, textColor: c.text },
        willDrawPage: (data) => {
            if (!state.paintedPages.has(data.pageNumber)) {
                paintPage(state.doc, c);
                state.paintedPages.add(data.pageNumber);
                drawPageHeader(state);
            }
        }
    };
}

function runTable(state, head, body, opts = {}) {
    ensureSpace(state, 40);
    autoTable(state.doc, {
        ...tableBase(state),
        startY: state.y,
        head: [head],
        body,
        ...opts
    });
    state.y = (state.doc.lastAutoTable?.finalY ?? state.y) + (opts.gap ?? 14);
}

function buildInsights(summary) {
    const stats = [
        {
            label: 'Avg spend / active day',
            value: formatMoney(summary.avgPerDay),
            hint: summary.activeDays ? `${summary.activeDays} days with expenses` : 'No spending days'
        },
        {
            label: 'Recurring expenses',
            value: formatMoney(summary.recurring),
            hint: summary.oneTime ? `${formatMoney(summary.oneTime)} non-recurring` : 'No one-time charges'
        },
        {
            label: 'Spending vs last month',
            value: summary.prevMonthTotal || summary.total ? formatDelta(summary.monthDelta) : '—',
            hint: summary.prevMonthTotal || summary.total ? 'Change in total spent' : 'No prior month to compare',
            tone: summary.monthDelta > 0 ? 'up' : summary.monthDelta < 0 ? 'down' : ''
        }
    ];

    if (summary.isCurrentMonth && summary.itemCount) {
        stats.push({
            label: 'Projected month spend',
            value: formatMoney(summary.projectedTotal),
            hint: `${formatMoney(summary.dailyPace)}/day · day ${summary.daysElapsed} of ${summary.daysInMonth}`
        });
    }

    if (summary.largest) {
        stats.push({
            label: 'Largest single expense',
            value: formatMoney(summary.largest.amount),
            hint: `${summary.largest.title} · ${summary.largest.date}`
        });
    }

    return stats;
}

function drawYearBars(state, summary) {
    ensureSpace(state, 90);
    const { doc, colors: c } = state;
    const totals = summary.monthTotals || new Array(12).fill(0);
    const max = Math.max(...totals, 1);
    const barAreaH = 56;
    const gap = 4;
    const barW = (CONTENT_W - gap * 11) / 12;
    const y0 = state.y + barAreaH;

    totals.forEach((amt, i) => {
        const x = MARGIN + i * (barW + gap);
        const h = Math.max(4, (amt / max) * (barAreaH - 8));
        const isCur = i === summary.month;

        setFill(doc, isCur ? c.accent : c.border);
        doc.roundedRect(x, y0 - h, barW, h, 2, 2, 'F');

        doc.setFont('helvetica', isCur ? 'bold' : 'normal');
        doc.setFontSize(6);
        setText(doc, isCur ? c.accent : c.muted);
        const label = new Date(summary.year, i).toLocaleString('default', { month: 'narrow' });
        doc.text(label, x + barW / 2, y0 + 10, { align: 'center' });
    });

    state.y = y0 + 22;
}

function drawFooters(doc, colors, summary) {
    const pages = doc.getNumberOfPages();
    for (let i = 1; i <= pages; i++) {
        doc.setPage(i);
        setDraw(doc, colors.border);
        doc.setLineWidth(0.5);
        doc.line(MARGIN, FOOTER_Y - 8, MARGIN + CONTENT_W, FOOTER_Y - 8);

        doc.setFont('helvetica', 'normal');
        doc.setFontSize(7);
        setText(doc, colors.muted);
        doc.text(
            `${summary.monthLabel} spending report · OpenExpense · Page ${i} of ${pages}`,
            PAGE.w / 2,
            FOOTER_Y,
            { align: 'center' }
        );
    }
}

function buildFilename(summary, ledgerName) {
    const base = Utils.sanitizeFilename(ledgerName) || 'ledger';
    const month = summary.monthLabel.toLowerCase().replace(/\s+/g, '-');
    return `${base}-${month}-spending-report.pdf`;
}

export async function exportMonthlySummaryPdf({ summary, ledgerName, isDark }) {
    const colors = themeColors(isDark);
    const doc = new jsPDF({ unit: 'pt', format: 'letter', compress: true });
    const state = {
        doc,
        colors,
        summary,
        ledgerName: Utils.sanitizeFilename(ledgerName),
        y: 0,
        paintedPages: new Set([1])
    };

    paintPage(doc, colors);
    drawHeaderBand(state);
    drawReportMeta(state);
    drawSpendingHero(state, summary);
    drawKpiRow(state, summary);
    drawSettlementBar(state, summary);
    drawSoftDivider(state);

    sectionHeading(state, 'Spending insights', 'Patterns and projections from your logged expenses');
    drawInsightGrid(state, buildInsights(summary));

    const merchants = summary.topMerchants || [];
    if (merchants.length) {
        sectionHeading(state, 'Top merchants', 'Where most of your spending went this month');
        runTable(state,
            ['Merchant', 'Charges', 'Spent'],
            merchants.map(item => [item.title, String(item.count), formatMoney(item.amount)]),
            { columnStyles: { 2: { halign: 'right' } } }
        );
    }

    sectionHeading(state, `${summary.year} spending`, 'Monthly expense totals for the calendar year');
    runTable(state,
        ['Period', 'Amount spent'],
        [
            ['Year to date', formatMoney(summary.yearTotal ?? 0)],
            ['Average month', formatMoney(summary.yearAvg ?? 0)]
        ],
        { columnStyles: { 1: { halign: 'right' } }, gap: 10 }
    );
    drawYearBars(state, summary);

    const monthTotals = summary.monthTotals || new Array(12).fill(0);
    runTable(state,
        ['Month', 'Spent'],
        monthTotals.map((amt, i) => {
            const label = new Date(summary.year, i).toLocaleString('default', { month: 'long' });
            return [i === summary.month ? `${label} (this report)` : label, formatMoney(amt)];
        }),
        { columnStyles: { 1: { halign: 'right' } } }
    );

    sectionHeading(state, 'Expense line items', 'Every charge logged this month');
    const items = summary.allItems || [];
    if (!items.length) {
        ensureSpace(state, 24);
        doc.setFont('helvetica', 'italic');
        doc.setFontSize(10);
        setText(doc, colors.muted);
        doc.text('No expenses were recorded for this month.', MARGIN, state.y);
    } else {
        runTable(state,
            ['Date', 'Description', 'Spent', 'Status', 'Type'],
            items.map(item => [
                item.date,
                item.title,
                formatMoney(item.amount),
                item.paid ? 'Paid' : 'Unpaid',
                item.recurring ? 'Recurring' : 'One-time'
            ]),
            {
                columnStyles: {
                    0: { cellWidth: 68 },
                    2: { halign: 'right', cellWidth: 58 },
                    3: { cellWidth: 48 },
                    4: { cellWidth: 54 }
                },
                gap: 0
            }
        );
    }

    drawFooters(doc, colors, summary);
    return { blob: doc.output('blob'), filename: buildFilename(summary, ledgerName) };
}
