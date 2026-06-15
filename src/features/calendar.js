import { DAYS } from '../config.js';
import { getState, patch } from '../core/store.js';
import { Utils } from '../core/utils.js';
import { UI } from '../ui/components.js';
import { Ledger } from './ledger.js';
import { Receipt } from './receipt.js';
import { openModal } from './modal.js';
import { render } from '../app/render.js';

export function changeMonth(delta) {
    const { currentDate } = getState();
    patch({
        currentDate: new Date(currentDate.getFullYear(), currentDate.getMonth() + delta, 1)
    });
    render();
}

export function renderCalendar() {
    const calCol = document.getElementById('cal-col');
    if (!calCol) return;
    calCol.innerHTML = '';
    const fragment = document.createDocumentFragment();
    const { currentDate, events } = getState();

    const hdr = document.createElement('div'); hdr.className = 'toolbar';
    const nav = document.createElement('div'); nav.className = 'nav-group';
    const titleStr = currentDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });

    nav.append(
        UI.createButton('', () => changeMonth(-1), { icon: 'chevron-left', iconOnly: true }),
        Object.assign(document.createElement('div'), { className: 'month-title', textContent: titleStr }),
        UI.createButton('', () => changeMonth(1), { icon: 'chevron-right', iconOnly: true })
    );

    const actions = document.createElement('div'); actions.className = 'nav-group toolbar-actions';
    const divider = () => Object.assign(document.createElement('div'), { className: 'nav-divider' });

    actions.append(
        UI.createButton('Today', () => { patch({ currentDate: new Date() }); render(); }),
        divider(),
        UI.createButton('Import', Ledger.import, { icon: 'upload' }),
        UI.createButton('Export', Ledger.export, { icon: 'download' }),
        divider(),
        UI.createButton(Utils.isMobile() ? 'Scan' : 'Scan Receipt', () => Receipt.pickImage(), { icon: 'camera' })
    );
    hdr.append(nav, actions);
    fragment.appendChild(hdr);

    const gridHead = document.createElement('div'); gridHead.className = 'grid-head';
    DAYS.forEach(d => gridHead.appendChild(Object.assign(document.createElement('span'), { textContent: d })));
    fragment.appendChild(gridHead);

    const y = currentDate.getFullYear();
    const m = currentDate.getMonth();
    const today = new Date();
    const firstDay = new Date(y, m, 1).getDay();
    const daysInMonth = new Date(y, m + 1, 0).getDate();
    const grid = document.createElement('div'); grid.className = 'cal-grid';

    for (let i = 0; i < firstDay + daysInMonth; i++) {
        const cell = document.createElement('div'); cell.className = 'cal-day';

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
                const pill = document.createElement('div'); pill.className = `pill ${e.paid ? 'is-paid' : ''}`;
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
        grid.appendChild(cell);
    }

    fragment.appendChild(grid);
    calCol.appendChild(fragment);
}
