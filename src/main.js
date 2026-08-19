/**
 * OpenExpense — application entry
 *
 * Boots the store from encrypted IndexedDB, wires header/import/scan
 * controls, and subscribes the renderer. Bundled by esbuild into /app.js.
 */
import { CONFIG, STORAGE_KEYS } from './config.js';
import { getState, patch, subscribe } from './core/store.js';
import * as store from './core/store.js';
import { loadLedger, initPersist } from './core/persist.js';
import { openSearch } from './features/search-panel.js';
import { sanitizeLedger } from './core/ledger-file.js';
import { cryptoAvailable } from './core/crypto.js';
import { Utils } from './core/utils.js';
import { render } from './app/render.js';
import { switchView, switchDocTab, showWelcome, closeWelcomeModal, shouldShowNotFound, bootShell } from './app/views.js';
import { closeModal, initModalBindings, renderModal, openModal, shiftSelectedDay } from './features/modal.js';
import { bindResponsiveCalendar } from './features/calendar.js';
import { Ledger } from './features/ledger.js';
import { Receipt } from './features/receipt.js';
import { Toast } from './ui/toast.js';
import { actionBusy } from './core/action-lock.js';
import { refreshExportButtons } from './features/export-buttons.js';
import { restoreDeleteUndo } from './features/undo-delete.js';
import { setLedgerFace } from './features/sidebar.js';
import { bootFrame } from './ui/frame.js';
import { attachHostApi, isEmbedMode } from './engine/host.js';

const LOCKED_ACTIONS = new Set(['export-ledger', 'import-ledger', 'clear-ledger', 'scan-receipt', 'quick-add-today']);

function openNotFoundPage() {
    try {
        location.replace(`${location.origin}/404.html`);
    } catch (_) {
        location.href = '/404.html';
    }
}

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

    try {
        if (localStorage.getItem(STORAGE_KEYS.ledgerFace) === 'income') {
            bootPatch.ledgerFace = 'income';
        }
    } catch (_) { }

    try {
        const filter = localStorage.getItem(STORAGE_KEYS.trackerFilter);
        if (filter === 'income' || filter === 'expense' || filter === 'all') {
            bootPatch.trackerFilter = filter;
            if (filter !== 'all') bootPatch.ledgerFace = filter;
        }
    } catch (_) { }

    bootPatch.storageEncrypted = cryptoAvailable();

    const embed = isEmbedMode();
    let saved = null;
    let localLoadFailed = false;
    if (embed) {
        bootPatch.autosaveEnabled = false;
    } else {
        try {
            saved = await loadLedger();
        } catch (err) {
            localLoadFailed = true;
            bootPatch.autosaveEnabled = false;
            console.error('[OpenExpense] encrypted local ledger could not be opened:', err);
        }
        const cleaned = saved ? sanitizeLedger(saved) : null;
        if (cleaned) {
            bootPatch.ledgerName = cleaned.name;
            bootPatch.events = cleaned.events;
            bootPatch.budgets = cleaned.budgets || {};
            bootPatch.plan = cleaned.plan || {};
        }
    }

    patch(bootPatch);

    initPersist(store);
    window.addEventListener('openexpense:storage-purged', () => {
        patch({ autosaveEnabled: false });
        Toast.show(
            'Another OpenExpense tab cleared local storage. Autosave is paused here to prevent restoring deleted data. Reload this tab.',
            'error',
            9000
        );
    });

    const versionBadge = document.getElementById('app-version');
    if (versionBadge && CONFIG.version) {
        versionBadge.textContent = CONFIG.version;
        versionBadge.style.display = 'inline-block';
        if (CONFIG.buildEnv) Utils.bindTooltip(versionBadge, `Environment: ${CONFIG.buildEnv}`);
    }

    if (shouldShowNotFound(location.pathname)) {
        window.__oeBoot = { ok: true };
        openNotFoundPage();
        return;
    }

    await refreshExportButtons().catch(() => {});
    bootFrame(() => render());
    bootShell();
    render();
    if (localLoadFailed) {
        Toast.show(
            'Encrypted local data could not be opened. Autosave is paused to preserve it. Import a known-good backup or use another browser profile.',
            'error',
            9000
        );
    }

    const importInput = document.getElementById('ledger-import-input');
    if (importInput && !importInput.dataset.bound) {
        importInput.addEventListener('change', Ledger.handleImport);
        importInput.dataset.bound = '1';
    }
    const keyInput = document.getElementById('ledger-key-input');
    if (keyInput && !keyInput.dataset.bound) {
        keyInput.addEventListener('change', Ledger.handleKeyImport);
        keyInput.dataset.bound = '1';
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

    document.querySelectorAll('[data-action="export-ledger"]').forEach((btn) => Ledger.bindFolderGesture(btn));
    bindSearchShortcut();

    attachHostApi();
    window.__oeBoot = { ok: true };
}

/** Ctrl/Cmd+K, and "/" when the user is not already typing somewhere. */
function bindSearchShortcut() {
    document.addEventListener('keydown', (event) => {
        const typing = event.target?.closest?.('input, textarea, select, [contenteditable="true"]');
        const combo = (event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 'k';
        if (!combo && (event.key !== '/' || typing)) return;
        if (combo && typing && event.target.id === 'search-input') return;
        event.preventDefault();
        if (getState().shellTab === 'privacy') switchView('overview');
        openSearch();
    });
}

/**
 * Document-level clicks. Frozen hooks:
 *   [data-action]           export, import, add, scan, search, undo, day nav
 *   [data-face]             leftover expense/income face (sidebar used to own this)
 *   [data-tracker-filter]   All / Expenses / Income
 *   [data-view]             bottom tabs
 *   [data-tab]              Privacy chapter tabs
 */
function handleDelegatedClick(e) {
    const actionEl = e.target.closest('[data-action]');
    if (actionEl) {
        const action = actionEl.dataset.action;
        if (LOCKED_ACTIONS.has(action) && actionBusy()) {
            e.preventDefault();
            return;
        }
        switch (action) {
            case 'close-welcome':
                closeWelcomeModal();
                break;
            case 'close-modal':
                closeModal();
                break;
            case 'scan-receipt':
                if (getState().shellTab === 'privacy') switchView('overview');
                Receipt.pickImage();
                break;
            case 'quick-add-today': {
                const now = new Date();
                if (getState().shellTab === 'privacy') switchView('overview');
                openModal(Utils.dateKey(now.getFullYear(), now.getMonth(), now.getDate()));
                break;
            }
            case 'export-ledger':
                Ledger.export();
                break;
            case 'import-ledger':
                Ledger.import();
                break;
            case 'clear-ledger':
                Ledger.clearLedger();
                break;
            case 'search-ledger':
                if (getState().shellTab === 'privacy') switchView('overview');
                openSearch();
                break;
            case 'undo-delete':
                restoreDeleteUndo();
                break;
            case 'day-prev':
                shiftSelectedDay(-1);
                break;
            case 'day-next':
                shiftSelectedDay(1);
                break;
        }
        return;
    }

    const faceEl = e.target.closest('[data-face]');
    if (faceEl) {
        setLedgerFace(faceEl.dataset.face);
        return;
    }

    const filterEl = e.target.closest('[data-tracker-filter]');
    if (filterEl) {
        const filter = filterEl.dataset.trackerFilter;
        if (filter === 'all' || filter === 'expense' || filter === 'income') {
            try { localStorage.setItem(STORAGE_KEYS.trackerFilter, filter); } catch (_) { /* ignore */ }
            const next = { trackerFilter: filter };
            if (filter !== 'all') {
                next.ledgerFace = filter;
                try { localStorage.setItem(STORAGE_KEYS.ledgerFace, filter); } catch (_) { /* ignore */ }
            }
            patch(next);
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
        const needsApp = keyList.some(k => ['isDark', 'autosaveEnabled', 'ledgerName', 'currentDate', 'events', 'ledgerFace', 'trackerFilter', 'plan', 'budgets'].includes(k));
        const needsModal = getState().selectedKey
            && keyList.some(k => ['selectedKey', 'events', 'editingIndex', 'isDark', 'ledgerFace'].includes(k));

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
    if (!isEmbedMode()) showWelcome();
});
