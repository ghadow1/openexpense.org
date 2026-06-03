/**
 * Project: OpenExpense
 * File: app.js
 * Author: Gregory Medina
 * Date: 2026
 *
 * MIT License
 * * Copyright (c) 2026 Gregory Medina
 *
 * Permission is hereby granted, free of charge, to any person obtaining a copy
 * of this software and associated documentation files (the "Software"), to deal
 * in the Software without restriction, including without limitation the rights
 * to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
 * copies of the Software, and to permit persons to whom the Software is
 * furnished to do so, subject to the following conditions:
 *
 * The above copyright notice and this permission notice shall be included in all
 * copies or substantial portions of the Software.
 *
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
 * AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 * LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
 * OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
 * SOFTWARE.
 */

// --- Configuration & Constants ---
const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

const CONFIG = {
    version: "Version 1.0.0",
    buildEnv: "Development",
    defaultTheme: "light",
    allowBannerDismissal: true
};

// --- Theme Definitions ---
const THEMES = {
    light: {
        bg: '#f9f9fb', surface: '#ffffff', surface2: '#f1f5f9',
        border: '#e2e8f0', borderStrong: '#cbd5e1',
        text: '#334155', text2: '#94a3b8', textMuted: '#94a3b8', textStrong: '#0f172a',
        accent: '#6366f1', accentHover: '#1d4ed8',
        btnBg: '#ffffff', btnText: '#334155', btnBorder: '#cbd5e1',
        inputBg: '#ffffff', inputBorder: '#cbd5e1',
        dayBg: '#ffffff', dayBorder: '#efeff2',
        overlay: 'rgba(15, 23, 42, 0.4)',
        pillBg: '#f1f5f9', pillText: '#1e40af', pillBorder: '#bfdbfe',
        dangerBg: '#fef2f2', dangerText: '#b91c1c', dangerBorder: '#fca5a5',
        shadowSm: '0 1px 2px 0 rgba(0, 0, 0, 0.05)', shadowHover: 'rgba(15, 23, 42, 0.03)', success: '#16a34a'
    },
    dark: {
        bg: '#09090b', surface: '#18181b', surface2: '#27272a',
        border: '#3f3f46', borderStrong: '#52525b',
        text: '#a1a1aa', text2: '#71717a', textMuted: '#52525b', textStrong: '#fafafa',
        accent: '#3b82f6', accentHover: '#60a5fa',
        btnBg: '#18181b', btnText: '#e4e4e7', btnBorder: '#3f3f46',
        inputBg: '#18181b', inputBorder: '#3f3f46',
        dayBg: '#18181b', dayBorder: '#27272a',
        overlay: 'rgba(0, 0, 0, 0.65)',
        pillBg: '#1e3a8a', pillText: '#bfdbfe', pillBorder: '#1e40af',
        dangerBg: '#450a0a', dangerText: '#fca5a5', dangerBorder: '#7f1d1d',
        shadowSm: '0 1px 2px 0 rgba(0, 0, 0, 0.4)', shadowHover: 'rgba(0, 0, 0, 0.3)', success: '#22c55e'
    }
};

// --- Application State ---
const AppState = {
    currentDate: new Date(),
    events: {},
    isDark: CONFIG.defaultTheme === 'dark',
    selectedKey: null,
    editingIndex: null,

    getColors: () => AppState.isDark ? THEMES.dark : THEMES.light
};

// --- Core Utilities ---
const Utils = {
    pad: (n) => String(n).padStart(2, '0'),
    dateKey: (y, m, d) => `${y}-${Utils.pad(m + 1)}-${Utils.pad(d)}`,
    getPrice: (e) => {
        if (e.price !== undefined && e.price !== null && e.price !== "") return parseFloat(e.price);
        const match = e.note?.match(/\$(\d+\.?\d*)/);
        return match ? parseFloat(match[1]) : 0;
    },
    bindTooltip: (el, text) => {
        if (!text) return;
        const tt = document.getElementById('global-tooltip');
        el.addEventListener('mouseenter', () => { tt.textContent = text; tt.style.opacity = '1'; });
        el.addEventListener('mousemove', (e) => { tt.style.left = `${e.clientX}px`; tt.style.top = `${e.clientY - 15}px`; });
        el.addEventListener('mouseleave', () => { tt.style.opacity = '0'; });
    }
};

// --- UI Element Factory ---
const UI = {
    createButton: (label, onClick, opts = {}) => {
        const c = AppState.getColors();
        const btn = document.createElement('button');

        if (opts.icon) {
            btn.innerHTML = `<i class="ti ti-${opts.icon}" style="font-size: 15px;"></i>${label ? `<span style="margin-left: 6px;">${label}</span>` : ''}`;
        } else {
            btn.textContent = label;
        }

        btn.onclick = onClick;

        const bg = opts.accent ? c.accent : opts.danger ? c.dangerBg : c.btnBg;
        const col = opts.accent ? '#fff' : opts.danger ? c.dangerText : (opts.iconOnly ? c.text : c.btnText);
        const bdr = opts.accent ? c.accent : opts.danger ? c.dangerBorder : c.btnBorder;

        Object.assign(btn.style, {
            display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
            padding: (opts.icon && !label) ? '6px' : '6px 12px',
            fontSize: '13px', fontWeight: '500', borderRadius: '6px', cursor: 'pointer',
            whiteSpace: 'nowrap', border: `1px solid ${bdr}`, background: bg, color: col,
            transition: 'all 0.1s ease', outline: 'none', height: '34px',
            boxShadow: opts.accent ? `0 1px 2px ${c.accent}20` : c.shadowSm
        });

        btn.onmouseenter = () => {
            btn.style.background = opts.accent ? c.accentHover : opts.danger ? c.dangerBorder : c.surface2;
            if (!opts.accent && !opts.danger) btn.style.color = c.textStrong;
        };
        btn.onmouseleave = () => { btn.style.background = bg; btn.style.color = col; };
        return btn;
    },

    createInput: (id, val, placeholder, type = 'text') => {
        const c = AppState.getColors();
        const el = document.createElement(type === 'textarea' ? 'textarea' : 'input');

        el.id = id;
        el.placeholder = placeholder || '';

        if (type === 'textarea') {
            el.value = val || '';
            el.style.height = '62px';
            el.style.resize = 'vertical';
        } else if (type === 'checkbox') {
            el.type = 'checkbox';
            el.checked = !!val;
            return el;
        } else {
            el.type = type;
            el.value = val || '';
            if (type === 'number') el.step = '0.01';
        }

        Object.assign(el.style, {
            width: '100%', background: c.inputBg, border: `1px solid ${c.inputBorder}`,
            borderRadius: '6px', color: c.textStrong, padding: '8px 12px',
            fontSize: '13px', fontFamily: 'inherit', boxSizing: 'border-box',
            transition: 'border-color 0.1s, box-shadow 0.1s'
        });

        el.onfocus = () => { el.style.borderColor = c.accent; el.style.boxShadow = `0 0 0 3px ${c.accent}15`; };
        el.onblur = () => { el.style.borderColor = c.inputBorder; el.style.boxShadow = 'none'; };
        return el;
    },

    createFieldGroup: (id, label, val, placeholder, type = 'text') => {
        const wrap = document.createElement('div'); wrap.className = 'input-group';
        const lbl = document.createElement('label'); lbl.className = 'input-label';
        lbl.textContent = label; lbl.htmlFor = id;
        wrap.append(lbl, UI.createInput(id, val, placeholder, type));
        return wrap;
    }
};

// --- View Rendering ---
function applyTheme() {
    const c = AppState.getColors();
    const root = document.documentElement;
    document.body.style.background = c.bg;

    Object.keys(c).forEach(k => root.style.setProperty(`--${k.replace(/[A-Z]/g, m => "-" + m.toLowerCase())}`, c[k]));
    root.style.setProperty('--day-bg', c.dayBg);
    root.style.setProperty('--day-border', c.dayBorder);
    root.style.setProperty('--pill-bg', c.pillBg);
}

function render() {
    applyTheme();
    renderToolbar();
    renderCalendar();
    renderSidebar();
}

function renderToolbar() {
    const toggleSlot = document.getElementById('theme-toggle-slot');
    if (toggleSlot) {
        toggleSlot.innerHTML = '';
        const btn = UI.createButton('', () => {
            AppState.isDark = !AppState.isDark;
            render();
            if (AppState.selectedKey) renderModal();
        }, { icon: AppState.isDark ? 'sun' : 'moon', iconOnly: true });

        Object.assign(btn.style, {
            fontSize: '10px', fontWeight: '600', background: 'var(--surface2)',
            border: '1px solid var(--border)', color: 'var(--text2)', padding: '2px 6px',
            borderRadius: '4px', height: 'auto', boxShadow: 'none', width: 'auto'
        });
        toggleSlot.appendChild(btn);
    }
}

function renderCalendar() {
    const calCol = document.getElementById('cal-col');
    calCol.innerHTML = '';
    const fragment = document.createDocumentFragment();
    const c = AppState.getColors();

    const hdr = document.createElement('div'); hdr.className = 'toolbar';
    const nav = document.createElement('div'); nav.className = 'nav-group';
    const titleStr = AppState.currentDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });

    nav.append(
        UI.createButton('', () => changeMonth(-1), { icon: 'chevron-left', iconOnly: true }),
        Object.assign(document.createElement('div'), { className: 'month-title', textContent: titleStr }),
        UI.createButton('', () => changeMonth(1), { icon: 'chevron-right', iconOnly: true })
    );

    const actions = document.createElement('div'); actions.className = 'nav-group';
    const fileInput = document.createElement('input');
    fileInput.type = 'file'; fileInput.style.display = 'none'; fileInput.onchange = loadJSON;

    actions.append(
        UI.createButton('Today', () => { AppState.currentDate = new Date(); render(); }),
        Object.assign(document.createElement('div'), { style: `width:1px; height:16px; background:${c.border}; margin: 0 4px;` }),
        fileInput,
        UI.createButton('Import', () => fileInput.click(), { icon: 'upload' }),
        UI.createButton('Export', exportJSON, { icon: 'download' })
    );
    hdr.append(nav, actions);
    fragment.appendChild(hdr);

    const gridHead = document.createElement('div'); gridHead.className = 'grid-head';
    DAYS.forEach(d => gridHead.appendChild(Object.assign(document.createElement('span'), { textContent: d })));
    fragment.appendChild(gridHead);

    const y = AppState.currentDate.getFullYear();
    const m = AppState.currentDate.getMonth();
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

            cell.onclick = () => openModal(dateKey);

            const numLabel = document.createElement('div');
            Object.assign(numLabel.style, {
                fontSize: '12px', fontWeight: '600', width: '22px', height: '22px',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                borderRadius: '4px', background: isToday ? c.accent : 'transparent',
                color: isToday ? '#fff' : c.textStrong, marginBottom: '4px'
            });
            numLabel.textContent = d;
            cell.appendChild(numLabel);

            const dayEvents = AppState.events[dateKey] || [];
            dayEvents.slice(0, 4).forEach(e => {
                const pill = document.createElement('div'); pill.className = `pill ${e.paid ? 'is-paid' : ''}`;
                const amt = Utils.getPrice(e);
                pill.innerHTML = `<span class="title">${e.title}</span> ${amt > 0 ? `<span style="opacity:0.85; font-size: 10px;">$${amt.toFixed(2)}</span>` : ''}`;
                pill.onclick = (ev) => { ev.stopPropagation(); openModal(dateKey); };
                cell.appendChild(pill);
            });

            if (dayEvents.length > 4) {
                const more = document.createElement('div');
                more.style.cssText = `font-size:10px; color:${c.text2}; padding-left:4px; font-weight:600; margin-top:2px;`;
                more.textContent = `+${dayEvents.length - 4} more`;
                cell.appendChild(more);
            }
        } else {
            Object.assign(cell.style, { opacity: '0.3', pointerEvents: 'none', background: 'transparent', border: 'none' });
        }
        grid.appendChild(cell);
    }

    fragment.appendChild(grid);
    calCol.appendChild(fragment);
}

function renderSidebar() {
    const sidebar = document.getElementById('sidebar');
    sidebar.innerHTML = '';
    const fragment = document.createDocumentFragment();
    const c = AppState.getColors();

    const sideHeader = document.createElement('div');
    sideHeader.style.cssText = `display:flex; justify-content:space-between; align-items:center; margin-bottom: 20px;`;

    const sideTitle = document.createElement('h3');
    sideTitle.style.cssText = `color:${c.textStrong}; font-weight: 600; font-size: 14px; display:flex; align-items:center; gap:8px; height:34px;`;
    sideTitle.innerHTML = `<i class="ti ti-chart-pie" style="color:${c.accent}"></i> Monthly Summary`;

    const printBtn = UI.createButton('', () => window.print(), { icon: 'printer', iconOnly: true });
    // Minimal styling adjustment for the print button
    printBtn.style.height = '28px';
    printBtn.style.padding = '0 8px';

    sideHeader.appendChild(sideTitle);
    sideHeader.appendChild(printBtn);
    fragment.appendChild(sideHeader);

    const y = AppState.currentDate.getFullYear();
    const m = AppState.currentDate.getMonth();
    const mKey = `${y}-${Utils.pad(m + 1)}`;

    let tTotal = 0, tPaid = 0, tPending = 0;
    let yearlyTotal = 0;
    let monthTotals = new Array(12).fill(0);
    const list = [];

    // Math & Metric Loop
    Object.keys(AppState.events).forEach(k => {
        const isCurrentMonth = k.startsWith(mKey);
        const isCurrentYear = k.startsWith(`${y}-`);
        if (!isCurrentMonth && !isCurrentYear) return;

        const currentMonthIdx = isCurrentYear ? parseInt(k.split('-')[1], 10) - 1 : -1;

        AppState.events[k].forEach(e => {
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

    // Render rolling chart
    const maxMonth = Math.max(...monthTotals, 1);
    const graphWrap = document.createElement('div');
    graphWrap.className = 'mini-graph';

    monthTotals.forEach((amt, i) => {
        const pct = (amt / maxMonth) * 100;
        const bar = document.createElement('div');
        const isCur = i === AppState.currentDate.getMonth();

        bar.className = 'graph-bar';
        bar.style.background = isCur ? c.accent : c.borderStrong;
        bar.style.height = `${Math.max(pct, 6)}%`;
        bar.style.opacity = isCur ? '1' : '0.4';

        const monthName = new Date(y, i).toLocaleString('default', { month: 'short' });
        Utils.bindTooltip(bar, `${monthName}: $${amt.toFixed(2)}`);

        bar.onmouseenter = () => { bar.style.opacity = '1'; };
        bar.onmouseleave = () => { bar.style.opacity = isCur ? '1' : '0.4'; };
        bar.onclick = () => { AppState.currentDate = new Date(y, i, 1); if (AppState.selectedKey) closeModal(); render(); };

        graphWrap.appendChild(bar);
    });
    insightsWrap.appendChild(graphWrap);
    fragment.appendChild(insightsWrap);

    // List Rendering
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
                <span style="color:${c.textStrong}; font-weight: 500; font-size:13px; text-decoration: ${item.paid ? 'line-through' : 'none'}; white-space:nowrap; overflow:hidden; text-overflow:ellipsis; padding-right:8px;">${item.title} ${item.recurring ? '<i class="ti ti-refresh" style="font-size:11px; margin-left:2px; opacity:0.6;"></i>' : ''}</span>
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

// --- Modal & Interaction Handlers ---
function changeMonth(delta) {
    AppState.currentDate = new Date(AppState.currentDate.getFullYear(), AppState.currentDate.getMonth() + delta, 1);
    render();
}

function openModal(key) {
    AppState.selectedKey = key;
    AppState.editingIndex = null;
    document.getElementById('modal').classList.add('open');
    renderModal();
}

function closeModal() {
    AppState.selectedKey = null;
    AppState.editingIndex = null;
    document.getElementById('modal').classList.remove('open');
}

function bgClose(e) { if (e.target === document.getElementById('modal')) closeModal(); }
document.getElementById('modal').addEventListener('keydown', e => { if (e.key === 'Escape') closeModal(); });

function renderModal() {
    if (!AppState.selectedKey) return;
    const c = AppState.getColors();

    const [y, m, d] = AppState.selectedKey.split('-');
    const dateObj = new Date(+y, +m - 1, +d);

    // Target the new 50/50 Layout Containers built in index.html
    const titleEl = document.getElementById('modal-date-title');
    if (titleEl) {
        titleEl.textContent = dateObj.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' });
    }

    const eventsContainer = document.getElementById('events-container');
    const formContainer = document.getElementById('form-container');

    if (eventsContainer) {
        eventsContainer.innerHTML = '';
        const list = AppState.events[AppState.selectedKey] || [];
        if (!list.length) {
            const p = document.createElement('p');
            p.style.cssText = `font-size:13px; color:${c.textMuted}; padding: 16px 0; border-bottom: 1px solid ${c.border}`;
            p.textContent = 'No expenses logged on this date.';
            eventsContainer.appendChild(p);
        } else {
            list.forEach((e, i) => eventsContainer.appendChild(buildRow(e, i)));
        }
    }

    if (formContainer) {
        formContainer.innerHTML = '';
        const form = document.createElement('form');
        form.className = 'record-form';
        form.onsubmit = (e) => { e.preventDefault(); addEvent(); };

        form.appendChild(UI.createFieldGroup('et', 'Title', '', 'e.g. Server Invoice'));

        const splitRow = document.createElement('div'); splitRow.className = 'form-row-split';

        const costWrap = UI.createFieldGroup('ep', 'Cost', '', '0.00', 'number');
        costWrap.style.flex = '0 0 45%';
        const costInput = costWrap.querySelector('input');
        costInput.style.paddingLeft = '24px';
        const dollarSign = document.createElement('span');
        dollarSign.style.cssText = `position:absolute; left:12px; top:31px; color:${c.text2}; font-weight:500; font-size:13px;`;
        dollarSign.textContent = '$';
        costWrap.style.position = 'relative'; costWrap.appendChild(dollarSign);
        splitRow.appendChild(costWrap);

        const optWrap = document.createElement('div');
        optWrap.style.cssText = 'display:flex; gap:20px; flex:1; padding-bottom: 3px;';
        optWrap.innerHTML = `
            <label class="custom-cb"><input type="checkbox" id="er"><span>Recurring</span></label>
            <label class="custom-cb"><input type="checkbox" id="epad"><span>Paid</span></label>
        `;
        splitRow.appendChild(optWrap);
        form.appendChild(splitRow);

        form.appendChild(UI.createFieldGroup('en', 'Notes', '', 'Optional context...', 'textarea'));

        const act = document.createElement('div'); act.style.cssText = 'display:flex; justify-content:flex-end; margin-top: 6px;';
        const submitBtn = UI.createButton('Save Item', null, { icon: 'plus', accent: true });
        submitBtn.type = 'submit';
        act.appendChild(submitBtn);
        form.appendChild(act);

        formContainer.appendChild(form);

        setTimeout(() => {
            const etEl = document.getElementById('et');
            if (etEl) etEl.focus();
        }, 60);
    }
}

function buildRow(e, i) {
    if (AppState.editingIndex === i) return buildEditRow(e, i);

    const row = document.createElement('div'); row.id = `row-${i}`; row.className = 'event-row';
    const info = document.createElement('div'); info.className = 'event-info';
    const titleRow = document.createElement('div'); titleRow.className = 'event-header';

    const t = document.createElement('span');
    t.className = `event-title ${e.paid ? 'paid' : ''}`;
    t.textContent = e.title;
    titleRow.appendChild(t);

    const amt = Utils.getPrice(e);
    if (amt > 0) {
        const badge = document.createElement('span'); badge.className = 'event-badge';
        badge.textContent = `$${amt.toFixed(2)}`;
        titleRow.appendChild(badge);
    }
    if (e.recurring) {
        const rec = document.createElement('span'); rec.className = 'event-badge-icon';
        rec.innerHTML = '<i class="ti ti-refresh"></i>';
        titleRow.appendChild(rec);
    }
    info.appendChild(titleRow);

    if (e.note) {
        const n = document.createElement('p');
        n.style.cssText = `font-size:13px; color:var(--text2); line-height:1.5; margin-top: 4px;`;
        n.textContent = e.note;
        info.appendChild(n);
    }
    row.appendChild(info);

    const act = document.createElement('div'); act.className = 'row-actions';

    const editBtn = document.createElement('button'); editBtn.className = 'btn-icon-edit';
    editBtn.innerHTML = '<i class="ti ti-edit" style="font-size:15px;"></i>';
    editBtn.onclick = () => startEdit(i);

    const delBtn = document.createElement('button'); delBtn.className = 'btn-icon-delete';
    delBtn.innerHTML = '<i class="ti ti-trash" style="font-size:15px;"></i>';
    delBtn.onclick = () => deleteEv(i);

    act.append(editBtn, delBtn);
    row.appendChild(act);

    return row;
}

function buildEditRow(e, i) {
    const c = AppState.getColors(); const wrap = document.createElement('div'); wrap.id = `row-${i}`;
    Object.assign(wrap.style, { padding: '16px', background: c.surface2, borderRadius: '8px', border: `1px solid ${c.borderStrong}`, marginBottom: '12px', marginTop: '12px' });

    const form = document.createElement('div'); form.className = 'form-grid'; form.style.margin = '0';
    form.appendChild(UI.createFieldGroup(`edit-title-${i}`, 'Title', e.title));

    const row2 = document.createElement('div'); row2.className = 'form-row';

    const pWrap = UI.createFieldGroup(`edit-price-${i}`, 'Cost', Utils.getPrice(e) || '', '0.00', 'number');
    pWrap.querySelector('input').style.paddingLeft = '24px';
    const dollar = document.createElement('span'); dollar.style.cssText = `position:absolute; left:10px; top:31px; color:${c.text2}; font-weight:500; font-size:13px;`; dollar.textContent = '$';
    pWrap.style.position = 'relative'; pWrap.appendChild(dollar); row2.appendChild(pWrap);

    const optWrap = document.createElement('div'); optWrap.className = 'input-group'; optWrap.style.justifyContent = 'flex-end';
    const optRow = document.createElement('div'); optRow.style.cssText = 'display:flex; gap:16px; height: 35px; align-items:center;';

    const recWrap = document.createElement('label'); recWrap.className = 'cb-wrap';
    const recCb = UI.createInput(`edit-rec-${i}`, e.recurring, '', 'checkbox'); recWrap.append(recCb, Object.assign(document.createElement('span'), { textContent: 'Recurring' }));

    const paidWrap = document.createElement('label'); paidWrap.className = 'cb-wrap';
    const paidCb = UI.createInput(`edit-paid-${i}`, e.paid, '', 'checkbox'); paidWrap.append(paidCb, Object.assign(document.createElement('span'), { textContent: 'Paid' }));

    optRow.append(recWrap, paidWrap); optWrap.appendChild(optRow); row2.appendChild(optWrap); form.appendChild(row2);

    form.appendChild(UI.createFieldGroup(`edit-note-${i}`, 'Notes', e.note || '', '', 'textarea'));
    wrap.appendChild(form);

    const act = document.createElement('div'); act.style.cssText = 'display:flex; gap:8px; margin-top:16px; justify-content:flex-end;';
    act.appendChild(UI.createButton('Cancel', () => { AppState.editingIndex = null; renderModal(); }));
    act.appendChild(UI.createButton('Update', () => saveEdit(i), { icon: 'check', accent: true }));
    wrap.appendChild(act);

    setTimeout(() => {
        const edEl = document.getElementById(`edit-title-${i}`);
        if (edEl) edEl.focus();
    }, 60); return wrap;
}

function startEdit(i) {
    AppState.editingIndex = i;
    const listEl = document.getElementById('events-container');
    const list = AppState.events[AppState.selectedKey] || [];
    listEl.innerHTML = '';
    list.forEach((e, idx) => listEl.appendChild(buildRow(e, idx)));
}

function propagateRecurring(baseEvent, startKey) {
    const [y, m, d] = startKey.split('-').map(Number);

    for (let i = 1; i <= 12; i++) {
        let nextM = m + i; let nextY = y;
        if (nextM > 12) { nextY += Math.floor((nextM - 1) / 12); nextM = ((nextM - 1) % 12) + 1; }

        const daysInNextMonth = new Date(nextY, nextM, 0).getDate();
        const nextD = Math.min(d, daysInNextMonth);
        const nextKey = `${nextY}-${Utils.pad(nextM)}-${Utils.pad(nextD)}`;

        if (!AppState.events[nextKey]) AppState.events[nextKey] = [];
        const exists = AppState.events[nextKey].some(e => e.title === baseEvent.title && e.recurring === true);
        if (!exists) AppState.events[nextKey].push({ ...baseEvent, paid: false });
    }
}

function saveEdit(i) {
    const title = document.getElementById(`edit-title-${i}`).value.trim(); if (!title) return;
    const isRecurring = document.getElementById(`edit-rec-${i}`).checked;
    const price = document.getElementById(`edit-price-${i}`).value;

    const updatedEv = {
        title, note: document.getElementById(`edit-note-${i}`).value.trim(),
        price: price ? parseFloat(price) : null, recurring: isRecurring,
        paid: document.getElementById(`edit-paid-${i}`).checked
    };

    AppState.events[AppState.selectedKey][i] = updatedEv;
    if (isRecurring) propagateRecurring(updatedEv, AppState.selectedKey);
    AppState.editingIndex = null;
    renderModal();
    render();
}

function deleteEv(i) {
    const row = document.getElementById(`row-${i}`);
    const go = () => {
        AppState.events[AppState.selectedKey].splice(i, 1);
        if (!AppState.events[AppState.selectedKey].length) delete AppState.events[AppState.selectedKey];
        AppState.editingIndex = null;
        renderModal();
        render();
    };
    if (row) { Object.assign(row.style, { opacity: '0', maxHeight: '0', padding: '0', overflow: 'hidden' }); setTimeout(go, 120); } else go();
}

function addEvent() {
    const t = document.getElementById('et').value.trim(); if (!t) return;
    const p = document.getElementById('ep').value;
    const isRecurring = document.getElementById('er').checked;

    const newEv = {
        title: t, note: document.getElementById('en').value.trim(),
        price: p ? parseFloat(p) : null, recurring: isRecurring,
        paid: document.getElementById('epad').checked
    };

    if (!AppState.events[AppState.selectedKey]) AppState.events[AppState.selectedKey] = [];
    AppState.events[AppState.selectedKey].push(newEv);
    if (isRecurring) propagateRecurring(newEv, AppState.selectedKey);
    renderModal();
    render();
}

// --- Data Management ---
function loadJSON(evt) {
    const f = evt.target.files[0];
    if (!f) return;
    const r = new FileReader();
    r.onload = () => {
        try {
            const p = JSON.parse(r.result);
            AppState.events = p.events || p;
            render();
        } catch {
            alert('Invalid file layout');
        }
    };
    r.readAsText(f);
    evt.target.value = '';
}

function exportJSON() {
    const dataBlob = new Blob([JSON.stringify({ events: AppState.events }, null, 2)], { type: 'application/json' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(dataBlob);
    a.download = 'ledger.json';
    a.click();
    URL.revokeObjectURL(a.href);
}

// --- Initialization ---
function initApplication() {
    const versionBadge = document.getElementById('app-version');
    if (versionBadge && CONFIG.version) {
        versionBadge.textContent = CONFIG.version;
        versionBadge.style.display = 'inline-block';
        if (CONFIG.buildEnv) Utils.bindTooltip(versionBadge, `Environment: ${CONFIG.buildEnv}`);
    }

    if (!CONFIG.allowBannerDismissal) {
        document.querySelector('.top-banner .close-banner')?.remove();
    }

    switchView('app'); // Ensure the UI view logic starts attached
    render();
}

// Re-expose view-switching utilities missing from original file
function switchView(viewName) {
    const appView = document.getElementById('view-app');
    const docsView = document.getElementById('view-docs');
    const tabApp = document.getElementById('vt-app');
    const tabDocs = document.getElementById('vt-docs');

    if (viewName === 'app') {
        if (appView) appView.classList.remove('hidden');
        if (docsView) docsView.classList.add('hidden');
        if (tabApp) tabApp.classList.add('active');
        if (tabDocs) tabDocs.classList.remove('active');
        render();
    } else {
        if (appView) appView.classList.add('hidden');
        if (docsView) docsView.classList.remove('hidden');
        if (tabApp) tabApp.classList.remove('active');
        if (tabDocs) tabDocs.classList.add('active');
    }
}

function switchDocTab(tabName) {
    document.querySelectorAll('.docs-pane').forEach(p => p.classList.remove('active'));
    document.querySelectorAll('.docs-nav-tab').forEach(t => t.classList.remove('active'));
    document.getElementById(`pane-${tabName}`)?.classList.add('active');
    document.getElementById(`dt-${tabName}`)?.classList.add('active');
}

// Bind to window so HTML inline onclicks still work
window.switchView = switchView;
window.switchDocTab = switchDocTab;
window.dismissBanner = () => document.getElementById('top-banner')?.remove();

document.addEventListener('DOMContentLoaded', initApplication);