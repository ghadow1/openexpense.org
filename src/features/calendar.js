import { DAYS } from '../config.js';
import { getState, patch } from '../core/store.js';
import { Utils } from '../core/utils.js';
import { UI } from '../ui/components.js';
import { Ledger } from './ledger.js';
import { Receipt } from './receipt.js';
import { openModal } from './modal.js';

let shellEl = null;
let gridHeadEl = null;
let gridEl = null;
let lastMonthKey = '';

export function changeMonth(delta) {
    const { currentDate } = getState();
    patch({
        currentDate: new Date(currentDate.getFullYear(), currentDate.getMonth() + delta, 1)
    });
}

function ensureShell(calCol) {
    if (shellEl && shellEl.isConnected) return;

    calCol.innerHTML = '';
    shellEl = document.createElement('div');
    shellEl.className = 'cal-shell';

    const hdr = document.createElement('div');
    hdr.className = 'toolbar';
    const nav = document.createElement('div');
    nav.className = 'nav-group';

    nav.append(
        UI.createButton('', () => changeMonth(-1), { icon: 'chevron-left', iconOnly: true }),
        Object.assign(document.createElement('div'), { className: 'month-title' }),
        UI.createButton('', () => changeMonth(1), { icon: 'chevron-right', iconOnly: true })
    );

    const actions = document.createElement('div');
    actions.className = 'nav-group toolbar-actions';
    const divider = () => Object.assign(document.createElement('div'), { className: 'nav-divider' });

    actions.append(
        UI.createButton('Today', () => patch({ currentDate: new Date() })),
        divider(),
        UI.createButton('Import', Ledger.import, { icon: 'upload' }),
        UI.createButton('Export', Ledger.export, { icon: 'download' }),
        divider(),
        UI.createButton(Utils.isMobile() ? 'Scan' : 'Scan Receipt', () => Receipt.pickImage(), { icon: 'camera' })
    );
    hdr.append(nav, actions);
    shellEl.appendChild(hdr);

    gridHeadEl = document.createElement('div');
    gridHeadEl.className = 'grid-head';
    DAYS.forEach(d => gridHeadEl.appendChild(Object.assign(document.createElement('span'), { textContent: d })));
    shellEl.appendChild(gridHeadEl);

    gridEl = document.createElement('div');
    gridEl.className = 'cal-grid';
    shellEl.appendChild(gridEl);

    calCol.appendChild(shellEl);
}

function updateMonthTitle(currentDate) {
    const title = shellEl?.querySelector('.month-title');
    if (title) {
        title.textContent = currentDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
    }
}

function renderGrid(y, m, events) {
    if (!gridEl) return;

    const today = new Date();
    const firstDay = new Date(y, m, 1).getDay();
    const daysInMonth = new Date(y, m + 1, 0).getDate();
    const totalCells = firstDay + daysInMonth;

    while (gridEl.children.length < totalCells) {
        gridEl.appendChild(document.createElement('div'));
    }
    while (gridEl.children.length > totalCells) {
        gridEl.lastChild.remove();
    }

    for (let i = 0; i < totalCells; i++) {
        const cell = gridEl.children[i];
        cell.className = 'cal-day';
        cell.replaceChildren();
        cell.onclick = null;
        cell.onkeydown = null;
        cell.removeAttribute('role');
        cell.removeAttribute('tabindex');
        cell.removeAttribute('aria-label');

        if (i >= firstDay) {
            const d = i - firstDay + 1;
            const dateKey = Utils.dateKey(y, m, d);
            const isToday = y === today.getFullYear() && m === today.getMonth() && d === today.getDate();

            cell.setAttribute('role', 'button');
            cell.setAttribute('tabindex', '0');
            cell.setAttribute('aria-label', `Log expense for ${dateKey}`);
            cell.onclick = () => openModal(dateKey);
            cell.onkeydown = (ev) => {
                if (ev.key === 'Enter' || ev.key === ' ') { ev.preventDefault(); openModal(dateKey); }
            };

            const numLabel = document.createElement('div');
            numLabel.className = `cal-day-num${isToday ? ' is-today' : ''}`;
            numLabel.textContent = d;
            cell.appendChild(numLabel);

            const dayEvents = events[dateKey] || [];
            dayEvents.slice(0, 4).forEach(e => {
                const pill = document.createElement('div');
                pill.className = `pill ${e.paid ? 'is-paid' : ''}`;
                const amt = Utils.getPrice(e);
                pill.innerHTML = `<span class="title">${Utils.escapeHtml(e.title)}</span>${amt > 0 ? `<span class="pill-amt">$${amt.toFixed(2)}</span>` : ''}`;
                pill.onclick = (ev) => { ev.stopPropagation(); openModal(dateKey); };
                cell.appendChild(pill);
            });

            if (dayEvents.length > 4) {
                const more = document.createElement('div');
                more.className = 'cal-more';
                more.textContent = `+${dayEvents.length - 4} more`;
                cell.appendChild(more);
            }
        } else {
            cell.classList.add('is-empty');
        }
    }
}

export function renderCalendar(changedKeys) {
    const calCol = document.getElementById('cal-col');
    if (!calCol) return;

    const { currentDate, events } = getState();
    const y = currentDate.getFullYear();
    const m = currentDate.getMonth();
    const monthKey = `${y}-${m}`;
    const keys = changedKeys || [];
    const monthChanged = !changedKeys || keys.includes('currentDate') || lastMonthKey !== monthKey;

    ensureShell(calCol);

    if (monthChanged) {
        updateMonthTitle(currentDate);
        lastMonthKey = monthKey;
    }

    if (!changedKeys || monthChanged || keys.includes('events')) {
        renderGrid(y, m, events);
    }
}
