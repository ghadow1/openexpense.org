/**
 * OpenExpense — dashboard snapshot
 *
 * Three swipeable views. Each slide is one period dial plus a three-point
 * year spark. Extra figures stay folded so the strip never fills the screen.
 */
import { STORAGE_KEYS } from '../config.js';
import { getState, patch } from '../core/store.js';
import {
    computeMonthlySummary,
    computeNetSnapshot,
    formatMoney,
    formatChipMoney,
    yearSeriesPoints
} from '../core/summary.js';
import { createDial, createSpark } from '../ui/dial-chart.js';
import { closeModal } from './modal.js';

const VIEWS = ['overview', 'income', 'expense'];
const VIEW_COPY = {
    overview: {
        tab: 'Overview',
        title: 'Left to spend',
        description: 'Deposits minus this month’s spending.'
    },
    income: {
        tab: 'Income',
        title: 'Deposited',
        description: 'What has landed this month.'
    },
    expense: {
        tab: 'Expenses',
        title: 'Month spending',
        description: 'Logged bills for the month on screen.'
    }
};

let activeView = readStoredView();

function readStoredView() {
    try {
        const stored = localStorage.getItem(STORAGE_KEYS.dashView);
        if (VIEWS.includes(stored)) return stored;
    } catch (_) { }
    return 'overview';
}

function persistView(view) {
    activeView = view;
    try { localStorage.setItem(STORAGE_KEYS.dashView, view); } catch (_) { }
}

function chip({ label, value, tone, hint, signed = true, track = false }) {
    const article = document.createElement('article');
    article.className = `dash-chip${tone ? ` is-${tone}` : ''}${track ? ' is-track' : ''}`;
    article.setAttribute('role', 'listitem');

    const shown = signed ? formatChipMoney(value) : formatMoney(value);
    const exact = !signed
        ? formatMoney(value)
        : (tone === 'flat'
            ? formatMoney(value)
            : `${tone === 'up' ? '+' : tone === 'down' ? '-' : ''}${formatMoney(Math.abs(value))}`);

    article.setAttribute('aria-label', `${label} ${exact}${hint ? `, ${hint}` : ''}`);
    article.title = exact;

    const kicker = document.createElement('span');
    kicker.className = 'dash-chip-label';
    kicker.textContent = label;

    const amount = document.createElement('strong');
    amount.className = 'dash-chip-value';
    amount.textContent = shown;

    article.append(kicker, amount);

    if (hint) {
        const meta = document.createElement('span');
        meta.className = 'dash-chip-hint';
        meta.textContent = hint;
        article.appendChild(meta);
    }

    return article;
}

function textChip({ label, value, hint, tone, track = false }) {
    const article = document.createElement('article');
    article.className = `dash-chip${tone ? ` is-${tone}` : ''}${track ? ' is-track' : ''}`;
    article.setAttribute('role', 'listitem');
    article.setAttribute('aria-label', `${label} ${value}${hint ? `, ${hint}` : ''}`);
    article.title = hint || `${label} ${value}`;

    const kicker = document.createElement('span');
    kicker.className = 'dash-chip-label';
    kicker.textContent = label;

    const amount = document.createElement('strong');
    amount.className = 'dash-chip-value';
    amount.textContent = value;

    article.append(kicker, amount);

    if (hint) {
        const meta = document.createElement('span');
        meta.className = 'dash-chip-hint';
        meta.textContent = hint;
        article.appendChild(meta);
    }

    return article;
}

function toneFor(n) {
    if (n > 0) return 'up';
    if (n < 0) return 'down';
    return 'flat';
}

function countHint(count, one, many) {
    if (!count) return many;
    return `${count} ${count === 1 ? one : many}`;
}

function clampRatio(part, whole) {
    if (!(whole > 0)) return part > 0 ? 1 : 0;
    return Math.max(0, Math.min(1, part / whole));
}

function goMonth(year, monthIndex) {
    patch({ currentDate: new Date(year, monthIndex, 1) });
    if (getState().selectedKey) closeModal();
}

function yearSpark(events, currentDate, kind, ariaLabel) {
    const year = currentDate.getFullYear();
    let totals;
    if (kind === 'overview') {
        const income = computeMonthlySummary(events, currentDate, 'income');
        const spend = computeMonthlySummary(events, currentDate, 'expense');
        totals = Array.from({ length: 12 }, (_, i) => (income.monthTotals[i] || 0) - (spend.monthTotals[i] || 0));
    } else {
        totals = computeMonthlySummary(events, currentDate, kind).monthTotals;
    }
    return createSpark({
        points: yearSeriesPoints(totals, year),
        ariaLabel,
        onSelect: (pt) => goMonth(year, pt.index)
    });
}

function foldExtras(title, items) {
    const details = document.createElement('details');
    details.className = 'dash-fold';

    const summary = document.createElement('summary');
    summary.className = 'dash-fold-sum';
    summary.textContent = title;

    const grid = document.createElement('div');
    grid.className = 'dash-block-grid';
    grid.setAttribute('role', 'list');
    grid.setAttribute('aria-label', title);
    grid.append(...items);

    details.append(summary, grid);
    return details;
}

function heroSlide({ title, description, dial, spark, extrasTitle, extras }) {
    const section = document.createElement('section');
    section.className = 'dash-hero-card';

    const header = document.createElement('header');
    header.className = 'dash-block-head';
    const heading = document.createElement('h3');
    heading.className = 'dash-block-title';
    heading.textContent = title;
    const copy = document.createElement('p');
    copy.className = 'dash-block-description';
    copy.textContent = description;
    header.append(heading, copy);

    const row = document.createElement('div');
    row.className = 'dash-hero';
    row.append(dial, spark);

    section.append(header, row, foldExtras(extrasTitle, extras));
    return [section];
}

function savingsRateChip(snap) {
    const saved = snap.savingsRate == null
        ? '—'
        : `${snap.savingsRate > 0 ? '+' : ''}${snap.savingsRate.toFixed(0)}%`;
    return textChip({
        label: 'Income left',
        value: saved,
        hint: 'After this month’s spending',
        tone: snap.savingsRate > 0 ? 'up' : 'flat',
        track: true
    });
}

function overviewSlide(snap, events, currentDate) {
    const dueHint = snap.dueSoonCount
        ? countHint(snap.dueSoonCount, 'bill', 'bills')
        : 'Next 7 days';
    const unpaidHint = snap.leftToPayCount
        ? `${countHint(snap.leftToPayCount, 'bill', 'bills')} · ${snap.monthLabel}`
        : snap.monthLabel;
    const depositedHint = snap.incomeDue > 0
        ? `${formatMoney(snap.incomeDue)} still to land`
        : `Landed in ${snap.monthLabel}`;
    const leftHint = snap.drawsOnSavings
        ? `${formatMoney(Math.abs(snap.leftToSpend))} from savings funds`
        : 'Deposited − spending';
    const savingsHint = snap.drawsOnSavings
        ? `${formatMoney(snap.savingsAfterMonth)} left after ${snap.monthLabel}`
        : `Carried into ${snap.monthLabel}`;

    return heroSlide({
        title: VIEW_COPY.overview.title,
        description: VIEW_COPY.overview.description,
        dial: createDial({
            value: snap.leftToSpend,
            label: 'Left to spend',
            caption: snap.monthLabel,
            ratio: clampRatio(Math.max(0, snap.leftToSpend), snap.deposited)
        }),
        spark: yearSpark(events, currentDate, 'overview', `${currentDate.getFullYear()} month net`),
        extrasTitle: 'More figures',
        extras: [
            chip({
                label: 'Deposited',
                value: snap.deposited,
                tone: snap.deposited > 0 ? 'up' : 'flat',
                hint: depositedHint
            }),
            chip({
                label: 'Savings funds',
                value: snap.savingsFunds,
                tone: toneFor(snap.savingsFunds),
                hint: savingsHint
            }),
            chip({
                label: 'Due next 7 days',
                value: snap.dueSoon,
                tone: snap.dueSoon > 0 ? 'flat' : 'up',
                hint: dueHint,
                signed: false,
                track: true
            }),
            chip({
                label: 'Unpaid bills',
                value: snap.leftToPay,
                tone: snap.leftToPay > 0 ? 'flat' : 'up',
                hint: unpaidHint,
                signed: false,
                track: true
            }),
            savingsRateChip(snap)
        ]
    });
}

function incomeSlide(snap, events, currentDate) {
    const expectedHint = snap.incomeDueCount
        ? countHint(snap.incomeDueCount, 'check', 'checks')
        : snap.monthLabel;

    return heroSlide({
        title: VIEW_COPY.income.title,
        description: VIEW_COPY.income.description,
        dial: createDial({
            value: snap.deposited,
            label: 'Deposited',
            caption: snap.monthLabel,
            ratio: clampRatio(snap.deposited, snap.projectedIncome)
        }),
        spark: yearSpark(events, currentDate, 'income', `${currentDate.getFullYear()} income`),
        extrasTitle: 'More figures',
        extras: [
            chip({
                label: 'Scheduled income',
                value: snap.projectedIncome,
                tone: snap.projectedIncome > 0 ? 'up' : 'flat',
                hint: snap.monthLabel
            }),
            chip({
                label: 'Still expected',
                value: snap.incomeDue,
                tone: snap.incomeDue > 0 ? 'up' : 'flat',
                hint: expectedHint,
                signed: false
            }),
            chip({
                label: 'Recurring income',
                value: snap.incomeRecurring,
                tone: snap.incomeRecurring > 0 ? 'up' : 'flat',
                hint: 'On the calendar',
                signed: false,
                track: true
            })
        ]
    });
}

function expenseSlide(snap, events, currentDate) {
    const dueHint = snap.dueSoonCount
        ? countHint(snap.dueSoonCount, 'bill', 'bills')
        : 'Next 7 days';
    const unpaidHint = snap.leftToPayCount
        ? countHint(snap.leftToPayCount, 'bill', 'bills')
        : snap.monthLabel;

    return heroSlide({
        title: VIEW_COPY.expense.title,
        description: VIEW_COPY.expense.description,
        dial: createDial({
            value: snap.monthOut,
            label: 'Month spending',
            caption: snap.monthLabel,
            ratio: clampRatio(snap.spendPaid, snap.monthOut)
        }),
        spark: yearSpark(events, currentDate, 'expense', `${currentDate.getFullYear()} spending`),
        extrasTitle: 'More figures',
        extras: [
            chip({
                label: 'Paid',
                value: snap.spendPaid,
                tone: 'up',
                hint: 'Marked paid',
                signed: false
            }),
            chip({
                label: 'Unpaid bills',
                value: snap.leftToPay,
                tone: snap.leftToPay > 0 ? 'flat' : 'up',
                hint: unpaidHint,
                signed: false
            }),
            chip({
                label: 'Due next 7 days',
                value: snap.dueSoon,
                tone: snap.dueSoon > 0 ? 'flat' : 'up',
                hint: dueHint,
                signed: false
            }),
            chip({
                label: 'Recurring spend',
                value: snap.spendRecurring,
                tone: 'flat',
                hint: 'On the calendar',
                signed: false,
                track: true
            })
        ]
    });
}

function slideFor(view, snap, events, currentDate) {
    if (view === 'income') return incomeSlide(snap, events, currentDate);
    if (view === 'expense') return expenseSlide(snap, events, currentDate);
    return overviewSlide(snap, events, currentDate);
}

function setDeckView(root, view) {
    if (!VIEWS.includes(view)) view = 'overview';
    persistView(view);
    const index = VIEWS.indexOf(view);
    root.dataset.view = view;
    const track = root.querySelector('.dash-deck-track');
    if (track) track.style.transform = `translateX(-${index * 100}%)`;
    root.querySelectorAll('[data-dash-view]').forEach((btn) => {
        const on = btn.dataset.dashView === view;
        btn.classList.toggle('is-active', on);
        btn.setAttribute('aria-selected', on ? 'true' : 'false');
        btn.tabIndex = on ? 0 : -1;
    });
    root.querySelectorAll('.dash-slide').forEach((slide) => {
        const on = slide.dataset.view === view;
        slide.setAttribute('aria-hidden', on ? 'false' : 'true');
    });
}

function shiftView(root, delta) {
    const index = VIEWS.indexOf(activeView);
    const next = VIEWS[(index + delta + VIEWS.length) % VIEWS.length];
    setDeckView(root, next);
}

function bindDeck(root) {
    if (root.dataset.deckBound === '1') return;
    root.dataset.deckBound = '1';

    root.addEventListener('click', (event) => {
        const tab = event.target.closest('[data-dash-view]');
        if (!tab || !root.contains(tab)) return;
        setDeckView(root, tab.dataset.dashView);
    });

    root.addEventListener('keydown', (event) => {
        if (!root.contains(document.activeElement)) return;
        if (event.key === 'ArrowRight') {
            event.preventDefault();
            shiftView(root, 1);
            root.querySelector('[data-dash-view].is-active')?.focus();
        } else if (event.key === 'ArrowLeft') {
            event.preventDefault();
            shiftView(root, -1);
            root.querySelector('[data-dash-view].is-active')?.focus();
        }
    });

    let startX = 0;
    let startY = 0;
    let dragging = false;
    root.addEventListener('pointerdown', (event) => {
        if (event.target.closest('[data-dash-view]')) return;
        if (event.target.closest('.dash-fold')) return;
        if (event.target.closest('.oe-spark-hit')) return;
        if (event.button != null && event.button !== 0) return;
        startX = event.clientX;
        startY = event.clientY;
        dragging = true;
    });
    root.addEventListener('pointerup', (event) => {
        if (!dragging) return;
        dragging = false;
        const dx = event.clientX - startX;
        const dy = event.clientY - startY;
        if (Math.abs(dx) < 36 || Math.abs(dx) < Math.abs(dy)) return;
        shiftView(root, dx < 0 ? 1 : -1);
    });
    root.addEventListener('pointercancel', () => { dragging = false; });
}

export function renderDashStrip() {
    const root = document.getElementById('dash-chips');
    if (!root) return;

    const { events, currentDate } = getState();
    const snap = computeNetSnapshot(events, currentDate);

    const deck = document.createElement('section');
    deck.className = 'dash-deck';
    deck.setAttribute('aria-roledescription', 'carousel');
    deck.setAttribute('aria-label', 'Ledger snapshot views');

    const tabs = document.createElement('div');
    tabs.className = 'dash-deck-tabs';
    tabs.setAttribute('role', 'tablist');
    tabs.setAttribute('aria-label', 'Snapshot views');
    VIEWS.forEach((view) => {
        const btn = document.createElement('button');
        btn.type = 'button';
        btn.className = 'dash-deck-tab';
        btn.dataset.dashView = view;
        btn.id = `dash-tab-${view}`;
        btn.setAttribute('role', 'tab');
        btn.setAttribute('aria-controls', `dash-slide-${view}`);
        btn.textContent = VIEW_COPY[view].tab;
        tabs.appendChild(btn);
    });

    const viewport = document.createElement('div');
    viewport.className = 'dash-deck-viewport';

    const track = document.createElement('div');
    track.className = 'dash-deck-track';

    VIEWS.forEach((view) => {
        const slide = document.createElement('div');
        slide.className = 'dash-slide';
        slide.id = `dash-slide-${view}`;
        slide.dataset.view = view;
        slide.setAttribute('role', 'tabpanel');
        slide.setAttribute('aria-labelledby', `dash-tab-${view}`);
        slide.append(...slideFor(view, snap, events, currentDate));
        track.appendChild(slide);
    });

    viewport.appendChild(track);
    deck.append(tabs, viewport);

    const firstPaint = !root.classList.contains('is-ready');
    root.replaceChildren(deck);
    root.classList.add('is-ready');
    root.classList.toggle('is-fresh', firstPaint);
    bindDeck(root);
    setDeckView(root, activeView);
}
