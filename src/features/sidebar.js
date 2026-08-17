/**
 * OpenExpense — monthly summary sidebar
 *
 * Expense and income faces share one card. A switch flips the card
 * like a coin. Calendar layout stays put; only this panel changes face.
 */
import { STORAGE_KEYS } from '../config.js';
import { getState, patch } from '../core/store.js';
import { Utils } from '../core/utils.js';
import { computeMonthlySummary, formatDelta } from '../core/summary.js';
import { UI } from '../ui/components.js';
import { Ledger } from './ledger.js';
import { Toast } from '../ui/toast.js';
import { closeModal, openModal } from './modal.js';

const FACE_COPY = {
    expense: {
        title: 'Monthly spending',
        icon: 'chart-pie',
        hero: 'Total spent',
        empty: 'No expenses this month.',
        emptyHint: 'Tap a calendar day to log spending.',
        emptyIcon: 'receipt',
        top: 'Where your money went',
        pdfLabel: 'Download spending report',
        paid: 'Paid',
        pending: 'Pending',
        settled: 'settled',
        daysHint: 'days with spend',
        startHint: 'Log an expense to start',
        oneTime: 'one-time',
        noOneTime: 'No one-time spend',
        yearAria: 'monthly spending chart'
    },
    income: {
        title: 'Monthly income',
        icon: 'wallet',
        hero: 'Month income',
        empty: 'No income this month.',
        emptyHint: 'Tap a calendar day and save an income entry.',
        emptyIcon: 'coin',
        top: 'Where income came from',
        pdfLabel: 'Download income report',
        paid: 'Received',
        pending: 'Expected',
        settled: 'received',
        daysHint: 'days with income',
        startHint: 'Log income to start',
        oneTime: 'one-time',
        noOneTime: 'No one-time income',
        yearAria: 'monthly income chart'
    }
};

async function downloadSummaryPdf() {
    if (downloadSummaryPdf._busy) return;
    downloadSummaryPdf._busy = true;

    const { currentDate, events, ledgerName, isDark, ledgerFace } = getState();
    const kind = ledgerFace === 'income' ? 'income' : 'expense';
    const summary = computeMonthlySummary(events, currentDate, kind);
    const reportName = kind === 'income' ? 'Monthly income report' : 'Monthly spending report';

    try {
        const { exportMonthlySummaryPdf } = await import('../core/summary-pdf.js');
        const { blob, filename } = await exportMonthlySummaryPdf({ summary, ledgerName, isDark });
        const result = await Ledger.saveBlob(
            blob,
            filename,
            reportName,
            { 'application/pdf': ['.pdf'] }
        );
        if (result !== 'abort') {
            const empty = kind === 'income' ? 'Empty income report PDF downloaded.' : 'Empty spending report PDF downloaded.';
            const ready = kind === 'income' ? 'Income report PDF downloaded.' : 'Spending report PDF downloaded.';
            Toast.show(summary.itemCount ? ready : empty, 'success');
        }
    } catch (err) {
        console.error('[OpenExpense] PDF export failed:', err);
        Toast.show('Could not create PDF.', 'error');
    } finally {
        downloadSummaryPdf._busy = false;
    }
}

function el(tag, className, html) {
    const node = document.createElement(tag);
    if (className) node.className = className;
    if (html != null) node.innerHTML = html;
    return node;
}

function statCard(icon, label, value, hint, tone) {
    const card = el('div', `summary-stat${tone ? ` is-${tone}` : ''}`);
    card.innerHTML = `
        <div class="summary-stat-label"><i class="ti ti-${icon}" aria-hidden="true"></i>${label}</div>
        <div class="summary-stat-value">${value}</div>
        ${hint ? `<div class="summary-stat-hint">${hint}</div>` : ''}
    `;
    return card;
}

function renderHero(summary, copy) {
    const hero = el('section', `summary-hero${summary.kind === 'income' ? ' is-income' : ''}`);
    const meta = summary.itemCount
        ? `${summary.itemCount} item${summary.itemCount === 1 ? '' : 's'} · ${summary.activeDays} active day${summary.activeDays === 1 ? '' : 's'}`
        : summary.kind === 'income' ? 'No income logged yet' : 'No expenses logged yet';

    hero.innerHTML = `
        <div class="summary-hero-top">
            <span class="summary-hero-label">${copy.hero}</span>
            ${summary.isCurrentMonth && summary.itemCount ? `<span class="summary-hero-badge">Live</span>` : ''}
        </div>
        <div class="summary-hero-amount">${Utils.formatMoney(summary.total)}</div>
        <div class="summary-hero-meta">${meta}</div>
    `;
    return hero;
}

function renderProgress(summary, copy) {
    const wrap = el('section', 'summary-progress');
    const paidFlex = summary.paid > 0 ? summary.paid : 0;
    const pendingFlex = summary.pending > 0 ? summary.pending : 0;
    const empty = paidFlex === 0 && pendingFlex === 0;
    wrap.innerHTML = `
        <div class="summary-progress-head">
            <span>${copy.paid} vs ${copy.pending.toLowerCase()}</span>
            <span class="summary-progress-pct">${summary.total ? `${Math.round(summary.pctPaid)}% ${copy.settled}` : '—'}</span>
        </div>
        <div class="budget-bar" role="img" aria-label="${copy.paid} ${Utils.formatMoney(summary.paid)}, ${copy.pending.toLowerCase()} ${Utils.formatMoney(summary.pending)}">
            ${empty
                ? '<span class="budget-fill-empty"></span>'
                : `<span class="budget-fill-paid" style="flex:${paidFlex}"></span><span class="budget-fill-pending" style="flex:${pendingFlex}"></span>`}
        </div>
        <div class="summary-progress-legend">
            <span><i class="legend-dot is-paid"></i>${copy.paid} <strong>${Utils.formatMoney(summary.paid)}</strong></span>
            <span><i class="legend-dot is-pending"></i>${copy.pending} <strong>${Utils.formatMoney(summary.pending)}</strong></span>
        </div>
    `;
    return wrap;
}

function renderStatsGrid(summary, copy) {
    const grid = el('div', 'summary-stats-grid');

    const spendUp = summary.monthDelta > 0;
    const deltaTone = summary.kind === 'income'
        ? (spendUp ? 'up' : '')
        : (summary.monthDelta < 0 ? 'up' : '');
    const deltaHint = summary.prevMonthTotal > 0 || summary.total > 0
        ? `${formatDelta(summary.monthDelta)} vs last month`
        : 'No prior month data';

    grid.append(
        statCard('calendar-stats', 'Daily average', Utils.formatMoney(summary.avgPerDay),
            summary.activeDays ? `Across ${summary.activeDays} ${copy.daysHint}` : copy.startHint, ''),
        statCard('receipt-2', 'Average entry', Utils.formatMoney(summary.avgPerEntry),
            summary.itemCount ? `${summary.itemCount} entries` : '—', ''),
        statCard('chart-arrows-vertical', 'Vs last month', summary.prevMonthTotal || summary.total ? formatDelta(summary.monthDelta) : '—',
            deltaHint, deltaTone),
        statCard('repeat', 'Recurring total', Utils.formatMoney(summary.recurring),
            summary.oneTime ? `${Utils.formatMoney(summary.oneTime)} ${copy.oneTime}` : copy.noOneTime, '')
    );

    if (summary.isCurrentMonth && summary.itemCount) {
        grid.appendChild(statCard('trending-up', 'Estimated month total', Utils.formatMoney(summary.projectedTotal),
            `${Utils.formatMoney(summary.dailyPace)}/day pace · ${summary.daysElapsed}/${summary.daysInMonth} days`, 'accent'));
    }

    if (summary.largest) {
        grid.appendChild(statCard('arrow-big-up-lines', 'Largest entry', Utils.formatMoney(summary.largest.amount),
            `${Utils.escapeHtml(summary.largest.title)} · ${summary.largest.date}`, ''));
    }

    return grid;
}

function renderTopMerchants(summary, copy) {
    if (!summary.topMerchants.length) return null;

    const section = el('section', 'summary-section');
    section.appendChild(el('div', 'summary-section-title', copy.top));

    const list = el('div', 'summary-merchant-list');
    const max = summary.topMerchants[0].amount || 1;

    summary.topMerchants.forEach(item => {
        const row = el('div', 'summary-merchant');
        const pct = Math.max(8, (item.amount / max) * 100);
        row.innerHTML = `
            <div class="summary-merchant-head">
                <span class="summary-merchant-name">${Utils.escapeHtml(item.title)}</span>
                <span class="summary-merchant-amt">${Utils.formatMoney(item.amount)}</span>
            </div>
            <div class="summary-merchant-track"><span style="width:${pct}%"></span></div>
            <div class="summary-merchant-meta">${item.count} entr${item.count === 1 ? 'y' : 'ies'}</div>
        `;
        list.appendChild(row);
    });

    section.appendChild(list);
    return section;
}

function renderYearChart(summary, currentDate, copy) {
    const section = el('section', 'summary-section');
    section.appendChild(el('div', 'summary-section-title', `${summary.year} at a glance`));
    section.appendChild(el('p', 'summary-section-description', 'Compare months and tap a column to open it.'));

    const cards = el('div', 'summary-stats-grid is-compact');
    cards.append(
        statCard('chart-bar', 'Year total', Utils.formatMoney(summary.yearTotal), `All activity in ${summary.year}`, 'accent'),
        statCard('chart-dots', 'Monthly average', Utils.formatMoney(summary.yearAvg), 'Across active months', '')
    );
    section.appendChild(cards);

    const maxMonth = Math.max(...summary.monthTotals, 1);
    const plot = el('div', 'year-chart');
    plot.setAttribute('role', 'group');
    plot.setAttribute('aria-label', `${summary.year} ${copy.yearAria}`);

    summary.monthTotals.forEach((amt, i) => {
        const col = el('button', 'year-chart-col');
        col.type = 'button';
        const isCur = i === currentDate.getMonth();
        col.classList.toggle('is-current', isCur);
        col.classList.toggle('is-hot', amt > 0);
        col.dataset.month = String(i);

        const monthName = new Date(summary.year, i).toLocaleString('default', { month: 'short' });
        col.setAttribute('aria-label', `${monthName}: ${Utils.formatMoney(amt)}`);
        Utils.bindTooltip(col, `${monthName}: ${Utils.formatMoney(amt)}`);

        const fill = el('span', 'year-chart-fill');
        const pct = amt > 0 ? Math.max(12, (amt / maxMonth) * 100) : 4;
        fill.style.height = `${pct}%`;

        const label = el('span', 'year-chart-label');
        label.textContent = monthName.slice(0, 1);

        col.append(fill, label);
        col.onclick = () => {
            patch({ currentDate: new Date(summary.year, i, 1) });
            if (getState().selectedKey) closeModal();
        };
        plot.appendChild(col);
    });

    section.appendChild(plot);
    return section;
}

function renderItemRow(item) {
    const row = el('button', `summary-item${item.paid ? ' is-paid' : ' is-pending'}`);
    row.type = 'button';
    row.innerHTML = `
        <span class="summary-item-main">
            <span class="summary-item-title">
                ${Utils.escapeHtml(item.title)}
                ${item.recurring ? '<i class="ti ti-refresh" aria-hidden="true"></i>' : ''}
            </span>
            <span class="summary-item-date">${item.date}</span>
        </span>
        <span class="summary-item-amt">${Utils.formatMoney(item.amount)}</span>
    `;

    if (item.note) {
        row.title = item.note;
        Utils.bindTooltip(row, item.note);
    }

    row.onclick = () => openModal(item.date);
    return row;
}

function renderItemList(summary, copy) {
    if (!summary.allItems.length) {
        const empty = el('div', 'summary-empty');
        empty.innerHTML = `<i class="ti ti-${copy.emptyIcon}" aria-hidden="true"></i><p>${copy.empty}</p><span>${copy.emptyHint}</span>`;
        return empty;
    }

    const wrap = el('section', 'summary-section');
    wrap.appendChild(el('div', 'summary-section-title', 'This month'));

    if (summary.pendingItems.length) {
        wrap.appendChild(el('div', 'summary-list-label', `${summary.pendingItems.length} ${copy.pending.toLowerCase()}`));
        const pendingList = el('div', 'summary-item-list');
        summary.pendingItems.forEach(item => pendingList.appendChild(renderItemRow(item)));
        wrap.appendChild(pendingList);
    }

    if (summary.paidItems.length) {
        wrap.appendChild(el('div', 'summary-list-label is-muted', `${summary.paidItems.length} ${copy.paid.toLowerCase()}`));
        const paidList = el('div', 'summary-item-list');
        summary.paidItems.forEach(item => paidList.appendChild(renderItemRow(item)));
        wrap.appendChild(paidList);
    }

    return wrap;
}

let expenseFace = null;
let incomeFace = null;

function setLedgerFace(face) {
    const next = face === 'income' ? 'income' : 'expense';
    if (getState().ledgerFace === next) return;
    patch({ ledgerFace: next });
    try { localStorage.setItem(STORAGE_KEYS.ledgerFace, next); } catch (_) { }
}

function paintFace(faceEl, kind) {
    if (!faceEl) return;
    const { currentDate, events } = getState();
    const copy = FACE_COPY[kind];
    const summary = computeMonthlySummary(events, currentDate, kind);

    faceEl.replaceChildren();

    const header = el('div', 'sidebar-header');
    const title = el('h3', 'sidebar-title');
    title.innerHTML = `<i class="ti ti-${copy.icon}" aria-hidden="true"></i> ${copy.title} <span class="sidebar-month">${summary.shortMonth} ${summary.year}</span>`;
    header.appendChild(title);

    const pdfBtn = UI.createButton('', () => { downloadSummaryPdf(); }, { icon: 'file-type-pdf', iconOnly: true });
    pdfBtn.classList.add('sidebar-print-btn');
    pdfBtn.setAttribute('aria-label', copy.pdfLabel);
    pdfBtn.title = copy.pdfLabel;
    header.appendChild(pdfBtn);

    faceEl.appendChild(header);
    faceEl.appendChild(renderHero(summary, copy));
    faceEl.appendChild(renderProgress(summary, copy));

    const statsSection = el('section', 'summary-section');
    statsSection.appendChild(el('div', 'summary-section-title', 'This month at a glance'));
    statsSection.appendChild(el('p', 'summary-section-description', 'Averages and patterns from the month on screen.'));
    statsSection.appendChild(renderStatsGrid(summary, copy));
    faceEl.appendChild(statsSection);

    const merchants = renderTopMerchants(summary, copy);
    if (merchants) faceEl.appendChild(merchants);

    faceEl.appendChild(renderYearChart(summary, currentDate, copy));
    faceEl.appendChild(renderItemList(summary, copy));
}

function ensureSidebarShell(sidebar) {
    if (expenseFace && expenseFace.isConnected && incomeFace && incomeFace.isConnected) return;

    sidebar.replaceChildren();
    sidebar.classList.add('has-flip');

    const switcher = el('div', 'ledger-switch');
    switcher.setAttribute('role', 'group');
    switcher.setAttribute('aria-label', 'Show expenses or income');
    switcher.innerHTML = `
        <button type="button" class="ledger-switch-btn" data-face="expense">
            <i class="ti ti-receipt" aria-hidden="true"></i><span>Expenses</span>
        </button>
        <button type="button" class="ledger-switch-btn" data-face="income">
            <i class="ti ti-coin" aria-hidden="true"></i><span>Income</span>
        </button>
        <span class="ledger-switch-coin" aria-hidden="true"><i class="ti ti-coin"></i></span>
    `;
    switcher.addEventListener('click', (ev) => {
        const btn = ev.target.closest('[data-face]');
        if (btn) setLedgerFace(btn.dataset.face);
    });
    sidebar.appendChild(switcher);

    const flip = el('div', 'sidebar-flip');
    const inner = el('div', 'sidebar-flip-inner');
    expenseFace = el('div', 'sidebar-face sidebar-face--expense');
    incomeFace = el('div', 'sidebar-face sidebar-face--income');
    inner.append(expenseFace, incomeFace);
    flip.appendChild(inner);
    sidebar.appendChild(flip);
}

function syncFlip(sidebar) {
    const face = getState().ledgerFace === 'income' ? 'income' : 'expense';
    sidebar.classList.toggle('is-income', face === 'income');
    sidebar.querySelectorAll('.ledger-switch-btn').forEach((btn) => {
        const on = btn.dataset.face === face;
        btn.classList.toggle('is-active', on);
        btn.setAttribute('aria-pressed', on ? 'true' : 'false');
    });
}

export function renderSidebar(changedKeys) {
    const sidebar = document.getElementById('sidebar');
    if (!sidebar) return;

    ensureSidebarShell(sidebar);
    syncFlip(sidebar);

    const keys = changedKeys || [];
    const all = !changedKeys || keys.length === 0;
    const dataChanged = all || keys.includes('events') || keys.includes('currentDate') || keys.includes('isDark');
    if (dataChanged) {
        paintFace(expenseFace, 'expense');
        paintFace(incomeFace, 'income');
    }
}
