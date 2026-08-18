/**
 * OpenExpense — day editor
 *
 * Opens `#modal` for a YYYY-MM-DD key. Lists that day’s entries in stored
 * order, with drag-reorder, paid toggle, and duplicate. Recurring edit or
 * delete can still update or remove a whole series. Receipt scan writes
 * through saveExpense().
 */
import { getState, patch } from '../core/store.js';
import { Utils } from '../core/utils.js';
import { formatMoney, sumDay } from '../core/summary.js';
import { UI } from '../ui/components.js';
import { Toast } from '../ui/toast.js';
import { confirmDialog } from '../ui/confirm.js';
import { lockBodyScroll, unlockBodyScroll } from '../ui/scroll-lock.js';
import { isValidDateKey } from '../core/ledger-file.js';
import {
    REPEAT,
    countSeriesOccurrences,
    normalizeRepeat,
    rebuildSeriesFrom,
    removeSeriesOccurrences,
    removeSeriesWeekday,
    repeatLabel,
    seedRecurringCopies,
    updateSeriesOccurrences,
    weekdayFromKey,
    weekdayName,
    countSeriesWeekday,
    addDaysToKey
} from '../core/series.js';
import { dismissUndo, offerDeleteUndo } from './undo-delete.js';
import { countEntries } from '../core/ledger-file.js';
import {
    duplicateAt,
    matchRememberedTitle,
    reorderDay,
    suggestTitles,
    togglePaidAt
} from '../core/day-entries.js';
import { clearDropMarks, makeGhost, placeGhost } from '../ui/pointer-drag.js';
import { categoryBadge, createCategoryPicker } from '../ui/category-picker.js';
import { cachedCategoryHistory, resolveCategory } from '../core/categories.js';
import { createGroupField, groupBadge } from '../ui/group-field.js';
import { cachedGroupHistory, canonicalGroup, suggestGroupFor, suggestGroups } from '../core/groups.js';

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
        modal.addEventListener('keydown', (e) => {
            if (e.key !== 'Escape') return;
            if (getState().editingIndex != null) {
                e.preventDefault();
                patch({ editingIndex: null });
                renderModal();
                return;
            }
            closeModal();
        });
        bindSheetGestures(modal);
        modal.dataset.bound = '1';
    }
}

export function shiftSelectedDay(delta) {
    const { selectedKey } = getState();
    if (!selectedKey) return;
    openModal(addDaysToKey(selectedKey, Number(delta) || 0));
}

function applyLedgerEvents(nextEvents, extra = {}) {
    dismissUndo();
    patch({ events: nextEvents, ...extra });
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
let addCategoryPicker = null;
let addGroupField = null;
// Edit rows are rebuilt on every refresh, so pickers are keyed by row index and
// cleared with the list rather than held for the lifetime of the modal.
const editPickers = new Map();
const editGroupFields = new Map();

/** The wiring a group field needs to read the ledger's existing vocabulary. */
function groupFieldHooks() {
    return {
        lookup: (query) => suggestGroups(getState().events, { query }),
        resolve: (raw) => canonicalGroup(getState().events, raw),
        historyFor: (title) => suggestGroupFor(title, cachedGroupHistory(getState().events))
    };
}

function refreshEventList() {
    const { selectedKey, events } = getState();
    if (!selectedKey) return;
    const eventsContainer = document.getElementById('events-container');
    if (!eventsContainer) return;

    eventsContainer.classList.add('day-entry-list');
    eventsContainer.replaceChildren();
    editPickers.clear();
    editGroupFields.clear();
    const list = events[selectedKey] || [];
    if (!list.length) {
        const p = document.createElement('p');
        p.className = 'modal-empty';
        p.textContent = 'Nothing on this day yet. Add an entry, or drag a calendar chip onto this date.';
        eventsContainer.appendChild(p);
        bindDayListDrag(eventsContainer);
        return;
    }

    list.forEach((entry, index) => {
        eventsContainer.appendChild(buildRow(entry, index));
    });
    bindDayListDrag(eventsContainer);
}

function bindDayListDrag(container) {
    if (!container || container.dataset.sortBound === '1') return;
    container.dataset.sortBound = '1';

    container.addEventListener('pointerdown', (event) => {
        const handle = event.target.closest('.drag-handle');
        if (!handle || !container.contains(handle)) return;
        const row = handle.closest('.event-row[data-index]');
        if (!row || (event.button != null && event.button !== 0)) return;
        if (getState().editingIndex != null) return;
        event.preventDefault();

        const from = Number(row.dataset.index);
        const originY = event.clientY;
        let dragging = false;
        let insertAt = from;
        let ghost = null;

        const rows = () => [...container.querySelectorAll('.event-row[data-index]')];

        const move = (ev) => {
            if (!dragging && Math.abs(ev.clientY - originY) > 5) {
                dragging = true;
                row.classList.add('is-dragging');
                ghost = makeGhost(row.querySelector('.event-title')?.textContent || 'Entry');
                try { handle.setPointerCapture(event.pointerId); } catch (_) { /* ignore */ }
            }
            if (!dragging) return;
            placeGhost(ghost, ev.clientX, ev.clientY);
            const list = rows();
            let dest = list.length - 1;
            for (let i = 0; i < list.length; i += 1) {
                const rect = list[i].getBoundingClientRect();
                if (ev.clientY < rect.top + rect.height / 2) {
                    dest = i;
                    break;
                }
            }
            insertAt = dest;
            clearDropMarks(container, '.event-row');
            row.classList.add('is-dragging');
            list[dest]?.classList.add('is-drop-before');
        };

        const end = () => {
            window.removeEventListener('pointermove', move, true);
            window.removeEventListener('pointerup', end, true);
            window.removeEventListener('pointercancel', end, true);
            ghost?.remove();
            clearDropMarks(container, '.event-row');
            if (!dragging || insertAt === from) return;
            const { events, selectedKey } = getState();
            applyLedgerEvents(reorderDay(events, selectedKey, from, insertAt));
            refreshEventList();
            renderDayInsights(selectedKey);
        };

        window.addEventListener('pointermove', move, true);
        window.addEventListener('pointerup', end, true);
        window.addEventListener('pointercancel', end, true);
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
        titleInput.setAttribute('list', 'et-suggest');
        titleInput.addEventListener('change', rememberTitleAmount);
        titleInput.addEventListener('input', paintSmartChips);
    }
    form.appendChild(titleField);

    const suggestList = document.createElement('datalist');
    suggestList.id = 'et-suggest';
    form.appendChild(suggestList);

    const chips = document.createElement('div');
    chips.id = 'et-smart-chips';
    chips.className = 'smart-chips';
    chips.hidden = true;
    form.appendChild(chips);

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

    addCategoryPicker = createCategoryPicker({
        id: 'ec',
        kind: readKind('ek'),
        history: () => cachedCategoryHistory(getState().events)
    });
    form.appendChild(addCategoryPicker.element);
    if (titleInput) titleInput.addEventListener('input', refreshAddCategory);

    addGroupField = createGroupField({ id: 'eg', ...groupFieldHooks() });
    form.appendChild(addGroupField.element);

    const noteField = UI.createFieldGroup('en', 'Notes', '', 'Optional context...', 'textarea');
    noteField.querySelector('textarea')?.addEventListener('input', refreshAddCategory);
    form.appendChild(noteField);

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

function refreshAddCategory() {
    const title = document.getElementById('et')?.value || '';
    addCategoryPicker?.refreshSuggestion({
        title,
        note: document.getElementById('en')?.value || ''
    });
    addGroupField?.refreshSuggestion(title);
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
    addCategoryPicker?.reset();
    addGroupField?.reset();
    syncAddFormKind();
}

export function saveExpense({ dateKey, title, price, note, recurring = false, paid = false, repeat, kind, category, group } = {}) {
    const t = String(title ?? '').trim();
    if (!t || !dateKey) return false;

    const parsedPrice = price != null && String(price).trim() !== ''
        ? parseFloat(String(price).replace(/[^0-9.]/g, ''))
        : null;

    const entryKind = Utils.entryKind({ kind });
    const newEv = {
        title: t,
        note: String(note ?? '').trim(),
        price: parsedPrice != null && !Number.isNaN(parsedPrice) ? parsedPrice : null,
        recurring: !!recurring,
        paid: !!paid,
        kind: entryKind
    };

    // Callers that never pass a category — the receipt scanner, the embed
    // importer — still get one filed for them from the title.
    const filed = resolveCategory({
        category,
        title: t,
        note: newEv.note,
        kind: entryKind,
        history: cachedCategoryHistory(getState().events)
    });
    if (filed) newEv.category = filed;

    // Snapped to the spelling already in the ledger, so callers that pass a
    // group as free text cannot fork "Bella" into a second group.
    const filedGroup = canonicalGroup(getState().events, group);
    if (filedGroup) newEv.group = filedGroup;

    if (newEv.kind === 'expense') delete newEv.kind;
    if (newEv.recurring) newEv.repeat = normalizeRepeat(repeat);

    dismissUndo();
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
    paintSmartChips();

    const focusTitle = !document.activeElement?.closest('#form-container');
    if (focusTitle) setTimeout(() => focusField('et'), 60);
}

function iconAction(className, icon, label, onClick) {
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = className;
    btn.innerHTML = `<i class="ti ti-${icon}" aria-hidden="true"></i>`;
    btn.setAttribute('aria-label', label);
    btn.title = label;
    btn.onclick = onClick;
    return btn;
}

function buildRow(e, i) {
    const { editingIndex } = getState();
    if (editingIndex === i) return buildEditRow(e, i);

    const row = document.createElement('div');
    row.id = `row-${i}`;
    row.className = `event-row${e.paid ? ' is-paid' : ''}${Utils.entryKind(e) === 'income' ? ' is-income' : ''}`;
    row.dataset.index = String(i);

    const handle = iconAction('drag-handle', 'grip-vertical', 'Reorder this entry', null);
    handle.onclick = null;
    handle.addEventListener('keydown', (ev) => {
        if (ev.key !== 'ArrowUp' && ev.key !== 'ArrowDown') return;
        ev.preventDefault();
        const { events, selectedKey } = getState();
        const to = ev.key === 'ArrowUp' ? i - 1 : i + 1;
        const next = reorderDay(events, selectedKey, i, to);
        if (next === events) return;
        applyLedgerEvents(next);
        refreshEventList();
        renderDayInsights(selectedKey);
        requestAnimationFrame(() => document.querySelector(`.event-row[data-index="${to}"] .drag-handle`)?.focus());
    });
    row.appendChild(handle);

    const info = document.createElement('div');
    info.className = 'event-info';
    const titleRow = document.createElement('div');
    titleRow.className = 'event-header';

    const t = document.createElement('span');
    t.className = `event-title ${e.paid ? 'paid' : ''}`;
    t.textContent = e.title;
    titleRow.appendChild(t);

    const amt = Utils.getPrice(e);
    if (amt > 0) {
        const badge = document.createElement('span');
        badge.className = 'event-badge';
        badge.textContent = `$${amt.toFixed(2)}`;
        titleRow.appendChild(badge);
    }
    if (Utils.entryKind(e) === 'income') {
        const kindBadge = document.createElement('span');
        kindBadge.className = 'event-kind is-income';
        kindBadge.textContent = 'Income';
        titleRow.appendChild(kindBadge);
    }
    if (e.category) titleRow.appendChild(categoryBadge(e.category, Utils.entryKind(e)));
    if (e.group) titleRow.appendChild(groupBadge(e.group));
    if (e.recurring) {
        const rec = document.createElement('span');
        rec.className = 'event-badge-icon';
        rec.innerHTML = '<i class="ti ti-refresh" aria-hidden="true"></i>';
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

    const act = document.createElement('div');
    act.className = 'row-actions';
    const paidLabel = Utils.entryKind(e) === 'income'
        ? (e.paid ? 'Mark not deposited' : 'Mark deposited')
        : (e.paid ? 'Mark unpaid' : 'Mark paid');
    const paidBtn = iconAction(
        `btn-icon-paid${e.paid ? ' is-on' : ''}`,
        e.paid ? 'circle-check' : 'circle',
        paidLabel,
        () => quickTogglePaid(i)
    );
    paidBtn.setAttribute('aria-pressed', e.paid ? 'true' : 'false');
    act.append(
        paidBtn,
        iconAction('btn-icon-copy', 'copy', 'Duplicate on this day', () => quickDuplicate(i)),
        iconAction('btn-icon-edit', 'edit', 'Edit entry', () => startEdit(i)),
        iconAction('btn-icon-delete', 'trash', 'Remove entry', () => deleteEv(i))
    );
    row.appendChild(act);

    return row;
}

function quickTogglePaid(index) {
    const { events, selectedKey } = getState();
    patch({ events: togglePaidAt(events, selectedKey, index) });
    refreshEventList();
    renderDayInsights(selectedKey);
}

function quickDuplicate(index) {
    const { events, selectedKey } = getState();
    const item = events[selectedKey]?.[index];
    applyLedgerEvents(duplicateAt(events, selectedKey, index));
    refreshEventList();
    renderDayInsights(selectedKey);
    if (item?.title) Toast.show(`Copied ${item.title} on this day.`, 'success');
}

function buildEditRow(e, i) {
    const wrap = document.createElement('div');
    wrap.id = `row-${i}`;
    wrap.className = 'event-edit-row';

    const form = document.createElement('div');
    form.className = 'form-grid form-grid--flush';
    form.appendChild(createKindPrompt(`edit-kind-${i}`, Utils.entryKind(e)));
    form.appendChild(UI.createFieldGroup(`edit-title-${i}`, 'Title', e.title));
    form.appendChild(UI.createFieldGroup(`edit-date-${i}`, 'Date', getState().selectedKey || '', '', 'date'));

    if (e.recurring) {
        const hint = document.createElement('p');
        hint.className = 'event-edit-series-hint';
        hint.textContent = 'Title, date, amount, and how often update every copy. Paid stays on each day.';
        form.appendChild(hint);
    }

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
        textContent: Utils.entryKind(e) === 'income' ? 'Deposited' : 'Paid'
    }));

    optRow.append(recWrap, paidWrap);
    optWrap.appendChild(optRow);
    row2.appendChild(optWrap);
    form.appendChild(row2);

    const editRepeat = createRepeatPrompt(`edit-repeat-${i}`, e.repeat);
    editRepeat.hidden = !e.recurring;
    bindRepeatToggle(recCb, editRepeat);
    form.appendChild(editRepeat);

    const editPicker = createCategoryPicker({
        id: `edit-cat-${i}`,
        kind: Utils.entryKind(e),
        value: e.category || '',
        history: () => cachedCategoryHistory(getState().events)
    });
    editPickers.set(i, editPicker);
    form.querySelectorAll(`input[name="edit-kind-${i}"]`).forEach((input) => {
        input.addEventListener('change', () => editPicker.setKind(readKind(`edit-kind-${i}`)));
    });
    form.appendChild(editPicker.element);

    const editGroup = createGroupField({
        id: `edit-group-${i}`,
        value: e.group || '',
        ...groupFieldHooks()
    });
    editGroupFields.set(i, editGroup);
    form.appendChild(editGroup.element);

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
    patch({ events: seedRecurringCopies(getState().events, baseEvent, startKey) });
}

function replaceOccurrence(events, fromKey, index, updated, toKey) {
    const dest = toKey || fromKey;
    const next = { ...events };
    const list = [...(next[fromKey] || [])];
    if (dest === fromKey) {
        list[index] = updated;
        next[fromKey] = list;
        return next;
    }
    list.splice(index, 1);
    if (list.length) next[fromKey] = list;
    else delete next[fromKey];
    next[dest] = [...(next[dest] || []), updated];
    return next;
}

function saveEdit(i) {
    const title = document.getElementById(`edit-title-${i}`).value.trim(); if (!title) return;
    const isRecurring = document.getElementById(`edit-rec-${i}`).checked;
    const price = document.getElementById(`edit-price-${i}`).value;
    const dateInput = document.getElementById(`edit-date-${i}`)?.value;

    const updatedEv = {
        title, note: document.getElementById(`edit-note-${i}`).value.trim(),
        price: price ? parseFloat(price) : null, recurring: isRecurring,
        paid: document.getElementById(`edit-paid-${i}`).checked,
        kind: readKind(`edit-kind-${i}`)
    };
    if (updatedEv.kind === 'expense') delete updatedEv.kind;
    if (isRecurring) updatedEv.repeat = readRepeat(`edit-repeat-${i}`);
    else delete updatedEv.repeat;

    const picked = editPickers.get(i)?.getValue();
    if (picked) updatedEv.category = picked;

    // Read even when empty: clearing the field has to be able to remove a group,
    // which an if-truthy guard would silently ignore.
    const pickedGroup = editGroupFields.get(i)?.getValue() ?? '';
    if (pickedGroup) updatedEv.group = pickedGroup;
    else delete updatedEv.group;

    const { selectedKey, events } = getState();
    const original = events[selectedKey]?.[i];
    if (!original) return;
    const destKey = isValidDateKey(dateInput) ? dateInput : selectedKey;

    let nextEvents;
    if (original.recurring && isRecurring) {
        const cadenceChanged = normalizeRepeat(original.repeat) !== normalizeRepeat(updatedEv.repeat);
        nextEvents = cadenceChanged
            ? rebuildSeriesFrom(events, original, destKey, updatedEv)
            : updateSeriesOccurrences(events, original, selectedKey, i, updatedEv, destKey);
        const count = countSeriesOccurrences(nextEvents, updatedEv);
        if (count > 1) Toast.show(`Updated ${count} copies of ${title}.`, 'success');
    } else {
        nextEvents = replaceOccurrence(events, selectedKey, i, updatedEv, destKey);
        if (isRecurring) nextEvents = seedRecurringCopies(nextEvents, updatedEv, destKey);
    }

    dismissUndo();
    patch({ events: nextEvents, editingIndex: null, selectedKey: destKey });
    renderModal();
}

function applyDelete(nextEvents) {
    const prev = getState();
    const removed = Math.max(1, countEntries(prev.events) - countEntries(nextEvents));
    offerDeleteUndo(prev, { count: removed });
    patch({ events: nextEvents, editingIndex: null });
    renderModal();
}

function seriesDeletePlan(events, item, dateKey) {
    const weekday = weekdayFromKey(dateKey);
    const dayName = weekdayName(weekday);
    const seriesCount = countSeriesOccurrences(events, item);
    const weekdayCount = countSeriesWeekday(events, item, weekday);
    const choices = [{ value: 'day', label: `Only this ${dayName}` }];

    if (weekdayCount > 1 || (weekdayCount > 0 && weekdayCount < seriesCount)) {
        choices.push({
            value: 'weekday',
            label: weekdayCount === seriesCount
                ? `Every ${dayName} — all ${weekdayCount} copies`
                : `Every ${dayName} (${weekdayCount} copies)`
        });
    }
    if (seriesCount > weekdayCount) {
        choices.push({
            value: 'series',
            label: `Every copy, all days (${seriesCount})`
        });
    }

    const choice = choices.some((row) => row.value === 'weekday') && weekdayCount > 1
        ? 'weekday'
        : 'day';

    return { choices, choice, weekday, dayName, seriesCount, weekdayCount };
}

function applySeriesDelete(events, item, index, dateKey, choice) {
    if (choice === 'series') {
        applyDelete(removeSeriesOccurrences(events, item));
        return;
    }
    if (choice === 'weekday') {
        const weekday = weekdayFromKey(dateKey);
        const count = countSeriesWeekday(events, item, weekday);
        applyDelete(removeSeriesWeekday(events, item, weekday));
        if (count > 1) Toast.show(`Removed ${count} ${weekdayName(weekday)} copies of ${item.title}.`, 'success');
        return;
    }
    if (index >= 0) removeOneOccurrence(index);
}

function removeOneOccurrence(index) {
    const { selectedKey, events } = getState();
    const nextEvents = { ...events };
    nextEvents[selectedKey] = [...(nextEvents[selectedKey] || [])];
    nextEvents[selectedKey].splice(index, 1);
    if (!nextEvents[selectedKey].length) delete nextEvents[selectedKey];
    applyDelete(nextEvents);
}

async function deleteEv(i) {
    const { selectedKey, events } = getState();
    const item = events[selectedKey]?.[i];
    if (!item) return;

    if (item.recurring) {
        const plan = seriesDeletePlan(events, item, selectedKey);
        const result = await confirmDialog({
            title: 'Remove this payment?',
            message: plan.seriesCount > 1
                ? `“${item.title}” is a re-accruing payment on ${plan.seriesCount} days. Removing every ${plan.dayName} does not touch other weekdays.`
                : `Remove “${item.title}” from this day?`,
            confirmText: 'Remove',
            cancelText: 'Cancel',
            danger: true,
            choices: plan.seriesCount > 1 ? plan.choices : null,
            choice: plan.choice
        });
        if (!result?.confirmed) return;
        applySeriesDelete(events, item, i, selectedKey, result.choice || 'day');
        return;
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
    if (paidSpan) paidSpan.textContent = income ? 'Deposited' : 'Paid';
    const submit = form.querySelector('button[type="submit"] span') || form.querySelector('button[type="submit"]');
    if (submit) {
        if (submit.tagName === 'SPAN') submit.textContent = income ? 'Save income' : 'Save expense';
        else if (!submit.querySelector('span')) submit.textContent = income ? 'Save income' : 'Save expense';
    }
    addCategoryPicker?.setKind(kind);
    refreshAddCategory();
    paintSmartChips();
}

function rememberTitleAmount() {
    const title = document.getElementById('et')?.value;
    const cost = document.getElementById('ep');
    if (!cost || cost.value) return;
    const hit = matchRememberedTitle(getState().events, title, readKind('ek'));
    if (hit?.price != null && hit.price !== '') cost.value = hit.price;
}

function paintSmartChips() {
    const chips = document.getElementById('et-smart-chips');
    const list = document.getElementById('et-suggest');
    if (!chips) return;

    const typed = document.getElementById('et')?.value || '';
    const kind = document.getElementById('expense-add-form') ? readKind('ek') : null;
    const rows = suggestTitles(getState().events, { kind, query: typed, limit: 6 });

    if (list) {
        list.replaceChildren();
        rows.forEach((row) => {
            const opt = document.createElement('option');
            opt.value = row.title;
            list.appendChild(opt);
        });
    }

    chips.replaceChildren();
    const shown = rows.slice(0, 4);
    chips.hidden = shown.length === 0;
    shown.forEach((row) => {
        const btn = document.createElement('button');
        btn.type = 'button';
        btn.className = 'smart-chip';
        const amt = row.price != null && row.price !== '' ? ` · ${Utils.formatMoney(row.price)}` : '';
        btn.textContent = `${row.title}${amt}`;
        btn.title = `Add ${row.title} with the last amount`;
        btn.onclick = () => applySmartTitle(row);
        chips.appendChild(btn);
    });
}

function applySmartTitle(row) {
    const title = document.getElementById('et');
    const cost = document.getElementById('ep');
    if (title) title.value = row.title;
    if (cost && (cost.value === '' || cost.value == null)) {
        cost.value = row.price != null && row.price !== '' ? row.price : '';
    }
    const radio = document.querySelector(`input[name="ek"][value="${row.kind === 'income' ? 'income' : 'expense'}"]`);
    if (radio) {
        radio.checked = true;
        syncAddFormKind();
    }
    paintSmartChips();
    focusField('ep');
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
        kind: readKind('ek'),
        category: addCategoryPicker?.getValue(),
        group: addGroupField?.getValue()
    });
    if (!ok) return;

    refreshEventList();
    renderDayInsights(selectedKey);
    resetAddForm();
    paintSmartChips();
    focusField('et');
}
