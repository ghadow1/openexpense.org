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

const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
let cur = new Date(), evs = {}, dark = false, sel = null, editingIdx = null;

// Default application structural configuration state
let config = {
    version: "Version 1.0.0",
    buildEnv: "Development",
    defaultTheme: "light",
    allowBannerDismissal: true
};

const L = {
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
};

const D = {
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
};

const C = () => dark ? D : L;

function pad(n) { return String(n).padStart(2, '0'); }
function dkey(y, m, d) { return y + '-' + pad(m + 1) + '-' + pad(d); }
function getPrice(e) {
    if (e.price !== undefined && e.price !== null && e.price !== "") return parseFloat(e.price);
    const match = e.note && e.note.match(/\$(\d+\.?\d*)/);
    return match ? parseFloat(match[1]) : 0;
}

function applyCSSVars() {
    const c = C();
    document.body.style.background = c.bg;
    const root = document.documentElement;
    Object.keys(c).forEach(k => root.style.setProperty(`--${k.replace(/[A-Z]/g, m => "-" + m.toLowerCase())}`, c[k]));
}

function dismissBanner() {
    const banner = document.getElementById('top-banner');
    if (banner) banner.remove();
}

function switchView(viewName) {
    const appView = document.getElementById('view-app');
    const docsView = document.getElementById('view-docs');
    const tabApp = document.getElementById('vt-app');
    const tabDocs = document.getElementById('vt-docs');

    if (viewName === 'app') {
        appView.classList.remove('hidden');
        docsView.classList.add('hidden');
        tabApp.classList.add('active');
        tabDocs.classList.remove('active');
        render();
    } else {
        appView.classList.add('hidden');
        docsView.classList.remove('hidden');
        tabApp.classList.remove('active');
        tabDocs.classList.add('active');
    }
}

function switchDocTab(tabName) {
    document.querySelectorAll('.docs-pane').forEach(p => p.classList.remove('active'));
    document.querySelectorAll('.docs-nav-tab').forEach(t => t.classList.remove('active'));

    document.getElementById(`pane-${tabName}`).classList.add('active');
    document.getElementById(`dt-${tabName}`).classList.add('active');
}

function mkBtn(label, onclick, opts = {}) {
    const c = C(), b = document.createElement('button');
    if (opts.icon) {
        const i = document.createElement('i'); i.className = `ti ti-${opts.icon}`; i.style.fontSize = '15px'; b.appendChild(i);
        if (label) { const s = document.createElement('span'); s.textContent = label; s.style.marginLeft = '6px'; b.appendChild(s); }
    } else { b.textContent = label; }
    b.onclick = onclick;

    const bg = opts.accent ? c.accent : opts.danger ? c.dangerBg : c.btnBg;
    const col = opts.accent ? '#fff' : opts.danger ? c.dangerText : (opts.iconOnly ? c.text : c.btnText);
    const bdr = opts.accent ? c.accent : opts.danger ? c.dangerBorder : c.btnBorder;

    Object.assign(b.style, {
        display: 'inline-flex', alignItems: 'center', justifyContent: 'center', padding: (opts.icon && !label) ? '6px' : '6px 12px',
        fontSize: '13px', fontWeight: '500', borderRadius: '6px', cursor: 'pointer', whiteSpace: 'nowrap',
        border: `1px solid ${bdr}`, background: bg, color: col, transition: 'all 0.1s ease', outline: 'none',
        boxShadow: opts.accent ? `0 1px 2px ${c.accent}20` : c.shadowSm, height: '34px'
    });

    b.onmouseenter = () => {
        b.style.background = opts.accent ? c.accentHover : opts.danger ? c.dangerBorder : c.surface2;
        if (!opts.accent && !opts.danger) b.style.color = c.textStrong;
    };
    b.onmouseleave = () => { b.style.background = bg; b.style.color = col; };
    return b;
}

function mkInput(id, val, placeholder, type = 'text') {
    const c = C(), el = document.createElement(type === 'textarea' ? 'textarea' : 'input');
    el.id = id; el.placeholder = placeholder || '';

    if (type === 'textarea') {
        el.value = val || ''; el.style.height = '62px'; el.style.resize = 'vertical';
    } else if (type === 'checkbox') {
        el.type = 'checkbox'; el.checked = !!val;
        return el;
    } else {
        el.type = type; el.value = val || ''; if (type === 'number') el.step = '0.01';
    }

    Object.assign(el.style, { width: '100%', background: c.inputBg, border: `1px solid ${c.inputBorder}`, borderRadius: '6px', color: c.textStrong, padding: '8px 12px', fontSize: '13px', fontFamily: 'inherit', boxSizing: 'border-box', transition: 'border-color 0.1s, box-shadow 0.1s' });
    el.onfocus = () => { el.style.borderColor = c.accent; el.style.boxShadow = `0 0 0 3px ${c.accent}15`; };
    el.onblur = () => { el.style.borderColor = c.inputBorder; el.style.boxShadow = 'none'; };
    return el;
}

const tt = document.getElementById('global-tooltip');
function bindTooltip(el, text) {
    if (!text) return;
    el.addEventListener('mouseenter', () => { tt.textContent = text; tt.style.opacity = '1'; });
    el.addEventListener('mousemove', (e) => { tt.style.left = e.clientX + 'px'; tt.style.top = (e.clientY - 15) + 'px'; });
    el.addEventListener('mouseleave', () => { tt.style.opacity = '0'; });
}

/* Optimized Rendering Pipeline using Single-Pass Fragments */
function render() {
    applyCSSVars(); const c = C();
    document.documentElement.style.setProperty('--day-bg', c.dayBg);
    document.documentElement.style.setProperty('--day-border', c.dayBorder);
    document.documentElement.style.setProperty('--pill-bg', c.pillBg);

    const toggleSlot = document.getElementById('theme-toggle-slot');
    if (toggleSlot) {
        toggleSlot.innerHTML = '';
        const btn = mkBtn('', () => { dark = !dark; render(); if (sel) renderModal(); }, { icon: dark ? 'sun' : 'moon', iconOnly: true });
        // Override mkBtn styles to match brand-badge
        Object.assign(btn.style, {
            fontSize: '10px',
            fontWeight: '600',
            background: 'var(--surface2)',
            border: '1px solid var(--border)',
            color: 'var(--text2)',
            padding: '2px 6px',
            borderRadius: '4px',
            height: 'auto',
            boxShadow: 'none',
            width: 'auto',
        });
        // Also fix the icon size inside
        const icon = btn.querySelector('i');
        if (icon) icon.style.fontSize = '10px';
        toggleSlot.appendChild(btn);
    }

    const calCol = document.getElementById('cal-col'); const sidebar = document.getElementById('sidebar');
    calCol.innerHTML = ''; sidebar.innerHTML = '';

    const calFragment = document.createDocumentFragment();
    const sideFragment = document.createDocumentFragment();

    // Toolbar Frame Setup
    const hdr = document.createElement('div'); hdr.className = 'toolbar';
    const nav = document.createElement('div'); nav.className = 'nav-group';
    const titleStr = cur.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });

    nav.append(
        mkBtn('', () => changeMonth(-1), { icon: 'chevron-left', iconOnly: true }),
        Object.assign(document.createElement('div'), { className: 'month-title', textContent: titleStr }),
        mkBtn('', () => changeMonth(1), { icon: 'chevron-right', iconOnly: true })
    );

    const actions = document.createElement('div'); actions.className = 'nav-group';
    const fi = document.createElement('input'); fi.type = 'file'; fi.style.display = 'none'; fi.onchange = loadJSON;
    actions.append(
        mkBtn('Today', () => { cur = new Date(); render(); }),
        Object.assign(document.createElement('div'), { style: `width:1px; height:16px; background:${c.border}; margin: 0 4px;` }),
        fi, mkBtn('Import', () => fi.click(), { icon: 'upload' }),
        mkBtn('Export', exportJSON, { icon: 'download' })
    );
    hdr.append(nav, actions); calFragment.appendChild(hdr);

    const gh = document.createElement('div'); gh.className = 'grid-head';
    DAYS.forEach(d => { const s = document.createElement('span'); s.textContent = d; gh.appendChild(s); });
    calFragment.appendChild(gh);

    const y = cur.getFullYear(), m = cur.getMonth(), today = new Date();
    const first = new Date(y, m, 1).getDay(), dim = new Date(y, m + 1, 0).getDate();
    const grid = document.createElement('div'); grid.className = 'cal-grid';

    for (let i = 0; i < first + dim; i++) {
        const cell = document.createElement('div'); cell.className = 'cal-day';
        if (i >= first) {
            const d = i - first + 1; const k = dkey(y, m, d);
            const isToday = y === today.getFullYear() && m === today.getMonth() && d === today.getDate();

            cell.onclick = () => openModal(k);
            const num = document.createElement('div');
            Object.assign(num.style, { fontSize: '12px', fontWeight: '600', width: '22px', height: '22px', display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: '4px', background: isToday ? c.accent : 'transparent', color: isToday ? '#fff' : c.textStrong, marginBottom: '4px' });
            num.textContent = d; cell.appendChild(num);

            (evs[k] || []).slice(0, 4).forEach(e => {
                const p = document.createElement('div'); p.className = `pill ${e.paid ? 'is-paid' : ''}`;
                const amt = getPrice(e);
                p.innerHTML = `<span class="title">${e.title}</span> ${amt > 0 ? `<span style="opacity:0.85; font-size: 10px;">$${amt.toFixed(2)}</span>` : ''}`;
                p.onclick = ev => { ev.stopPropagation(); openModal(k); };
                cell.appendChild(p);
            });
            if ((evs[k] || []).length > 4) {
                const more = document.createElement('div'); more.style.cssText = `font-size:10px;color:${c.text2};padding-left:4px;font-weight:600;margin-top:2px;`; more.textContent = `+${evs[k].length - 4} more`; cell.appendChild(more);
            }
        } else {
            cell.style.opacity = '0.3'; cell.style.pointerEvents = 'none'; cell.style.background = 'transparent'; cell.style.border = 'none';
        }
        grid.appendChild(cell);
    }
    calFragment.appendChild(grid);
    calCol.appendChild(calFragment);

    // Financial Metrics Pass
    const sideTitle = document.createElement('h3');
    sideTitle.style.cssText = `color:${c.textStrong}; margin-bottom: 20px; font-weight: 600; font-size: 14px; display:flex; align-items:center; gap:8px; height:34px;`;
    sideTitle.innerHTML = `<i class="ti ti-chart-pie" style="color:${c.accent}"></i> Monthly Summary`;
    sideFragment.appendChild(sideTitle);

    const mKey = `${y}-${pad(m + 1)}`;
    let tTotal = 0, tPaid = 0, tPending = 0; const list = [];
    let yearlyTotal = 0; let monthTotals = new Array(12).fill(0);

    // single pass state variable iteration mapping metrics loops
    Object.keys(evs).forEach(k => {
        const isCurrentMonth = k.startsWith(mKey);
        const isCurrentYear = k.startsWith(`${y}-`);
        if (!isCurrentMonth && !isCurrentYear) return;

        const currentMonthIdx = isCurrentYear ? parseInt(k.split('-')[1], 10) - 1 : -1;
        const listLength = evs[k].length;

        for (let idx = 0; idx < listLength; idx++) {
            const e = evs[k][idx];
            const amt = getPrice(e);
            if (amt <= 0) continue;

            if (isCurrentMonth) {
                tTotal += amt;
                if (e.paid) tPaid += amt; else tPending += amt;
                list.push({ title: e.title, val: amt, date: k, recurring: e.recurring, paid: e.paid, note: e.note });
            }
            if (isCurrentYear) {
                yearlyTotal += amt;
                monthTotals[currentMonthIdx] += amt;
            }
        }
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
    sideFragment.appendChild(statsWrap);

    const activeMonths = monthTotals.filter(a => a > 0).length || 1;
    const monthlyAvg = yearlyTotal / activeMonths;

    const insightsWrap = document.createElement('div');
    insightsWrap.style.cssText = `margin-bottom: 24px; padding-bottom: 24px; border-bottom: 1px solid ${c.border};`;

    const insightsHeader = document.createElement('div');
    insightsHeader.style.cssText = `font-size: 11px; text-transform: uppercase; letter-spacing: 0.05em; color: ${c.text2}; font-weight: 600; margin-bottom: 12px;`;
    insightsHeader.textContent = `${y} Projections`;
    insightsWrap.appendChild(insightsHeader);

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
        const isCur = i === cur.getMonth();

        bar.className = 'graph-bar';
        bar.style.background = isCur ? c.accent : c.borderStrong;
        bar.style.height = `${Math.max(pct, 6)}%`;
        bar.style.opacity = isCur ? '1' : '0.4';

        const monthName = new Date(y, i).toLocaleString('default', { month: 'short' });
        bindTooltip(bar, `${monthName}: $${amt.toFixed(2)}`);

        bar.onmouseenter = () => { bar.style.opacity = '1'; };
        bar.onmouseleave = () => { bar.style.opacity = isCur ? '1' : '0.4'; };
        bar.onclick = () => { cur = new Date(y, i, 1); if (sel) closeModal(); render(); };

        graphWrap.appendChild(bar);
    });
    insightsWrap.appendChild(graphWrap);
    sideFragment.appendChild(insightsWrap);

    if (list.length > 0) {
        const listHeader = document.createElement('div');
        listHeader.style.cssText = `font-size: 11px; text-transform: uppercase; letter-spacing: 0.05em; color: ${c.text2}; font-weight: 600; margin-bottom: 12px; padding-bottom: 8px; border-bottom: 1px solid ${c.border}`;
        listHeader.textContent = "Expense Items";
        sideFragment.appendChild(listHeader);

        const ledgerWrap = document.createElement('div');
        ledgerWrap.style.cssText = 'display:flex; flex-direction:column; gap:4px;';

        list.sort((a, b) => a.date.localeCompare(b.date)).forEach(item => {
            const row = document.createElement('div');
            row.style.cssText = `display: flex; justify-content: space-between; align-items: center; padding: 10px 12px; border-radius: 8px; transition: background-color 0.1s; background: ${item.paid ? 'transparent' : c.surface2}; border: 1px solid ${item.paid ? 'transparent' : c.border};`;

            row.onmouseenter = () => { row.style.background = c.surface2; };
            row.onmouseleave = () => { row.style.background = item.paid ? 'transparent' : c.surface2; };
            bindTooltip(row, item.note);

            row.innerHTML = `
            <div style="display:flex; flex-direction:column; opacity: ${item.paid ? '0.5' : '1'}; min-width:0; flex:1;">
                <span style="color:${c.textStrong}; font-weight: 500; font-size:13px; text-decoration: ${item.paid ? 'line-through' : 'none'}; white-space:nowrap; overflow:hidden; text-overflow:ellipsis; padding-right:8px;">${item.title} ${item.recurring ? '<i class="ti ti-refresh" style="font-size:11px; margin-left:2px; opacity:0.6;"></i>' : ''}</span>
                <span style="font-size: 11px; color:${c.text2}; margin-top:1px;">${item.date}</span>
            </div>
            <span style="font-weight:600; color:${item.paid ? c.text2 : c.textStrong}; font-size:13px; opacity: ${item.paid ? '0.5' : '1'}; flex-shrink:0;">$${item.val.toFixed(2)}</span>
          `;
            ledgerWrap.appendChild(row);
        });
        sideFragment.appendChild(ledgerWrap);
    } else {
        const empty = document.createElement('div');
        empty.style.cssText = `text-align:center; padding: 32px 0; color: ${c.textMuted}; font-size: 13px;`;
        empty.innerHTML = `<i class="ti ti-receipt" style="font-size:28px; opacity:0.4; margin-bottom:8px; display:block;"></i>No items logged.`;
        sideFragment.appendChild(empty);
    }
    sidebar.appendChild(sideFragment);
}

function openModal(k) { sel = k; editingIdx = null; document.getElementById('modal').classList.add('open'); renderModal(); }
function closeModal() { sel = null; editingIdx = null; document.getElementById('modal').classList.remove('open'); }
function bgClose(e) { if (e.target === document.getElementById('modal')) closeModal(); }
document.getElementById('modal').addEventListener('keydown', e => { if (e.key === 'Escape') closeModal(); });

function createField(id, label, val, placeholder, type = 'text') {
    const wrap = document.createElement('div'); wrap.className = 'input-group';
    const l = document.createElement('label'); l.className = 'input-label'; l.textContent = label; l.htmlFor = id;
    const inp = mkInput(id, val, placeholder, type);
    wrap.append(l, inp); return wrap;
}

function renderModal() {
    if (!sel) return;
    const c = C(); const mbox = document.getElementById('mbox');
    mbox.innerHTML = ''; mbox.className = 'modal-anim';

    const [y, m, d] = sel.split('-');
    const dateObj = new Date(+y, +m - 1, +d);

    const header = document.createElement('div'); header.className = 'modal-header';
    const title = document.createElement('h3'); title.className = 'modal-title';
    title.textContent = dateObj.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' });
    header.append(title, mkBtn('', closeModal, { icon: 'x', iconOnly: true }));
    mbox.appendChild(header);

    const listEl = document.createElement('div'); listEl.id = 'ev-list';
    const list = evs[sel] || [];
    if (!list.length) {
        const p = document.createElement('p');
        p.style.cssText = `font-size:13px; color:${c.textMuted}; text-align:center; padding: 16px 0; border-bottom: 1px solid ${c.border}`;
        p.textContent = 'No expenses logged on this date.';
        listEl.appendChild(p);
    } else {
        list.forEach((e, i) => listEl.appendChild(buildRow(e, i)));
    }
    mbox.appendChild(listEl);

    const formHeader = document.createElement('div');
    formHeader.style.cssText = `font-size: 14px; font-weight: 600; color: ${c.textStrong}; margin-top: 24px; margin-bottom: 12px;`;
    formHeader.textContent = "Log New Item";
    mbox.appendChild(formHeader);

    const form = document.createElement('form'); form.className = 'record-form';
    form.onsubmit = (e) => { e.preventDefault(); addEvent(); };

    form.appendChild(createField('et', 'Title', '', 'e.g. Server Invoice'));

    const splitRow = document.createElement('div'); splitRow.className = 'form-row-split';

    const costWrap = createField('ep', 'Cost', '', '0.00', 'number');
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

    form.appendChild(createField('en', 'Notes', '', 'Optional context...', 'textarea'));

    const act = document.createElement('div'); act.style.cssText = 'display:flex; justify-content:flex-end; margin-top: 6px;';
    const submitBtn = mkBtn('Save Item', null, { icon: 'plus', accent: true });
    submitBtn.type = 'submit';
    act.appendChild(submitBtn);
    form.appendChild(act);

    mbox.appendChild(form);
    setTimeout(() => {
        const etEl = document.getElementById('et');
        if (etEl) etEl.focus();
    }, 60);
}

function buildRow(e, i) {
    if (editingIdx === i) return buildEditRow(e, i);

    const row = document.createElement('div'); row.id = `row-${i}`; row.className = 'event-row';
    const info = document.createElement('div'); info.className = 'event-info';
    const titleRow = document.createElement('div'); titleRow.className = 'event-header';
    const t = document.createElement('span');
    t.className = `event-title ${e.paid ? 'paid' : ''}`;
    t.textContent = e.title;
    titleRow.appendChild(t);

    const amt = getPrice(e);
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
    const c = C(); const wrap = document.createElement('div'); wrap.id = `row-${i}`;
    Object.assign(wrap.style, { padding: '16px', background: c.surface2, borderRadius: '8px', border: `1px solid ${c.borderStrong}`, marginBottom: '12px', marginTop: '12px' });

    const form = document.createElement('div'); form.className = 'form-grid'; form.style.margin = '0';
    form.appendChild(createField(`edit-title-${i}`, 'Title', e.title));

    const row2 = document.createElement('div'); row2.className = 'form-row';

    const pWrap = createField(`edit-price-${i}`, 'Cost', getPrice(e) || '', '0.00', 'number');
    pWrap.querySelector('input').style.paddingLeft = '24px';
    const dollar = document.createElement('span'); dollar.style.cssText = `position:absolute; left:10px; top:31px; color:${c.text2}; font-weight:500; font-size:13px;`; dollar.textContent = '$';
    pWrap.style.position = 'relative'; pWrap.appendChild(dollar); row2.appendChild(pWrap);

    const optWrap = document.createElement('div'); optWrap.className = 'input-group'; optWrap.style.justifyContent = 'flex-end';
    const optRow = document.createElement('div'); optRow.style.cssText = 'display:flex; gap:16px; height: 35px; align-items:center;';

    const recWrap = document.createElement('label'); recWrap.className = 'cb-wrap';
    const recCb = mkInput(`edit-rec-${i}`, e.recurring, '', 'checkbox'); recWrap.append(recCb, Object.assign(document.createElement('span'), { textContent: 'Recurring' }));

    const paidWrap = document.createElement('label'); paidWrap.className = 'cb-wrap';
    const paidCb = mkInput(`edit-paid-${i}`, e.paid, '', 'checkbox'); paidWrap.append(paidCb, Object.assign(document.createElement('span'), { textContent: 'Paid' }));

    optRow.append(recWrap, paidWrap); optWrap.appendChild(optRow); row2.appendChild(optWrap); form.appendChild(row2);

    form.appendChild(createField(`edit-note-${i}`, 'Notes', e.note || '', '', 'textarea'));
    wrap.appendChild(form);

    const act = document.createElement('div'); act.style.cssText = 'display:flex; gap:8px; margin-top:16px; justify-content:flex-end;';
    act.appendChild(mkBtn('Cancel', () => { editingIdx = null; renderModal(); }));
    act.appendChild(mkBtn('Update', () => saveEdit(i), { icon: 'check', accent: true }));
    wrap.appendChild(act);

    setTimeout(() => {
        const edEl = document.getElementById(`edit-title-${i}`);
        if (edEl) edEl.focus();
    }, 60); return wrap;
}

function startEdit(i) { editingIdx = i; const listEl = document.getElementById('ev-list'); const list = evs[sel] || []; listEl.innerHTML = ''; list.forEach((e, idx) => listEl.appendChild(buildRow(e, idx))); }

function propagateRecurring(baseEvent, startKey) {
    const [y, m, d] = startKey.split('-').map(Number);

    for (let i = 1; i <= 12; i++) {
        let nextM = m + i; let nextY = y;
        if (nextM > 12) { nextY += Math.floor((nextM - 1) / 12); nextM = ((nextM - 1) % 12) + 1; }

        const daysInNextMonth = new Date(nextY, nextM, 0).getDate();
        const nextD = Math.min(d, daysInNextMonth);
        const nextKey = `${nextY}-${pad(nextM)}-${pad(nextD)}`;

        if (!evs[nextKey]) evs[nextKey] = [];
        const exists = evs[nextKey].some(e => e.title === baseEvent.title && e.recurring === true);
        if (!exists) evs[nextKey].push({ ...baseEvent, paid: false });
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

    evs[sel][i] = updatedEv;
    if (isRecurring) propagateRecurring(updatedEv, sel);
    editingIdx = null; renderModal(); render();
}

function deleteEv(i) {
    const row = document.getElementById(`row-${i}`);
    const go = () => { evs[sel].splice(i, 1); if (!evs[sel].length) delete evs[sel]; editingIdx = null; renderModal(); render(); };
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

    if (!evs[sel]) evs[sel] = [];
    evs[sel].push(newEv);
    if (isRecurring) propagateRecurring(newEv, sel);
    renderModal(); render();
}

function changeMonth(d) { cur = new Date(cur.getFullYear(), cur.getMonth() + d, 1); render(); }
function loadJSON(evt) { const f = evt.target.files[0]; if (!f) return; const r = new FileReader(); r.onload = () => { try { const p = JSON.parse(r.result); evs = p.events || p; render(); } catch { alert('Invalid file layout'); } }; r.readAsText(f); evt.target.value = ''; }
function exportJSON() { const a = document.createElement('a'); a.href = URL.createObjectURL(new Blob([JSON.stringify({ events: evs }, null, 2)], { type: 'application/json' })); a.download = 'ledger.json'; a.click(); URL.revokeObjectURL(a.href); }

/* Simplified initialization: Uses the local config object directly */
function initApplication() {
    // The 'config' object is already defined above in your script.
    // We no longer fetch an external file, so this works offline 
    // even when opening via file:///

    // 1. Sync version badge
    const versionBadge = document.getElementById('app-version');
    if (versionBadge && config.version) {
        versionBadge.textContent = config.version;
        versionBadge.style.display = 'inline-block';
        if (config.buildEnv) {
            bindTooltip(versionBadge, `Environment: ${config.buildEnv}`);
        }
    }

    // 2. Handle banner dismissal logic
    if (config.allowBannerDismissal === false) {
        const bannerCloseBtn = document.querySelector('.top-banner .close-banner');
        if (bannerCloseBtn) bannerCloseBtn.remove();
    }

    // 3. Apply theme settings
    if (config.defaultTheme === 'dark') {
        dark = true;
    }

    // Final render pass
    render();
}

document.addEventListener('DOMContentLoaded', () => {
    initApplication();
});