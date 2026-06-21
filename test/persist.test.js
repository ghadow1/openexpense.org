import test from 'node:test';
import assert from 'node:assert/strict';
import { webcrypto } from 'node:crypto';
import { indexedDB as fakeIndexedDB } from 'fake-indexeddb';
import {
    initPersist,
    isAutosaveBlocked,
    loadLedger,
    openDb,
    saveLedger
} from '../src/core/persist.js';

globalThis.indexedDB = fakeIndexedDB;
Object.defineProperty(globalThis, 'crypto', { value: webcrypto, configurable: true });

const encoder = new TextEncoder();

function txDone(tx) {
    return new Promise((resolve, reject) => {
        tx.oncomplete = () => resolve();
        tx.onerror = () => reject(tx.error);
        tx.onabort = () => reject(tx.error);
    });
}

async function putRecord(db, storeName, key, value) {
    const tx = db.transaction(storeName, 'readwrite');
    tx.objectStore(storeName).put(value, key);
    await txDone(tx);
}

async function getRecord(db, storeName, key) {
    return new Promise((resolve, reject) => {
        const tx = db.transaction(storeName, 'readonly');
        const req = tx.objectStore(storeName).get(key);
        req.onerror = () => reject(req.error);
        req.onsuccess = () => resolve(req.result);
    });
}

async function encryptedLedgerWithoutStoredKey(payload) {
    const key = await webcrypto.subtle.generateKey(
        { name: 'AES-GCM', length: 256 },
        false,
        ['encrypt', 'decrypt']
    );
    const iv = webcrypto.getRandomValues(new Uint8Array(12));
    const ct = await webcrypto.subtle.encrypt(
        { name: 'AES-GCM', iv },
        key,
        encoder.encode(JSON.stringify(payload))
    );

    return {
        __enc: true,
        v: 1,
        alg: 'AES-GCM',
        iv: iv.buffer,
        ct,
        savedAt: Date.now()
    };
}

test('autosave does not overwrite an encrypted ledger that cannot be decrypted', async () => {
    const originalError = console.error;
    console.error = () => {};

    try {
        const db = await openDb();
        const original = await encryptedLedgerWithoutStoredKey({
            name: 'Protected',
            events: { '2026-06-21': [{ title: 'Original', price: 10 }] }
        });
        await putRecord(db, 'ledger', 'current', original);

        assert.equal(await loadLedger(), null);
        assert.equal(isAutosaveBlocked(), true);

        let onStoreChange;
        initPersist({
            getState: () => ({
                autosaveEnabled: true,
                ledgerName: 'Replacement',
                events: { '2026-06-21': [{ title: 'Replacement', price: 99 }] }
            }),
            subscribe: (fn) => {
                onStoreChange = fn;
                return () => {};
            }
        });

        onStoreChange({ events: true });
        await new Promise(resolve => setTimeout(resolve, 550));

        const afterAutosave = await getRecord(db, 'ledger', 'current');
        assert.deepEqual(new Uint8Array(afterAutosave.iv), new Uint8Array(original.iv));
        assert.deepEqual(new Uint8Array(afterAutosave.ct), new Uint8Array(original.ct));
        assert.equal(
            await saveLedger({ name: 'Replacement', events: {}, savedAt: Date.now() }),
            false
        );
    } finally {
        console.error = originalError;
    }
});
