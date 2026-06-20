import { CONFIG, STORAGE_KEYS } from './config.js';
import { getState, patch, subscribe } from './core/store.js';
import * as store from './core/store.js';
import { loadLedger, initPersist } from './core/persist.js';
import { cryptoAvailable } from './core/crypto.js';
import { Utils } from './core/utils.js';
import { render } from './app/render.js';
import { switchView, switchDocTab, showWelcome, closeWelcomeModal } from './app/views.js';
import { closeModal, initModalBindings, renderModal, openModal } from './features/modal.js';
import { bindResponsiveCalendar } from './features/calendar.js';
import { Ledger } from './features/ledger.js';
import { Receipt } from './features/receipt.js';
import { Toast } from './ui/toast.js';

async function initApplication() {
    const bootPatch = {};

    try {
        const storedTheme = localStorage.getItem(STORAGE_KEYS.theme);
        if (storedTheme) bootPatch.isDark = storedTheme === 'dark';
    } catch (_) { }

    // Local encrypted autosave is on by default; only an explicit opt-out disables it.
    try {
        if (localStorage.getItem(STORAGE_KEYS.autosave) === 'false') {
            bootPatch.autosaveEnabled = false;
        }
    } catch (_) { }

    bootPatch.storageEncrypted = cryptoAvailable();

    const saved = await loadLedger();
    if (saved && typeof saved === 'object') {
        if (saved.name) bootPatch.ledgerName = Utils.sanitizeFilename(saved.name);
        if (saved.events && typeof saved.events === 'object') bootPatch.events = saved.events;
    }

    patch(bootPatch);

    initPersist(store);

    const versionBadge = document.getElementById('app-version');
    if (versionBadge && CONFIG.version) {
        versionBadge.textContent = CONFIG.version;
        versionBadge.style.display = 'inline-block';
        if (CONFIG.buildEnv) Utils.bindTooltip(versionBadge, `Environment: ${CONFIG.buildEnv}`);
    }

    switchView('app');

    const importInput = document.getElementById('ledger-import-input');
    if (importInput && !importInput.dataset.bound) {
        importInput.addEventListener('change', Ledger.handleImport);
        importInput.dataset.bound = '1';
    }
    const ledgerNameInput = document.getElementById('ledger-name-input');
    if (ledgerNameInput && !ledgerNameInput.dataset.bound) {
        ledgerNameInput.addEventListener('input', (e) => Ledger.setLedgerName(e.target.value));
        ledgerNameInput.dataset.bound = '1';
    }
    const scanInput = document.getElementById('receipt-scan-input');
    if (scanInput && !scanInput.dataset.bound) {
        scanInput.addEventListener('change', (e) => {
            const file = e.target.files && e.target.files[0];
            if (file) Receipt.scan(file);
            e.target.value = '';
        });
        scanInput.dataset.bound = '1';
    }

    initModalBindings();
    bindResponsiveCalendar();

    // @tag ocr-performance Warm OCR during idle time unless the browser is in data-saver mode.
    const warmOcr = () => { Receipt.warmEngine(); };
    if (typeof requestIdleCallback === 'function') requestIdleCallback(warmOcr, { timeout: 8000 });
    else setTimeout(warmOcr, 3000);

    window.__oeBoot = { ok: true };
}

function handleDelegatedClick(e) {
    const actionEl = e.target.closest('[data-action]');
    if (actionEl) {
        const action = actionEl.dataset.action;
        switch (action) {
            case 'close-welcome':
                closeWelcomeModal();
                break;
            case 'close-modal':
                closeModal();
                break;
            case 'scan-receipt':
                if (document.getElementById('view-app')?.classList.contains('hidden')) switchView('app');
                Receipt.pickImage();
                break;
            case 'quick-add-today': {
                const now = new Date();
                switchView('app');
                openModal(Utils.dateKey(now.getFullYear(), now.getMonth(), now.getDate()));
                break;
            }
        }
        return;
    }

    const viewEl = e.target.closest('[data-view]');
    if (viewEl) {
        switchView(viewEl.dataset.view);
        return;
    }

    const tabEl = e.target.closest('[data-tab]');
    if (tabEl) {
        switchDocTab(tabEl.dataset.tab);
    }
}

document.addEventListener('click', handleDelegatedClick);

let pendingKeys = null;
let renderFrame = 0;

function queueRender(changedKeys) {
    pendingKeys = pendingKeys ? { ...pendingKeys, ...changedKeys } : { ...changedKeys };
    if (renderFrame) return;
    renderFrame = requestAnimationFrame(() => {
        renderFrame = 0;
        const keys = pendingKeys;
        pendingKeys = null;
        const keyList = Object.keys(keys);
        const needsApp = keyList.some(k => ['isDark', 'autosaveEnabled', 'ledgerName', 'currentDate', 'events'].includes(k));
        const needsModal = getState().selectedKey
            && keyList.some(k => ['selectedKey', 'events', 'editingIndex', 'isDark'].includes(k));

        if (needsApp) render(keys);

        if (needsModal) renderModal();
    });
}

subscribe(queueRender);

document.addEventListener('DOMContentLoaded', () => {
    initApplication().catch((err) => {
        console.error('[OpenExpense] init failed:', err);
        Toast.show('Failed to start OpenExpense. Try refreshing the page.', 'error', 6000);
    });
    showWelcome();
});
