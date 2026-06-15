import { CONFIG, STORAGE_KEYS } from './config.js';
import { getState, patch, subscribe } from './core/store.js';
import * as store from './core/store.js';
import { loadLedger, initPersist } from './core/persist.js';
import { Utils } from './core/utils.js';
import { render } from './app/render.js';
import { switchView, switchDocTab, showWelcome, closeWelcomeModal } from './app/views.js';
import { closeModal, initModalBindings, renderModal } from './features/modal.js';
import { Ledger } from './features/ledger.js';
import { Receipt } from './features/receipt.js';
import { Toast } from './ui/toast.js';

async function initApplication() {
    try {
        const storedTheme = localStorage.getItem(STORAGE_KEYS.theme);
        if (storedTheme) patch({ isDark: storedTheme === 'dark' });
    } catch (_) { }

    const saved = await loadLedger();
    if (saved && typeof saved === 'object') {
        patch({
            ledgerName: saved.name ? Utils.sanitizeFilename(saved.name) : getState().ledgerName,
            events: saved.events && typeof saved.events === 'object' ? saved.events : getState().events
        });
    } else {
        try {
            const storedName = localStorage.getItem(STORAGE_KEYS.ledgerName);
            if (storedName) patch({ ledgerName: Utils.sanitizeFilename(storedName) });
        } catch (_) { }
    }

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

subscribe(() => {
    render();
    if (getState().selectedKey) renderModal();
});

document.addEventListener('DOMContentLoaded', () => {
    initApplication().catch((err) => {
        console.error('[OpenExpense] init failed:', err);
        Toast.show('Failed to start OpenExpense. Try refreshing the page.', 'error', 6000);
    });
    showWelcome();
});
