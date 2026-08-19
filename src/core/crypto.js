/**
 * OpenExpense — AES-256-GCM at rest
 *
 * Generates a non-extractable device key and wraps ledger JSON for IndexedDB.
 * That key cannot be exported as JWK and is not the user's key.json.
 * Portable export keys live only in a downloaded key.json (see bundle.js).
 */
import { metaGetOrCreate } from './database.js';
import { ENVELOPE, canonicalJson } from './envelope.js';

const KEY_ID = 'ledger-key-v1';
const ENC_VERSION = 2;
const LEGACY_ENC_VERSION = 1;

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

    const candidate = await c.subtle.generateKey(
        { name: 'AES-GCM', length: 256 },
        false,
        ['encrypt', 'decrypt']
    );
    return metaGetOrCreate(KEY_ID, candidate);
}

export function clearCachedDeviceKey() {
    keyPromise = null;
}

function getCryptoKey() {
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

/**
 * Bind the record's own header to its ciphertext, so anything with write access
 * to IndexedDB cannot restamp or relabel a record and have it still open.
 */
function recordAad({ v, alg, savedAt }) {
    return encoder.encode(canonicalJson({ __enc: true, v, alg, savedAt }));
}

/** Seal a record under an already-resolved key. Exported so it can be tested. */
export async function sealRecord(obj, key, now = Date.now()) {
    const c = subtleCrypto();
    if (!c) throw new Error('Web Crypto API unavailable');

    const iv = c.getRandomValues(new Uint8Array(ENVELOPE.IV_BYTES));
    const header = { v: ENC_VERSION, alg: ENVELOPE.ALG, savedAt: now };
    const ct = await c.subtle.encrypt(
        { name: 'AES-GCM', iv, tagLength: ENVELOPE.TAG_BITS, additionalData: recordAad(header) },
        key,
        encoder.encode(JSON.stringify(obj))
    );
    return { __enc: true, ...header, iv: iv.buffer, ct };
}

export async function openRecord(envelope, key) {
    const c = subtleCrypto();
    if (!c) throw new Error('Web Crypto API unavailable');

    const iv = new Uint8Array(envelope.iv);
    const version = Number(envelope.v) || LEGACY_ENC_VERSION;
    // v1 records predate the AAD; they are re-encrypted on the next autosave.
    const params = version >= ENC_VERSION
        ? { name: 'AES-GCM', iv, tagLength: ENVELOPE.TAG_BITS, additionalData: recordAad(envelope) }
        : { name: 'AES-GCM', iv };
    const buf = await c.subtle.decrypt(params, key, envelope.ct);
    return JSON.parse(decoder.decode(buf));
}

export async function encryptJSON(obj) {
    return sealRecord(obj, await getCryptoKey());
}

export async function decryptJSON(envelope) {
    return openRecord(envelope, await getCryptoKey());
}
