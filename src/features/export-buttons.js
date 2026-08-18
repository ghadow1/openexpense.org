/**
 * OpenExpense — Export / Save button state
 *
 * When a directory handle is linked, every Export control becomes Save and
 * writes over the existing JSON in that folder. Tracker keeps the control
 * icon-only; Privacy shows a text label. The name also lives in aria-label.
 */
import { getSavedFolder } from '../core/folder.js';

const SAVE_HINT = 'Save the current ledger into your OpenExpense folder (updates the existing JSON). Long-press to choose another folder';
const EXPORT_HINT = 'Export to the OpenExpense folder. Long-press to choose another folder';

function setIcon(el, icon) {
    const iconEl = el.querySelector('i');
    if (iconEl) iconEl.className = `ti ti-${icon}`;
}

function setLabel(el, text) {
    const span = el.querySelector('span');
    if (span) span.textContent = text;
}

export function paintExportButtons(linked) {
    const icon = linked ? 'device-floppy' : 'download';
    const label = linked ? 'Save' : 'Export';
    const hint = linked ? SAVE_HINT : EXPORT_HINT;

    document.querySelectorAll('[data-action="export-ledger"]').forEach((el) => {
        setIcon(el, icon);
        if (el.classList.contains('privacy-tool-btn')) {
            const span = el.querySelector('span');
            if (span) span.textContent = linked ? 'Save JSON backup' : 'Download JSON backup';
        } else {
            setLabel(el, label);
        }
        el.setAttribute('aria-label', hint);
        el.title = hint;
        el.classList.toggle('is-linked', linked);
    });
}

export async function refreshExportButtons() {
    const linked = !!(await getSavedFolder());
    paintExportButtons(linked);
    return linked;
}
