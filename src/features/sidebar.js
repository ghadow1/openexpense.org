import { getState, patch, getColors } from '../core/store.js';
import { Utils } from '../core/utils.js';
import { UI } from '../ui/components.js';
import { closeModal } from './modal.js';

export function renderSidebar() {
    const sidebar = document.getElementById('sidebar');
    if (!sidebar) return;
    sidebar.innerHTML = '';
    const fragment = document.createDocumentFragment();
    const c = getColors();
    const { currentDate, events } = getState();

    const sideHeader = document.createElement('div');
    sideHeader.style.cssText = `display:flex; justify-content:space-between; align-items:center; margin-bottom: 20px;`;

    const sideTitle = document.createElement('h3');
    sideTitle.className = 'sidebar-title';
    sideTitle.innerHTML = `<i class="ti ti-chart-pie"></i> Monthly Summary`;

    const printBtn = UI.createButton('', () => {
        requestAnimationFrame(() => setTimeout(() => window.print(), 50));
    }, { icon: 'printer', iconOnly: true });
    printBtn.className = 'sidebar-print-btn';
    printBtn.setAttribute('aria-label', 'Print monthly summary');
    printBtn.title = 'Print';
    Object.assign(printBtn.style, { height: '28px', padding: '0 8px' });

    sideHeader.append(sideTitle, printBtn);
    fragment.appendChild(sideHeader);

    const y = currentDate.getFullYear();
    const m = currentDate.getMonth();
    const mKey = `${y}-${Utils.pad(m + 1)}`;

    let tTotal = 0, tPaid = 0, tPending = 0;
    let yearlyTotal = 0;
    let monthTotals = new Array(12).fill(0);
    const list = [];

    Object.keys(events).forEach(k => {
        const isCurrentMonth = k.startsWith(mKey);
        const isCurrentYear = k.startsWith(`${y}-`);
        if (!isCurrentMonth && !isCurrentYear) return;

        const currentMonthIdx = isCurrentYear ? parseInt(k.split('-')[1], 10) - 1 : -1;

        events[k].forEach(e => {
            const amt = Utils.getPrice(e);
            if (amt <= 0) return;

            if (isCurrentMonth) {
                tTotal += amt;
                if (e.paid) tPaid += amt; else tPending += amt;
                list.push({ title: e.title, val: amt, date: k, recurring: e.recurring, paid: e.paid, note: e.note });
            }
            if (isCurrentYear) {
                yearlyTotal += amt;
                monthTotals[currentMonthIdx] += amt;
            }
        });
    });

    const pctPaid = tTotal ? (tPaid / tTotal) * 100 : 0;
    const pctPending = tTotal ? (tPending / tTotal) * 100 : 0;

    const statsWrap = document.createElement('div');
    statsWrap.style.cssText = `background: ${c.surface2}; border: 1px solid ${c.border}; border-radius: 8px; padding: 16px; margin-bottom: 20px; box-shadow: ${c.shadowSm};`;
    statsWrap.innerHTML = `
        <div style="display:flex; justify-content:space-between; align-items:flex-end; margin-bottom:12px;">
          <div>
            <div style="font-size:10px; color:${c.text2}; font-weight:600; text-transform:uppercase; letter-spacing:0.05em; margin-bottom:4px;">Total Budget</div>
            <div style="font-size:22px; font-weight:700; color:${c.textStrong}; letter-spacing:-0.02em;">$${tTotal.toFixed(2)}</div>
          </div>
        </div>
        <div class="budget-bar">
          <div class="budget-fill-paid" style="width: ${pctPaid}%"></div>
          <div class="budget-fill-pending" style="width: ${pctPending}%"></div>
        </div>
        <div style="display:flex; justify-content:space-between; margin-top:12px; font-size:12px;">
          <div style="display:flex; align-items:center; gap:6px;">
            <div style="width:8px; height:8px; border-radius:2px; background:${c.success};"></div>
            <span style="color:${c.text2}">Paid <strong style="color:${c.textStrong}; margin-left:2px;">$${tPaid.toFixed(2)}</strong></span>
          </div>
          <div style="display:flex; align-items:center; gap:6px;">
            <div style="width:8px; height:8px; border-radius:2px; background:${c.accent};"></div>
            <span style="color:${c.text2}">Pending <strong style="color:${c.textStrong}; margin-left:2px;">$${tPending.toFixed(2)}</strong></span>
          </div>
        </div>
    `;
    fragment.appendChild(statsWrap);

    const activeMonths = monthTotals.filter(a => a > 0).length || 1;
    const monthlyAvg = yearlyTotal / activeMonths;

    const insightsWrap = document.createElement('div');
    insightsWrap.style.cssText = `margin-bottom: 24px; padding-bottom: 24px; border-bottom: 1px solid ${c.border};`;
    insightsWrap.innerHTML = `<div style="font-size: 11px; text-transform: uppercase; letter-spacing: 0.05em; color: ${c.text2}; font-weight: 600; margin-bottom: 12px;">${y} Projections</div>`;

    const miniGrid = document.createElement('div');
    miniGrid.style.cssText = `display: grid; grid-template-columns: 1fr 1fr; gap: 8px; margin-bottom: 12px;`;
    const mkMiniCard = (icon, label, val) => `
        <div style="background: ${c.surface2}; border: 1px solid ${c.border}; border-radius: 8px; padding: 10px 12px; display: flex; flex-direction: column; gap: 4px;">
          <div style="display: flex; align-items: center; gap: 6px; color: ${c.text2}; font-size: 10px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.05em;">
            <i class="ti ti-${icon}" style="font-size: 13px; color: ${c.accent};"></i> ${label}
          </div>
          <div style="font-size: 15px; font-weight: 700; color: ${c.textStrong}; letter-spacing: -0.01em;">$${val.toFixed(2)}</div>
        </div>
    `;
    miniGrid.innerHTML = mkMiniCard('chart-bar', 'Avg Month', monthlyAvg) + mkMiniCard('wallet', 'Year Total', yearlyTotal);
    insightsWrap.appendChild(miniGrid);

    const maxMonth = Math.max(...monthTotals, 1);
    const graphWrap = document.createElement('div');
    graphWrap.className = 'mini-graph';

    monthTotals.forEach((amt, i) => {
        const pct = (amt / maxMonth) * 100;
        const bar = document.createElement('div');
        const isCur = i === currentDate.getMonth();

        bar.className = 'graph-bar';
        bar.style.background = isCur ? c.accent : c.borderStrong;
        bar.style.height = `${Math.max(pct, 6)}%`;
        bar.style.opacity = isCur ? '1' : '0.4';

        const monthName = new Date(y, i).toLocaleString('default', { month: 'short' });
        Utils.bindTooltip(bar, `${monthName}: $${amt.toFixed(2)}`);

        bar.onmouseenter = () => { bar.style.opacity = '1'; };
        bar.onmouseleave = () => { bar.style.opacity = isCur ? '1' : '0.4'; };
        bar.onclick = () => {
            patch({ currentDate: new Date(y, i, 1) });
            if (getState().selectedKey) closeModal();
        };

        graphWrap.appendChild(bar);
    });
    insightsWrap.appendChild(graphWrap);
    fragment.appendChild(insightsWrap);

    if (list.length > 0) {
        const listHeader = document.createElement('div');
        listHeader.style.cssText = `font-size: 11px; text-transform: uppercase; letter-spacing: 0.05em; color: ${c.text2}; font-weight: 600; margin-bottom: 12px; padding-bottom: 8px; border-bottom: 1px solid ${c.border}`;
        listHeader.textContent = "Expense Items";
        fragment.appendChild(listHeader);

        const ledgerWrap = document.createElement('div');
        ledgerWrap.style.cssText = 'display:flex; flex-direction:column; gap:4px;';

        list.sort((a, b) => a.date.localeCompare(b.date)).forEach(item => {
            const row = document.createElement('div');
            row.style.cssText = `display: flex; justify-content: space-between; align-items: center; padding: 10px 12px; border-radius: 8px; transition: background-color 0.1s; background: ${item.paid ? 'transparent' : c.surface2}; border: 1px solid ${item.paid ? 'transparent' : c.border};`;

            row.onmouseenter = () => { row.style.background = c.surface2; };
            row.onmouseleave = () => { row.style.background = item.paid ? 'transparent' : c.surface2; };
            Utils.bindTooltip(row, item.note);

            row.innerHTML = `
            <div style="display:flex; flex-direction:column; opacity: ${item.paid ? '0.5' : '1'}; min-width:0; flex:1;">
                <span style="color:${c.textStrong}; font-weight: 500; font-size:13px; text-decoration: ${item.paid ? 'line-through' : 'none'}; white-space:nowrap; overflow:hidden; text-overflow:ellipsis; padding-right:8px;">${Utils.escapeHtml(item.title)} ${item.recurring ? '<i class="ti ti-refresh" style="font-size:11px; margin-left:2px; opacity:0.6;"></i>' : ''}</span>
                <span style="font-size: 11px; color:${c.text2}; margin-top:1px;">${item.date}</span>
            </div>
            <span style="font-weight:600; color:${item.paid ? c.text2 : c.textStrong}; font-size:13px; opacity: ${item.paid ? '0.5' : '1'}; flex-shrink:0;">$${item.val.toFixed(2)}</span>
            `;
            ledgerWrap.appendChild(row);
        });
        fragment.appendChild(ledgerWrap);
    } else {
        const empty = document.createElement('div');
        empty.style.cssText = `text-align:center; padding: 32px 0; color: ${c.textMuted}; font-size: 13px;`;
        empty.innerHTML = `<i class="ti ti-receipt" style="font-size:28px; opacity:0.4; margin-bottom:8px; display:block;"></i>No items logged.`;
        fragment.appendChild(empty);
    }
    sidebar.appendChild(fragment);
}
