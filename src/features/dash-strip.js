/**
 * OpenExpense — dashboard snapshot chips
 *
 * Paints derived month totals into #dash-chips. Read-only over events.
 * Does not persist or change ledger data.
 */
import { getState } from '../core/store.js';
import { computeNetSnapshot, formatMoney } from '../core/summary.js';

function chip({ label, value, tone, hint }) {
    const article = document.createElement('article');
    article.className = `dash-chip${tone ? ` is-${tone}` : ''}`;
    article.setAttribute('role', 'listitem');

    const shown = tone === 'flat'
        ? formatMoney(value)
        : `${tone === 'up' ? '+' : tone === 'down' ? '-' : ''}${formatMoney(Math.abs(value))}`;

    article.setAttribute('aria-label', `${label} ${shown}${hint ? `, ${hint}` : ''}`);

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

function toneFor(n) {
    if (n > 0) return 'up';
    if (n < 0) return 'down';
    return 'flat';
}

export function renderDashStrip() {
    const root = document.getElementById('dash-chips');
    if (!root) return;

    const { events, currentDate } = getState();
    const snap = computeNetSnapshot(events, currentDate);

    root.replaceChildren(
        chip({ label: 'Balance', value: snap.yearNet, tone: toneFor(snap.yearNet), hint: `${currentDate.getFullYear()} net` }),
        chip({ label: 'Cashflow', value: snap.monthNet, tone: toneFor(snap.monthNet), hint: snap.monthLabel }),
        chip({ label: 'Monthly avg', value: snap.monthAvg, tone: toneFor(snap.monthAvg), hint: 'Active months' })
    );
    root.classList.add('is-ready');
}
