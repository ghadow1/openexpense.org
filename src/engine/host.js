/**
 * OpenExpense — live-page host API
 *
 * Attaches window.OpenExpense after boot. Writes always go through sanitize.
 */
import { getState, patch, subscribe } from '../core/store.js';
import { sanitizeLedger } from '../core/ledger-file.js';
import { categorize } from './categorize.js';
import { mapTransaction, mapTransactions, mergeTransactions } from './map.js';
import { budgetStatus, detectRecurring, flagAnomalies, snapshot } from './insights.js';
import { bindHostBridge, isEmbedMode } from './bridge.js';

function currentLedger() {
    const { ledgerName, events } = getState();
    return { name: ledgerName || '', events: events || {} };
}

function applyLedger(payload) {
    const cleaned = sanitizeLedger(payload || {}) || { name: '', events: {} };
    patch({ ledgerName: cleaned.name || '', events: cleaned.events || {} });
    return currentLedger();
}

export function createHostApi() {
    return {
        version: '2.2.0',
        get: currentLedger,
        set: applyLedger,
        importTransactions(list) {
            const { ledgerName, events } = getState();
            return applyLedger({ name: ledgerName, events: mergeTransactions(events, list) });
        },
        getSnapshot(date) {
            return snapshot(getState().events, date || getState().currentDate);
        },
        subscribe(fn) {
            return subscribe(() => fn(currentLedger()));
        },
        categorize,
        mapTransaction,
        mapTransactions,
        detectRecurring: (events) => detectRecurring(events || getState().events),
        flagAnomalies: (events) => flagAnomalies(events || getState().events),
        budgetStatus: (opts) => budgetStatus(getState().events, opts),
        allowOrigin(origin) {
            bindHostBridge(createHostApi(), origin);
        }
    };
}

export function attachHostApi() {
    const api = createHostApi();
    window.OpenExpense = api;
    if (isEmbedMode()) {
        document.body.classList.add('is-embed');
        bindHostBridge(api);
    }
    return api;
}

export { isEmbedMode };
