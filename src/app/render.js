/**
 * OpenExpense — render orchestration
 *
 * Applies theme, paints the calendar, snapshot chips, dash, and sidebar, and
 * keeps the header chips (privacy + file-loaded) in sync with store state.
 */
import { applyTheme, setTheme, themeFace } from '../ui/theme.js';
import { renderCalendar } from '../features/calendar.js';
import { renderSidebar } from '../features/sidebar.js';
import { renderDashStrip } from '../features/dash-strip.js';
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

/**
 * Which state keys each surface reads. A surface left off its own list simply
 * stops repainting, with no error to notice — that is how a saved budget went
 * on showing "no caps set yet" until something unrelated forced a redraw.
 */
export const RENDER_DEPS = {
    theme: ['isDark'],
    headerToggles: ['isDark', 'autosaveEnabled', 'ledgerName'],
    privacyStatus: ['storageEncrypted', 'autosaveEnabled'],
    fileStatus: ['ledgerName', 'events'],
    ledgerNameInput: ['ledgerName'],
    calendar: ['isDark', 'currentDate', 'events'],
    dash: ['isDark', 'currentDate', 'events', 'budgets', 'plan'],
    sidebar: ['isDark', 'currentDate', 'events', 'ledgerFace', 'budgets', 'plan']
};

/** A null or empty patch means "redraw everything". */
export function shouldRender(surface, keys) {
    if (!keys || keys.length === 0) return true;
    return RENDER_DEPS[surface].some((key) => keys.includes(key));
}

export function render(changedKeys) {
    const keys = changedKeys ? Object.keys(changedKeys) : null;

    if (shouldRender('theme', keys)) applyTheme();
    if (shouldRender('headerToggles', keys)) updateHeaderToggles();
    if (shouldRender('privacyStatus', keys)) updatePrivacyStatus();
    if (shouldRender('fileStatus', keys)) updateFileStatus();
    if (shouldRender('ledgerNameInput', keys)) syncLedgerNameInput();
    if (shouldRender('calendar', keys)) renderCalendar(keys);
    if (shouldRender('dash', keys)) renderDashStrip();
    if (shouldRender('sidebar', keys)) renderSidebar(keys);
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
        setChip(false, 'lock', 'You own your data',
            'Auto-saving an encrypted local wallet with AES-256-GCM. The portable key.json is never stored in this browser.');
    }
}

function hasLoadedLedger() {
    const { events, ledgerName } = getState();
    return !!String(ledgerName || '').trim() || Object.keys(events || {}).length > 0;
}

function updateFileStatus() {
    const chip = document.getElementById('file-status');
    if (!chip) return;

    const loaded = hasLoadedLedger();
    const text = chip.querySelector('.file-status-text');
    chip.hidden = false;
    chip.classList.toggle('is-loaded', loaded);
    chip.classList.toggle('is-empty', !loaded);
    if (text) text.textContent = loaded ? 'File loaded' : 'Not loaded';
    chip.title = loaded
        ? 'A ledger is loaded on this device — from autosave or an imported backup.'
        : 'No ledger file is loaded yet. Import a backup or add an entry to begin.';
}

function syncLedgerNameInput() {
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
    const face = themeFace(isDark);
    // Rebuild when the cached button is missing or detached, otherwise a slot
    // that got cleared would leave the header with no toggle at all.
    if (themeToggleBtn?.parentElement !== toggleSlot) {
        toggleSlot.replaceChildren();
        themeToggleBtn = createHeaderIconBtn(face.nextIcon, () => setTheme(!getState().isDark));
        toggleSlot.appendChild(themeToggleBtn);
    }

    themeToggleBtn.innerHTML = `<i class="ti ti-${face.nextIcon}" aria-hidden="true"></i>`;
    themeToggleBtn.setAttribute('aria-label', `Switch to ${face.nextLabel} theme`);
    themeToggleBtn.title = `${face.label} theme · tap for ${face.nextLabel}`;
    themeToggleBtn.onclick = () => setTheme(!getState().isDark);
}

function updateAutosaveToggle() {
    const slot = document.getElementById('autosave-toggle-slot');
    if (!slot) return;

    const { autosaveEnabled } = getState();
    if (autosaveToggleBtn?.parentElement !== slot) {
        slot.replaceChildren();
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
