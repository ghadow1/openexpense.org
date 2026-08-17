/**
 * OpenExpense — monthly brochure PDF
 *
 * Letter-size report for the month on screen. Page 1 is a branded cover
 * with the same KPIs the sidebar shows. Page 2 is a two-column breakdown
 * (calendar + merchants + year tiles). Later pages hold the register and
 * a closing brand panel so leftover paper is used on purpose.
 */
import { jsPDF } from 'jspdf';
import { DAYS } from '../config.js';
import { formatDelta, formatMoney } from './summary.js';
import { repeatLabel } from './series.js';
import { Utils } from './utils.js';
import {
    drawBrandMark,
    drawCard,
    drawKicker,
    drawPill,
    getPdfTheme,
    loadPdfFonts,
    mixHex,
    safePdfText,
    setDocFont,
    setDocFontItalic,
    setDraw,
    setFill,
    setText
} from './pdf-theme.js';

const PAGE = { w: 612, h: 792 };
const MARGIN = 40;
const CONTENT_W = PAGE.w - MARGIN * 2;
const GUTTER = 16;
const COL_W = (CONTENT_W - GUTTER) / 2;
const COVER_H = 92;
const BAND_H = 46;
const FOOTER_Y = PAGE.h - 22;
const FOOTER_RULE_Y = PAGE.h - 38;
const BOTTOM = FOOTER_RULE_Y - 12;

const MONTHS_LONG = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
];
const MONTHS_SHORT = [
    'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
    'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'
];
const MONTHS_NARROW = ['J', 'F', 'M', 'A', 'M', 'J', 'J', 'A', 'S', 'O', 'N', 'D'];

const REPORT_COPY = {
    expense: {
        kicker: 'Spending report',
        docType: 'Monthly spending report',
        subtitle: 'Money out this month. Income is not included.',
        total: 'Total spent',
        paid: 'Paid',
        pending: 'Pending',
        entries: 'Entries',
        settled: 'settled',
        settlement: 'Settlement',
        insights: 'This month',
        merchants: 'Top merchants',
        register: 'Expense register',
        empty: 'No expenses logged this month.',
        daysHint: 'days with spend',
        oneTime: 'one-time',
        noOneTime: 'No one-time spend',
        largest: 'Largest expense',
        daily: 'Daily activity',
        weekday: 'By weekday',
        composition: 'Recurring mix',
        year: 'Year at a glance',
        months: 'Every month',
        breakdown: 'Breakdown',
        filename: 'spending-report'
    },
    income: {
        kicker: 'Income report',
        docType: 'Monthly income report',
        subtitle: 'Money in this month. Expenses are not included.',
        total: 'Total received',
        paid: 'Received',
        pending: 'Expected',
        entries: 'Entries',
        settled: 'received',
        settlement: 'Received vs expected',
        insights: 'This month',
        merchants: 'Top sources',
        register: 'Income register',
        empty: 'No income logged this month.',
        daysHint: 'days with income',
        oneTime: 'one-time',
        noOneTime: 'No one-time income',
        largest: 'Largest credit',
        daily: 'Daily activity',
        weekday: 'By weekday',
        composition: 'Recurring mix',
        year: 'Year at a glance',
        months: 'Every month',
        breakdown: 'Breakdown',
        filename: 'income-report'
    }
};

function copyFor(summary) {
    return REPORT_COPY[summary.kind === 'income' ? 'income' : 'expense'];
}

function txt(value) {
    return safePdfText(value);
}

function formatGenerated(date) {
    const h = date.getHours();
    const m = String(date.getMinutes()).padStart(2, '0');
    const h12 = h % 12 || 12;
    const ampm = h >= 12 ? 'PM' : 'AM';
    return `${MONTHS_SHORT[date.getMonth()]} ${date.getDate()}, ${date.getFullYear()} at ${h12}:${m} ${ampm}`;
}

function itemType(item) {
    if (!item.recurring) return 'One-time';
    return `Recurring · ${repeatLabel(item.repeat, true)}`;
}

function beginPage(state, pageNumber = state.doc.getNumberOfPages()) {
    state.doc.setPage(pageNumber);
    setFill(state.doc, state.colors.page);
    state.doc.rect(0, 0, PAGE.w, PAGE.h, 'F');
    if (pageNumber > 1) drawBandHeader(state);
}

function newPage(state, needed = 0) {
    if (needed && state.y + needed <= BOTTOM) return false;
    state.doc.addPage();
    beginPage(state);
    state.y = BAND_H + 22;
    return true;
}

function drawBandHeader(state) {
    const { doc, colors: c, summary, theme, copy } = state;
    setFill(doc, c.brandNavy);
    doc.rect(0, 0, PAGE.w, BAND_H, 'F');
    setFill(doc, c.brandIndigo);
    doc.rect(0, BAND_H - 3, PAGE.w, 3, 'F');

    drawBrandMark(doc, MARGIN, 10, 26, c);
    setDocFont(doc, theme, 'bold', 11);
    setText(doc, c.brandInk);
    doc.text('OpenExpense.org', MARGIN + 34, 26);

    setDocFont(doc, theme, 'normal', 8);
    setText(doc, c.brandMuted);
    doc.text(txt(summary.monthLabel), PAGE.w - MARGIN, 20, { align: 'right' });
    doc.text(txt(state.bandLabel || copy.breakdown), PAGE.w - MARGIN, 33, { align: 'right' });
}

function drawCoverHeader(state) {
    const { doc, colors: c, theme, summary } = state;
    setFill(doc, c.brandNavy);
    doc.rect(0, 0, PAGE.w, COVER_H, 'F');
    setFill(doc, c.brandIndigo);
    doc.rect(0, COVER_H - 4, PAGE.w, 4, 'F');

    drawBrandMark(doc, MARGIN, 24, 44, c);

    setDocFont(doc, theme, 'bold', 16);
    setText(doc, c.brandInk);
    doc.text('OpenExpense.org', MARGIN + 56, 44);

    setDocFont(doc, theme, 'normal', 8);
    setText(doc, c.brandMuted);
    doc.text('www.openexpense.org', MARGIN + 56, 60);
    doc.text('Offline expense ledger', MARGIN + 56, 72);

    const generated = formatGenerated(new Date());
    setDocFont(doc, theme, 'bold', 8);
    setText(doc, c.brandMuted);
    doc.text('MONTHLY REPORT', PAGE.w - MARGIN, 40, { align: 'right' });
    setDocFont(doc, theme, 'normal', 8);
    setText(doc, c.brandInk);
    doc.text(generated, PAGE.w - MARGIN, 56, { align: 'right' });

    if (summary.isCurrentMonth && summary.itemCount) {
        const badge = 'Live';
        setDocFont(doc, theme, 'bold', 7);
        const badgeW = doc.getTextWidth(badge) + 14;
        drawPill(doc, PAGE.w - MARGIN - badgeW, 64, badgeW, 14, {
            fill: mixHex(c.brandNavy, c.success, 0.28),
            stroke: c.success,
            lineWidth: 0.4
        });
        setText(doc, '#bbf7d0');
        doc.text(badge, PAGE.w - MARGIN - badgeW / 2, 74, { align: 'center' });
    }
}

function drawCoverTitle(state) {
    const { doc, colors: c, theme, summary, ledgerName, copy } = state;
    let y = COVER_H + 28;

    drawKicker(doc, theme, c, MARGIN, y, copy.kicker);
    y += 28;

    setDocFont(doc, theme, 'bold', 32);
    setText(doc, c.text);
    doc.text(txt(summary.monthLabel), MARGIN, y);
    y += 18;

    setDocFont(doc, theme, 'normal', 10);
    setText(doc, c.muted);
    const ledger = ledgerName || 'Untitled ledger';
    const subLines = doc.splitTextToSize(`${txt(ledger)}  ·  ${txt(copy.subtitle)}`, CONTENT_W);
    doc.text(subLines, MARGIN, y);

    state.y = y + subLines.length * 12 + 16;
}

function drawKpiRow(state) {
    const { doc, colors: c, theme, summary, copy } = state;
    const figures = [
        { label: copy.total, value: formatMoney(summary.total), accent: c.accent },
        { label: copy.paid, value: formatMoney(summary.paid), accent: c.paid },
        { label: copy.pending, value: formatMoney(summary.pending), accent: c.pending },
        { label: copy.entries, value: String(summary.itemCount || 0), accent: c.borderStrong }
    ];
    const gap = 10;
    const cardW = (CONTENT_W - gap * 3) / 4;
    const cardH = 72;
    const y = state.y;

    figures.forEach((fig, i) => {
        const x = MARGIN + i * (cardW + gap);
        drawCard(doc, x, y, cardW, cardH, c, { stroke: true, accent: fig.accent });
        setDocFont(doc, theme, 'bold', 16);
        setText(doc, c.text);
        doc.text(fig.value, x + 12, y + 36, { maxWidth: cardW - 20 });
        setDocFont(doc, theme, 'normal', 8);
        setText(doc, c.muted);
        doc.text(txt(fig.label), x + 12, y + 54, { maxWidth: cardW - 20 });
    });

    state.y = y + cardH + 14;
}

function drawSettlement(state) {
    const { doc, colors: c, theme, summary, copy } = state;
    const y = state.y;
    const h = 70;
    drawCard(doc, MARGIN, y, CONTENT_W, h, c, { stroke: true });

    setDocFont(doc, theme, 'bold', 9);
    setText(doc, c.text);
    doc.text(txt(copy.settlement), MARGIN + 16, y + 20);

    const pct = summary.total ? `${Math.round(summary.pctPaid)}% ${copy.settled}` : 'No activity yet';
    setDocFont(doc, theme, 'normal', 9);
    setText(doc, c.muted);
    doc.text(txt(pct), MARGIN + CONTENT_W - 16, y + 20, { align: 'right' });

    const barX = MARGIN + 16;
    const barW = CONTENT_W - 32;
    const barY = y + 32;
    const barH = 8;
    setFill(doc, c.cardAlt);
    doc.roundedRect(barX, barY, barW, barH, 3, 3, 'F');

    if (summary.total > 0) {
        const paidW = barW * (summary.pctPaid / 100);
        const pendingW = barW - paidW;
        if (paidW > 0.6) {
            setFill(doc, c.paid);
            doc.roundedRect(barX, barY, paidW, barH, 3, 3, 'F');
        }
        if (pendingW > 0.6) {
            setFill(doc, c.pending);
            doc.roundedRect(barX + paidW, barY, pendingW, barH, 3, 3, 'F');
        }
    }

    setDocFont(doc, theme, 'normal', 8);
    setText(doc, c.textSecondary);
    doc.text(`${txt(copy.paid)}  ${formatMoney(summary.paid)}`, barX, y + 56);
    doc.text(`${txt(copy.pending)}  ${formatMoney(summary.pending)}`, barX + barW, y + 56, { align: 'right' });

    state.y = y + h + 16;
}

function insightCards(summary, copy) {
    const deltaHint = summary.prevMonthTotal > 0 || summary.total > 0
        ? `${formatDelta(summary.monthDelta)} vs last month`
        : 'No prior month data';

    const cards = [
        {
            label: 'Avg per active day',
            value: formatMoney(summary.avgPerDay),
            hint: summary.activeDays ? `${summary.activeDays} ${copy.daysHint}` : '—'
        },
        {
            label: 'Avg per entry',
            value: formatMoney(summary.avgPerEntry),
            hint: summary.itemCount ? `${summary.itemCount} entries` : '—'
        },
        {
            label: 'Month trend',
            value: summary.prevMonthTotal || summary.total ? formatDelta(summary.monthDelta) : '—',
            hint: deltaHint
        },
        {
            label: 'Recurring',
            value: formatMoney(summary.recurring),
            hint: summary.oneTime ? `${formatMoney(summary.oneTime)} ${copy.oneTime}` : copy.noOneTime
        }
    ];

    if (summary.isCurrentMonth && summary.itemCount) {
        cards.push({
            label: 'Projected',
            value: formatMoney(summary.projectedTotal),
            hint: `${formatMoney(summary.dailyPace)}/day  ·  ${summary.daysElapsed}/${summary.daysInMonth} days`
        });
    }

    if (summary.largest) {
        cards.push({
            label: copy.largest,
            value: formatMoney(summary.largest.amount),
            hint: `${summary.largest.title}  ·  ${summary.largest.date}`
        });
    }

    return cards;
}

function drawSectionHead(state, title, x = MARGIN, w = CONTENT_W) {
    const { doc, theme, colors: c } = state;
    setDocFont(doc, theme, 'bold', 11);
    setText(doc, c.text);
    doc.text(txt(title), x, state.y);
    setDraw(doc, c.border);
    doc.setLineWidth(0.45);
    doc.line(x, state.y + 6, x + w, state.y + 6);
    state.y += 16;
}

function drawInsightGrid(state) {
    const { doc, colors: c, theme, summary, copy } = state;
    const cards = insightCards(summary, copy);
    drawSectionHead(state, copy.insights);

    const gap = 10;
    const cardH = 58;
    const cols = 2;
    const cardW = (CONTENT_W - gap) / cols;
    const startY = state.y;

    cards.forEach((card, i) => {
        const col = i % cols;
        const row = Math.floor(i / cols);
        const x = MARGIN + col * (cardW + gap);
        const y = startY + row * (cardH + gap);
        drawCard(doc, x, y, cardW, cardH, c, { stroke: true });
        setDocFont(doc, theme, 'normal', 8);
        setText(doc, c.muted);
        doc.text(txt(card.label), x + 12, y + 18, { maxWidth: cardW - 24 });
        setDocFont(doc, theme, 'bold', 14);
        setText(doc, c.text);
        doc.text(txt(card.value), x + 12, y + 38, { maxWidth: cardW - 24 });
        setDocFont(doc, theme, 'normal', 8);
        setText(doc, c.muted);
        doc.text(txt(card.hint), x + 12, y + 48, { maxWidth: cardW - 24 });
    });

    const rows = Math.ceil(cards.length / cols);
    state.y = startY + rows * (cardH + gap) + 6;
}

function drawYearBand(state) {
    const { doc, colors: c, theme, summary, copy } = state;
    const h = 120;
    if (state.y + h + 18 > BOTTOM) {
        // Keep the year chart on the cover by tightening, not by spilling a thin page.
        return;
    }

    drawSectionHead(state, `${summary.year}  ·  ${copy.year}`);
    const y = state.y;
    drawCard(doc, MARGIN, y, CONTENT_W, h, c, { stroke: true });

    const leftW = 150;
    setDocFont(doc, theme, 'normal', 8);
    setText(doc, c.muted);
    doc.text('Year total', MARGIN + 16, y + 28);
    setDocFont(doc, theme, 'bold', 18);
    setText(doc, c.text);
    doc.text(formatMoney(summary.yearTotal ?? 0), MARGIN + 16, y + 50);

    setDocFont(doc, theme, 'normal', 8);
    setText(doc, c.muted);
    doc.text('Avg active month', MARGIN + 16, y + 78);
    setDocFont(doc, theme, 'bold', 14);
    setText(doc, c.text);
    doc.text(formatMoney(summary.yearAvg ?? 0), MARGIN + 16, y + 98);

    const totals = summary.monthTotals || new Array(12).fill(0);
    const max = Math.max(...totals, 1);
    const chartX = MARGIN + leftW;
    const chartW = CONTENT_W - leftW - 20;
    const chartY = y + 22;
    const chartH = 78;
    const barGap = 4;
    const barW = (chartW - barGap * 11) / 12;

    totals.forEach((amt, i) => {
        const x = chartX + i * (barW + barGap);
        const hBar = Math.max(amt > 0 ? 6 : 3, (amt / max) * (chartH - 8));
        const isCur = i === summary.month;
        setFill(doc, isCur ? c.accent : (amt > 0 ? mixHex(c.card, c.accent, 0.35) : c.cardAlt));
        doc.roundedRect(x, chartY + chartH - hBar, barW, hBar, 1.6, 1.6, 'F');
        setDocFont(doc, theme, isCur ? 'bold' : 'normal', 7);
        setText(doc, isCur ? c.accent : c.muted);
        doc.text(MONTHS_NARROW[i], x + barW / 2, chartY + chartH + 14, { align: 'center' });
    });

    state.y = y + h + 8;
}

function drawCoverPage(state) {
    drawCoverHeader(state);
    drawCoverTitle(state);
    drawKpiRow(state);
    drawSettlement(state);
    drawInsightGrid(state);
    drawYearBand(state);
}

function firstOfMonthWeekday(year, month) {
    return new Date(Date.UTC(year, month, 1)).getUTCDay();
}

function drawCalendarHeatmap(state, x, y, w) {
    const { doc, colors: c, theme, summary } = state;
    const days = summary.dailyTotals || [];
    const max = Math.max(...days.map(d => d.amount), 1);
    const cellGap = 3;
    const labelH = 14;
    const cell = (w - cellGap * 6) / 7;
    const startWd = firstOfMonthWeekday(summary.year, summary.month);
    const weeks = Math.ceil((startWd + days.length) / 7);
    const height = labelH + weeks * (cell + cellGap);

    DAYS.forEach((name, i) => {
        setDocFont(doc, theme, 'bold', 6);
        setText(doc, c.muted);
        doc.text(name[0], x + i * (cell + cellGap) + cell / 2, y + 8, { align: 'center' });
    });

    days.forEach((row) => {
        const idx = startWd + row.day - 1;
        const col = idx % 7;
        const week = Math.floor(idx / 7);
        const cx = x + col * (cell + cellGap);
        const cy = y + labelH + week * (cell + cellGap);
        const fill = row.amount > 0
            ? mixHex(c.card, c.accent, 0.18 + 0.62 * (row.amount / max))
            : c.cardAlt;
        setFill(doc, fill);
        doc.roundedRect(cx, cy, cell, cell, 2, 2, 'F');
        setDocFont(doc, theme, row.amount > 0 ? 'bold' : 'normal', 7);
        setText(doc, row.amount > 0 ? c.text : c.muted);
        doc.text(String(row.day), cx + 3, cy + 10);
        if (row.amount > 0 && cell > 28) {
            setDocFont(doc, theme, 'normal', 5);
            setText(doc, c.text);
            doc.text(formatMoney(row.amount), cx + 3, cy + cell - 4, { maxWidth: cell - 5 });
        }
    });

    return height;
}

function drawWeekdayBars(state, x, y, w) {
    const { doc, colors: c, theme, summary, copy } = state;
    const { totals } = summary.weekdayTotals || { totals: new Array(7).fill(0) };
    const max = Math.max(...totals, 1);
    const barH = 46;
    const gap = 4;
    const barW = (w - gap * 6) / 7;

    setDocFont(doc, theme, 'bold', 8);
    setText(doc, c.muted);
    doc.text(txt(copy.weekday), x, y);

    totals.forEach((amt, i) => {
        const bx = x + i * (barW + gap);
        const h = Math.max(amt > 0 ? 5 : 2, (amt / max) * (barH - 6));
        setFill(doc, amt > 0 ? c.accent : c.cardAlt);
        doc.roundedRect(bx, y + 10 + (barH - h), barW, h, 1.4, 1.4, 'F');
        setDocFont(doc, theme, 'normal', 6);
        setText(doc, c.muted);
        doc.text(DAYS[i][0], bx + barW / 2, y + 10 + barH + 10, { align: 'center' });
    });

    return 10 + barH + 16;
}

function drawMerchantPanel(state, x, y, w, h) {
    const { doc, colors: c, theme, summary, copy } = state;
    drawCard(doc, x, y, w, h, c, { stroke: true });

    setDocFont(doc, theme, 'bold', 11);
    setText(doc, c.text);
    doc.text(txt(copy.merchants), x + 14, y + 22);

    const merchants = (summary.allMerchants || summary.topMerchants || []).slice(0, 8);
    const total = summary.total || 1;

    if (!merchants.length) {
        setDocFontItalic(doc, theme, 9);
        setText(doc, c.muted);
        doc.text(txt(copy.empty), x + 14, y + 48);
        return;
    }

    const rowH = Math.min(38, (h - 44) / merchants.length);
    merchants.forEach((item, i) => {
        const ry = y + 36 + i * rowH;
        const share = item.amount / total;
        const pct = Math.round(share * 100);
        const count = `${item.count} entr${item.count === 1 ? 'y' : 'ies'}`;
        setDocFont(doc, theme, 'bold', 8);
        setText(doc, c.text);
        doc.text(txt(item.title), x + 14, ry + 10, { maxWidth: w - 96 });
        setDocFont(doc, theme, 'bold', 8);
        setText(doc, c.text);
        doc.text(formatMoney(item.amount), x + w - 14, ry + 10, { align: 'right' });

        const barW = w - 28;
        const barY = ry + 14;
        setFill(doc, c.cardAlt);
        doc.roundedRect(x + 14, barY, barW, 5, 2, 2, 'F');
        if (share > 0) {
            setFill(doc, c.accent);
            doc.roundedRect(x + 14, barY, Math.max(4, barW * share), 5, 2, 2, 'F');
        }

        if (rowH >= 32) {
            setDocFont(doc, theme, 'normal', 7);
            setText(doc, c.muted);
            doc.text(`${count}  ·  ${pct}% of month`, x + 14, barY + 14);
        }
    });
}

function drawCompositionCard(state, x, y, w, h) {
    const { doc, colors: c, theme, summary, copy } = state;
    drawCard(doc, x, y, w, h, c, { stroke: true });
    setDocFont(doc, theme, 'bold', 10);
    setText(doc, c.text);
    doc.text(txt(copy.composition), x + 14, y + 20);

    const rec = summary.recurring || 0;
    const one = summary.oneTime || 0;
    const mixTotal = rec + one;
    const recShare = mixTotal ? rec / mixTotal : 0;

    const barX = x + 14;
    const barW = w - 28;
    const barY = y + 34;
    setFill(doc, c.cardAlt);
    doc.roundedRect(barX, barY, barW, 10, 4, 4, 'F');
    if (mixTotal > 0) {
        if (recShare > 0) {
            setFill(doc, c.accent);
            doc.roundedRect(barX, barY, Math.max(4, barW * recShare), 10, 4, 4, 'F');
        }
        if (1 - recShare > 0.02) {
            setFill(doc, c.paid);
            doc.roundedRect(barX + barW * recShare, barY, barW * (1 - recShare), 10, 4, 4, 'F');
        }
    }

    setDocFont(doc, theme, 'normal', 8);
    setText(doc, c.textSecondary);
    doc.text(`Recurring  ${formatMoney(rec)}`, barX, y + 60);
    doc.text(`${txt(copy.oneTime)}  ${formatMoney(one)}`, barX + barW, y + 60, { align: 'right' });
}

function drawMonthTiles(state) {
    const { doc, colors: c, theme, summary, copy } = state;
    newPage(state, 150);
    drawSectionHead(state, `${summary.year}  ·  ${copy.months}`);

    const totals = summary.monthTotals || new Array(12).fill(0);
    const gap = 8;
    const cols = 4;
    const tileW = (CONTENT_W - gap * (cols - 1)) / cols;
    const tileH = 48;
    const startY = state.y;

    totals.forEach((amt, i) => {
        const col = i % cols;
        const row = Math.floor(i / cols);
        const x = MARGIN + col * (tileW + gap);
        const y = startY + row * (tileH + gap);
        const current = i === summary.month;
        drawCard(doc, x, y, tileW, tileH, c, {
            fill: current ? c.accentTint : c.card,
            stroke: current ? c.accent : c.border,
            accent: current ? c.accent : null
        });
        setDocFont(doc, theme, current ? 'bold' : 'normal', 8);
        setText(doc, current ? c.accent : c.muted);
        doc.text(MONTHS_LONG[i], x + 10, y + 18);
        setDocFont(doc, theme, 'bold', 11);
        setText(doc, amt > 0 || current ? c.text : c.muted);
        doc.text(formatMoney(amt), x + 10, y + 36);
    });

    state.y = startY + 3 * (tileH + gap) + 4;
}

function drawBreakdownPage(state) {
    state.bandLabel = state.copy.breakdown;
    newPage(state);
    const { doc, colors: c, theme, summary, copy } = state;
    const leftX = MARGIN;
    const rightX = MARGIN + COL_W + GUTTER;
    const top = state.y;

    setDocFont(doc, theme, 'bold', 11);
    setText(doc, c.text);
    doc.text(txt(copy.daily), leftX, top);
    setDraw(doc, c.border);
    doc.setLineWidth(0.45);
    doc.line(leftX, top + 6, leftX + COL_W, top + 6);

    const mapY = top + 16;
    const mapH = drawCalendarHeatmap(state, leftX, mapY, COL_W);
    const weekH = drawWeekdayBars(state, leftX, mapY + mapH + 12, COL_W);

    const leftH = 16 + mapH + 12 + weekH;
    const panelH = Math.max(leftH - 8, 220);
    drawMerchantPanel(state, rightX, top, COL_W, panelH);

    state.y = top + Math.max(leftH, panelH + 8) + 12;
    drawCompositionCard(state, MARGIN, state.y, CONTENT_W, 74);
    state.y += 88;
    drawMonthTiles(state);
}

function drawRegisterHead(state, label, tone) {
    const { doc, theme, colors: c } = state;
    newPage(state, 56);
    setDocFont(doc, theme, 'bold', 9);
    setText(doc, tone === 'accent' ? c.accent : c.muted);
    doc.text(txt(label), MARGIN, state.y);
    state.y += 10;

    setDraw(doc, c.border);
    doc.setLineWidth(0.45);
    doc.line(MARGIN, state.y, MARGIN + CONTENT_W, state.y);
    state.y += 14;

    setDocFont(doc, theme, 'bold', 7);
    setText(doc, c.muted);
    doc.text('DATE', MARGIN, state.y);
    doc.text('DESCRIPTION', MARGIN + 78, state.y);
    doc.text('TYPE', MARGIN + CONTENT_W - 118, state.y);
    doc.text('AMOUNT', MARGIN + CONTENT_W, state.y, { align: 'right' });
    state.y += 6;
    doc.line(MARGIN, state.y, MARGIN + CONTENT_W, state.y);
    state.y += 8;
}

function drawRegisterRows(state, items) {
    const { doc, theme, colors: c } = state;

    items.forEach(item => {
        const note = txt(item.note);
        const rowH = note ? 36 : 26;
        if (state.y + rowH > BOTTOM) {
            newPage(state);
            drawRegisterHead(state, 'Continued', 'muted');
        }

        setDocFont(doc, theme, 'normal', 8);
        setText(doc, c.muted);
        doc.text(item.date, MARGIN, state.y + 10);

        setDocFont(doc, theme, 'normal', 9);
        setText(doc, c.text);
        doc.text(txt(item.title), MARGIN + 78, state.y + 10, { maxWidth: 250 });

        setDocFont(doc, theme, 'normal', 8);
        setText(doc, c.muted);
        doc.text(txt(itemType(item)), MARGIN + CONTENT_W - 118, state.y + 10, { maxWidth: 90 });

        setDocFont(doc, theme, 'bold', 9);
        setText(doc, c.text);
        doc.text(formatMoney(item.amount), MARGIN + CONTENT_W, state.y + 10, { align: 'right' });

        if (note) {
            setDocFont(doc, theme, 'normal', 7);
            setText(doc, c.muted);
            doc.text(note, MARGIN + 78, state.y + 22, { maxWidth: 340 });
        }

        state.y += rowH;
        setDraw(doc, c.border);
        doc.setLineWidth(0.3);
        doc.line(MARGIN, state.y, MARGIN + CONTENT_W, state.y);
        state.y += 4;
    });
}

function drawClosingPanel(state) {
    const { doc, colors: c, theme, summary, ledgerName, copy } = state;
    const leftover = BOTTOM - state.y;
    if (leftover < 110) return;

    const y0 = state.y + 8;
    const recapH = leftover > 220 ? 72 : 0;
    if (recapH) {
        const gap = 10;
        const cardW = (CONTENT_W - gap * 2) / 3;
        const recap = [
            { label: copy.entries, value: String(summary.itemCount || 0), hint: `${summary.activeDays} active days` },
            { label: copy.pending, value: formatMoney(summary.pending), hint: `${summary.pendingCount || 0} open` },
            { label: copy.paid, value: formatMoney(summary.paid), hint: `${summary.paidCount || 0} settled` }
        ];
        recap.forEach((card, i) => {
            const x = MARGIN + i * (cardW + gap);
            drawCard(doc, x, y0, cardW, recapH, c, { stroke: true, accent: c.accent });
            setDocFont(doc, theme, 'normal', 8);
            setText(doc, c.muted);
            doc.text(txt(card.label), x + 12, y0 + 20);
            setDocFont(doc, theme, 'bold', 14);
            setText(doc, c.text);
            doc.text(txt(card.value), x + 12, y0 + 40);
            setDocFont(doc, theme, 'normal', 8);
            setText(doc, c.muted);
            doc.text(txt(card.hint), x + 12, y0 + 56);
        });
    }

    const brandY = y0 + (recapH ? recapH + 12 : 0);
    const brandH = BOTTOM - brandY;
    if (brandH < 90) return;

    drawCard(doc, MARGIN, brandY, CONTENT_W, brandH, c, { fill: c.brandNavy });
    drawBrandMark(doc, MARGIN + 22, brandY + 22, 40, c);

    setDocFont(doc, theme, 'bold', 16);
    setText(doc, c.brandInk);
    doc.text('OpenExpense.org', MARGIN + 76, brandY + 40);

    setDocFont(doc, theme, 'normal', 9);
    setText(doc, c.brandMuted);
    const lines = [
        `This ${copy.kicker.toLowerCase()} was built on your device from the ${txt(ledgerName || 'ledger')} file.`,
        'Nothing in this PDF was uploaded. Keep it with your encrypted ledger and key.json if you archive the month.',
        `${txt(summary.monthLabel)}  ·  ${summary.itemCount} ${summary.itemCount === 1 ? 'entry' : 'entries'}  ·  ${formatMoney(summary.total)}`,
        'www.openexpense.org  ·  Offline expense ledger  ·  You own your data'
    ];
    lines.forEach((line, i) => {
        doc.text(txt(line), MARGIN + 22, brandY + 78 + i * 16, { maxWidth: CONTENT_W - 44 });
    });

    state.y = BOTTOM;
}

function drawRegisterPages(state) {
    const { doc, theme, colors: c, summary, copy } = state;
    const pending = summary.pendingItems || [];
    const paid = summary.paidItems || [];
    const items = summary.allItems || [];

    state.bandLabel = copy.register;
    if (state.y + 80 > BOTTOM) newPage(state);
    else drawSectionHead(state, copy.register);

    if (!items.length) {
        drawCard(doc, MARGIN, state.y, CONTENT_W, 72, c, { stroke: true });
        setDocFontItalic(doc, theme, 10);
        setText(doc, c.muted);
        doc.text(txt(copy.empty), MARGIN + 16, state.y + 32);
        state.y += 84;
        drawClosingPanel(state);
        return;
    }

    if (pending.length) {
        drawRegisterHead(state, `${pending.length} ${copy.pending.toLowerCase()}`, 'accent');
        drawRegisterRows(state, pending);
        state.y += 8;
    }

    if (paid.length) {
        drawRegisterHead(state, `${paid.length} ${copy.paid.toLowerCase()}`, 'muted');
        drawRegisterRows(state, paid);
    }

    drawClosingPanel(state);
}

function drawFooters(state) {
    const { doc, theme, colors: c, summary, ledgerName } = state;
    const pages = doc.getNumberOfPages();
    const ledger = txt(ledgerName || 'OpenExpense ledger');

    for (let i = 1; i <= pages; i++) {
        doc.setPage(i);
        setDraw(doc, c.border);
        doc.setLineWidth(0.4);
        doc.line(MARGIN, FOOTER_RULE_Y, MARGIN + CONTENT_W, FOOTER_RULE_Y);

        drawBrandMark(doc, MARGIN, FOOTER_Y - 9, 12, c);
        setDocFont(doc, theme, 'bold', 7);
        setText(doc, c.textSecondary);
        doc.text('OpenExpense.org', MARGIN + 16, FOOTER_Y);

        setDocFont(doc, theme, 'normal', 7);
        setText(doc, c.muted);
        doc.text(`${txt(summary.monthLabel)}  ·  ${ledger}`, PAGE.w / 2, FOOTER_Y, { align: 'center' });
        doc.text(`${i} / ${pages}`, MARGIN + CONTENT_W, FOOTER_Y, { align: 'right' });
    }
}

function buildFilename(summary, ledgerName) {
    const base = Utils.sanitizeFilename(ledgerName) || 'ledger';
    const month = `${MONTHS_LONG[summary.month].toLowerCase()}-${summary.year}`;
    const suffix = copyFor(summary).filename;
    return `${base}-${month}-${suffix}.pdf`;
}

export async function exportMonthlySummaryPdf({ summary, ledgerName, isDark }) {
    const copy = copyFor(summary);
    const theme = getPdfTheme(isDark, summary.kind);
    const doc = new jsPDF({ unit: 'pt', format: 'letter', compress: true });
    await loadPdfFonts(doc);

    const state = {
        doc,
        colors: theme,
        theme,
        summary,
        copy,
        ledgerName: Utils.sanitizeFilename(ledgerName),
        y: 0
    };

    beginPage(state, 1);
    drawCoverPage(state);
    drawBreakdownPage(state);
    drawRegisterPages(state);
    drawFooters(state);

    return { blob: doc.output('blob'), filename: buildFilename(summary, ledgerName) };
}
