/**
 * OpenExpense — encrypted IndexedDB autosave
 *
 * Debounced writes of sanitized { name, events, budgets, plan, goals } into the `openexpense` database.
 * The device AES-GCM key lives in the `meta` store (see crypto.js).
 * Portable key.json is never written here.
 */
import { encryptJSON, decryptJSON, isEncrypted, cryptoAvailable } from './crypto.js';
import { sanitizeLedger } from './ledger-file.js';
import {
    deleteStoredLedgerAndMeta,
    getStoredLedger,
    putStoredLedger
} from './database.js';

let saveTimer = null;
let lastSavedSig = '';
let saveQueue = Promise.resolve();
let externallyPurged = false;
const syncChannel = typeof window !== 'undefined' && typeof BroadcastChannel === 'function'
    ? new BroadcastChannel('openexpense-storage-v1')
    : null;

if (syncChannel) {
    syncChannel.addEventListener('message', (event) => {
        if (event.data?.type !== 'purged') return;
        externallyPurged = true;
        clearTimeout(saveTimer);
        lastSavedSig = '';
        window.dispatchEvent(new CustomEvent('openexpense:storage-purged'));
    });
}

function ledgerSignature(name, events, budgets, plan, goals) {
    return JSON.stringify({
        name: name || '',
        events: events || {},
        budgets: budgets || {},
        plan: plan || {},
        goals: goals || []
    });
}

export async function loadLedger() {
    const raw = await getStoredLedger();
    if (raw == null) return null;

    if (isEncrypted(raw)) {
        try {
            return await decryptJSON(raw);
        } catch (err) {
            console.error('[OpenExpense] could not decrypt local ledger:', err);
            const failure = new Error('LOCAL_LEDGER_DECRYPT_FAILED');
            failure.cause = err;
            throw failure;
        }
    }

    // Legacy plaintext record: migrate before normal autosave starts. If
    // encryption is unavailable, return it for recovery but never write it.
    if (cryptoAvailable()) {
        await saveLedger(raw);
    }
    return raw;
}

async function commitLedger(data) {
    if (externallyPurged) {
        throw new Error('STORAGE_PURGED_IN_ANOTHER_TAB');
    }
    if (!cryptoAvailable()) {
        throw new Error('ENCRYPTED_STORAGE_UNAVAILABLE');
    }
    const cleaned = sanitizeLedger(data) || { name: '', events: {}, savedAt: Date.now() };
    const sig = ledgerSignature(cleaned.name, cleaned.events, cleaned.budgets, cleaned.plan, cleaned.goals);
    if (sig === lastSavedSig) return;
    const record = await encryptJSON(cleaned);
    await putStoredLedger(record);
    lastSavedSig = sig;
}

/** Serialize encryption + commits so an older save cannot finish last. */
export function saveLedger(data) {
    const next = saveQueue.catch(() => {}).then(() => commitLedger(data));
    saveQueue = next;
    return next;
}

/** Delete ciphertext and its device key in one IndexedDB transaction. */
export function purgeStoredLedger(deviceKeyId = 'ledger-key-v1') {
    const operation = saveQueue.catch(() => {}).then(() => (
        deleteStoredLedgerAndMeta(deviceKeyId).then(() => {
            lastSavedSig = '';
            syncChannel?.postMessage({ type: 'purged' });
        })
    ));
    saveQueue = operation;
    return operation;
}

const LEDGER_PATCH_KEYS = new Set(['events', 'ledgerName', 'autosaveEnabled', 'budgets', 'plan', 'goals']);

export function initPersist(store) {
    const boot = store.getState();
    lastSavedSig = ledgerSignature(boot.ledgerName, boot.events, boot.budgets, boot.plan, boot.goals);

    store.subscribe((partial) => {
        if (partial && !Object.keys(partial).some((key) => LEDGER_PATCH_KEYS.has(key))) return;
        clearTimeout(saveTimer);
        if (!store.getState().autosaveEnabled) return;
        saveTimer = setTimeout(() => {
            if (!store.getState().autosaveEnabled) return;
            const s = store.getState();
            saveLedger({
                name: s.ledgerName,
                events: s.events,
                budgets: s.budgets,
                plan: s.plan,
                goals: s.goals,
                savedAt: Date.now()
            })
                .catch((err) => console.error('[OpenExpense] encrypted autosave failed:', err));
        }, 400);
    });
}
