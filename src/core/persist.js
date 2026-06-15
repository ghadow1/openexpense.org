const DB_NAME = 'openexpense';
const DB_VERSION = 1;
const STORE_NAME = 'ledger';
const KEY = 'current';

let saveTimer = null;

function openDb() {
    return new Promise((resolve, reject) => {
        const req = indexedDB.open(DB_NAME, DB_VERSION);
        req.onerror = () => reject(req.error);
        req.onupgradeneeded = () => {
            const db = req.result;
            if (!db.objectStoreNames.contains(STORE_NAME)) {
                db.createObjectStore(STORE_NAME);
            }
        };
        req.onsuccess = () => resolve(req.result);
    });
}

export async function loadLedger() {
    try {
        const db = await openDb();
        return new Promise((resolve, reject) => {
            const tx = db.transaction(STORE_NAME, 'readonly');
            const req = tx.objectStore(STORE_NAME).get(KEY);
            req.onerror = () => reject(req.error);
            req.onsuccess = () => resolve(req.result ?? null);
            tx.oncomplete = () => db.close();
        });
    } catch {
        return null;
    }
}

export async function saveLedger(data) {
    try {
        const db = await openDb();
        return new Promise((resolve, reject) => {
            const tx = db.transaction(STORE_NAME, 'readwrite');
            tx.objectStore(STORE_NAME).put(data, KEY);
            tx.onerror = () => reject(tx.error);
            tx.oncomplete = () => { db.close(); resolve(); };
        });
    } catch {
        // IndexedDB unavailable — fail silently
    }
}

export function initPersist(store) {
    store.subscribe(() => {
        clearTimeout(saveTimer);
        saveTimer = setTimeout(() => {
            const s = store.getState();
            saveLedger({ name: s.ledgerName, events: s.events, savedAt: Date.now() });
        }, 400);
    });
}
