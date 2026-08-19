/**
 * OpenExpense — short-lived delete undo
 *
 * Snapshots the ledger in memory before a delete or clear, then shows Undo
 * next to File loaded (and on the open day sheet) for a few seconds.
 * The snapshot is never written to IndexedDB or localStorage.
 */
import { getState, patch } from '../core/store.js';
import { Toast } from '../ui/toast.js';

export const UNDO_MS = 10000;

let snapshot = null;
let timer = null;

export function captureUndoSlice(state) {
    return {
        events: JSON.parse(JSON.stringify(state.events || {})),
        budgets: JSON.parse(JSON.stringify(state.budgets || {})),
        plan: JSON.parse(JSON.stringify(state.plan || {})),
        goals: JSON.parse(JSON.stringify(state.goals || [])),
        ledgerName: state.ledgerName || '',
        selectedKey: state.selectedKey ?? null,
        editingIndex: state.editingIndex ?? null
    };
}

function undoButtons() {
    if (typeof document === 'undefined') return [];
    return [...document.querySelectorAll('[data-action="undo-delete"]')];
}

function paintUndoButtons(visible, label = 'Undo') {
    for (const btn of undoButtons()) {
        btn.hidden = !visible;
        const text = btn.querySelector('.undo-delete-text');
        if (text) text.textContent = label;
        else btn.textContent = label;
        const hint = visible
            ? `${label} last removal — available for a few seconds`
            : 'Undo last removal';
        btn.setAttribute('aria-label', hint);
        btn.title = hint;
    }
}

export function dismissUndo() {
    snapshot = null;
    if (timer) {
        clearTimeout(timer);
        timer = null;
    }
    paintUndoButtons(false);
}

export function offerDeleteUndo(state = getState(), { count = 1 } = {}) {
    snapshot = captureUndoSlice(state);
    const label = count > 1 ? `Undo (${count})` : 'Undo';
    paintUndoButtons(true, label);
    if (timer) clearTimeout(timer);
    timer = setTimeout(dismissUndo, UNDO_MS);
}

export function restoreDeleteUndo() {
    if (!snapshot) return false;
    const next = snapshot;
    dismissUndo();
    patch({
        events: next.events,
        budgets: next.budgets,
        plan: next.plan,
        goals: next.goals,
        ledgerName: next.ledgerName,
        selectedKey: next.selectedKey,
        editingIndex: next.editingIndex
    });
    Toast.show('Restored.', 'success');
    return true;
}
