/**
 * OpenExpense — category tag field
 *
 * One input that finds an existing category or creates a new tag. Typing
 * filters previously used labels (and the built-in set). Enter assigns
 * whatever is in the field: a known name joins that tag, an unknown name
 * becomes a new one. Until the user touches the field, a keyword or history
 * guess can follow the title; after that it stays put.
 */
import {
    canonicalCategory,
    categoryInfo,
    normalizeCategory,
    resolveCategory,
    UNCATEGORIZED
} from '../core/categories.js';
import { isPlaceholderTitle } from '../core/labeling.js';

function chip(label, tone) {
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'cat-chip';
    btn.dataset.category = label;

    const dot = document.createElement('span');
    dot.className = 'cat-dot';
    dot.dataset.tone = tone;
    const text = document.createElement('span');
    text.textContent = label;
    btn.append(dot, text);
    return btn;
}

/**
 * @param {object} options
 * @param {string} options.id                 unique per form, so add and edit can coexist
 * @param {string} [options.kind]             'expense' | 'income'
 * @param {string} [options.value]            an already-chosen category
 * @param {Function} [options.lookup]         (query, kind) => [{ label, count }]
 * @param {Function} [options.resolve]        (raw) => the spelling already in the ledger
 * @param {Function} [options.history]        returns past title-to-category choices
 * @returns {{element: HTMLElement, getValue: Function, setKind: Function, refreshSuggestion: Function, reset: Function}}
 */
export function createCategoryPicker({
    id,
    kind = 'expense',
    value = '',
    lookup = () => [],
    resolve = (raw) => canonicalCategory({}, raw),
    history = null
} = {}) {
    let currentKind = kind === 'income' ? 'income' : 'expense';
    let explicit = !!normalizeCategory(value);

    const element = document.createElement('div');
    element.className = 'cat-field';

    const head = document.createElement('div');
    head.className = 'cat-field-head';
    const label = document.createElement('label');
    label.className = 'repeat-prompt-label';
    label.setAttribute('for', id);
    label.textContent = 'Category';
    const note = document.createElement('span');
    note.className = 'cat-auto-note';
    note.hidden = true;
    head.append(label, note);

    const tagRow = document.createElement('div');
    tagRow.className = 'cat-tag-row';

    const inputRow = document.createElement('div');
    inputRow.className = 'cat-input-row';

    const input = document.createElement('input');
    input.type = 'text';
    input.id = id;
    input.className = 'text-input cat-input';
    input.placeholder = 'Find or add a category';
    input.value = normalizeCategory(value);
    input.autocomplete = 'off';
    input.spellcheck = false;
    input.setAttribute('enterkeyhint', 'done');
    input.setAttribute('list', `${id}-list`);
    input.setAttribute('maxlength', '40');

    const list = document.createElement('datalist');
    list.id = `${id}-list`;

    const clear = document.createElement('button');
    clear.type = 'button';
    clear.className = 'cat-clear';
    clear.title = 'Clear category';
    clear.setAttribute('aria-label', 'Clear category');
    clear.innerHTML = '<i class="ti ti-x" aria-hidden="true"></i>';

    inputRow.append(input, list, clear);

    const chips = document.createElement('div');
    chips.className = 'cat-chips';

    element.append(head, tagRow, inputRow, chips);

    function typed() {
        return normalizeCategory(input.value);
    }

    function assigned() {
        return typed();
    }

    function paint() {
        const query = typed();
        const rows = lookup(query, currentKind) || [];
        const key = query.toLowerCase();
        const known = rows.some((row) => String(row.label || '').toLowerCase() === key)
            || !!categoryInfo(query, currentKind).known;

        list.replaceChildren(...rows.map((row) => {
            const option = document.createElement('option');
            option.value = row.label;
            return option;
        }));

        const offer = rows.filter((row) => String(row.label || '').toLowerCase() !== key).slice(0, 6);
        chips.replaceChildren(...offer.map((row) => {
            const info = categoryInfo(row.label, currentKind);
            return chip(row.label, info.tone);
        }));
        chips.hidden = !offer.length;

        clear.hidden = !query;
        element.classList.toggle('is-set', !!query);
        element.dataset.value = query || '';

        tagRow.replaceChildren();
        if (query) {
            const tag = document.createElement('span');
            tag.className = 'cat-tag';
            if (!explicit) tag.classList.add('is-auto');
            const info = categoryInfo(query, currentKind);
            const dot = document.createElement('span');
            dot.className = 'cat-dot';
            dot.dataset.tone = info.tone;
            const text = document.createElement('span');
            text.textContent = info.label;
            tag.append(dot, text);
            tagRow.appendChild(tag);
        }
        tagRow.hidden = !query;

        if (!query) {
            note.hidden = true;
            note.textContent = '';
            note.classList.remove('is-new');
        } else if (!explicit) {
            note.hidden = false;
            note.textContent = 'auto';
            note.classList.remove('is-new');
        } else {
            note.hidden = false;
            note.textContent = known ? 'existing' : 'new';
            note.classList.toggle('is-new', !known);
        }
    }

    function commit(label, { fromUser = true } = {}) {
        input.value = normalizeCategory(label);
        if (fromUser) explicit = true;
        paint();
    }

    input.addEventListener('input', () => {
        explicit = true;
        paint();
    });

    // Enter assigns the typed tag. A new name is created; a known name joins.
    // Never submit the parent entry form from this field.
    input.addEventListener('keydown', (e) => {
        if (e.key !== 'Enter') return;
        e.preventDefault();
        const raw = typed();
        if (!raw) return;
        commit(resolve(raw));
    });

    chips.addEventListener('click', (e) => {
        const btn = e.target.closest('.cat-chip');
        if (!btn) return;
        commit(btn.dataset.category);
        input.focus();
    });

    clear.addEventListener('click', () => {
        input.value = '';
        explicit = false;
        paint();
        input.focus();
    });

    paint();

    return {
        element,
        getValue() {
            const raw = assigned();
            return raw ? resolve(raw) : '';
        },
        setKind(nextKind) {
            const next = nextKind === 'income' ? 'income' : 'expense';
            if (next === currentKind) return;
            currentKind = next;
            const current = typed();
            const info = current ? categoryInfo(current, next) : null;
            if (info && info.known && info.kind !== next) {
                input.value = '';
                explicit = false;
            }
            paint();
        },
        refreshSuggestion({ title = '', note: entryNote = '' } = {}) {
            if (explicit) return;
            if (isPlaceholderTitle(title)) {
                input.value = '';
                paint();
                return;
            }
            const guessed = resolveCategory({
                title,
                note: entryNote,
                kind: currentKind,
                history: history?.()
            }) || '';
            input.value = guessed ? normalizeCategory(guessed) : '';
            paint();
        },
        reset() {
            input.value = '';
            explicit = false;
            paint();
        }
    };
}

/** Small read-only badge used on entry rows and in the breakdown. */
export function categoryBadge(label, kind = 'expense') {
    const info = categoryInfo(label, kind);
    const el = document.createElement('span');
    el.className = 'cat-badge';
    if (info.uncategorized) el.classList.add('is-empty');

    const dot = document.createElement('span');
    dot.className = 'cat-dot';
    dot.dataset.tone = info.tone;
    const text = document.createElement('span');
    text.textContent = info.uncategorized ? UNCATEGORIZED : info.label;
    el.append(dot, text);
    return el;
}
