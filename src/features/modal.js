/**
 * OpenExpense — day editor
 *
 * Opens `#modal` for a YYYY-MM-DD key. Lists that day’s entries in stored
 * order, with drag-reorder, paid toggle, and duplicate. Group, series, and
 * twin edits ask this-vs-all before a multi-row write. Recurring delete can
 * still remove a weekday or the whole series. Receipt scan writes through
 * saveExpense().
 */
import { getState, patch } from '../core/store.js';
import { Utils } from '../core/utils.js';
import { formatAxisMoney, formatMoney, sumDay } from '../core/summary.js';
import { createDial } from '../ui/dial-chart.js';
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
    assignGroupToIndexes,
    clearGroupAt,
    duplicateAt,
    matchRememberedTitle,
    reorderDay,
    suggestTitles,
    togglePaidAt
} from '../core/day-entries.js';
import { clearDropMarks, makeGhost, placeGhost } from '../ui/pointer-drag.js';
import { categoryBadge, createCategoryPicker } from '../ui/category-picker.js';
import {
    cachedCategoryHistory,
    canonicalCategory,
    resolveCategory,
    suggestCategories
} from '../core/categories.js';
import { createGroupField, groupBadge } from '../ui/group-field.js';
import {
    applyGroupLabel,
    cachedGroupHistory,
    canonicalGroup,
    findGroupRefs,
    normalizeGroup,
    suggestGroupFor,
    suggestGroups
} from '../core/groups.js';
import {
    applyTitlePrice,
    findTwinRefs,
    isPlaceholderTitle,
    labelOrPriceChanged
} from '../core/labeling.js';

function prefersFieldAutofocus() {
    return !Utils.isPhone() && !window.matchMedia('(pointer: coarse)').matches;
}

function focusField(id) {
    if (!prefersFieldAutofocus()) return;
    const el = document.getElementById(id);
    if (el) el.focus({ preventScroll: true });
}

export function openModal(key) {
    selectedDayIndexes.clear();
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
    selectedDayIndexes.clear();
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

function foldFields(title, nodes, { open = false } = {}) {
    const details = document.createElement('details');
    details.className = 'form-fold';
    details.open = !!open;
    const summary = document.createElement('summary');
    summary.className = 'form-fold-sum';
    summary.textContent = title;
    details.append(summary, ...nodes.filter(Boolean));
    return details;
}

function renderDayInsights(dateKey) {
    const el = document.getElementById('day-insights');
    if (!el) return;

    const list = getState().events[dateKey] || [];
    const { expense, income, net } = sumDay(list);
    const pending = list.filter((e) => !e.paid).length;
    const scale = Math.max(expense, income, Math.abs(net), 1);
    const caption = list.length
        ? `${list.length} ${list.length === 1 ? 'entry' : 'entries'}${pending ? ` · ${pending} pending` : ''}`
        : 'Nothing on this day yet';

    el.hidden = false;
    el.replaceChildren(createDial({
        value: net,
        label: 'Day net',
        caption,
        ratio: Math.min(1, Math.abs(net) / scale),
        display: formatAxisMoney(net)
    }));
    el.setAttribute('aria-label', `Day net ${formatMoney(net)}. Spent ${formatMoney(expense)}, income ${formatMoney(income)}. ${caption}`);
}

let addFormReady = false;
let addCategoryPicker = null;
let addGroupField = null;
// Edit rows are rebuilt on every refresh, so pickers are keyed by row index and
// cleared with the list rather than held for the lifetime of the modal.
const editPickers = new Map();
const editGroupFields = new Map();
const selectedDayIndexes = new Set();

/** The wiring a group field needs to read the ledger's existing vocabulary. */
function groupFieldHooks() {
    return {
        lookup: (query) => suggestGroups(getState().events, { query }),
        resolve: (raw) => canonicalGroup(getState().events, raw),
        historyFor: (title) => suggestGroupFor(title, cachedGroupHistory(getState().events))
    };
}

function categoryFieldHooks() {
    return {
        lookup: (query, kind) => suggestCategories(getState().events, { query, kind }),
        resolve: (raw) => canonicalCategory(getState().events, raw),
        history: () => cachedCategoryHistory(getState().events)
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
    [...selectedDayIndexes].forEach((index) => {
        if (index < 0 || index >= list.length) selectedDayIndexes.delete(index);
    });
    if (!list.length) {
        selectedDayIndexes.clear();
        const p = document.createElement('p');
        p.className = 'modal-empty';
        p.textContent = 'Nothing on this day yet. Add an entry, or drag a calendar chip onto this date.';
        eventsContainer.appendChild(p);
        bindDayListDrag(eventsContainer);
        bindDayListGroup(eventsContainer);
        return;
    }

    paintDaySelectBar(eventsContainer);
    list.forEach((entry, index) => {
        eventsContainer.appendChild(buildRow(entry, index));
    });
    bindDayListDrag(eventsContainer);
    bindDayListGroup(eventsContainer);
}

function paintDaySelectBar(container) {
    if (!container) return;
    let bar = container.querySelector('.day-select-bar');
    const count = selectedDayIndexes.size;
    if (!count) {
        bar?.remove();
        return;
    }
    if (!bar) {
        bar = document.createElement('div');
        bar.className = 'day-select-bar';
        container.prepend(bar);
    }
    bar.hidden = false;
    bar.replaceChildren();
    const label = document.createElement('span');
    label.className = 'day-select-count';
    label.textContent = `${count} selected`;
    const groupBtn = UI.createButton('Group', () => groupSelected());
    groupBtn.disabled = count < 2;
    const ungroupBtn = UI.createButton('Ungroup', () => ungroupSelected());
    const clearBtn = UI.createButton('Clear', () => {
        selectedDayIndexes.clear();
        syncRowSelection();
    });
    bar.append(label, groupBtn, ungroupBtn, clearBtn);
}

function syncRowSelection() {
    const container = document.getElementById('events-container');
    container?.querySelectorAll('.event-row[data-index]').forEach((row) => {
        const index = Number(row.dataset.index);
        const on = selectedDayIndexes.has(index);
        row.classList.toggle('is-selected', on);
        const box = row.querySelector('.row-pick');
        if (box) box.checked = on;
    });
    paintDaySelectBar(container);
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

function bindDayListGroup(container) {
    if (!container || container.dataset.groupBound === '1') return;
    container.dataset.groupBound = '1';

    container.addEventListener('pointerdown', (event) => {
        if (event.target.closest('.drag-handle, .row-actions, .row-pick-wrap, button, input, a, label')) return;
        const row = event.target.closest('.event-row[data-index]');
        if (!row || !container.contains(row) || (event.button != null && event.button !== 0)) return;
        if (getState().editingIndex != null) return;

        const from = Number(row.dataset.index);
        const originY = event.clientY;
        const originX = event.clientX;
        let dragging = false;
        let overIndex = from;
        let ghost = null;

        const rows = () => [...container.querySelectorAll('.event-row[data-index]')];

        const move = (ev) => {
            if (!dragging && (Math.abs(ev.clientY - originY) > 6 || Math.abs(ev.clientX - originX) > 6)) {
                dragging = true;
                row.classList.add('is-dragging');
                ghost = makeGhost(row.querySelector('.event-title')?.textContent || 'Entry');
                try { row.setPointerCapture(event.pointerId); } catch (_) { /* ignore */ }
            }
            if (!dragging) return;
            placeGhost(ghost, ev.clientX, ev.clientY);
            overIndex = from;
            rows().forEach((el) => {
                el.classList.remove('is-group-drop');
                const rect = el.getBoundingClientRect();
                if (ev.clientX >= rect.left && ev.clientX <= rect.right
                    && ev.clientY >= rect.top && ev.clientY <= rect.bottom) {
                    overIndex = Number(el.dataset.index);
                    if (overIndex !== from) el.classList.add('is-group-drop');
                }
            });
            row.classList.add('is-dragging');
        };

        const end = () => {
            window.removeEventListener('pointermove', move, true);
            window.removeEventListener('pointerup', end, true);
            window.removeEventListener('pointercancel', end, true);
            ghost?.remove();
            clearDropMarks(container, '.event-row');
            container.querySelectorAll('.is-group-drop').forEach((el) => el.classList.remove('is-group-drop'));
            row.classList.remove('is-dragging');
            if (!dragging || overIndex === from) return;
            groupEntries([from, overIndex]);
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
        ...categoryFieldHooks()
    });
    if (titleInput) titleInput.addEventListener('input', refreshAddCategory);

    addGroupField = createGroupField({ id: 'eg', ...groupFieldHooks() });

    const noteField = UI.createFieldGroup('en', 'Notes', '', 'Optional context...', 'textarea');
    noteField.querySelector('textarea')?.addEventListener('input', refreshAddCategory);
    form.appendChild(foldFields('Category, group, and notes', [
        addCategoryPicker.element,
        addGroupField.element,
        noteField
    ]));

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
    if (isPlaceholderTitle(title)) {
        addCategoryPicker?.refreshSuggestion({ title: '', note: '' });
        addGroupField?.refreshSuggestion('');
        return;
    }
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

    row.classList.toggle('is-selected', selectedDayIndexes.has(i));

    const pickWrap = document.createElement('label');
    pickWrap.className = 'row-pick-wrap';
    const pick = document.createElement('input');
    pick.type = 'checkbox';
    pick.className = 'row-pick';
    pick.checked = selectedDayIndexes.has(i);
    pick.setAttribute('aria-label', `Select ${e.title || 'this entry'}`);
    pick.addEventListener('click', (ev) => ev.stopPropagation());
    pick.addEventListener('change', () => {
        if (pick.checked) selectedDayIndexes.add(i);
        else selectedDayIndexes.delete(i);
        syncRowSelection();
    });
    pickWrap.appendChild(pick);
    row.appendChild(pickWrap);

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

    const body = document.createElement('div');
    body.className = 'event-row-body';

    const main = document.createElement('div');
    main.className = 'event-row-main';

    const identity = document.createElement('div');
    identity.className = 'event-identity';

    const t = document.createElement('span');
    t.className = `event-title ${e.paid ? 'paid' : ''}`;
    t.textContent = e.title;
    identity.appendChild(t);

    const meta = document.createElement('div');
    meta.className = 'event-meta';
    if (Utils.entryKind(e) === 'income') {
        const kindBadge = document.createElement('span');
        kindBadge.className = 'event-kind is-income';
        kindBadge.textContent = 'Income';
        meta.appendChild(kindBadge);
    }
    if (e.category) meta.appendChild(categoryBadge(e.category, Utils.entryKind(e)));
    if (e.group) meta.appendChild(groupBadge(e.group));
    if (e.recurring) {
        const rec = document.createElement('span');
        rec.className = 'event-badge-icon';
        rec.innerHTML = '<i class="ti ti-refresh" aria-hidden="true"></i>';
        rec.title = repeatLabel(e.repeat);
        rec.setAttribute('aria-label', repeatLabel(e.repeat));
        meta.appendChild(rec);
        const cadence = document.createElement('span');
        cadence.className = 'event-repeat';
        cadence.textContent = repeatLabel(e.repeat, true);
        meta.appendChild(cadence);
    }
    if (meta.childNodes.length) identity.appendChild(meta);
    main.appendChild(identity);

    const amt = Utils.getPrice(e);
    if (amt > 0) {
        const amount = document.createElement('span');
        amount.className = 'event-amount';
        amount.textContent = `$${amt.toFixed(2)}`;
        main.appendChild(amount);
    }
    body.appendChild(main);

    if (e.note) {
        const n = document.createElement('p');
        n.className = 'event-note';
        n.textContent = e.note;
        body.appendChild(n);
    }

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
    act.append(paidBtn);
    if (e.group) {
        act.append(iconAction(
            'btn-icon-ungroup',
            'unlink',
            `Ungroup from ${e.group}`,
            () => ungroupEntry(i)
        ));
    }
    act.append(
        iconAction('btn-icon-copy', 'copy', 'Duplicate on this day', () => quickDuplicate(i)),
        iconAction('btn-icon-edit', 'edit', 'Edit entry', () => startEdit(i)),
        iconAction('btn-icon-delete', 'trash', 'Remove entry', () => deleteEv(i))
    );
    body.appendChild(act);
    row.appendChild(body);

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
        hint.textContent = 'Date and how often can shift the series. Name and amount stay on this entry unless other rows share both.';
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
        ...categoryFieldHooks()
    });
    editPickers.set(i, editPicker);
    form.querySelectorAll(`input[name="edit-kind-${i}"]`).forEach((input) => {
        input.addEventListener('change', () => editPicker.setKind(readKind(`edit-kind-${i}`)));
    });

    const editGroup = createGroupField({
        id: `edit-group-${i}`,
        value: e.group || '',
        ...groupFieldHooks()
    });
    editGroupFields.set(i, editGroup);

    form.appendChild(foldFields('Category, group, and notes', [
        editPicker.element,
        editGroup.element,
        UI.createFieldGroup(`edit-note-${i}`, 'Notes', e.note || '', '', 'textarea')
    ], { open: !!(e.category || e.group || e.note) }));
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

async function saveEdit(i) {
    const rawTitle = document.getElementById(`edit-title-${i}`).value.trim();
    if (!rawTitle || isPlaceholderTitle(rawTitle)) return;
    const title = rawTitle;
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

    const picked = editPickers.get(i)?.getValue() ?? '';
    if (picked) updatedEv.category = picked;
    else delete updatedEv.category;

    // Read even when empty: clearing the field has to be able to remove a group,
    // which an if-truthy guard would silently ignore.
    const pickedGroup = editGroupFields.get(i)?.getValue() ?? '';
    if (pickedGroup) updatedEv.group = pickedGroup;
    else delete updatedEv.group;

    const { selectedKey, events } = getState();
    const original = events[selectedKey]?.[i];
    if (!original) return;
    const destKey = isValidDateKey(dateInput) ? dateInput : selectedKey;
    const dateChanged = destKey !== selectedKey;
    const cadenceChanged = original.recurring && isRecurring
        && normalizeRepeat(original.repeat) !== normalizeRepeat(updatedEv.repeat);

    if (!original.recurring && isRecurring) {
        const scheduled = await confirmDialog({
            title: 'Schedule copies?',
            message: `“${title}” will be copied onto the calendar through the next year. You can still edit or remove one day later.`,
            confirmText: 'Schedule',
            cancelText: 'Cancel'
        });
        if (!scheduled?.confirmed) return;
    }

    if (original.recurring && isRecurring && (dateChanged || cadenceChanged)) {
        const seriesCount = countSeriesOccurrences(events, original);
        if (seriesCount > 1) {
            const series = await confirmDialog({
                title: 'Update the series?',
                message: cadenceChanged
                    ? `Changing how often rebuilds every copy of “${original.title}” (${seriesCount} days). Name and amount stay on this entry unless you choose Change all.`
                    : `Moving this day shifts every copy of “${original.title}” (${seriesCount} days). Name and amount stay on this entry unless you choose Change all.`,
                confirmText: 'Update series',
                cancelText: 'Cancel'
            });
            if (!series?.confirmed) return;
        }
    }

    let applyToTwins = false;
    const twins = labelOrPriceChanged(original, updatedEv)
        ? findTwinRefs(events, original, { skip: { date: selectedKey, index: i } })
        : [];
    if (twins.length) {
        const result = await confirmDialog({
            title: 'Change all matching entries?',
            message: `“${original.title}” at ${Utils.formatMoney(Utils.getPrice(original))} appears ${twins.length + 1} times. Change the name and amount on every match, or only this entry?`,
            confirmText: 'Apply',
            cancelText: 'Cancel',
            choices: [
                { value: 'all', label: `Change all ${twins.length + 1} matching entries` },
                { value: 'one', label: 'Only this entry' }
            ],
            choice: 'all',
            choicesLabel: 'Which entries to change'
        });
        if (!result?.confirmed) return;
        applyToTwins = result.choice === 'all';
    }

    const oldGroup = normalizeGroup(original.group);
    const newGroup = normalizeGroup(updatedEv.group);
    let applyGroupToAll = false;
    if (oldGroup && oldGroup !== newGroup) {
        const mates = findGroupRefs(events, oldGroup, { skip: { date: selectedKey, index: i } });
        if (mates.length) {
            const renaming = !!newGroup;
            const result = await confirmDialog({
                title: renaming ? `Rename ${oldGroup}?` : `Ungroup ${oldGroup}?`,
                message: renaming
                    ? `“${original.title}” is in ${oldGroup} with ${mates.length} other ${mates.length === 1 ? 'entry' : 'entries'}. Rename the group everywhere, or move only this entry?`
                    : `“${original.title}” is in ${oldGroup} with ${mates.length} other ${mates.length === 1 ? 'entry' : 'entries'}. Remove only this entry, or clear the group from every member?`,
                confirmText: 'Apply',
                cancelText: 'Cancel',
                choices: renaming
                    ? [
                        { value: 'one', label: `Only this entry — move to ${newGroup}` },
                        { value: 'all', label: `Rename ${oldGroup} to ${newGroup} on all ${mates.length + 1} entries` }
                    ]
                    : [
                        { value: 'one', label: 'Only this entry' },
                        { value: 'all', label: `Ungroup all ${mates.length + 1} entries` }
                    ],
                choice: 'one',
                choicesLabel: 'Which grouped entries to change'
            });
            if (!result?.confirmed) return;
            applyGroupToAll = result.choice === 'all';
        }
    }

    let nextEvents;
    if (original.recurring && isRecurring) {
        nextEvents = cadenceChanged
            ? rebuildSeriesFrom(events, original, destKey, updatedEv)
            : updateSeriesOccurrences(events, original, selectedKey, i, updatedEv, destKey);
        if (cadenceChanged || dateChanged) {
            const count = countSeriesOccurrences(nextEvents, updatedEv);
            if (count > 1) Toast.show(`Updated ${count} copies of ${title}.`, 'success');
        }
    } else {
        nextEvents = replaceOccurrence(events, selectedKey, i, updatedEv, destKey);
        if (isRecurring) nextEvents = seedRecurringCopies(nextEvents, updatedEv, destKey);
    }

    if (applyToTwins) {
        // Re-scan after the row/series write: the edited row already has the
        // new name and amount, so it drops out, and date-shifted copies still
        // match the original pair.
        const remaining = findTwinRefs(nextEvents, original);
        nextEvents = applyTitlePrice(nextEvents, remaining, {
            title: updatedEv.title,
            price: updatedEv.price
        });
        Toast.show(`Updated ${twins.length + 1} matching entries.`, 'success');
    }

    if (applyGroupToAll && oldGroup) {
        const leftover = findGroupRefs(nextEvents, oldGroup);
        nextEvents = applyGroupLabel(nextEvents, leftover, newGroup);
        Toast.show(newGroup
            ? `Renamed ${oldGroup} to ${newGroup} on ${leftover.length + 1} entries.`
            : `Ungrouped ${leftover.length + 1} entries.`, 'success');
    }

    dismissUndo();
    selectedDayIndexes.clear();
    patch({ events: nextEvents, editingIndex: null, selectedKey: destKey });
    renderModal();
}

async function groupEntries(indexes) {
    const { events, selectedKey } = getState();
    const list = events[selectedKey] || [];
    const unique = [...new Set((indexes || []).map(Number))]
        .filter((index) => list[index]);
    if (unique.length < 2) return;

    const existing = unique
        .map((index) => normalizeGroup(list[index].group))
        .filter(Boolean);
    const uniqueNames = [...new Set(existing.map((label) => label.toLowerCase()))];
    // One known group among the selection is enough to join it. Two different
    // groups, or none, need a name so the user is never silently re-filed.
    let label = uniqueNames.length === 1 ? canonicalGroup(events, existing[0]) : '';
    if (label) {
        const join = await confirmDialog({
            title: `Add to ${label}?`,
            message: `${unique.length} entries will share this group. Price, date, and each label stay as they are.`,
            confirmText: 'Group',
            cancelText: 'Cancel'
        });
        if (!join?.confirmed) return;
    } else {
        const result = await confirmDialog({
            title: unique.length === 2 ? 'Group these entries?' : `Group ${unique.length} entries?`,
            message: 'Name the group. Price, date, and the label on each entry stay as they are.',
            confirmText: 'Group',
            cancelText: 'Cancel',
            field: {
                label: 'Group',
                placeholder: 'Find or add a group',
                value: existing[0] || ''
            },
            validate: (row) => normalizeGroup(row.value) ? null : 'Enter a group name'
        });
        if (!result?.confirmed) return;
        label = canonicalGroup(getState().events, result.value);
    }
    if (!label) return;

    applyLedgerEvents(assignGroupToIndexes(getState().events, selectedKey, unique, label));
    selectedDayIndexes.clear();
    refreshEventList();
    renderDayInsights(selectedKey);
    Toast.show(`Grouped ${unique.length} entries as ${label}.`, 'success');
}

function groupSelected() {
    return groupEntries([...selectedDayIndexes]);
}

function ungroupEntry(index) {
    const { events, selectedKey } = getState();
    const item = events[selectedKey]?.[index];
    if (!item?.group) return;
    applyLedgerEvents(clearGroupAt(events, selectedKey, index));
    selectedDayIndexes.delete(index);
    refreshEventList();
    renderDayInsights(selectedKey);
    Toast.show(`Removed from ${item.group}.`, 'success');
}

async function ungroupSelected() {
    const { events, selectedKey } = getState();
    const list = events[selectedKey] || [];
    const indexes = [...selectedDayIndexes].filter((index) => list[index]?.group);
    if (!indexes.length) return;
    if (indexes.length > 1) {
        const result = await confirmDialog({
            title: `Ungroup ${indexes.length} entries?`,
            message: 'Each entry stays on this day with its price and label. Only the group name is removed.',
            confirmText: 'Ungroup',
            cancelText: 'Cancel'
        });
        if (!result?.confirmed) return;
    }
    let next = getState().events;
    indexes.forEach((index) => {
        next = clearGroupAt(next, selectedKey, index);
    });
    applyLedgerEvents(next);
    selectedDayIndexes.clear();
    refreshEventList();
    renderDayInsights(selectedKey);
    Toast.show(indexes.length === 1 ? 'Removed from group.' : `Ungrouped ${indexes.length} entries.`, 'success');
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
            choice: plan.choice,
            choicesLabel: 'What to remove'
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
                <span><i class="ti ti-receipt" aria-hidden="true"></i>Expense</span>
            </label>
            <label class="repeat-choice">
                <input type="radio" name="${name}" value="income"${current === 'income' ? ' checked' : ''}>
                <span><i class="ti ti-coin" aria-hidden="true"></i>Income</span>
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

async function addEvent() {
    const { selectedKey } = getState();
    if (!selectedKey) return;

    const title = document.getElementById('et')?.value;
    const recurring = document.getElementById('er')?.checked;
    const repeat = readRepeat('er-repeat');
    const kind = readKind('ek');

    if (recurring) {
        const scheduled = await confirmDialog({
            title: 'Schedule copies?',
            message: `“${String(title || '').trim() || 'This entry'}” will be copied onto the calendar through the next year. You can still edit or remove one day later.`,
            confirmText: 'Schedule',
            cancelText: 'Cancel'
        });
        if (!scheduled?.confirmed) return;
    }

    const ok = saveExpense({
        dateKey: selectedKey,
        title,
        price: document.getElementById('ep')?.value,
        note: document.getElementById('en')?.value,
        recurring,
        paid: document.getElementById('epad')?.checked,
        repeat,
        kind,
        category: addCategoryPicker?.getValue(),
        group: addGroupField?.getValue()
    });
    if (!ok) return;

    if (recurring) {
        const count = countSeriesOccurrences(getState().events, {
            title: String(title || '').trim(),
            recurring: true,
            repeat,
            kind
        });
        if (count > 1) Toast.show(`Scheduled ${count} copies of ${String(title || '').trim()}.`, 'success');
    }

    refreshEventList();
    renderDayInsights(selectedKey);
    resetAddForm();
    paintSmartChips();
    focusField('et');
}
