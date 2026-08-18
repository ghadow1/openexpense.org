/**
 * OpenExpense — confirm dialog
 *
 * Promise-based modal. Returns { confirmed, checked, choice } so callers can
 * offer a checkbox or a radio scope (this day / this weekday / all time).
 */
import { Utils } from '../core/utils.js';
import { lockBodyScroll, unlockBodyScroll } from './scroll-lock.js';

let backdropEl = null;
let keyHandler = null;
let resolveActive = null;
let confirmLocked = false;

function teardown(result) {
    if (keyHandler) {
        document.removeEventListener('keydown', keyHandler, true);
        keyHandler = null;
    }
    if (backdropEl) {
        backdropEl.remove();
        backdropEl = null;
    }
    if (!document.getElementById('modal')?.classList.contains('open')
        && !document.querySelector('.backdrop.open')) {
        document.body.classList.remove('modal-open');
    }
    if (confirmLocked) {
        unlockBodyScroll();
        confirmLocked = false;
    }
    if (resolveActive) {
        const resolve = resolveActive;
        resolveActive = null;
        resolve(result);
    }
}

function readResult(confirmed) {
    const box = backdropEl?.querySelector('#confirm-extra');
    const picked = backdropEl?.querySelector('input[name="confirm-scope"]:checked');
    const value = backdropEl?.querySelector('#confirm-field')?.value ?? '';
    const repeat = backdropEl?.querySelector('#confirm-field-repeat')?.value ?? '';
    return {
        confirmed,
        checked: !!box?.checked,
        choice: picked?.value || null,
        value: confirmed ? value : '',
        repeat: confirmed ? repeat : ''
    };
}

// Promise-based confirm dialog. Enter confirms, Escape / backdrop click cancels.
// Resolves { confirmed, checked }.
export function confirmDialog({
    title = 'Are you sure?',
    message = '',
    confirmText = 'Yes',
    cancelText = 'Cancel',
    danger = false,
    checkbox = null,
    choices = null,
    choice = null,
    field = null,
    validate = null
} = {}) {
    teardown({ confirmed: false, checked: false, choice: null, value: '', repeat: '' });

    return new Promise((resolve) => {
        resolveActive = resolve;

        const list = Array.isArray(choices) ? choices.filter((row) => row?.value) : [];
        const selected = list.some((row) => row.value === choice) ? choice : list[0]?.value;
        const choiceHtml = list.length
            ? `<div class="confirm-choices" role="radiogroup" aria-label="What to remove">
                ${list.map((row) => `<label class="confirm-choice">
                    <input type="radio" name="confirm-scope" value="${Utils.escapeHtml(row.value)}"${row.value === selected ? ' checked' : ''}>
                    <span>${Utils.escapeHtml(row.label || row.value)}</span>
                  </label>`).join('')}
              </div>`
            : '';

        const checkHtml = !list.length && checkbox
            ? `<label class="confirm-check custom-cb">
                <input type="checkbox" id="confirm-extra"${checkbox.checked ? ' checked' : ''}>
                <span>${Utils.escapeHtml(checkbox.label || '')}</span>
              </label>`
            : '';

        const inputType = field?.type === 'password' ? 'password' : 'text';
        const autofill = inputType === 'password' ? 'new-password' : 'off';
        const fieldHtml = field
            ? `<div class="confirm-field">
                <label class="confirm-field-label" for="confirm-field">${Utils.escapeHtml(field.label || '')}</label>
                <input class="text-input" type="${inputType}" id="confirm-field"
                       autocomplete="${autofill}" spellcheck="false"
                       placeholder="${Utils.escapeHtml(field.placeholder || '')}">
                ${field.repeatLabel
                    ? `<label class="confirm-field-label" for="confirm-field-repeat">${Utils.escapeHtml(field.repeatLabel)}</label>
                       <input class="text-input" type="${inputType}" id="confirm-field-repeat"
                              autocomplete="${autofill}" spellcheck="false">`
                    : ''}
                <p class="confirm-field-error" id="confirm-field-error" role="alert" hidden></p>
              </div>`
            : '';

        backdropEl = document.createElement('div');
        backdropEl.className = 'backdrop open';
        backdropEl.innerHTML = `
            <div class="modal-shell confirm-card" role="alertdialog" aria-modal="true"
                 aria-labelledby="confirm-title" aria-describedby="confirm-desc">
              <div class="modal-header">
                <h3 class="modal-title" id="confirm-title"></h3>
              </div>
              <p class="confirm-copy" id="confirm-desc"></p>
              ${choiceHtml}
              ${fieldHtml}
              ${checkHtml}
              <div class="confirm-actions">
                <button type="button" class="btn-ghost" data-confirm="cancel"></button>
                <button type="button" class="btn-primary${danger ? ' btn-danger' : ''}" data-confirm="ok"></button>
              </div>
            </div>`;

        backdropEl.querySelector('#confirm-title').textContent = title;
        backdropEl.querySelector('#confirm-desc').textContent = message;
        const okBtn = backdropEl.querySelector('[data-confirm="ok"]');
        const cancelBtn = backdropEl.querySelector('[data-confirm="cancel"]');
        okBtn.textContent = confirmText;
        cancelBtn.textContent = cancelText;

        // Hold the dialog open when the caller rejects what was typed, so the
        // user can correct it instead of starting over.
        const submit = () => {
            const result = readResult(true);
            const problem = typeof validate === 'function' ? validate(result) : null;
            if (problem) {
                const slot = backdropEl?.querySelector('#confirm-field-error');
                if (slot) {
                    slot.textContent = problem;
                    slot.hidden = false;
                }
                backdropEl?.querySelector('#confirm-field')?.focus();
                return;
            }
            teardown(result);
        };

        okBtn.addEventListener('click', submit);
        cancelBtn.addEventListener('click', () => teardown(readResult(false)));
        backdropEl.addEventListener('mousedown', (e) => {
            if (e.target === backdropEl) teardown(readResult(false));
        });

        keyHandler = (e) => {
            if (e.key === 'Enter') {
                e.preventDefault();
                e.stopPropagation();
                submit();
            } else if (e.key === 'Escape') {
                e.preventDefault();
                e.stopPropagation();
                teardown(readResult(false));
            }
        };
        document.addEventListener('keydown', keyHandler, true);

        Utils.hideTooltip();
        document.body.classList.add('modal-open');
        lockBodyScroll();
        confirmLocked = true;
        document.body.appendChild(backdropEl);
        const firstField = backdropEl.querySelector('#confirm-field');
        requestAnimationFrame(() => (firstField || okBtn).focus());
    });
}
