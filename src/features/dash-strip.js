/**
 * OpenExpense — dashboard snapshot chips
 *
 * Paints derived funds and month totals into #dash-chips as one family of
 * blocks. Read-only over events. Does not persist or change ledger data.
 */
import { getState } from '../core/store.js';
import { computeNetSnapshot, formatMoney, formatChipMoney } from '../core/summary.js';

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
    const saved = snap.savingsRate == null
        ? '—'
        : `${snap.savingsRate > 0 ? '+' : ''}${snap.savingsRate.toFixed(0)}%`;
    const dueHint = snap.dueSoonCount
        ? `${snap.dueSoonCount} bill${snap.dueSoonCount === 1 ? '' : 's'}`
        : 'Next 7 days';

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
        }),
        chip({
            label: 'Due soon',
            value: snap.dueSoon,
            tone: snap.dueSoon > 0 ? 'flat' : 'up',
            hint: dueHint,
            signed: false,
            track: true
        }),
        chip({
            label: 'Left to pay',
            value: snap.leftToPay,
            tone: snap.leftToPay > 0 ? 'flat' : 'up',
            hint: snap.monthLabel,
            signed: false,
            track: true
        }),
        textChip({
            label: 'Saved',
            value: saved,
            hint: snap.monthLabel,
            tone: snap.savingsRate > 0 ? 'up' : 'flat',
            track: true
        })
    );
    root.classList.add('is-ready');

    const tools = document.getElementById('dash-insights');
    if (tools) {
        tools.hidden = true;
        tools.replaceChildren();
    }
}
