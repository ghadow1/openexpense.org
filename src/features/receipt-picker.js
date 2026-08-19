/**
 * Lightweight, synchronous receipt picker.
 *
 * Kept separate from OCR so opening the native camera/file chooser preserves
 * the user gesture while the heavier receipt pipeline stays out of startup.
 */
import { Utils } from '../core/utils.js';
import { Toast } from '../ui/toast.js';
import { actionBusy } from '../ui/action-lock.js';

let intendedDate = null;

export function pickReceiptFile({ dateKey = null } = {}) {
    if (actionBusy()) {
        Toast.show('Please wait — another action is still running.', 'info', 2800);
        return false;
    }
    const input = document.getElementById('receipt-scan-input');
    if (!input) return false;
    intendedDate = dateKey;
    input.value = '';
    if (Utils.prefersCamera()) input.setAttribute('capture', 'environment');
    else input.removeAttribute('capture');
    input.click();
    return true;
}

export function takeReceiptDateContext() {
    const dateKey = intendedDate;
    intendedDate = null;
    return dateKey;
}
