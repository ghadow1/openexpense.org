/**
 * OpenExpense — portable encrypted ledger + key
 *
 * Export writes an encrypted .json and a matching key.json (never stored here).
 * Older .zip backups still import. Device autosave uses crypto.js instead.
 *
 * New exports are v2 envelopes (see envelope.js): HKDF-derived keys, a key
 * commitment, and the whole header authenticated. v1 files — a raw AES-GCM key
 * in a JWK — still open, so older backups keep working.
 */
import { zipSync, unzipSync, strToU8, strFromU8 } from 'fflate';
import {
    ENVELOPE, sealPayload, openPayload, randomBytes, toBase64, fromBase64,
    wrapSecret, unwrapSecret
} from './envelope.js';

export const BUNDLE = {
    ENC_NAME: 'ledger.enc.json',
    KEY_NAME: 'ledger.key.json',
    README_NAME: 'README.txt',
    ENC_FORMAT: 'openexpense-encrypted',
    KEY_FORMAT: 'openexpense-key',
    /** Written by this build. v1 stays readable. */
    VERSION: ENVELOPE.VERSION,
    LEGACY_VERSION: 1
};

export const ZIP_LIMITS = {
    maxCompressedBytes: 8 * 1024 * 1024,
    maxExpandedBytes: 16 * 1024 * 1024,
    maxEntryBytes: 8 * 1024 * 1024,
    maxEntries: 8
};

export function newKid() {
    const bytes = new Uint8Array(16);
    const c = globalThis.crypto;
    if (!c) throw new Error('Web Crypto API unavailable');
    c.getRandomValues(bytes);
    return Array.from(bytes, (b) => b.toString(16).padStart(2, '0')).join('');
}

function subtleCrypto() {
    const c = globalThis.crypto;
    return c && c.subtle ? c : null;
}

function base64ToU8(b64) {
    const bin = atob(b64);
    const out = new Uint8Array(bin.length);
    for (let i = 0; i < bin.length; i++) out[i] = bin.charCodeAt(i);
    return out;
}

/**
 * Seal a payload under a fresh, single-use master secret.
 *
 * Without a passphrase the secret sits in key.json, so the pair of files is the
 * whole secret — same as before. With one, key.json only holds the secret
 * wrapped under PBKDF2, so a copied pair is not enough to read the ledger.
 */
export async function encryptBundle(payload, { passphrase = '' } = {}) {
    if (!subtleCrypto()) throw new Error('Web Crypto API unavailable');

    const kid = newKid();
    const secret = randomBytes(ENVELOPE.SECRET_BYTES);
    try {
        const enc = await sealPayload(payload, secret, {
            format: BUNDLE.ENC_FORMAT,
            kid,
            createdAt: Date.now()
        });
        const keyFile = {
            format: BUNDLE.KEY_FORMAT,
            version: ENVELOPE.VERSION,
            kid,
            alg: ENVELOPE.ALG,
            kdf: ENVELOPE.KDF
        };
        if (passphrase) {
            keyFile.wrap = await wrapSecret(secret, passphrase, { kid });
        } else {
            keyFile.secret = toBase64(secret);
        }
        return { enc, keyFile };
    } finally {
        secret.fill(0);
    }
}

/** True when this key.json cannot be used without asking the user for words. */
export function needsPassphrase(keyFile) {
    return !!keyFile && typeof keyFile === 'object'
        && !!keyFile.wrap && typeof keyFile.wrap === 'object';
}

function envelopeVersion(enc) {
    return Number(enc?.version) || BUNDLE.LEGACY_VERSION;
}

async function secretFromKeyFile(keyFile, passphrase) {
    if (needsPassphrase(keyFile)) {
        if (!passphrase) throw new Error('PASSPHRASE_REQUIRED');
        return unwrapSecret(keyFile.wrap, passphrase, { kid: keyFile.kid || '' });
    }
    if (typeof keyFile?.secret !== 'string') throw new Error('KEY_FILE_MISSING_SECRET');
    return fromBase64(keyFile.secret);
}

// v1: the JWK in key.json is the AES key itself, with no AAD and no commitment.
async function decryptLegacyBundle(enc, keyFile) {
    const c = subtleCrypto();
    const jwk = isKeyFile(keyFile) ? (keyFile.key || keyFile) : keyFile;
    const key = await c.subtle.importKey('jwk', jwk, { name: 'AES-GCM' }, false, ['decrypt']);
    const buf = await c.subtle.decrypt(
        { name: 'AES-GCM', iv: base64ToU8(enc.iv) },
        key,
        base64ToU8(enc.ct)
    );
    return JSON.parse(strFromU8(new Uint8Array(buf)));
}

export async function decryptBundle(enc, keyFile, { passphrase = '' } = {}) {
    if (!subtleCrypto()) throw new Error('Web Crypto API unavailable');
    if (envelopeVersion(enc) < ENVELOPE.VERSION) return decryptLegacyBundle(enc, keyFile);

    const secret = await secretFromKeyFile(keyFile, passphrase);
    try {
        return await openPayload(enc, secret);
    } finally {
        secret.fill(0);
    }
}

export function isEncFile(obj) {
    return !!obj && typeof obj === 'object'
        && (obj.format === BUNDLE.ENC_FORMAT || (typeof obj.iv === 'string' && typeof obj.ct === 'string'));
}

export function isKeyFile(obj) {
    return !!obj && typeof obj === 'object'
        && (obj.format === BUNDLE.KEY_FORMAT
            || typeof obj.secret === 'string'
            || (obj.wrap && typeof obj.wrap === 'object')
            || (obj.kty && obj.k)
            || (obj.key && obj.key.kty));
}

export function zipBundle(enc, keyFile) {
    const files = {
        [BUNDLE.ENC_NAME]: strToU8(JSON.stringify(enc, null, 2)),
        [BUNDLE.KEY_NAME]: strToU8(JSON.stringify(keyFile, null, 2)),
        [BUNDLE.README_NAME]: strToU8(
            'OpenExpense encrypted export\n' +
            '================================\n\n' +
            `${BUNDLE.ENC_NAME}  - your ledger, encrypted with AES-256-GCM.\n` +
            `${BUNDLE.KEY_NAME}  - the key needed to decrypt it.\n\n` +
            'To restore: open openexpense.org and use Import. Prefer the two JSON\n' +
            'files saved next to each other (encrypted ledger.json + key.json).\n' +
            'This zip is a legacy bundle of the same pair.\n\n' +
            'The portable key is only in key.json. OpenExpense does not keep it\n' +
            'in the browser. Without a passphrase, anyone with BOTH files can\n' +
            'read the ledger. With one, key.json is useless on its own.\n'
        )
    };
    return zipSync(files, { level: 6 });
}

export function unzipBundle(u8) {
    if (!(u8 instanceof Uint8Array) || u8.byteLength > ZIP_LIMITS.maxCompressedBytes) {
        throw new Error('ZIP_TOO_LARGE');
    }
    let count = 0;
    let expectedBytes = 0;
    const entries = unzipSync(u8, {
        filter(file) {
            count += 1;
            const size = Number(file?.originalSize ?? 0);
            expectedBytes += size;
            if (count > ZIP_LIMITS.maxEntries
                || size > ZIP_LIMITS.maxEntryBytes
                || expectedBytes > ZIP_LIMITS.maxExpandedBytes) {
                throw new Error('ZIP_EXPANSION_LIMIT');
            }
            return true;
        }
    });
    const out = {};
    let expandedBytes = 0;
    for (const name of Object.keys(entries)) {
        expandedBytes += entries[name].byteLength;
        if (entries[name].byteLength > ZIP_LIMITS.maxEntryBytes
            || expandedBytes > ZIP_LIMITS.maxExpandedBytes) {
            throw new Error('ZIP_EXPANSION_LIMIT');
        }
        out[name] = entries[name];
    }
    return out;
}

export function entryToJson(u8) {
    if (!u8) return null;
    try {
        return JSON.parse(strFromU8(u8));
    } catch {
        return null;
    }
}
