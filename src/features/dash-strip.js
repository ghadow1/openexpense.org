/**
 * OpenExpense — dashboard snapshot chips
 *
 * Three swipeable views: overview, income, and expenses.
 * Read-only over events. Does not persist or change ledger data.
 */
import { STORAGE_KEYS } from '../config.js';
import { getState } from '../core/store.js';
import { computeNetSnapshot, formatMoney, formatChipMoney } from '../core/summary.js';

const VIEWS = ['overview', 'income', 'expense'];
const VIEW_COPY = {
    overview: {
        tab: 'Overview',
        title: 'Account overview',
        description: 'Growth potential, settled cash, and how this month is tracking.'
    },
    income: {
        tab: 'Income',
        title: 'Income',
        description: 'What has arrived and what is still expected.'
    },
    expense: {
        tab: 'Expenses',
        title: 'Expenses',
        description: 'What is paid and which bills are still open.'
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

function blockGroup({ title, description, items, className = '' }) {
    const section = document.createElement('section');
    section.className = `dash-block-group${className ? ` ${className}` : ''}`;

    const header = document.createElement('header');
    header.className = 'dash-block-head';

    const heading = document.createElement('h3');
    heading.className = 'dash-block-title';
    heading.textContent = title;

    const copy = document.createElement('p');
    copy.className = 'dash-block-description';
    copy.textContent = description;
    header.append(heading, copy);

    const grid = document.createElement('div');
    grid.className = 'dash-block-grid';
    grid.setAttribute('role', 'list');
    grid.setAttribute('aria-label', title);
    grid.append(...items);

    section.append(header, grid);
    return section;
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

function savingsChip(snap) {
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

function overviewSlide(snap) {
    const dueHint = snap.dueSoonCount
        ? countHint(snap.dueSoonCount, 'bill', 'bills')
        : 'Next 7 days';
    const unpaidHint = snap.leftToPayCount
        ? `${countHint(snap.leftToPayCount, 'bill', 'bills')} · ${snap.monthLabel}`
        : snap.monthLabel;
    const incomeHint = snap.incomeDue > 0
        ? `${formatMoney(snap.incomeDue)} not in yet`
        : (snap.deposited > 0 ? `${formatMoney(snap.deposited)} deposited` : snap.monthLabel);
    const depositedHint = snap.incomeDue > 0
        ? `${formatMoney(snap.incomeDue)} still to land`
        : `Landed in ${snap.monthLabel}`;
    // Spending past the deposits is not a loss, it is the reserve doing its job,
    // so the hint names where the money is coming from instead.
    const leftHint = snap.drawsOnSavings
        ? `${formatMoney(Math.abs(snap.leftToSpend))} from savings funds`
        : 'Deposited − spending';
    const savingsHint = snap.drawsOnSavings
        ? `${formatMoney(snap.savingsAfterMonth)} left after ${snap.monthLabel}`
        : `Carried into ${snap.monthLabel}`;

    return [
        blockGroup({
            title: 'Account overview',
            description: 'What has landed, what is left of it, and the reserve behind it.',
            items: [
                chip({
                    label: 'Deposited',
                    value: snap.deposited,
                    tone: snap.deposited > 0 ? 'up' : 'flat',
                    hint: depositedHint
                }),
                chip({
                    label: 'Left to spend',
                    value: snap.leftToSpend,
                    tone: toneFor(snap.leftToSpend),
                    hint: leftHint
                }),
                chip({
                    label: 'Savings funds',
                    value: snap.savingsFunds,
                    tone: toneFor(snap.savingsFunds),
                    hint: savingsHint
                }),
                chip({
                    label: 'Month net',
                    value: snap.monthNet,
                    tone: toneFor(snap.monthNet),
                    hint: 'Income − spending'
                })
            ]
        }),
        blockGroup({
            title: 'Upcoming & savings',
            description: 'Income still to land, open bills, and how the months average out.',
            className: 'is-planning',
            items: [
                chip({
                    label: 'Scheduled income',
                    value: snap.projectedIncome,
                    tone: snap.projectedIncome > 0 ? 'up' : 'flat',
                    hint: incomeHint
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
                savingsChip(snap),
                chip({
                    label: 'Avg monthly net',
                    value: snap.monthAvg,
                    tone: toneFor(snap.monthAvg),
                    hint: `Through ${snap.monthLabel}`
                })
            ]
        })
    ];
}

function incomeSlide(snap) {
    const expectedHint = snap.incomeDueCount
        ? countHint(snap.incomeDueCount, 'check', 'checks')
        : snap.monthLabel;
    const soonHint = snap.incomeSoonCount
        ? countHint(snap.incomeSoonCount, 'check', 'checks')
        : 'Next 7 days';

    return [
        blockGroup({
            title: 'Income this month',
            description: 'Scheduled pay, what has arrived, and what is still open.',
            items: [
                chip({
                    label: 'Scheduled income',
                    value: snap.projectedIncome,
                    tone: snap.projectedIncome > 0 ? 'up' : 'flat',
                    hint: snap.monthLabel
                }),
                chip({
                    label: 'Deposited',
                    value: snap.deposited,
                    tone: snap.deposited > 0 ? 'up' : 'flat',
                    hint: 'Marked deposited',
                    signed: false
                }),
                chip({
                    label: 'Still expected',
                    value: snap.incomeDue,
                    tone: snap.incomeDue > 0 ? 'up' : 'flat',
                    hint: expectedHint,
                    signed: false
                }),
                chip({
                    label: 'Expected next 7 days',
                    value: snap.incomeSoon,
                    tone: snap.incomeSoon > 0 ? 'up' : 'flat',
                    hint: soonHint,
                    signed: false
                })
            ]
        }),
        blockGroup({
            title: 'Income mix',
            description: 'Recurring pay and how much of this month stays after spending.',
            className: 'is-planning',
            items: [
                chip({
                    label: 'Recurring income',
                    value: snap.incomeRecurring,
                    tone: snap.incomeRecurring > 0 ? 'up' : 'flat',
                    hint: 'On the calendar',
                    signed: false,
                    track: true
                }),
                chip({
                    label: 'Month net',
                    value: snap.monthNet,
                    tone: toneFor(snap.monthNet),
                    hint: 'Income − spending',
                    track: true
                }),
                savingsChip(snap)
            ]
        })
    ];
}

function expenseSlide(snap) {
    const dueHint = snap.dueSoonCount
        ? countHint(snap.dueSoonCount, 'bill', 'bills')
        : 'Next 7 days';
    const unpaidHint = snap.leftToPayCount
        ? countHint(snap.leftToPayCount, 'bill', 'bills')
        : snap.monthLabel;

    return [
        blockGroup({
            title: 'Spending this month',
            description: 'Logged bills, what is paid, and what is still open.',
            items: [
                chip({
                    label: 'Month spending',
                    value: snap.monthOut,
                    tone: snap.monthOut > 0 ? 'flat' : 'up',
                    hint: `Logged in ${snap.monthLabel}`,
                    signed: false
                }),
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
                })
            ]
        }),
        blockGroup({
            title: 'Spending mix',
            description: 'Recurring bills and the share of income left after spending.',
            className: 'is-planning',
            items: [
                chip({
                    label: 'Recurring spend',
                    value: snap.spendRecurring,
                    tone: 'flat',
                    hint: 'On the calendar',
                    signed: false,
                    track: true
                }),
                chip({
                    label: 'Left to spend',
                    value: snap.leftToSpend,
                    tone: toneFor(snap.leftToSpend),
                    hint: snap.drawsOnSavings ? 'From savings funds' : 'Deposited − spending',
                    track: true
                }),
                savingsChip(snap)
            ]
        })
    ];
}

function slideFor(view, snap) {
    if (view === 'income') return incomeSlide(snap);
    if (view === 'expense') return expenseSlide(snap);
    return overviewSlide(snap);
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
        slide.append(...slideFor(view, snap));
        track.appendChild(slide);
    });

    viewport.appendChild(track);
    deck.append(tabs, viewport);

    // Chips fade in the first time the deck appears. Later repaints (theme
    // swap, an edit) update in place instead of replaying the animation.
    const firstPaint = !root.classList.contains('is-ready');
    root.replaceChildren(deck);
    root.classList.add('is-ready');
    root.classList.toggle('is-fresh', firstPaint);
    bindDeck(root);
    setDeckView(root, activeView);

    const tools = document.getElementById('dash-insights');
    if (tools) {
        tools.hidden = true;
        tools.replaceChildren();
    }
}
