import { getState, patch, getColors } from '../core/store.js';
import { Utils } from '../core/utils.js';
import { UI } from '../ui/components.js';

export function openModal(key) {
    patch({ selectedKey: key, editingIndex: null });
    document.getElementById('modal').classList.add('open');
    renderModal();
}

export function closeModal() {
    patch({ selectedKey: null, editingIndex: null });
    document.getElementById('modal').classList.remove('open');
}

export function bgClose(e) {
    if (e.target === document.getElementById('modal')) closeModal();
}

export function initModalBindings() {
    const modal = document.getElementById('modal');
    if (modal && !modal.dataset.bound) {
        modal.addEventListener('click', bgClose);
        modal.addEventListener('keydown', e => { if (e.key === 'Escape') closeModal(); });
        modal.dataset.bound = '1';
    }
}

export function renderModal() {
    const { selectedKey } = getState();
    if (!selectedKey) return;
    const c = getColors();

    const [y, m, d] = selectedKey.split('-');
    const dateObj = new Date(+y, +m - 1, +d);

    const titleEl = document.getElementById('modal-date-title');
    if (titleEl) {
        titleEl.textContent = dateObj.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' });
    }

    const eventsContainer = document.getElementById('events-container');
    const formContainer = document.getElementById('form-container');
    const { events } = getState();

    if (eventsContainer) {
        eventsContainer.innerHTML = '';
        const list = events[selectedKey] || [];
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

export function buildRow(e, i) {
    const { editingIndex } = getState();
    if (editingIndex === i) return buildEditRow(e, i);

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
        n.className = 'event-note';
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

export function buildEditRow(e, i) {
    const c = getColors(); const wrap = document.createElement('div'); wrap.id = `row-${i}`;
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
    act.appendChild(UI.createButton('Cancel', () => { patch({ editingIndex: null }); renderModal(); }));
    act.appendChild(UI.createButton('Update', () => saveEdit(i), { icon: 'check', accent: true }));
    wrap.appendChild(act);

    setTimeout(() => {
        const edEl = document.getElementById(`edit-title-${i}`);
        if (edEl) edEl.focus();
    }, 60); return wrap;
}

export function startEdit(i) {
    patch({ editingIndex: i });
    const listEl = document.getElementById('events-container');
    const { selectedKey, events } = getState();
    const list = events[selectedKey] || [];
    listEl.innerHTML = '';
    list.forEach((e, idx) => listEl.appendChild(buildRow(e, idx)));
}

export function propagateRecurring(baseEvent, startKey) {
    const [y, m, d] = startKey.split('-').map(Number);
    const { events } = getState();
    const nextEvents = { ...events };

    for (let i = 1; i <= 12; i++) {
        let nextM = m + i; let nextY = y;
        if (nextM > 12) { nextY += Math.floor((nextM - 1) / 12); nextM = ((nextM - 1) % 12) + 1; }

        const daysInNextMonth = new Date(nextY, nextM, 0).getDate();
        const nextD = Math.min(d, daysInNextMonth);
        const nextKey = `${nextY}-${Utils.pad(nextM)}-${Utils.pad(nextD)}`;

        if (!nextEvents[nextKey]) nextEvents[nextKey] = [];
        const exists = nextEvents[nextKey].some(e => e.title === baseEvent.title && e.recurring === true);
        if (!exists) nextEvents[nextKey].push({ ...baseEvent, paid: false });
    }

    patch({ events: nextEvents });
}

export function saveEdit(i) {
    const title = document.getElementById(`edit-title-${i}`).value.trim(); if (!title) return;
    const isRecurring = document.getElementById(`edit-rec-${i}`).checked;
    const price = document.getElementById(`edit-price-${i}`).value;

    const updatedEv = {
        title, note: document.getElementById(`edit-note-${i}`).value.trim(),
        price: price ? parseFloat(price) : null, recurring: isRecurring,
        paid: document.getElementById(`edit-paid-${i}`).checked
    };

    const { selectedKey, events } = getState();
    const nextEvents = { ...events };
    nextEvents[selectedKey] = [...nextEvents[selectedKey]];
    nextEvents[selectedKey][i] = updatedEv;
    patch({ events: nextEvents, editingIndex: null });
    if (isRecurring) propagateRecurring(updatedEv, selectedKey);
    renderModal();
}

export function deleteEv(i) {
    const row = document.getElementById(`row-${i}`);
    const go = () => {
        const { selectedKey, events } = getState();
        const nextEvents = { ...events };
        nextEvents[selectedKey] = [...nextEvents[selectedKey]];
        nextEvents[selectedKey].splice(i, 1);
        if (!nextEvents[selectedKey].length) delete nextEvents[selectedKey];
        patch({ events: nextEvents, editingIndex: null });
        renderModal();
    };
    if (row) { Object.assign(row.style, { opacity: '0', maxHeight: '0', padding: '0', overflow: 'hidden' }); setTimeout(go, 120); } else go();
}

export function addEvent() {
    const t = document.getElementById('et').value.trim(); if (!t) return;
    const p = document.getElementById('ep').value;
    const isRecurring = document.getElementById('er').checked;

    const newEv = {
        title: t, note: document.getElementById('en').value.trim(),
        price: p ? parseFloat(p) : null, recurring: isRecurring,
        paid: document.getElementById('epad').checked
    };

    const { selectedKey, events } = getState();
    const nextEvents = { ...events };
    if (!nextEvents[selectedKey]) nextEvents[selectedKey] = [];
    else nextEvents[selectedKey] = [...nextEvents[selectedKey]];
    nextEvents[selectedKey].push(newEv);
    patch({ events: nextEvents });
    if (isRecurring) propagateRecurring(newEv, selectedKey);
    renderModal();
}
