/**
 * OpenExpense — search panel
 *
 * A sheet over the calendar: type, see matches from the whole ledger, tap one
 * to jump to its day. The running total under the box is the point — "how much
 * have I spent on coffee this year" is a search, not a report.
 */
import { getState, patch } from '../core/store.js';
import { Utils } from '../core/utils.js';
import { searchEntries } from '../core/search.js';
import { countEntries } from '../core/ledger-file.js';
import { categoryBadge } from '../ui/category-picker.js';
import { lockBodyScroll, unlockBodyScroll } from '../ui/scroll-lock.js';
import { openModal } from './modal.js';
import { exportSearchCsv } from './csv-export.js';

const RESULT_LIMIT = 60;

let panel = null;
let keyHandler = null;
let lastQuery = '';

const HINTS = [
    ['cat:groceries', 'one category'],
    ['group:bella', 'one group'],
    ['>50', 'over an amount'],
    ['is:unpaid', 'still owed'],
    ['2026-08', 'one month']
];

export function openSearch() {
    if (panel) {
        panel.querySelector('#search-input')?.focus();
        return;
    }

    panel = document.createElement('div');
    panel.className = 'backdrop open search-backdrop';
    panel.innerHTML = `
        <div class="modal-shell search-shell" role="dialog" aria-modal="true" aria-label="Search entries">
          <div class="search-head">
            <i class="ti ti-search search-head-icon" aria-hidden="true"></i>
            <input type="search" id="search-input" class="search-input" autocomplete="off"
                   spellcheck="false" placeholder="Search entries, or try cat:groceries >50">
            <button type="button" class="search-close" data-search="close" aria-label="Close search">
              <i class="ti ti-x" aria-hidden="true"></i>
            </button>
          </div>
          <div class="search-hints" id="search-hints">
            ${HINTS.map(([token, label]) => `
              <button type="button" class="search-hint" data-token="${Utils.escapeHtml(token)}">
                <code>${Utils.escapeHtml(token)}</code><span>${Utils.escapeHtml(label)}</span>
              </button>`).join('')}
          </div>
          <div class="search-summary" id="search-summary" hidden></div>
          <div class="search-results" id="search-results"></div>
        </div>`;

    document.body.appendChild(panel);
    document.body.classList.add('modal-open');
    lockBodyScroll();

    const input = panel.querySelector('#search-input');
    input.value = lastQuery;
    input.addEventListener('input', run);

    panel.addEventListener('mousedown', (event) => {
        if (event.target === panel) closeSearch();
    });
    panel.addEventListener('click', (event) => {
        if (event.target.closest('[data-search="close"]')) {
            closeSearch();
            return;
        }
        const hint = event.target.closest('[data-token]');
        if (hint) {
            // Append rather than replace: hints are meant to be stacked up.
            input.value = `${input.value.trim()} ${hint.dataset.token}`.trim();
            input.focus();
            run();
            return;
        }
        const row = event.target.closest('[data-date]');
        if (row) {
            closeSearch();
            patch({ currentDate: dateFromKey(row.dataset.date) });
            openModal(row.dataset.date);
        }
    });

    keyHandler = (event) => {
        if (event.key !== 'Escape') return;
        event.preventDefault();
        event.stopPropagation();
        closeSearch();
    };
    document.addEventListener('keydown', keyHandler, true);

    requestAnimationFrame(() => input.focus());
    run();
}

function closeSearch() {
    if (!panel) return;
    if (keyHandler) {
        document.removeEventListener('keydown', keyHandler, true);
        keyHandler = null;
    }
    panel.remove();
    panel = null;
    if (!document.getElementById('modal')?.classList.contains('open')) {
        document.body.classList.remove('modal-open');
    }
    unlockBodyScroll();
}

function dateLabel(key) {
    const date = dateFromKey(key);
    if (Number.isNaN(date.getTime())) return key;
    const sameYear = date.getFullYear() === new Date().getFullYear();
    return date.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: sameYear ? undefined : 'numeric'
    });
}

function dateFromKey(key) {
    const [y, m, d] = String(key).split('-').map(Number);
    return new Date(y, (m || 1) - 1, d || 1);
}

function run() {
    if (!panel) return;
    const input = panel.querySelector('#search-input');
    lastQuery = input?.value || '';

    const result = searchEntries(getState().events, lastQuery, { limit: RESULT_LIMIT });
    const summary = panel.querySelector('#search-summary');
    const list = panel.querySelector('#search-results');
    const hints = panel.querySelector('#search-hints');

    hints.hidden = !!lastQuery.trim();
    summary.hidden = false;
    summary.replaceChildren();
    list.replaceChildren();

    const count = document.createElement('span');
    if (!lastQuery.trim()) {
        // With no query there is nothing to list, but this is also the only
        // place a whole-ledger CSV is offered, so the bar has to stay.
        const total = countEntries(getState().events);
        if (!total) {
            summary.hidden = true;
            return;
        }
        count.innerHTML = `<strong>${total}</strong> entr${total === 1 ? 'y' : 'ies'} in this ledger`;
        summary.append(count, csvButton('Download the whole ledger as CSV', 'Export all'));
        return;
    }

    if (!result.total) {
        summary.textContent = 'No matches.';
        return;
    }

    count.innerHTML = `<strong>${result.total}</strong> match${result.total === 1 ? '' : 'es'} · <strong>${Utils.formatMoney(result.sum)}</strong>`;
    summary.append(count, csvButton('Download these matches as CSV', 'CSV'));

    for (const row of result.rows) list.appendChild(resultRow(row));

    if (result.truncated) {
        const more = document.createElement('p');
        more.className = 'search-more';
        more.textContent = `Showing the first ${result.rows.length}. Narrow the search to see the rest.`;
        list.appendChild(more);
    }
}

function csvButton(title, label) {
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'search-csv';
    btn.innerHTML = `<i class="ti ti-table-export" aria-hidden="true"></i><span>${label}</span>`;
    btn.title = title;
    btn.addEventListener('click', () => exportSearchCsv(lastQuery));
    return btn;
}

function resultRow(row) {
    const el = document.createElement('button');
    el.type = 'button';
    el.className = `search-row${row.kind === 'income' ? ' is-income' : ''}${row.paid ? ' is-paid' : ''}`;
    el.dataset.date = row.date;

    const main = document.createElement('div');
    main.className = 'search-row-main';
    const title = document.createElement('span');
    title.className = 'search-row-title';
    title.textContent = row.title;
    main.appendChild(title);
    if (row.category) main.appendChild(categoryBadge(row.category, row.kind));

    const meta = document.createElement('div');
    meta.className = 'search-row-meta';
    meta.textContent = `${dateLabel(row.date)}${row.paid ? '' : ' · unpaid'}${row.recurring ? ' · repeats' : ''}`;

    const left = document.createElement('div');
    left.className = 'search-row-left';
    left.append(main, meta);

    const amount = document.createElement('span');
    amount.className = 'search-row-amt';
    amount.textContent = Utils.formatMoney(row.amount);

    el.append(left, amount);
    return el;
}
