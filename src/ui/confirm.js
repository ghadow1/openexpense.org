import { Utils } from '../core/utils.js';

let backdropEl = null;
let keyHandler = null;
let resolveActive = null;

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
    if (resolveActive) {
        const resolve = resolveActive;
        resolveActive = null;
        resolve(result);
    }
}

// Promise-based confirm dialog. Enter confirms, Escape / backdrop click cancels.
export function confirmDialog({
    title = 'Are you sure?',
    message = '',
    confirmText = 'Yes',
    cancelText = 'Cancel',
    danger = false
} = {}) {
    teardown(false);

    return new Promise((resolve) => {
        resolveActive = resolve;

        backdropEl = document.createElement('div');
        backdropEl.className = 'backdrop open';
        backdropEl.innerHTML = `
            <div class="modal-shell confirm-card" role="alertdialog" aria-modal="true"
                 aria-labelledby="confirm-title" aria-describedby="confirm-desc">
              <div class="modal-header">
                <h3 class="modal-title" id="confirm-title"></h3>
              </div>
              <p class="confirm-copy" id="confirm-desc"></p>
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

        okBtn.addEventListener('click', () => teardown(true));
        cancelBtn.addEventListener('click', () => teardown(false));
        backdropEl.addEventListener('mousedown', (e) => {
            if (e.target === backdropEl) teardown(false);
        });

        keyHandler = (e) => {
            if (e.key === 'Enter') {
                e.preventDefault();
                e.stopPropagation();
                teardown(true);
            } else if (e.key === 'Escape') {
                e.preventDefault();
                e.stopPropagation();
                teardown(false);
            }
        };
        document.addEventListener('keydown', keyHandler, true);

        Utils.hideTooltip();
        document.body.classList.add('modal-open');
        document.body.appendChild(backdropEl);
        requestAnimationFrame(() => okBtn.focus());
    });
}
