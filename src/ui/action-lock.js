/**
 * OpenExpense — one in-flight lock for public mutating actions
 *
 * Export, import, clear, and scan share a single UI lock so a second tap cannot
 * start another write or wipe while the first is still running.
 */
import { Toast } from './toast.js';

let currentAction = null;
const LOCKABLE_SELECTOR = '[data-lockable]';

function paintLock(isBusy) {
    const root = document.documentElement;
    root.classList.toggle('is-action-busy', isBusy);
    if (isBusy) root.setAttribute('aria-busy', 'true');
    else root.removeAttribute('aria-busy');

    document.querySelectorAll(LOCKABLE_SELECTOR).forEach((element) => {
        element.disabled = isBusy;
        element.setAttribute('aria-disabled', isBusy ? 'true' : 'false');
    });
}

export function actionBusy() {
    return currentAction;
}

export async function runLocked(actionName, operation) {
    if (currentAction) {
        if (currentAction !== actionName) {
            Toast.show('Please wait — another action is still running.', 'info', 2800);
        }
        return { ok: false, reason: 'busy' };
    }

    currentAction = actionName;
    paintLock(true);
    try {
        return { ok: true, value: await operation() };
    } finally {
        currentAction = null;
        paintLock(false);
    }
}
