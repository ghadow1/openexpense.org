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
import {
    ENVELOPE, sealPayload, openPayload, randomBytes, toBase64, fromBase64,
    wrapSecret, unwrapSecret
} from './envelope.js';
import {
    BUNDLE, isKeyFile, needsPassphrase
} from './bundle-format.js';

export {
    BUNDLE, ZIP_LIMITS, isEncFile, isKeyFile, needsPassphrase
} from './bundle-format.js';

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
        { name: 'AES-GCM', iv: fromBase64(enc.iv) },
        key,
        fromBase64(enc.ct)
    );
    return JSON.parse(new TextDecoder().decode(new Uint8Array(buf)));
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

