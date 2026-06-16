import { encryptJSON, decryptJSON, isEncrypted, cryptoAvailable } from './crypto.js';

const DB_NAME = 'openexpense';
const DB_VERSION = 2;
const STORE_NAME = 'ledger';
const META_STORE = 'meta';
const KEY = 'current';

let saveTimer = null;
let dbPromise = null;

export function openDb() {
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

export function metaGet(key) {
    return idbGet(META_STORE, key);
}

export function metaPut(key, value) {
    return idbPut(META_STORE, key, value);
}

export async function loadLedger() {
    try {
        const raw = await idbGet(STORE_NAME, KEY);
        if (raw == null) return null;

        if (isEncrypted(raw)) {
            try {
                return await decryptJSON(raw);
            } catch (err) {
                console.error('[OpenExpense] could not decrypt local ledger:', err);
                return null;
            }
        }

        // Legacy plaintext record: hand it back, then transparently
        // re-save it encrypted so it never lingers unencrypted at rest.
        if (cryptoAvailable()) {
            saveLedger(raw).catch(() => { });
        }
        return raw;
    } catch {
        dbPromise = null;
        return null;
    }
}

export async function saveLedger(data) {
    try {
        let record = data;
        if (cryptoAvailable()) {
            try {
                record = await encryptJSON(data);
            } catch (err) {
                console.error('[OpenExpense] encryption failed, keeping data out of storage:', err);
                return;
            }
        }
        await idbPut(STORE_NAME, KEY, record);
    } catch {
        dbPromise = null;
    }
}

export function initPersist(store) {
    store.subscribe(() => {
        clearTimeout(saveTimer);
        if (!store.getState().autosaveEnabled) return;
        saveTimer = setTimeout(() => {
            if (!store.getState().autosaveEnabled) return;
            const s = store.getState();
            saveLedger({ name: s.ledgerName, events: s.events, savedAt: Date.now() });
        }, 400);
    });
}
