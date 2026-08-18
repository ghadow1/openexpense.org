/**
 * OpenExpense — encrypted IndexedDB autosave
 *
 * Debounced writes of sanitized { name, events } into the `openexpense` database.
 * The device AES-GCM key lives in the `meta` store (see crypto.js).
 * Portable key.json is never written here.
 */
import { encryptJSON, decryptJSON, isEncrypted, cryptoAvailable } from './crypto.js';
import { sanitizeLedger } from './ledger-file.js';

const DB_NAME = 'openexpense';
const DB_VERSION = 2;
const STORE_NAME = 'ledger';
const META_STORE = 'meta';
const KEY = 'current';

let saveTimer = null;
let dbPromise = null;
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

function ledgerSignature(name, events, budgets) {
    return JSON.stringify({ name: name || '', events: events || {}, budgets: budgets || {} });
}

function openDb() {
    if (dbPromise) return dbPromise;
    dbPromise = new Promise((resolve, reject) => {
        const req = indexedDB.open(DB_NAME, DB_VERSION);
        req.onerror = () => {
            dbPromise = null;
            reject(req.error);
        };
        req.onupgradeneeded = () => {
            const db = req.result;
            if (!db.objectStoreNames.contains(STORE_NAME)) {
                db.createObjectStore(STORE_NAME);
            }
            if (!db.objectStoreNames.contains(META_STORE)) {
                db.createObjectStore(META_STORE);
            }
        };
        // Another tab holding an older version blocks this upgrade; fail fast
        // instead of hanging the app boot.
        req.onblocked = () => {
            dbPromise = null;
            reject(new Error('IndexedDB upgrade blocked by another open tab'));
        };
        req.onsuccess = () => resolve(req.result);
    });
    return dbPromise;
}

function idbGet(storeName, key) {
    return openDb().then(db => new Promise((resolve, reject) => {
        const tx = db.transaction(storeName, 'readonly');
        const req = tx.objectStore(storeName).get(key);
        req.onerror = () => reject(req.error);
        req.onsuccess = () => resolve(req.result ?? null);
    }));
}

function idbPut(storeName, key, value) {
    return openDb().then(db => new Promise((resolve, reject) => {
        const tx = db.transaction(storeName, 'readwrite');
        tx.objectStore(storeName).put(value, key);
        tx.onerror = () => reject(tx.error);
        tx.oncomplete = () => resolve();
    }));
}

function idbGetOrCreate(storeName, key, candidate) {
    return openDb().then(db => new Promise((resolve, reject) => {
        const tx = db.transaction(storeName, 'readwrite');
        const store = tx.objectStore(storeName);
        const req = store.get(key);
        let selected = null;

        req.onerror = () => reject(req.error);
        req.onsuccess = () => {
            selected = req.result ?? candidate;
            if (req.result == null) store.put(candidate, key);
        };
        tx.onerror = () => reject(tx.error);
        tx.oncomplete = () => resolve(selected);
    }));
}

export function metaGet(key) {
    return idbGet(META_STORE, key);
}

export function metaPut(key, value) {
    return idbPut(META_STORE, key, value);
}

/** Atomically keep the first value written when multiple tabs initialize. */
export function metaGetOrCreate(key, candidate) {
    return idbGetOrCreate(META_STORE, key, candidate);
}

export async function loadLedger() {
    const raw = await idbGet(STORE_NAME, KEY);
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
    const sig = ledgerSignature(cleaned.name, cleaned.events, cleaned.budgets);
    if (sig === lastSavedSig) return;
    const record = await encryptJSON(cleaned);
    await idbPut(STORE_NAME, KEY, record);
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
    const operation = saveQueue.catch(() => {}).then(() => openDb().then(db => new Promise((resolve, reject) => {
        const tx = db.transaction([STORE_NAME, META_STORE], 'readwrite');
        tx.objectStore(STORE_NAME).delete(KEY);
        tx.objectStore(META_STORE).delete(deviceKeyId);
        tx.onerror = () => reject(tx.error);
        tx.oncomplete = () => {
            lastSavedSig = '';
            syncChannel?.postMessage({ type: 'purged' });
            resolve();
        };
    })));
    saveQueue = operation;
    return operation;
}

const LEDGER_PATCH_KEYS = new Set(['events', 'ledgerName', 'autosaveEnabled', 'budgets']);

export function initPersist(store) {
    const boot = store.getState();
    lastSavedSig = ledgerSignature(boot.ledgerName, boot.events, boot.budgets);

    store.subscribe((partial) => {
        if (partial && !Object.keys(partial).some((key) => LEDGER_PATCH_KEYS.has(key))) return;
        clearTimeout(saveTimer);
        if (!store.getState().autosaveEnabled) return;
        saveTimer = setTimeout(() => {
            if (!store.getState().autosaveEnabled) return;
            const s = store.getState();
            saveLedger({ name: s.ledgerName, events: s.events, budgets: s.budgets, savedAt: Date.now() })
                .catch((err) => console.error('[OpenExpense] encrypted autosave failed:', err));
        }, 400);
    });
}
