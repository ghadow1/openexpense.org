import { applyTheme, setTheme } from '../ui/theme.js';
import { renderCalendar } from '../features/calendar.js';
import { renderSidebar } from '../features/sidebar.js';
import { getState } from '../core/store.js';
import { UI } from '../ui/components.js';

let themeToggleBtn = null;

export function render(changedKeys) {
    const keys = changedKeys ? Object.keys(changedKeys) : null;
    const all = !keys || keys.length === 0;

    if (all || keys.includes('isDark')) {
        applyTheme();
        updateThemeToggle();
    }
    if (all || keys.includes('ledgerName')) {
        syncLedgerNameInput();
    }
    if (all || keys.includes('isDark') || keys.includes('currentDate') || keys.includes('events')) {
        renderCalendar(keys);
        renderSidebar();
    }
}

export function syncLedgerNameInput() {
    const input = document.getElementById('ledger-name-input');
    const { ledgerName } = getState();
    if (input && document.activeElement !== input && input.value !== ledgerName) {
        input.value = ledgerName;
    }
}

function updateThemeToggle() {
    const toggleSlot = document.getElementById('theme-toggle-slot');
    if (!toggleSlot) return;

    const { isDark } = getState();
    if (!themeToggleBtn) {
        toggleSlot.innerHTML = '';
        themeToggleBtn = UI.createButton('', () => setTheme(!getState().isDark),
            { icon: isDark ? 'sun' : 'moon', iconOnly: true });
        Object.assign(themeToggleBtn.style, {
            fontSize: '10px', fontWeight: '600', background: 'var(--surface2)',
            border: '1px solid var(--border)', color: 'var(--text2)', padding: '2px 6px',
            borderRadius: '4px', height: 'auto', boxShadow: 'none', width: 'auto'
        });
        toggleSlot.appendChild(themeToggleBtn);
    }

    themeToggleBtn.innerHTML = `<i class="ti ti-${isDark ? 'sun' : 'moon'}" style="font-size: 15px;"></i>`;
    themeToggleBtn.setAttribute('aria-label', isDark ? 'Switch to light mode' : 'Switch to dark mode');
    themeToggleBtn.title = isDark ? 'Switch to light mode' : 'Switch to dark mode';
    themeToggleBtn.onclick = () => setTheme(!getState().isDark);
}
