/**
 * OpenExpense — day editor
 *
 * Opens `#modal` for a YYYY-MM-DD key. Groups same-title expenses and can
 * delete a whole recurring series. Receipt scan writes through saveExpense().
 */
import { getState, patch } from '../core/store.js';
import { Utils } from '../core/utils.js';
import { formatMoney, sumDay } from '../core/summary.js';
import { UI } from '../ui/components.js';
import { confirmDialog } from '../ui/confirm.js';
import { lockBodyScroll, unlockBodyScroll } from '../ui/scroll-lock.js';
import {
    REPEAT,
    countSeriesOccurrences,
    groupExpenses,
    normalizeRepeat,
    normalizeTitle,
    removeSeriesOccurrences,
    repeatLabel,
    nextOccurrenceKey,
    seriesCopyCount
} from '../core/series.js';

function prefersFieldAutofocus() {
    return !Utils.isPhone() && !window.matchMedia('(pointer: coarse)').matches;
}

function focusField(id) {
    if (!prefersFieldAutofocus()) return;
    const el = document.getElementById(id);
    if (el) el.focus({ preventScroll: true });
}

export function openModal(key) {
    patch({ selectedKey: key, editingIndex: null });
    Utils.hideTooltip();
    const modal = document.getElementById('modal');
    const sheet = document.getElementById('mbox');
    if (sheet) sheet.style.transform = '';
    modal.classList.add('open');
    document.body.classList.add('modal-open');
    lockBodyScroll();
    renderModal();
}

export function closeModal() {
    patch({ selectedKey: null, editingIndex: null });
    const sheet = document.getElementById('mbox');
    if (sheet) sheet.style.transform = '';
    document.getElementById('modal').classList.remove('open');
    document.body.classList.remove('modal-open');
    unlockBodyScroll();
}

function bgClose(e) {
    if (e.target === document.getElementById('modal')) closeModal();
}

function bindSheetGestures(modal) {
    const sheet = document.getElementById('mbox');
    if (!sheet || sheet.dataset.gestures === '1') return;
    sheet.dataset.gestures = '1';

    let startY = 0;
    let dragging = false;
    let dy = 0;

    const canDragFrom = (target) => {
        if (!window.matchMedia('(max-width: 640px)').matches) return false;
        return !!target.closest('.sheet-grab, .modal-header');
    };

    sheet.addEventListener('touchstart', (e) => {
        if (!canDragFrom(e.target) || e.touches.length !== 1) return;
        startY = e.touches[0].clientY;
        dragging = true;
        dy = 0;
        sheet.style.transition = 'none';
    }, { passive: true });

    sheet.addEventListener('touchmove', (e) => {
        if (!dragging) return;
        dy = Math.max(0, e.touches[0].clientY - startY);
        sheet.style.transform = `translateY(${dy}px)`;
        if (dy > 8) e.preventDefault();
    }, { passive: false });

    const endDrag = () => {
        if (!dragging) return;
        dragging = false;
        sheet.style.transition = '';
        if (dy > 88) closeModal();
        else sheet.style.transform = '';
        dy = 0;
    };

    sheet.addEventListener('touchend', endDrag);
    sheet.addEventListener('touchcancel', endDrag);
}

export function initModalBindings() {
    const modal = document.getElementById('modal');
    if (modal && !modal.dataset.bound) {
        modal.addEventListener('click', bgClose);
        modal.addEventListener('keydown', e => { if (e.key === 'Escape') closeModal(); });
        bindSheetGestures(modal);
        modal.dataset.bound = '1';
    }
}

function moneySpark(up) {
    return `<svg class="day-insight-spark" viewBox="0 0 12 8" width="18" height="12" aria-hidden="true">
        <polyline points="${up ? '1,6 4.5,3.5 7,5 11,1.5' : '1,2 4.5,4.5 7,3 11,6.5'}"
            fill="none" stroke="currentColor" stroke-width="1.4"
            stroke-linecap="round" stroke-linejoin="round"/>
    </svg>`;
}

function renderDayInsights(dateKey) {
    const el = document.getElementById('day-insights');
    if (!el) return;

    const list = getState().events[dateKey] || [];
    const { expense, income, net } = sumDay(list);
    const pending = list.filter((e) => !e.paid).length;
    const downFlex = expense > 0 ? expense : (income > 0 ? 0 : 1);
    const upFlex = income > 0 ? income : (expense > 0 ? 0 : 1);
    const netLabel = net === 0
        ? 'Net even'
        : `Net ${net > 0 ? '+' : '-'}${formatMoney(Math.abs(net))}`;

    el.hidden = false;
    el.innerHTML = `
        <div class="day-insight-pair">
            <div class="day-insight is-down">
                ${moneySpark(false)}
                <div class="day-insight-copy">
                    <span class="day-insight-label">Spent</span>
                    <strong>${formatMoney(expense)}</strong>
                </div>
            </div>
            <div class="day-insight is-up">
                ${moneySpark(true)}
                <div class="day-insight-copy">
                    <span class="day-insight-label">Income</span>
                    <strong>${formatMoney(income)}</strong>
                </div>
            </div>
        </div>
        <div class="day-insight-track" role="img"
            aria-label="Spent ${formatMoney(expense)}, income ${formatMoney(income)}">
            <span class="day-insight-fill is-down" style="flex:${downFlex}"></span>
            <span class="day-insight-fill is-up" style="flex:${upFlex}"></span>
        </div>
        <p class="day-insight-meta">${netLabel} · ${list.length} ${list.length === 1 ? 'entry' : 'entries'}${pending ? ` · ${pending} pending` : ''}</p>
    `;
}

let addFormReady = false;

function refreshEventList() {
    const { selectedKey, events } = getState();
    if (!selectedKey) return;
    const eventsContainer = document.getElementById('events-container');
    if (!eventsContainer) return;

    eventsContainer.replaceChildren();
    const list = events[selectedKey] || [];
    if (!list.length) {
        const p = document.createElement('p');
        p.className = 'modal-empty';
        p.textContent = 'No expenses logged on this date.';
        eventsContainer.appendChild(p);
        return;
    }

    groupExpenses(list).forEach((group) => {
        const showHead = group.count > 1 || group.recurring;
        if (!showHead) {
            group.items.forEach(({ e, i }) => eventsContainer.appendChild(buildRow(e, i)));
            return;
        }

        const wrap = document.createElement('section');
        wrap.className = `expense-group${group.recurring ? ' is-recurring' : ''}${group.kind === 'income' ? ' is-income' : ''}`;

        const head = document.createElement('div');
        head.className = 'expense-group-head';
        const meta = [
            group.kind === 'income' ? 'Income' : null,
            group.recurring ? repeatLabel(group.repeat) : (group.count > 1 ? `${group.count} items` : null),
            group.total > 0 ? Utils.formatMoney(group.total) : null
        ].filter(Boolean).join(' · ');
        head.innerHTML = `
            <div class="expense-group-copy">
                <span class="expense-group-title">${Utils.escapeHtml(group.title)}</span>
                <span class="expense-group-meta">${group.recurring ? '<i class="ti ti-refresh" aria-hidden="true"></i>' : ''}${meta}</span>
            </div>`;

        if (group.recurring) {
            const seriesBtn = document.createElement('button');
            seriesBtn.type = 'button';
            seriesBtn.className = 'expense-group-remove';
            seriesBtn.textContent = 'Remove series';
            seriesBtn.onclick = () => deleteSeries(group.items[0].e);
            head.appendChild(seriesBtn);
        }

        wrap.appendChild(head);
        group.items.forEach(({ e, i }) => wrap.appendChild(buildRow(e, i)));
        eventsContainer.appendChild(wrap);
    });
}

function ensureAddForm(formContainer) {
    if (addFormReady && formContainer?.querySelector('#et')) return;
    if (!formContainer) return;

    formContainer.replaceChildren();
    addFormReady = false;

    const form = document.createElement('form');
    form.className = 'record-form';
    form.id = 'expense-add-form';
    form.onsubmit = (e) => { e.preventDefault(); addEvent(); };

    form.appendChild(createKindPrompt('ek', getState().ledgerFace === 'income' ? 'income' : 'expense'));
    const titleField = UI.createFieldGroup('et', 'Title', '', 'e.g. Coffee, Zoom, Gas');
    const titleInput = titleField.querySelector('input');
    if (titleInput) {
        titleInput.setAttribute('autocomplete', 'off');
        titleInput.setAttribute('autocapitalize', 'sentences');
        titleInput.setAttribute('enterkeyhint', 'next');
        titleInput.setAttribute('spellcheck', 'false');
    }
    form.appendChild(titleField);

    const splitRow = document.createElement('div');
    splitRow.className = 'form-row-split';

    const costWrap = UI.createFieldGroup('ep', 'Cost', '', '0.00', 'number');
    costWrap.classList.add('input-group--cost');
    const costInput = costWrap.querySelector('input');
    costInput.classList.add('amount-input');
    costInput.setAttribute('inputmode', 'decimal');
    costInput.setAttribute('enterkeyhint', 'done');
    const dollarSign = document.createElement('span');
    dollarSign.className = 'form-dollar';
    dollarSign.textContent = '$';
    costWrap.appendChild(dollarSign);
    splitRow.appendChild(costWrap);

    const optWrap = document.createElement('div');
    optWrap.className = 'form-opt-row';
    optWrap.innerHTML = `
        <label class="custom-cb"><input type="checkbox" id="er"><span>Recurring</span></label>
        <label class="custom-cb"><input type="checkbox" id="epad"><span>Paid</span></label>
    `;
    splitRow.appendChild(optWrap);
    form.appendChild(splitRow);

    const repeatPrompt = createRepeatPrompt('er-repeat', 'monthly');
    form.appendChild(repeatPrompt);
    bindRepeatToggle(optWrap.querySelector('#er'), repeatPrompt);

    form.appendChild(UI.createFieldGroup('en', 'Notes', '', 'Optional context...', 'textarea'));

    const act = document.createElement('div');
    act.className = 'form-actions';
    const submitBtn = UI.createButton('Save expense', null, { icon: 'plus', accent: true });
    submitBtn.type = 'submit';
    act.appendChild(submitBtn);
    form.appendChild(act);

    formContainer.appendChild(form);
    addFormReady = true;
    bindKindPrompt(form);
    syncAddFormKind();
}

function resetAddForm() {
    const et = document.getElementById('et');
    const ep = document.getElementById('ep');
    const en = document.getElementById('en');
    const er = document.getElementById('er');
    const epad = document.getElementById('epad');
    if (et) et.value = '';
    if (ep) ep.value = '';
    if (en) en.value = '';
    if (er) er.checked = false;
    if (epad) epad.checked = false;
    const monthly = document.querySelector('input[name="er-repeat"][value="monthly"]');
    if (monthly) monthly.checked = true;
    const prompt = document.getElementById('er-repeat-prompt');
    if (prompt) prompt.hidden = true;
    syncAddFormKind();
}

export function saveExpense({ dateKey, title, price, note, recurring = false, paid = false, repeat, kind } = {}) {
    const t = String(title ?? '').trim();
    if (!t || !dateKey) return false;

    const parsedPrice = price != null && String(price).trim() !== ''
        ? parseFloat(String(price).replace(/[^0-9.]/g, ''))
        : null;

    const newEv = {
        title: t,
        note: String(note ?? '').trim(),
        price: parsedPrice != null && !Number.isNaN(parsedPrice) ? parsedPrice : null,
        recurring: !!recurring,
        paid: !!paid,
        kind: Utils.entryKind({ kind })
    };
    if (newEv.kind === 'expense') delete newEv.kind;
    if (newEv.recurring) newEv.repeat = normalizeRepeat(repeat);

    const { events } = getState();
    const nextEvents = { ...events };
    if (!nextEvents[dateKey]) nextEvents[dateKey] = [];
    else nextEvents[dateKey] = [...nextEvents[dateKey]];
    nextEvents[dateKey].push(newEv);
    patch({ events: nextEvents });
    if (newEv.recurring) propagateRecurring(newEv, dateKey);
    return true;
}

export function renderModal() {
    const { selectedKey } = getState();
    if (!selectedKey) return;

    const [y, m, d] = selectedKey.split('-');
    const dateObj = new Date(+y, +m - 1, +d);

    const titleEl = document.getElementById('modal-date-title');
    if (titleEl) {
        titleEl.textContent = dateObj.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' });
    }

    refreshEventList();
    renderDayInsights(selectedKey);
    ensureAddForm(document.getElementById('form-container'));
    syncAddFormKind();

    const focusTitle = !document.activeElement?.closest('#form-container');
    if (focusTitle) setTimeout(() => focusField('et'), 60);
}

function buildRow(e, i) {
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
    if (Utils.entryKind(e) === 'income') {
        const kindBadge = document.createElement('span');
        kindBadge.className = 'event-kind is-income';
        kindBadge.textContent = 'Income';
        titleRow.appendChild(kindBadge);
    }
    if (e.recurring) {
        const rec = document.createElement('span'); rec.className = 'event-badge-icon';
        rec.innerHTML = '<i class="ti ti-refresh"></i>';
        rec.title = repeatLabel(e.repeat);
        rec.setAttribute('aria-label', repeatLabel(e.repeat));
        titleRow.appendChild(rec);
        const cadence = document.createElement('span');
        cadence.className = 'event-repeat';
        cadence.textContent = repeatLabel(e.repeat, true);
        titleRow.appendChild(cadence);
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

function buildEditRow(e, i) {
    const wrap = document.createElement('div');
    wrap.id = `row-${i}`;
    wrap.className = 'event-edit-row';

    const form = document.createElement('div');
    form.className = 'form-grid form-grid--flush';
    form.appendChild(createKindPrompt(`edit-kind-${i}`, Utils.entryKind(e)));
    form.appendChild(UI.createFieldGroup(`edit-title-${i}`, 'Title', e.title));

    const row2 = document.createElement('div');
    row2.className = 'form-row';

    const pWrap = UI.createFieldGroup(`edit-price-${i}`, 'Cost', Utils.getPrice(e) || '', '0.00', 'number');
    pWrap.classList.add('input-group--cost');
    pWrap.querySelector('input')?.classList.add('amount-input');
    const dollar = document.createElement('span');
    dollar.className = 'form-dollar';
    dollar.textContent = '$';
    pWrap.appendChild(dollar);
    row2.appendChild(pWrap);

    const optWrap = document.createElement('div');
    optWrap.className = 'input-group input-group--end';
    const optRow = document.createElement('div');
    optRow.className = 'form-opt-row form-opt-row--inline';

    const recWrap = document.createElement('label');
    recWrap.className = 'cb-wrap';
    const recCb = UI.createInput(`edit-rec-${i}`, e.recurring, '', 'checkbox');
    recWrap.append(recCb, Object.assign(document.createElement('span'), { textContent: 'Recurring' }));

    const paidWrap = document.createElement('label');
    paidWrap.className = 'cb-wrap';
    const paidCb = UI.createInput(`edit-paid-${i}`, e.paid, '', 'checkbox');
    paidWrap.append(paidCb, Object.assign(document.createElement('span'), {
        textContent: Utils.entryKind(e) === 'income' ? 'Received' : 'Paid'
    }));

    optRow.append(recWrap, paidWrap);
    optWrap.appendChild(optRow);
    row2.appendChild(optWrap);
    form.appendChild(row2);

    const editRepeat = createRepeatPrompt(`edit-repeat-${i}`, e.repeat);
    editRepeat.hidden = !e.recurring;
    bindRepeatToggle(recCb, editRepeat);
    form.appendChild(editRepeat);

    form.appendChild(UI.createFieldGroup(`edit-note-${i}`, 'Notes', e.note || '', '', 'textarea'));
    wrap.appendChild(form);

    const act = document.createElement('div');
    act.className = 'form-actions';
    act.appendChild(UI.createButton('Cancel', () => { patch({ editingIndex: null }); renderModal(); }));
    act.appendChild(UI.createButton('Update', () => saveEdit(i), { icon: 'check', accent: true }));
    wrap.appendChild(act);

    setTimeout(() => focusField(`edit-title-${i}`), 60);
    return wrap;
}

function startEdit(i) {
    patch({ editingIndex: i });
    refreshEventList();
}

function propagateRecurring(baseEvent, startKey) {
    const { events } = getState();
    const nextEvents = { ...events };
    const cadence = normalizeRepeat(baseEvent.repeat);
    const copies = seriesCopyCount(cadence);

    for (let i = 1; i <= copies; i++) {
        const nextKey = nextOccurrenceKey(startKey, cadence, i);
        if (!nextEvents[nextKey]) nextEvents[nextKey] = [];
        const exists = nextEvents[nextKey].some((e) => (
            e.title === baseEvent.title
            && e.recurring === true
            && Utils.entryKind(e) === Utils.entryKind(baseEvent)
            && normalizeRepeat(e.repeat) === cadence
        ));
        if (!exists) nextEvents[nextKey].push({ ...baseEvent, paid: false, repeat: cadence });
    }

    patch({ events: nextEvents });
}

function saveEdit(i) {
    const title = document.getElementById(`edit-title-${i}`).value.trim(); if (!title) return;
    const isRecurring = document.getElementById(`edit-rec-${i}`).checked;
    const price = document.getElementById(`edit-price-${i}`).value;

    const updatedEv = {
        title, note: document.getElementById(`edit-note-${i}`).value.trim(),
        price: price ? parseFloat(price) : null, recurring: isRecurring,
        paid: document.getElementById(`edit-paid-${i}`).checked,
        kind: readKind(`edit-kind-${i}`)
    };
    if (updatedEv.kind === 'expense') delete updatedEv.kind;
    if (isRecurring) updatedEv.repeat = readRepeat(`edit-repeat-${i}`);
    else delete updatedEv.repeat;

    const { selectedKey, events } = getState();
    const nextEvents = { ...events };
    nextEvents[selectedKey] = [...nextEvents[selectedKey]];
    nextEvents[selectedKey][i] = updatedEv;
    patch({ events: nextEvents, editingIndex: null });
    if (isRecurring) propagateRecurring(updatedEv, selectedKey);
    renderModal();
}

function applyDelete(nextEvents) {
    patch({ events: nextEvents, editingIndex: null });
    renderModal();
}

function removeOneOccurrence(index) {
    const { selectedKey, events } = getState();
    const nextEvents = { ...events };
    nextEvents[selectedKey] = [...(nextEvents[selectedKey] || [])];
    nextEvents[selectedKey].splice(index, 1);
    if (!nextEvents[selectedKey].length) delete nextEvents[selectedKey];
    applyDelete(nextEvents);
}

async function deleteSeries(item) {
    const { events } = getState();
    const count = countSeriesOccurrences(events, item);
    const result = await confirmDialog({
        title: 'Remove recurring payment?',
        message: count > 1
            ? `“${item.title}” is on ${count} days. Remove every copy of this re-accruing payment?`
            : `Remove “${item.title}” from this ledger?`,
        confirmText: 'Remove series',
        cancelText: 'Cancel',
        danger: true,
        checkbox: {
            label: 'Remove all recurring copies of this payment',
            checked: true
        }
    });
    if (!result?.confirmed) return;
    if (result.checked) applyDelete(removeSeriesOccurrences(events, item));
    else {
        const { selectedKey } = getState();
        const list = events[selectedKey] || [];
        const index = list.findIndex((entry) => entry === item || (
            entry.recurring
            && normalizeTitle(entry.title) === normalizeTitle(item.title)
            && normalizeRepeat(entry.repeat) === normalizeRepeat(item.repeat)
        ));
        if (index >= 0) removeOneOccurrence(index);
    }
}

async function deleteEv(i) {
    const { selectedKey, events } = getState();
    const item = events[selectedKey]?.[i];
    if (!item) return;

    if (item.recurring) {
        const count = countSeriesOccurrences(events, item);
        const result = await confirmDialog({
            title: 'Remove this payment?',
            message: count > 1
                ? `“${item.title}” is a re-accruing payment on ${count} days. Leave the box unchecked to remove only this day.`
                : `Remove “${item.title}” from this day?`,
            confirmText: 'Remove',
            cancelText: 'Cancel',
            danger: true,
            checkbox: {
                label: 'Remove all recurring copies of this payment',
                checked: false
            }
        });
        if (!result?.confirmed) return;
        if (result.checked) {
            applyDelete(removeSeriesOccurrences(events, item));
            return;
        }
    }

    const row = document.getElementById(`row-${i}`);
    const go = () => removeOneOccurrence(i);
    if (row) { row.classList.add('is-removing'); setTimeout(go, 160); } else go();
}

function createKindPrompt(name, selected = 'expense') {
    const current = selected === 'income' ? 'income' : 'expense';
    const wrap = document.createElement('div');
    wrap.className = 'kind-prompt';
    wrap.innerHTML = `
        <p class="repeat-prompt-label" id="${name}-label">Entry type</p>
        <div class="repeat-prompt-options" role="radiogroup" aria-labelledby="${name}-label">
            <label class="repeat-choice">
                <input type="radio" name="${name}" value="expense"${current === 'expense' ? ' checked' : ''}>
                <span>Expense</span>
            </label>
            <label class="repeat-choice">
                <input type="radio" name="${name}" value="income"${current === 'income' ? ' checked' : ''}>
                <span>Income</span>
            </label>
        </div>
    `;
    return wrap;
}

function readKind(name) {
    return Utils.entryKind({ kind: document.querySelector(`input[name="${name}"]:checked`)?.value });
}

function bindKindPrompt(form) {
    form.querySelectorAll('input[name="ek"]').forEach((input) => {
        input.addEventListener('change', syncAddFormKind);
    });
}

function syncAddFormKind() {
    const form = document.getElementById('expense-add-form');
    if (!form) return;
    const selected = document.querySelector('input[name="ek"]:checked');
    if (!selected) {
        const face = getState().ledgerFace === 'income' ? 'income' : 'expense';
        const radio = form.querySelector(`input[name="ek"][value="${face}"]`);
        if (radio) radio.checked = true;
    }
    const kind = readKind('ek');
    const income = kind === 'income';
    const title = form.querySelector('#et');
    if (title && !title.value) title.placeholder = income ? 'e.g. Paycheck, Refund' : 'e.g. Coffee, Zoom, Gas';
    const costLabel = form.querySelector('label[for="ep"]');
    if (costLabel) costLabel.textContent = income ? 'Amount' : 'Cost';
    const paidSpan = form.querySelector('#epad')?.closest('label')?.querySelector('span');
    if (paidSpan) paidSpan.textContent = income ? 'Received' : 'Paid';
    const submit = form.querySelector('button[type="submit"] span') || form.querySelector('button[type="submit"]');
    if (submit) {
        if (submit.tagName === 'SPAN') submit.textContent = income ? 'Save income' : 'Save expense';
        else if (!submit.querySelector('span')) submit.textContent = income ? 'Save income' : 'Save expense';
    }
}

function createRepeatPrompt(name, selected = 'monthly') {
    const current = normalizeRepeat(selected);
    const wrap = document.createElement('div');
    wrap.className = 'repeat-prompt';
    wrap.id = `${name}-prompt`;
    wrap.hidden = true;
    wrap.innerHTML = `
        <p class="repeat-prompt-label" id="${name}-label">How often?</p>
        <div class="repeat-prompt-options" role="radiogroup" aria-labelledby="${name}-label">
            ${Object.values(REPEAT).map((opt) => `
                <label class="repeat-choice">
                    <input type="radio" name="${name}" value="${opt.id}"${opt.id === current ? ' checked' : ''}>
                    <span>${opt.short}</span>
                </label>
            `).join('')}
        </div>
    `;
    return wrap;
}

function bindRepeatToggle(checkbox, prompt) {
    if (!checkbox || !prompt) return;
    const sync = () => { prompt.hidden = !checkbox.checked; };
    checkbox.addEventListener('change', sync);
    sync();
}

function readRepeat(name) {
    return normalizeRepeat(document.querySelector(`input[name="${name}"]:checked`)?.value);
}

function addEvent() {
    const { selectedKey } = getState();
    if (!selectedKey) return;

    const ok = saveExpense({
        dateKey: selectedKey,
        title: document.getElementById('et')?.value,
        price: document.getElementById('ep')?.value,
        note: document.getElementById('en')?.value,
        recurring: document.getElementById('er')?.checked,
        paid: document.getElementById('epad')?.checked,
        repeat: readRepeat('er-repeat'),
        kind: readKind('ek')
    });
    if (!ok) return;

    refreshEventList();
    renderDayInsights(selectedKey);
    resetAddForm();
    focusField('et');
}
