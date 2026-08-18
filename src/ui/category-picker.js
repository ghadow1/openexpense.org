/**
 * OpenExpense — category picker
 *
 * A row of one-tap chips rather than a dropdown: picking from a visible set is
 * markedly faster than opening a menu, and category is a field people set on
 * every single entry.
 *
 * The picker distinguishes a guess from a decision. Until the user touches it,
 * the chip the keyword rules suggested shows as selected and marked "auto", and
 * it keeps following what they type in the title. The moment they tap anything
 * it stops moving, because silently overriding a deliberate choice is worse
 * than guessing wrong. Tapping the chosen chip again hands control back.
 */
import { categoriesFor, categoryInfo, suggestCategory, UNCATEGORIZED } from '../core/categories.js';

function chip(label, tone) {
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'cat-chip';
    btn.dataset.category = label;
    btn.setAttribute('role', 'radio');
    btn.setAttribute('aria-checked', 'false');

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
 * @param {string} options.id            unique per form, so add and edit can coexist
 * @param {string} [options.kind]        'expense' | 'income'
 * @param {string} [options.value]       an already-chosen category
 * @returns {{element: HTMLElement, getValue: Function, setKind: Function, refreshSuggestion: Function}}
 */
export function createCategoryPicker({ id, kind = 'expense', value = '' } = {}) {
    let currentKind = kind === 'income' ? 'income' : 'expense';
    let chosen = String(value ?? '').trim();
    // An existing entry's category is a decision the user already made.
    let explicit = !!chosen;
    let suggested = '';
    let expanded = false;

    const element = document.createElement('div');
    element.className = 'cat-field';

    const head = document.createElement('div');
    head.className = 'cat-field-head';
    const label = document.createElement('p');
    label.className = 'repeat-prompt-label';
    label.id = `${id}-label`;
    label.textContent = 'Category';
    const note = document.createElement('span');
    note.className = 'cat-auto-note';
    note.hidden = true;
    note.textContent = 'auto';
    head.append(label, note);

    const chips = document.createElement('div');
    chips.className = 'cat-chips';
    chips.setAttribute('role', 'radiogroup');
    chips.setAttribute('aria-labelledby', `${id}-label`);

    element.append(head, chips);

    /** The value that will actually be saved: a decision, else the guess. */
    function effective() {
        return explicit ? chosen : suggested;
    }

    function select(label) {
        if (explicit && chosen === label) {
            // Tapping the active chip clears the decision and resumes guessing.
            explicit = false;
            chosen = '';
        } else {
            explicit = true;
            chosen = label;
        }
        paint();
    }

    function paint() {
        const active = effective();
        const { quick, rest } = categoriesFor(currentKind);

        // Always show a chip for a category that is set but off the quick list,
        // otherwise the current value would be invisible until "More" is opened.
        const offList = active && !quick.includes(active) && !expanded;
        const labels = expanded ? [...quick, ...rest] : (offList ? [...quick, active] : quick);

        chips.replaceChildren();
        for (const name of labels) {
            const info = categoryInfo(name, currentKind);
            const btn = chip(name, info.tone);
            const on = name === active;
            btn.classList.toggle('is-active', on);
            btn.classList.toggle('is-auto', on && !explicit);
            btn.setAttribute('aria-checked', on ? 'true' : 'false');
            btn.addEventListener('click', () => select(name));
            chips.appendChild(btn);
        }

        if (!expanded && rest.length) {
            const more = document.createElement('button');
            more.type = 'button';
            more.className = 'cat-chip cat-chip--more';
            more.textContent = 'More';
            more.addEventListener('click', () => { expanded = true; paint(); });
            chips.appendChild(more);
        }

        note.hidden = explicit || !active;
        element.dataset.value = active || '';
    }

    /** Re-guess from the current title and note, unless the user has decided. */
    function refreshSuggestion({ title = '', note: entryNote = '' } = {}) {
        if (explicit) return;
        suggested = suggestCategory({ title, note: entryNote, kind: currentKind }) || '';
        paint();
    }

    function setKind(nextKind) {
        const next = nextKind === 'income' ? 'income' : 'expense';
        if (next === currentKind) return;
        currentKind = next;

        // Income and expense do not share a vocabulary, so a leftover expense
        // category on an income entry would be nonsense.
        const info = chosen ? categoryInfo(chosen, next) : null;
        if (info && info.known && info.kind !== next) {
            chosen = '';
            explicit = false;
        }
        suggested = '';
        expanded = false;
        paint();
    }

    paint();

    return {
        element,
        getValue: () => effective(),
        setKind,
        refreshSuggestion,
        reset() {
            chosen = '';
            explicit = false;
            suggested = '';
            expanded = false;
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
