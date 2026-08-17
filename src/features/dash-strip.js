/**
 * OpenExpense — dashboard snapshot chips
 *
 * Paints derived funds and month totals into #dash-chips, plus compact
 * tracking points in #dash-insights. Read-only over events.
 * Does not persist or change ledger data.
 */
import { getState } from '../core/store.js';
import { computeNetSnapshot, formatMoney, formatChipMoney } from '../core/summary.js';

function chip({ label, value, tone, hint }) {
    const article = document.createElement('article');
    article.className = `dash-chip${tone ? ` is-${tone}` : ''}`;
    article.setAttribute('role', 'listitem');

    const shown = formatChipMoney(value);
    const exact = tone === 'flat'
        ? formatMoney(value)
        : `${tone === 'up' ? '+' : tone === 'down' ? '-' : ''}${formatMoney(Math.abs(value))}`;

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

function insight({ label, value, hint, tone }) {
    const el = document.createElement('span');
    el.className = `dash-insight${tone ? ` is-${tone}` : ''}`;
    el.setAttribute('role', 'listitem');
    el.title = hint || `${label} ${value}`;

    const kicker = document.createElement('span');
    kicker.className = 'dash-insight-label';
    kicker.textContent = label;

    const amount = document.createElement('strong');
    amount.className = 'dash-insight-value';
    amount.textContent = value;

    el.append(kicker, amount);
    if (hint) {
        const meta = document.createElement('span');
        meta.className = 'dash-insight-hint';
        meta.textContent = hint;
        el.appendChild(meta);
    }
    return el;
}

function toneFor(n) {
    if (n > 0) return 'up';
    if (n < 0) return 'down';
    return 'flat';
}

function incomeHint(snap) {
    if (snap.incomeReceived > 0 && snap.incomeDue > 0) {
        return `${formatMoney(snap.incomeReceived)} in`;
    }
    if (snap.incomeReceived > 0) return `${formatMoney(snap.incomeReceived)} in`;
    if (snap.incomeDue > 0) return `${formatMoney(snap.incomeDue)} due`;
    return snap.monthLabel;
}

export function renderDashStrip() {
    const root = document.getElementById('dash-chips');
    if (!root) return;

    const { events, currentDate } = getState();
    const snap = computeNetSnapshot(events, currentDate);

    root.replaceChildren(
        chip({
            label: 'Current funds',
            value: snap.currentFunds,
            tone: toneFor(snap.currentFunds),
            hint: 'Settled'
        }),
        chip({
            label: 'Projected income',
            value: snap.projectedIncome,
            tone: snap.projectedIncome > 0 ? 'up' : 'flat',
            hint: incomeHint(snap)
        }),
        chip({
            label: 'Cashflow',
            value: snap.monthNet,
            tone: toneFor(snap.monthNet),
            hint: snap.monthLabel
        }),
        chip({
            label: 'Monthly avg',
            value: snap.monthAvg,
            tone: toneFor(snap.monthAvg),
            hint: 'Active months'
        })
    );
    root.classList.add('is-ready');

    const tools = document.getElementById('dash-insights');
    if (!tools) return;

    const dueHint = snap.dueSoonCount
        ? `${snap.dueSoonCount} bill${snap.dueSoonCount === 1 ? '' : 's'}`
        : 'Next 7 days';
    const saved = snap.savingsRate == null
        ? '—'
        : `${snap.savingsRate > 0 ? '+' : ''}${snap.savingsRate.toFixed(0)}%`;

    tools.hidden = false;
    tools.replaceChildren(
        insight({
            label: 'Due soon',
            value: formatMoney(snap.dueSoon),
            hint: dueHint,
            tone: snap.dueSoon > 0 ? 'down' : ''
        }),
        insight({
            label: 'Left to pay',
            value: formatMoney(snap.leftToPay),
            hint: snap.monthLabel,
            tone: snap.leftToPay > 0 ? 'down' : ''
        }),
        insight({
            label: 'Saved',
            value: saved,
            hint: snap.monthLabel,
            tone: snap.savingsRate > 0 ? 'up' : snap.savingsRate < 0 ? 'down' : ''
        })
    );
}
