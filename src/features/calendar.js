/**
 * OpenExpense — month calendar
 *
 * Renders the day grid, collapses same-title pills, opens the day editor,
 * and lets a chip drag onto another day to move those copies. Sunday–Saturday
 * rows get a thin rail from over-daily-safe days (2 = half red, 3+ = full red).
 * In-budget weeks stay unmarked. Day squares stay the surface colour.
 */
import { DAYS } from '../config.js';
import { getState, patch } from '../core/store.js';
import { Utils } from '../core/utils.js';
import { groupExpenses, repeatLabel } from '../core/series.js';
import { computeNetSnapshot, dayNetBadge } from '../core/summary.js';
import { monthDaySpend, trackCalendarWeeks } from '../core/plan.js';
import { UI } from '../ui/components.js';
import { openModal } from './modal.js';
import { moveIndexes } from '../core/day-entries.js';
import { dismissUndo } from './undo-delete.js';
import { Toast } from '../ui/toast.js';
import { clearDropMarks, dayCellFromPoint, makeGhost, placeGhost } from '../ui/pointer-drag.js';

let shellEl = null;
let gridHeadEl = null;
let gridEl = null;
let lastMonthKey = '';
let skipPillOpen = false;

function bindCalendarEntryDrag(grid) {
    if (!grid || grid.dataset.entryDrag === '1') return;
    grid.dataset.entryDrag = '1';

    grid.addEventListener('pointerdown', (event) => {
        const pill = event.target.closest('.pill[data-date]');
        if (!pill || !grid.contains(pill)) return;
        if (event.button != null && event.button !== 0) return;

        const fromKey = pill.dataset.date;
        const indexes = String(pill.dataset.indexes || '')
            .split(',')
            .map(Number)
            .filter((n) => Number.isFinite(n));
        if (!fromKey || !indexes.length) return;

        const originX = event.clientX;
        const originY = event.clientY;
        let dragging = false;
        let destKey = '';
        let ghost = null;

        const move = (ev) => {
            const dx = ev.clientX - originX;
            const dy = ev.clientY - originY;
            if (!dragging && Math.abs(dx) > 8 && Math.abs(dx) >= Math.abs(dy)) {
                dragging = true;
                document.body.classList.add('is-entry-dragging');
                pill.classList.add('is-dragging');
                ghost = makeGhost(pill.textContent.replace(/\s+/g, ' ').trim() || 'Entry');
                try { pill.setPointerCapture(event.pointerId); } catch (_) { /* ignore */ }
            }
            if (!dragging) return;
            placeGhost(ghost, ev.clientX, ev.clientY);
            clearDropMarks(grid, '.cal-day');
            const cell = dayCellFromPoint(ev.clientX, ev.clientY);
            destKey = cell?.dataset.date || '';
            if (destKey && destKey !== fromKey) cell.classList.add('is-drop-target');
        };

        const end = () => {
            window.removeEventListener('pointermove', move, true);
            window.removeEventListener('pointerup', end, true);
            window.removeEventListener('pointercancel', end, true);
            ghost?.remove();
            document.body.classList.remove('is-entry-dragging');
            clearDropMarks(grid, '.cal-day');
            pill.classList.remove('is-dragging');
            if (!dragging) return;
            skipPillOpen = true;
            if (!destKey || destKey === fromKey) return;
            const { events } = getState();
            const next = moveIndexes(events, fromKey, indexes, destKey);
            if (next === events) return;
            dismissUndo();
            patch({ events: next });
            const label = pill.querySelector('.title')?.textContent?.trim() || 'Entry';
            Toast.show(`Moved ${label} to ${destKey}.`, 'success');
        };

        window.addEventListener('pointermove', move, true);
        window.addEventListener('pointerup', end, true);
        window.addEventListener('pointercancel', end, true);
    });
}

function changeMonth(delta) {
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

    const todayBtn = UI.createButton('Today', () => patch({ currentDate: new Date() }), { icon: 'calendar-event', iconOnly: true });
    const searchBtn = UI.createButton('Search', () => {}, { icon: 'search', iconOnly: true });
    searchBtn.setAttribute('data-action', 'search-ledger');
    [[todayBtn, 'Jump to today'], [searchBtn, 'Search entries']].forEach(([btn, label]) => {
        btn.setAttribute('aria-label', label);
        btn.title = label;
    });

    actions.append(todayBtn, searchBtn);
    hdr.append(nav, actions);
    shellEl.appendChild(hdr);

    gridHeadEl = document.createElement('div');
    gridHeadEl.className = 'grid-head';
    const headRail = document.createElement('span');
    headRail.className = 'grid-head-rail';
    headRail.setAttribute('aria-hidden', 'true');
    gridHeadEl.appendChild(headRail);
    DAYS.forEach(d => gridHeadEl.appendChild(Object.assign(document.createElement('span'), { textContent: d })));
    shellEl.appendChild(gridHeadEl);

    gridEl = document.createElement('div');
    gridEl.className = 'cal-grid';
    bindCalendarEntryDrag(gridEl);
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
    const col = colEl || document.getElementById('cal-col');
    const colW = col?.clientWidth || 0;

    if (Utils.isMobile() && colW > 0 && colW < 520) return 'mobile';
    if (colW > 0 && colW < 560) return 'mobile';
    if (colW > 0 && colW < 720) return 'compact';
    if (colW > 0 && colW < 900) return 'narrow';
    if (colW > 0 && colW < 1100) return 'tablet';
    return 'desktop';
}

function syncDensityClass(density) {
    if (shellEl) shellEl.dataset.density = density;
}

function formatDayTotal(amount) {
    const abs = Math.abs(amount);
    if (abs >= 10000) return `$${(abs / 1000).toFixed(0)}k`;
    if (abs >= 1000) return `$${(abs / 1000).toFixed(1)}k`;
    return `$${Math.round(abs)}`;
}

function appendDayTotal(head, dayEvents, overDaily) {
    const badge = dayNetBadge(dayEvents);
    if (!badge) return;

    const up = badge.direction === 'up';
    const down = badge.direction === 'down';
    const label = overDaily ? 'over the daily budget' : (up ? 'net up' : down ? 'net down' : 'net even');
    const spark = up ? '1,6 4.5,3.5 7,5 11,1.5' : down ? '1,2 4.5,4.5 7,3 11,6.5' : '1,4 11,4';

    const total = document.createElement('span');
    total.className = `cal-day-total${up ? ' is-up' : ''}${down ? ' is-down' : ''}${overDaily ? ' is-over' : ''}`;
    total.title = badge.expense > 0 && badge.income > 0
        ? `Net ${up ? '+' : down ? '-' : ''}${Utils.formatMoney(badge.amount)} · spent ${Utils.formatMoney(badge.expense)} · income ${Utils.formatMoney(badge.income)}`
        : (up
            ? `Net +${Utils.formatMoney(badge.amount)}`
            : (down ? `Net -${Utils.formatMoney(badge.amount)}` : 'Net even'));
    total.setAttribute('aria-label', `${Utils.formatMoney(badge.amount)} ${label} this day`);
    total.innerHTML = `
        <svg class="cal-day-spark" viewBox="0 0 12 8" width="12" height="8" aria-hidden="true">
            <polyline points="${spark}"
                fill="none" stroke="currentColor" stroke-width="1.4"
                stroke-linecap="round" stroke-linejoin="round"/>
        </svg>
        <span class="cal-day-total-amt">${formatDayTotal(badge.amount)}</span>
    `;
    head.appendChild(total);
}

function appendCompactMobileDay(body, dayEvents) {
    const dots = document.createElement('div');
    dots.className = 'cal-day-dots';
    const dotCount = Math.min(dayEvents.length, 4);
    for (let j = 0; j < dotCount; j++) {
        const dot = document.createElement('span');
        const income = Utils.entryKind(dayEvents[j]) === 'income';
        dot.className = `cal-day-dot${income ? ' is-income' : ''}${dayEvents[j].paid ? ' is-paid' : ''}`;
        dots.appendChild(dot);
    }
    body.appendChild(dots);
}

function appendPills(body, dayEvents, dateKey, maxVisible, density) {
    const groups = groupExpenses(dayEvents);
    const visible = groups.slice(0, maxVisible);
    visible.forEach((group) => {
        const pill = document.createElement('div');
        const income = group.kind === 'income';
        const compact = density === 'narrow' || density === 'tablet';
        pill.className = `pill${income ? ' is-income' : ''}${group.allPaid ? ' is-paid' : ''}${group.recurring ? ' is-recurring' : ''}${compact ? ' is-compact' : ''}`;
        const title = Utils.escapeHtml(group.title);
        const count = group.count > 1 ? `<span class="pill-count">×${group.count}</span>` : '';
        const amt = group.total > 0 ? `<span class="pill-amt">$${group.total.toFixed(2)}</span>` : '';
        const rec = group.recurring ? '<i class="ti ti-refresh pill-rec" aria-hidden="true"></i>' : '';
        const tips = [income ? 'Income' : 'Expense'];
        if (group.recurring) tips.push(repeatLabel(group.repeat));
        pill.title = `${tips.join(' · ')} · Drag to another day to move`;
        pill.dataset.date = dateKey;
        pill.dataset.indexes = group.items.map((row) => row.i).join(',');
        if (compact) {
            pill.innerHTML = `${amt}<span class="title">${rec}${title}${count}</span>`;
        } else {
            pill.innerHTML = `<span class="title">${rec}${title}${count}</span>${amt}`;
        }
        pill.onclick = (ev) => {
            ev.stopPropagation();
            if (skipPillOpen) {
                skipPillOpen = false;
                return;
            }
            openModal(dateKey);
        };
        body.appendChild(pill);
    });

    const hidden = groups.slice(maxVisible).reduce((sum, group) => sum + group.count, 0);
    if (hidden > 0) {
        const more = document.createElement('div');
        more.className = 'cal-more';
        more.textContent = `+${hidden} more`;
        body.appendChild(more);
    }
}

function weekHintRows(events, currentDate, plan) {
    const snap = computeNetSnapshot(events, currentDate, new Date(), plan);
    const weeks = trackCalendarWeeks(events, currentDate, plan, snap.spendableIncome, {
        dailySafe: snap.dailySafe
    });
    const daily = monthDaySpend(events, currentDate, plan);
    const cap = Utils.toCents(snap.dailySafe);
    const overDays = new Set();
    daily.forEach((amount, index) => {
        if (Utils.toCents(amount) > 0 && Utils.toCents(amount) > cap) overDays.add(index + 1);
    });
    return {
        over: new Set(weeks.filter((week) => (week.overDailyCount || 0) >= 3).map((week) => week.row)),
        warn: new Set(weeks.filter((week) => week.overDailyCount === 2).map((week) => week.row)),
        overDays
    };
}

function visibleDayEvents(rows, filter) {
    if (filter === 'income') return rows.filter((e) => Utils.entryKind(e) === 'income');
    if (filter === 'expense') return rows.filter((e) => Utils.entryKind(e) === 'expense');
    return rows;
}

function paintDayCell(cell, i, firstDay, y, m, today, events, hints) {
    cell.className = 'cal-day';
    cell.replaceChildren();
    cell.onclick = null;
    cell.onkeydown = null;
    cell.removeAttribute('role');
    cell.removeAttribute('tabindex');
    cell.removeAttribute('aria-label');
    delete cell.dataset.date;

    if (i < firstDay) {
        cell.classList.add('is-empty');
        return;
    }

    const d = i - firstDay + 1;
    const dateKey = Utils.dateKey(y, m, d);
    cell.dataset.date = dateKey;
    const isToday = y === today.getFullYear() && m === today.getMonth() && d === today.getDate();

    cell.setAttribute('role', 'button');
    cell.setAttribute('tabindex', '0');
    cell.onclick = () => openModal(dateKey);
    cell.onkeydown = (ev) => {
        if (ev.key === 'Enter' || ev.key === ' ') { ev.preventDefault(); openModal(dateKey); }
    };

    const dayEvents = visibleDayEvents(events[dateKey] || [], getState().trackerFilter);
    if (dayEvents.length) {
        cell.classList.add('has-items');
        if (dayEvents.some((e) => Utils.entryKind(e) === 'expense')) cell.classList.add('has-expense');
        if (dayEvents.some((e) => Utils.entryKind(e) === 'income')) cell.classList.add('has-income');
    }

    const head = document.createElement('div');
    head.className = 'cal-day-head';
    const numLabel = document.createElement('div');
    numLabel.className = `cal-day-num${isToday ? ' is-today' : ''}`;
    numLabel.textContent = d;
    head.appendChild(numLabel);
    const overDaily = hints.overDays.has(d);
    if (overDaily) cell.classList.add('is-over-day');
    if (dayEvents.length) appendDayTotal(head, dayEvents, overDaily);
    cell.appendChild(head);

    const badge = dayNetBadge(dayEvents);
    const moneyHint = !badge
        ? ''
        : (badge.direction === 'up'
            ? `, net up ${Utils.formatMoney(badge.amount)}`
            : (badge.direction === 'down'
                ? `, net down ${Utils.formatMoney(badge.amount)}`
                : ', net even'));
    const row = Math.floor(i / 7);
    const weekHints = [
        hints.over.has(row) ? 'three or more days over the daily budget this week' : '',
        hints.warn.has(row) ? 'two days over the daily budget this week' : ''
    ].filter(Boolean);
    const weekHint = weekHints.length ? `, ${weekHints.join(', ')}` : '';
    cell.setAttribute('aria-label', `Log expense for ${dateKey}${moneyHint}${weekHint}`);

    const body = document.createElement('div');
    body.className = 'cal-day-body';
    const density = getCalendarDensity(document.getElementById('cal-col'));
    if (density === 'mobile' || density === 'compact') {
        if (dayEvents.length) appendCompactMobileDay(body, dayEvents);
    } else {
        const maxVisible = density === 'narrow' ? 1 : density === 'tablet' ? 1 : 3;
        appendPills(body, dayEvents, dateKey, maxVisible, density);
    }
    cell.appendChild(body);
}

function renderGrid(y, m, events, plan) {
    if (!gridEl) return;

    const today = new Date();
    const firstDay = new Date(y, m, 1).getDay();
    const daysInMonth = new Date(y, m + 1, 0).getDate();
    const totalCells = firstDay + daysInMonth;
    const weekCount = Math.ceil(totalCells / 7);
    const hints = weekHintRows(events, new Date(y, m, 1), plan);

    gridEl.replaceChildren();

    for (let row = 0; row < weekCount; row++) {
        const week = document.createElement('div');
        week.className = 'cal-week';
        const over = hints.over.has(row);
        const warn = hints.warn.has(row);
        if (over) week.classList.add('is-over-week');
        if (warn) week.classList.add('is-warn-week');

        const rail = document.createElement('span');
        rail.className = 'cal-week-rail';
        rail.setAttribute('aria-hidden', 'true');
        if (over) rail.title = 'Three or more days over the daily budget';
        else if (warn) rail.title = 'Two days over the daily budget';
        week.appendChild(rail);

        const start = row * 7;
        const end = Math.min(start + 7, totalCells);
        for (let i = start; i < end; i++) {
            const cell = document.createElement('div');
            paintDayCell(cell, i, firstDay, y, m, today, events, hints);
            week.appendChild(cell);
        }
        gridEl.appendChild(week);
    }
}

export function renderCalendar(changedKeys) {
    const calCol = document.getElementById('cal-col');
    if (!calCol) return;

    const { currentDate, events, plan } = getState();
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

    if (!changedKeys || monthChanged || keys.includes('events') || keys.includes('plan') || keys.includes('trackerFilter')) {
        renderGrid(y, m, events, plan);
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
    const { currentDate, events, plan } = getState();
    renderGrid(currentDate.getFullYear(), currentDate.getMonth(), events, plan);
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
