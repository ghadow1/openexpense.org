/**
 * OpenExpense — Export / Save button labels
 *
 * When a directory handle is linked, both Export controls become Save and
 * write over the existing JSON in that folder.
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

    const dash = document.querySelector('[data-action="export-ledger"]');
    if (dash) {
        setIcon(dash, icon);
        setLabel(dash, label);
        dash.setAttribute('aria-label', hint);
        dash.title = hint;
        dash.classList.toggle('is-linked', linked);
    }

    const cal = document.getElementById('cal-export-btn');
    if (cal) {
        setIcon(cal, icon);
        setLabel(cal, label);
        cal.setAttribute('aria-label', hint);
        cal.title = hint;
        cal.classList.toggle('is-linked', linked);
        cal.classList.toggle('ui-btn--accent', linked);
    }
}

export async function refreshExportButtons() {
    const linked = !!(await getSavedFolder());
    paintExportButtons(linked);
    return linked;
}
