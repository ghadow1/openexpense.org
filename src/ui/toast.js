import { Utils } from '../core/utils.js';

export const Toast = {
    icons: { success: 'circle-check', error: 'alert-triangle', info: 'info-circle' },
    show(message, type = 'info', timeout = 3200) {
        let stack = document.getElementById('toast-stack');
        if (!stack) {
            stack = document.createElement('div');
            stack.id = 'toast-stack';
            stack.className = 'toast-stack';
            document.body.appendChild(stack);
        }
        const el = document.createElement('div');
        el.className = `toast toast-${type}`;
        el.setAttribute('role', 'status');
        el.innerHTML = `<i class="ti ti-${Toast.icons[type] || Toast.icons.info}"></i><span>${Utils.escapeHtml(message)}</span>`;
        stack.appendChild(el);
        requestAnimationFrame(() => el.classList.add('show'));
        setTimeout(() => {
            el.classList.remove('show');
            setTimeout(() => el.remove(), 220);
        }, timeout);
    }
};
