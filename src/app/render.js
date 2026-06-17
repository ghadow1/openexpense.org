import { applyTheme, setTheme } from '../ui/theme.js';
import { renderCalendar } from '../features/calendar.js';
import { renderSidebar } from '../features/sidebar.js';
import { getState } from '../core/store.js';
import { Ledger } from '../features/ledger.js';

let themeToggleBtn = null;
let autosaveToggleBtn = null;

function createHeaderIconBtn(icon, onClick) {
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'header-icon-btn';
    btn.innerHTML = `<i class="ti ti-${icon}" aria-hidden="true"></i>`;
    btn.onclick = onClick;
    return btn;
}

export function render(changedKeys) {
    const keys = changedKeys ? Object.keys(changedKeys) : null;
    const all = !keys || keys.length === 0;

    if (all || keys.includes('isDark')) {
        applyTheme();
    }
    if (all || keys.includes('isDark') || keys.includes('autosaveEnabled') || keys.includes('ledgerName')) {
        updateHeaderToggles();
    }
    if (all || keys.includes('storageEncrypted') || keys.includes('autosaveEnabled')) {
        updatePrivacyStatus();
    }
    if (all || keys.includes('ledgerName')) {
        syncLedgerNameInput();
    }
    if (all || keys.includes('isDark') || keys.includes('currentDate') || keys.includes('events')) {
        renderCalendar(keys);
        renderSidebar();
    }
}

function updatePrivacyStatus() {
    const chip = document.getElementById('privacy-status');
    if (!chip) return;

    const { storageEncrypted, autosaveEnabled } = getState();
    const icon = chip.querySelector('.privacy-chip-icon');
    const text = chip.querySelector('.privacy-chip-text');

    chip.hidden = false;

    const setChip = (warn, iconName, label, title) => {
        chip.classList.toggle('is-warn', warn);
        if (icon) icon.className = `ti ti-${iconName} privacy-chip-icon`;
        if (text) text.textContent = label;
        chip.title = title;
    };

    if (!storageEncrypted) {
        setChip(true, 'lock-open', 'Unencrypted — local only',
            'Encryption needs a secure context (https or localhost). Your data stays on this device but is not encrypted in this browser context.');
    } else if (!autosaveEnabled) {
        setChip(true, 'alert-triangle', 'Not saving — session only',
            "Autosave is off, so changes this session aren't written to your device. Turn it back on with the disk button, or export a backup.");
    } else {
        setChip(false, 'lock', 'Encrypted — data stays here',
            'Auto-saving encrypted on this device with AES-256-GCM. Your key never leaves your browser.');
    }
}

export function syncLedgerNameInput() {
    const input = document.getElementById('ledger-name-input');
    const { ledgerName } = getState();
    if (input && document.activeElement !== input && input.value !== ledgerName) {
        input.value = ledgerName;
    }
}

function updateHeaderToggles() {
    updateThemeToggle();
    updateAutosaveToggle();
}

function updateThemeToggle() {
    const toggleSlot = document.getElementById('theme-toggle-slot');
    if (!toggleSlot) return;

    const { isDark } = getState();
    if (!themeToggleBtn) {
        toggleSlot.innerHTML = '';
        themeToggleBtn = createHeaderIconBtn(isDark ? 'sun' : 'moon', () => setTheme(!getState().isDark));
        toggleSlot.appendChild(themeToggleBtn);
    }

    themeToggleBtn.innerHTML = `<i class="ti ti-${isDark ? 'sun' : 'moon'}" aria-hidden="true"></i>`;
    themeToggleBtn.setAttribute('aria-label', isDark ? 'Switch to light mode' : 'Switch to dark mode');
    themeToggleBtn.title = isDark ? 'Switch to light mode' : 'Switch to dark mode';
    themeToggleBtn.onclick = () => setTheme(!getState().isDark);
}

function updateAutosaveToggle() {
    const slot = document.getElementById('autosave-toggle-slot');
    if (!slot) return;

    const { autosaveEnabled } = getState();
    if (!autosaveToggleBtn) {
        slot.innerHTML = '';
        autosaveToggleBtn = createHeaderIconBtn('device-floppy', () => Ledger.toggleAutosave());
        slot.appendChild(autosaveToggleBtn);
    }

    autosaveToggleBtn.classList.toggle('is-active', autosaveEnabled);
    autosaveToggleBtn.innerHTML = `<i class="ti ti-device-floppy autosave-icon" aria-hidden="true"></i>`;
    autosaveToggleBtn.setAttribute('aria-label', autosaveEnabled ? 'Autosave on' : 'Autosave off');
    autosaveToggleBtn.setAttribute('aria-pressed', autosaveEnabled ? 'true' : 'false');
    autosaveToggleBtn.title = autosaveEnabled
        ? 'Autosave on — saving encrypted on this device. Click to pause.'
        : 'Autosave off — click to save changes encrypted on this device.';
    autosaveToggleBtn.onclick = () => Ledger.toggleAutosave();
}
