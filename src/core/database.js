/**
 * OpenExpense — IndexedDB connection and primitive transactions
 *
 * This module owns database topology only. Encryption and autosave policy live
 * in crypto.js and persist.js, which both depend on these primitives without
 * depending on each other.
 */
const DB_NAME = 'openexpense';
const DB_VERSION = 2;
const LEDGER_STORE = 'ledger';
const META_STORE = 'meta';
const CURRENT_LEDGER_KEY = 'current';

let databasePromise = null;

function openDatabase() {
    if (databasePromise) return databasePromise;
    databasePromise = new Promise((resolve, reject) => {
        const request = indexedDB.open(DB_NAME, DB_VERSION);
        request.onerror = () => {
            databasePromise = null;
            reject(request.error);
        };
        request.onupgradeneeded = () => {
            const database = request.result;
            if (!database.objectStoreNames.contains(LEDGER_STORE)) {
                database.createObjectStore(LEDGER_STORE);
            }
            if (!database.objectStoreNames.contains(META_STORE)) {
                database.createObjectStore(META_STORE);
            }
        };
        // Another tab holding an older version blocks this upgrade; fail fast
        // instead of hanging application boot.
        request.onblocked = () => {
            databasePromise = null;
            reject(new Error('IndexedDB upgrade blocked by another open tab'));
        };
        request.onsuccess = () => resolve(request.result);
    });
    return databasePromise;
}

function getValue(storeName, key) {
    return openDatabase().then((database) => new Promise((resolve, reject) => {
        const transaction = database.transaction(storeName, 'readonly');
        const request = transaction.objectStore(storeName).get(key);
        request.onerror = () => reject(request.error);
        request.onsuccess = () => resolve(request.result ?? null);
    }));
}

function putValue(storeName, key, value) {
    return openDatabase().then((database) => new Promise((resolve, reject) => {
        const transaction = database.transaction(storeName, 'readwrite');
        transaction.objectStore(storeName).put(value, key);
        transaction.onerror = () => reject(transaction.error);
        transaction.oncomplete = () => resolve();
    }));
}

function getOrCreateValue(storeName, key, candidate) {
    return openDatabase().then((database) => new Promise((resolve, reject) => {
        const transaction = database.transaction(storeName, 'readwrite');
        const store = transaction.objectStore(storeName);
        const request = store.get(key);
        let selected = null;

        request.onerror = () => reject(request.error);
        request.onsuccess = () => {
            selected = request.result ?? candidate;
            if (request.result == null) store.put(candidate, key);
        };
        transaction.onerror = () => reject(transaction.error);
        transaction.oncomplete = () => resolve(selected);
    }));
}

export function getStoredLedger() {
    return getValue(LEDGER_STORE, CURRENT_LEDGER_KEY);
}

export function putStoredLedger(value) {
    return putValue(LEDGER_STORE, CURRENT_LEDGER_KEY, value);
}

export function metaGet(key) {
    return getValue(META_STORE, key);
}

export function metaPut(key, value) {
    return putValue(META_STORE, key, value);
}

/** Atomically keep the first value written when multiple tabs initialize. */
export function metaGetOrCreate(key, candidate) {
    return getOrCreateValue(META_STORE, key, candidate);
}

/** Delete ciphertext and one metadata key in the same committed transaction. */
export function deleteStoredLedgerAndMeta(metaKey) {
    return openDatabase().then((database) => new Promise((resolve, reject) => {
        const transaction = database.transaction([LEDGER_STORE, META_STORE], 'readwrite');
        transaction.objectStore(LEDGER_STORE).delete(CURRENT_LEDGER_KEY);
        transaction.objectStore(META_STORE).delete(metaKey);
        transaction.onerror = () => reject(transaction.error);
        transaction.oncomplete = () => resolve();
    }));
}
