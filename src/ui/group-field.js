/**
 * OpenExpense — group field
 *
 * One input that both finds an existing group and creates a new one. There is
 * no separate "add" action, because the two are the same gesture: you type a
 * name, and whether it already exists only decides if you are joining or
 * starting a group. The field says which of the two is about to happen so that
 * distinction is never a surprise.
 *
 * Like the category picker, it separates a guess from a decision. The last
 * group used for a title is offered automatically and keeps following the
 * title as it is typed, until the user touches the field. After that it stays
 * put, and clearing it hands control back.
 */
import { normalizeGroup, groupKey } from '../core/groups.js';

function chip(label) {
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'group-chip';
    btn.dataset.group = label;
    btn.textContent = label;
    return btn;
}

/**
 * @param {object} options
 * @param {string} options.id                 unique per form, so add and edit can coexist
 * @param {string} [options.value]            an already-chosen group
 * @param {Function} [options.lookup]         (query) => [{ label, count }] known groups
 * @param {Function} [options.resolve]        (raw) => the spelling already in the ledger
 * @param {Function} [options.historyFor]     (title) => the group last used for that title
 * @returns {{element: HTMLElement, getValue: Function, setValue: Function, refreshSuggestion: Function, reset: Function}}
 */
export function createGroupField({
    id,
    value = '',
    lookup = () => [],
    resolve = (raw) => normalizeGroup(raw),
    historyFor = () => ''
} = {}) {
    let explicit = !!normalizeGroup(value);

    const element = document.createElement('div');
    element.className = 'group-field';

    const head = document.createElement('div');
    head.className = 'group-field-head';
    const label = document.createElement('label');
    label.className = 'repeat-prompt-label';
    label.setAttribute('for', id);
    label.textContent = 'Group';
    const note = document.createElement('span');
    note.className = 'group-note';
    note.hidden = true;
    head.append(label, note);

    const inputRow = document.createElement('div');
    inputRow.className = 'group-input-row';

    const input = document.createElement('input');
    input.type = 'text';
    input.id = id;
    input.className = 'text-input group-input';
    input.placeholder = 'Find or add a group';
    input.value = normalizeGroup(value);
    input.autocomplete = 'off';
    input.spellcheck = false;
    input.setAttribute('enterkeyhint', 'next');
    input.setAttribute('list', `${id}-list`);
    input.setAttribute('maxlength', '40');

    const list = document.createElement('datalist');
    list.id = `${id}-list`;

    const clear = document.createElement('button');
    clear.type = 'button';
    clear.className = 'group-clear';
    clear.title = 'Clear group';
    clear.setAttribute('aria-label', 'Clear group');
    clear.innerHTML = '<i class="ti ti-x" aria-hidden="true"></i>';

    inputRow.append(input, list, clear);

    const chips = document.createElement('div');
    chips.className = 'group-chips';

    element.append(head, inputRow, chips);

    function typed() {
        return normalizeGroup(input.value);
    }

    /** Repaints the suggestions, the datalist and the find-or-add note. */
    function paint() {
        const query = typed();
        const rows = lookup(query) || [];
        const key = groupKey(query);
        const known = rows.some((row) => groupKey(row.label) === key);

        list.replaceChildren(...rows.map((row) => {
            const option = document.createElement('option');
            option.value = row.label;
            return option;
        }));

        // Offering a chip identical to what is already typed wastes a row.
        const offer = rows.filter((row) => groupKey(row.label) !== key).slice(0, 5);
        chips.replaceChildren(...offer.map((row) => chip(row.label)));
        chips.hidden = !offer.length;

        clear.hidden = !query;
        element.classList.toggle('is-set', !!query);

        if (!query) {
            note.hidden = true;
            note.textContent = '';
        } else {
            note.hidden = false;
            note.textContent = known ? 'existing' : 'new group';
            note.classList.toggle('is-new', !known);
        }
    }

    function commit(label, { fromUser = true } = {}) {
        input.value = normalizeGroup(label);
        if (fromUser) explicit = true;
        paint();
    }

    input.addEventListener('input', () => {
        explicit = true;
        paint();
    });

    // Enter keeps what was typed: a known name joins that group, a new name
    // creates one. Stealing the first chip here used to overwrite a custom
    // placeholder the user was in the middle of naming.
    input.addEventListener('keydown', (e) => {
        if (e.key !== 'Enter') return;
        e.preventDefault();
        const raw = typed();
        if (!raw) return;
        commit(resolve(raw));
    });

    chips.addEventListener('click', (e) => {
        const btn = e.target.closest('.group-chip');
        if (!btn) return;
        commit(btn.dataset.group);
        input.focus();
    });

    clear.addEventListener('click', () => {
        input.value = '';
        // An emptied field is a decision to stop guessing for this entry only.
        explicit = false;
        paint();
        input.focus();
    });

    paint();

    return {
        element,
        getValue() {
            const raw = typed();
            return raw ? resolve(raw) : '';
        },
        setValue(next) {
            commit(next, { fromUser: false });
        },
        /** Offers the group this title was filed under last, until the user decides. */
        refreshSuggestion(title) {
            if (explicit) return;
            if (!String(title || '').trim()) {
                input.value = '';
                paint();
                return;
            }
            const remembered = historyFor(title);
            input.value = remembered ? normalizeGroup(remembered) : '';
            paint();
        },
        reset() {
            input.value = '';
            explicit = false;
            paint();
        }
    };
}

/** Small read-only badge for an entry row. */
export function groupBadge(label) {
    const clean = normalizeGroup(label);
    if (!clean) return null;
    const el = document.createElement('span');
    el.className = 'group-badge';
    el.textContent = clean;
    el.title = `Group: ${clean}`;
    return el;
}
