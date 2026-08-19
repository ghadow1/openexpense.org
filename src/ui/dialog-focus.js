/**
 * OpenExpense — keyboard focus boundary for modal surfaces
 *
 * Visual positioning remains owned by `.backdrop` and `.modal-shell`. This
 * module changes no classes or styles; it only keeps Tab inside the topmost
 * open dialog and returns focus to the control that launched it.
 */
const FOCUSABLE_SELECTOR = [
    'a[href]',
    'button:not([disabled])',
    'input:not([disabled]):not([type="hidden"])',
    'select:not([disabled])',
    'textarea:not([disabled])',
    'details > summary:first-of-type',
    '[tabindex]:not([tabindex="-1"])'
].join(',');

const dialogStack = [];
let listening = false;

function topLevelBodyChild(element) {
    let current = element;
    while (current?.parentElement && current.parentElement !== document.body) {
        current = current.parentElement;
    }
    return current?.parentElement === document.body ? current : null;
}

function isolateDialog(dialog) {
    const dialogLayer = topLevelBodyChild(dialog);
    if (!dialogLayer) return [];
    return [...document.body.children]
        .filter((element) => element !== dialogLayer && !['SCRIPT', 'STYLE', 'LINK'].includes(element.tagName))
        .map((element) => {
            const previous = {
                element,
                inert: element.inert,
                ariaHidden: element.getAttribute('aria-hidden')
            };
            element.inert = true;
            element.setAttribute('aria-hidden', 'true');
            return previous;
        });
}

function restoreIsolation(entries) {
    entries.forEach(({ element, inert, ariaHidden }) => {
        if (!element.isConnected) return;
        element.inert = inert;
        if (ariaHidden == null) element.removeAttribute('aria-hidden');
        else element.setAttribute('aria-hidden', ariaHidden);
    });
}

function visibleFocusableElements(dialog) {
    return [...dialog.querySelectorAll(FOCUSABLE_SELECTOR)].filter((element) => {
        if (element.hidden || element.closest('[hidden]')) return false;
        const style = window.getComputedStyle(element);
        return style.display !== 'none' && style.visibility !== 'hidden';
    });
}

function containTab(event) {
    if (event.key !== 'Tab' || !dialogStack.length) return;
    const { dialog } = dialogStack[dialogStack.length - 1];
    if (!dialog?.isConnected) return;

    const focusable = visibleFocusableElements(dialog);
    if (!focusable.length) {
        event.preventDefault();
        dialog.focus({ preventScroll: true });
        return;
    }

    const first = focusable[0];
    const last = focusable[focusable.length - 1];
    const active = document.activeElement;
    if (event.shiftKey && (active === first || !dialog.contains(active))) {
        event.preventDefault();
        last.focus();
    } else if (!event.shiftKey && (active === last || !dialog.contains(active))) {
        event.preventDefault();
        first.focus();
    }
}

/**
 * Make a rendered `role="dialog"` the active keyboard boundary.
 *
 * Re-activating the same node is harmless, which matters when the day editor
 * is repainted while it remains open.
 *
 * @param {HTMLElement | null} dialog
 * @param {HTMLElement | null} initialFocus
 */
export function activateDialogFocus(dialog, initialFocus = null) {
    if (!dialog || dialogStack.some((entry) => entry.dialog === dialog)) return;
    const returnFocus = document.activeElement instanceof HTMLElement
        ? document.activeElement
        : null;
    dialogStack.push({ dialog, returnFocus, isolated: isolateDialog(dialog) });

    if (!listening) {
        document.addEventListener('keydown', containTab, true);
        listening = true;
    }

    requestAnimationFrame(() => {
        if (dialogStack.at(-1)?.dialog !== dialog || !dialog.isConnected) return;
        const target = initialFocus?.isConnected
            ? initialFocus
            : visibleFocusableElements(dialog)[0] || dialog;
        if (target === dialog && !dialog.hasAttribute('tabindex')) {
            dialog.setAttribute('tabindex', '-1');
        }
        target.focus({ preventScroll: true });
    });
}

/**
 * Release a dialog and restore the launch point when it still exists.
 * @param {HTMLElement | null} dialog
 */
export function deactivateDialogFocus(dialog) {
    const index = dialogStack.findIndex((entry) => entry.dialog === dialog);
    if (index < 0) return;
    const [{ returnFocus, isolated }] = dialogStack.splice(index, 1);
    restoreIsolation(isolated);

    if (!dialogStack.length && listening) {
        document.removeEventListener('keydown', containTab, true);
        listening = false;
    }

    if (returnFocus?.isConnected && !returnFocus.closest('[hidden]')) {
        requestAnimationFrame(() => returnFocus.focus({ preventScroll: true }));
    }
}
