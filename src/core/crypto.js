import { metaGet, metaPut } from './persist.js';

const KEY_ID = 'ledger-key-v1';
const ENC_VERSION = 1;

let keyPromise = null;

const encoder = new TextEncoder();
const decoder = new TextDecoder();

function subtleCrypto() {
    const c = globalThis.crypto;
    return c && c.subtle ? c : null;
}

export function cryptoAvailable() {
    return !!subtleCrypto();
}

async function loadOrCreateKey() {
    const c = subtleCrypto();
    if (!c) throw new Error('Web Crypto API unavailable (requires a secure context)');

    const existing = await metaGet(KEY_ID);
    if (existing) return existing;

    const key = await c.subtle.generateKey(
        { name: 'AES-GCM', length: 256 },
        false,
        ['encrypt', 'decrypt']
    );
    await metaPut(KEY_ID, key);
    return key;
}

export function getCryptoKey() {
    if (!keyPromise) {
        keyPromise = loadOrCreateKey().catch((err) => {
            keyPromise = null;
            throw err;
        });
    }
    return keyPromise;
}

export function isEncrypted(value) {
    return !!value
        && typeof value === 'object'
        && value.__enc === true
        && value.ct != null
        && value.iv != null;
}

export async function encryptJSON(obj) {
    const c = subtleCrypto();
    if (!c) throw new Error('Web Crypto API unavailable');

    const key = await getCryptoKey();
    const iv = c.getRandomValues(new Uint8Array(12));
    const plaintext = encoder.encode(JSON.stringify(obj));
    const ct = await c.subtle.encrypt({ name: 'AES-GCM', iv }, key, plaintext);

    return {
        __enc: true,
        v: ENC_VERSION,
        alg: 'AES-GCM',
        iv: iv.buffer,
        ct,
        savedAt: Date.now()
    };
}

export async function decryptJSON(envelope) {
    const c = subtleCrypto();
    if (!c) throw new Error('Web Crypto API unavailable');

    const key = await getCryptoKey();
    const iv = new Uint8Array(envelope.iv);
    const buf = await c.subtle.decrypt({ name: 'AES-GCM', iv }, key, envelope.ct);
    return JSON.parse(decoder.decode(buf));
}
