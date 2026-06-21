import { DAYS } from '../config.js';
import { getState, patch } from '../core/store.js';
import { Utils } from '../core/utils.js';
import { UI } from '../ui/components.js';
import { Ledger } from './ledger.js';
import { Receipt } from './receipt.js';
import { openModal } from './modal.js';

/**
 * @module oe/calendar-view
 * @tag perf:responsive-render
 * @tag platform:mobile-tablet-desktop
 */
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

    const todayBtn = UI.createButton('Today', () => patch({ currentDate: new Date() }), { icon: 'calendar-event' });
    const importBtn = UI.createButton('Import', Ledger.import, { icon: 'upload' });
    const exportBtn = UI.createButton('Export', Ledger.export, { icon: 'download' });
    const clearBtn = UI.createButton('Clear', () => Ledger.clearLedger(), { icon: 'trash', danger: true });
    const scanBtn = UI.createButton('Scan', () => Receipt.pickImage(), { icon: 'camera', accent: true });
    scanBtn.classList.add('toolbar-scan-btn');

    // Accessible name + tooltip so the buttons stay usable once labels collapse to icons.
    [[todayBtn, 'Jump to today'], [importBtn, 'Import ledger'], [exportBtn, 'Export ledger'],
    [clearBtn, 'Clear calendar'], [scanBtn, 'Scan receipt — photo or PDF']].forEach(([btn, label]) => {
        btn.setAttribute('aria-label', label);
        btn.title = label;
    });

    actions.append(todayBtn, divider(), importBtn, exportBtn, clearBtn, divider(), scanBtn);
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

function getCalendarDensity(colEl) {
    // @section responsive-density
    const col = colEl || document.getElementById('cal-col');
    const colW = col?.clientWidth || 0;

    if (Utils.isMobile()) return 'mobile';
    if (colW > 0 && colW < 640) return 'compact';
    if (colW > 0 && colW < 820) return 'narrow';
    if (colW > 0 && colW < 980) return 'tablet';
    if (window.matchMedia('(max-width: 900px)').matches) return 'tablet';
    return 'desktop';
}

function syncDensityClass(density) {
    if (shellEl) shellEl.dataset.density = density;
}

function appendCompactMobileDay(body, dayEvents) {
    const dots = document.createElement('div');
    dots.className = 'cal-day-dots';
    const dotCount = Math.min(dayEvents.length, 4);
    for (let j = 0; j < dotCount; j++) {
        const dot = document.createElement('span');
        dot.className = `cal-day-dot${dayEvents[j].paid ? ' is-paid' : ''}`;
        dots.appendChild(dot);
    }
    body.appendChild(dots);

    if (dayEvents.length === 1) {
        const micro = document.createElement('div');
        micro.className = 'cal-day-micro';
        micro.textContent = dayEvents[0].title;
        body.appendChild(micro);
        return;
    }

    const badge = document.createElement('div');
    badge.className = 'cal-day-count';
    badge.textContent = `${dayEvents.length} items`;
    body.appendChild(badge);
}

function appendPills(body, dayEvents, dateKey, maxVisible, density) {
    const visible = dayEvents.slice(0, maxVisible);
    visible.forEach(e => {
        const pill = document.createElement('div');
        pill.className = `pill ${e.paid ? 'is-paid' : ''}${density === 'narrow' ? ' is-compact' : ''}`;
        const amt = Utils.getPrice(e);
        const title = Utils.escapeHtml(e.title);
        if (density === 'narrow') {
            pill.innerHTML = amt > 0
                ? `<span class="pill-amt">$${amt.toFixed(2)}</span><span class="title">${title}</span>`
                : `<span class="title">${title}</span>`;
        } else {
            pill.innerHTML = `<span class="title">${title}</span>${amt > 0 ? `<span class="pill-amt">$${amt.toFixed(2)}</span>` : ''}`;
        }
        pill.onclick = (ev) => { ev.stopPropagation(); openModal(dateKey); };
        body.appendChild(pill);
    });

    if (dayEvents.length > maxVisible) {
        const more = document.createElement('div');
        more.className = 'cal-more';
        more.textContent = `+${dayEvents.length - maxVisible} more`;
        body.appendChild(more);
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
            if (dayEvents.length) cell.classList.add('has-items');

            const body = document.createElement('div');
            body.className = 'cal-day-body';

            const density = getCalendarDensity(document.getElementById('cal-col'));

            if (density === 'mobile' || density === 'compact') {
                if (dayEvents.length) appendCompactMobileDay(body, dayEvents);
            } else {
                const maxVisible = density === 'narrow' ? 1 : density === 'tablet' ? 2 : 3;
                appendPills(body, dayEvents, dateKey, maxVisible, density);
            }

            cell.appendChild(body);
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

    const density = getCalendarDensity(calCol);
    syncDensityClass(density);
    if (density !== lastDensity) lastDensity = density;

    if (monthChanged) {
        updateMonthTitle(currentDate);
        lastMonthKey = monthKey;
    }

    if (!changedKeys || monthChanged || keys.includes('events')) {
        renderGrid(y, m, events);
    }
}

let boundResize = false;
let lastDensity = '';

function refreshCalendarDensity() {
    const col = document.getElementById('cal-col');
    const density = getCalendarDensity(col);
    syncDensityClass(density);
    if (density === lastDensity) return;
    lastDensity = density;
    const { currentDate, events } = getState();
    renderGrid(currentDate.getFullYear(), currentDate.getMonth(), events);
}

export function bindResponsiveCalendar() {
    if (boundResize) return;
    boundResize = true;

    const col = document.getElementById('cal-col');
    window.addEventListener('resize', refreshCalendarDensity);

    if (col && typeof ResizeObserver !== 'undefined') {
        const observer = new ResizeObserver(() => refreshCalendarDensity());
        observer.observe(col);
    }

    lastDensity = getCalendarDensity(col);
    syncDensityClass(lastDensity);
}
