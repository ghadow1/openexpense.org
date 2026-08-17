/**
 * OpenExpense — one in-flight lock for public mutating actions
 *
 * Export, import, clear, and scan share a single lock so a second tap
 * cannot start a second write or wipe while the first is still running.
 */
import { Toast } from '../ui/toast.js';

let current = null;

const LOCKABLE = '[data-lockable]';

function paintLock(busy) {
    const root = document.documentElement;
    root.classList.toggle('is-action-busy', busy);
    if (busy) root.setAttribute('aria-busy', 'true');
    else root.removeAttribute('aria-busy');

    document.querySelectorAll(LOCKABLE).forEach((el) => {
        el.disabled = busy;
        el.setAttribute('aria-disabled', busy ? 'true' : 'false');
    });
}

export function actionBusy() {
    return current;
}

export async function runLocked(name, fn) {
    if (current) {
        if (current !== name) {
            Toast.show('Please wait — another action is still running.', 'info', 2800);
        }
        return { ok: false, reason: 'busy' };
    }

    current = name;
    paintLock(true);
    try {
        return { ok: true, value: await fn() };
    } finally {
        current = null;
        paintLock(false);
    }
}
