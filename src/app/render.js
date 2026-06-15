import { applyTheme, setTheme } from '../ui/theme.js';
import { renderCalendar } from '../features/calendar.js';
import { renderSidebar } from '../features/sidebar.js';
import { getState } from '../core/store.js';
import { UI } from '../ui/components.js';

export function render() {
    applyTheme();
    renderToolbar();
    syncLedgerNameInput();
    renderCalendar();
    renderSidebar();
}

export function syncLedgerNameInput() {
    const input = document.getElementById('ledger-name-input');
    const { ledgerName } = getState();
    if (input && document.activeElement !== input && input.value !== ledgerName) {
        input.value = ledgerName;
    }
}

export function renderToolbar() {
    const toggleSlot = document.getElementById('theme-toggle-slot');
    if (toggleSlot) {
        toggleSlot.innerHTML = '';
        const { isDark } = getState();
        const btn = UI.createButton('', () => setTheme(!isDark),
            { icon: isDark ? 'sun' : 'moon', iconOnly: true });
        btn.setAttribute('aria-label', isDark ? 'Switch to light mode' : 'Switch to dark mode');
        btn.title = isDark ? 'Switch to light mode' : 'Switch to dark mode';

        Object.assign(btn.style, {
            fontSize: '10px', fontWeight: '600', background: 'var(--surface2)',
            border: '1px solid var(--border)', color: 'var(--text2)', padding: '2px 6px',
            borderRadius: '4px', height: 'auto', boxShadow: 'none', width: 'auto'
        });
        toggleSlot.appendChild(btn);
    }
}
