/**
 * OpenExpense — encrypted envelope v2
 *
 * A ledger is sealed with AES-256-GCM, but the key stored in key.json is never
 * used as the cipher key directly. It is a 32-byte master secret that HKDF
 * splits into two independent values: the AES key, and a commitment that is
 * published in the envelope.
 *
 * That commitment matters because AES-GCM is not key-committing — a single
 * ciphertext can be made to authenticate under more than one key, which is what
 * partitioning-oracle attacks abuse to search a passphrase space. Checking the
 * commitment first turns "wrong key" into an unambiguous answer.
 *
 * Every header field is fed to the cipher as additional authenticated data, so
 * the key id, the salts, the timestamp and the passphrase parameters cannot be
 * edited without breaking decryption. In particular the PBKDF2 iteration count
 * is covered, so it cannot be downgraded to make guessing cheap.
 *
 * Everything here is the platform Web Crypto API. No third-party crypto.
 */

export const ENVELOPE = {
    VERSION: 2,
    ALG: 'AES-256-GCM',
    KDF: 'HKDF-SHA-256',
    WRAP_KDF: 'PBKDF2-HMAC-SHA-256',
    /** OWASP 2023 guidance for PBKDF2-HMAC-SHA-256. */
    WRAP_ITERATIONS: 600000,
    /** Refuse files that ask for less work than this. */
    MIN_WRAP_ITERATIONS: 210000,
    SECRET_BYTES: 32,
    SALT_BYTES: 32,
    WRAP_SALT_BYTES: 16,
    IV_BYTES: 12,
    COMMIT_BYTES: 32,
    TAG_BITS: 128
};

const INFO_ENC = 'openexpense/v2/enc';
const INFO_COMMIT = 'openexpense/v2/commit';

const encoder = new TextEncoder();
const decoder = new TextDecoder();

function webcrypto() {
    const c = globalThis.crypto;
    if (!c || !c.subtle) throw new Error('Web Crypto API unavailable (requires a secure context)');
    return c;
}

export function randomBytes(length) {
    const out = new Uint8Array(length);
    webcrypto().getRandomValues(out);
    return out;
}

export function toBase64(bytes) {
    const u8 = bytes instanceof Uint8Array ? bytes : new Uint8Array(bytes);
    let bin = '';
    for (let i = 0; i < u8.length; i++) bin += String.fromCharCode(u8[i]);
    return btoa(bin);
}

export function fromBase64(value) {
    const bin = atob(String(value));
    const out = new Uint8Array(bin.length);
    for (let i = 0; i < bin.length; i++) out[i] = bin.charCodeAt(i);
    return out;
}

/** Compare without leaking where two byte strings first differ. */
export function equalBytes(a, b) {
    if (!(a instanceof Uint8Array) || !(b instanceof Uint8Array)) return false;
    if (a.length !== b.length) return false;
    let diff = 0;
    for (let i = 0; i < a.length; i++) diff |= a[i] ^ b[i];
    return diff === 0;
}

/**
 * Deterministic JSON so both sides of a decryption agree on the AAD byte for
 * byte. Keys are sorted and undefined values dropped.
 */
export function canonicalJson(value) {
    if (value === undefined) return 'null';
    if (value === null || typeof value !== 'object') return JSON.stringify(value) ?? 'null';
    if (Array.isArray(value)) return `[${value.map(canonicalJson).join(',')}]`;
    const keys = Object.keys(value).filter((key) => value[key] !== undefined).sort();
    return `{${keys.map((key) => `${JSON.stringify(key)}:${canonicalJson(value[key])}`).join(',')}}`;
}

/**
 * The AAD is the whole header minus the ciphertext, so any edit to any field —
 * including ones this version does not know about — breaks decryption.
 */
export function headerAad(header) {
    const { ct, ...rest } = header || {};
    return encoder.encode(canonicalJson(rest));
}

async function hkdfBase(secret) {
    return webcrypto().subtle.importKey('raw', secret, 'HKDF', false, ['deriveBits', 'deriveKey']);
}

/**
 * Split the master secret into an AES key and a public commitment. The two are
 * independent: publishing the commitment says nothing about the AES key.
 */
export async function deriveEnvelopeKeys(secret, salt) {
    if (!(secret instanceof Uint8Array) || secret.length !== ENVELOPE.SECRET_BYTES) {
        throw new Error('ENVELOPE_BAD_SECRET');
    }
    const c = webcrypto();
    const base = await hkdfBase(secret);
    const key = await c.subtle.deriveKey(
        { name: 'HKDF', hash: 'SHA-256', salt, info: encoder.encode(INFO_ENC) },
        base,
        { name: 'AES-GCM', length: 256 },
        false,
        ['encrypt', 'decrypt']
    );
    const commitment = new Uint8Array(await c.subtle.deriveBits(
        { name: 'HKDF', hash: 'SHA-256', salt, info: encoder.encode(INFO_COMMIT) },
        base,
        ENVELOPE.COMMIT_BYTES * 8
    ));
    return { key, commitment };
}

function wrapContext({ kid, iterations, salt }) {
    return encoder.encode(canonicalJson({
        purpose: 'openexpense/v2/wrap',
        kdf: ENVELOPE.WRAP_KDF,
        kid: kid || '',
        iterations,
        salt
    }));
}

async function passphraseKey(passphrase, salt, iterations) {
    const c = webcrypto();
    const base = await c.subtle.importKey(
        'raw',
        encoder.encode(String(passphrase).normalize('NFKC')),
        'PBKDF2',
        false,
        ['deriveKey']
    );
    return c.subtle.deriveKey(
        { name: 'PBKDF2', hash: 'SHA-256', salt, iterations },
        base,
        { name: 'AES-GCM', length: 256 },
        false,
        ['encrypt', 'decrypt']
    );
}

/** Encrypt the master secret under a passphrase so key.json alone is useless. */
export async function wrapSecret(secret, passphrase, { kid = '' } = {}) {
    if (!passphrase) throw new Error('ENVELOPE_NO_PASSPHRASE');
    const c = webcrypto();
    const salt = randomBytes(ENVELOPE.WRAP_SALT_BYTES);
    const iv = randomBytes(ENVELOPE.IV_BYTES);
    const iterations = ENVELOPE.WRAP_ITERATIONS;
    const saltB64 = toBase64(salt);
    const key = await passphraseKey(passphrase, salt, iterations);
    const ct = await c.subtle.encrypt(
        {
            name: 'AES-GCM',
            iv,
            tagLength: ENVELOPE.TAG_BITS,
            additionalData: wrapContext({ kid, iterations, salt: saltB64 })
        },
        key,
        secret
    );
    return {
        kdf: ENVELOPE.WRAP_KDF,
        iterations,
        salt: saltB64,
        iv: toBase64(iv),
        ct: toBase64(new Uint8Array(ct))
    };
}

export async function unwrapSecret(wrap, passphrase, { kid = '' } = {}) {
    if (!wrap || typeof wrap !== 'object') throw new Error('ENVELOPE_BAD_WRAP');
    if (wrap.kdf !== ENVELOPE.WRAP_KDF) throw new Error('ENVELOPE_BAD_WRAP_KDF');
    const iterations = Number(wrap.iterations);
    if (!Number.isInteger(iterations) || iterations < ENVELOPE.MIN_WRAP_ITERATIONS) {
        throw new Error('ENVELOPE_WEAK_WRAP');
    }
    if (!passphrase) throw new Error('ENVELOPE_NO_PASSPHRASE');

    const c = webcrypto();
    const salt = fromBase64(wrap.salt);
    const key = await passphraseKey(passphrase, salt, iterations);
    const plain = await c.subtle.decrypt(
        {
            name: 'AES-GCM',
            iv: fromBase64(wrap.iv),
            tagLength: ENVELOPE.TAG_BITS,
            additionalData: wrapContext({ kid, iterations, salt: wrap.salt })
        },
        key,
        fromBase64(wrap.ct)
    );
    const secret = new Uint8Array(plain);
    if (secret.length !== ENVELOPE.SECRET_BYTES) throw new Error('ENVELOPE_BAD_SECRET');
    return secret;
}

/**
 * Seal a payload. `header` carries the caller's identifying fields (format,
 * kid, createdAt …); this adds the cryptographic ones and authenticates all of
 * them together.
 */
export async function sealPayload(payload, secret, header = {}) {
    const c = webcrypto();
    const salt = randomBytes(ENVELOPE.SALT_BYTES);
    const iv = randomBytes(ENVELOPE.IV_BYTES);
    const { key, commitment } = await deriveEnvelopeKeys(secret, salt);

    const sealed = {
        ...header,
        version: ENVELOPE.VERSION,
        alg: ENVELOPE.ALG,
        kdf: ENVELOPE.KDF,
        salt: toBase64(salt),
        iv: toBase64(iv),
        commit: toBase64(commitment)
    };

    const ct = await c.subtle.encrypt(
        { name: 'AES-GCM', iv, tagLength: ENVELOPE.TAG_BITS, additionalData: headerAad(sealed) },
        key,
        encoder.encode(JSON.stringify(payload))
    );
    sealed.ct = toBase64(new Uint8Array(ct));
    return sealed;
}

export async function openPayload(sealed, secret) {
    if (!sealed || typeof sealed !== 'object') throw new Error('ENVELOPE_BAD_INPUT');
    const c = webcrypto();
    const salt = fromBase64(sealed.salt);
    const { key, commitment } = await deriveEnvelopeKeys(secret, salt);

    // Answer "is this the right key?" before touching the ciphertext, so a
    // wrong key can never be resolved into a second valid-looking plaintext.
    if (!equalBytes(commitment, fromBase64(sealed.commit))) {
        throw new Error('ENVELOPE_KEY_MISMATCH');
    }

    const plain = await c.subtle.decrypt(
        {
            name: 'AES-GCM',
            iv: fromBase64(sealed.iv),
            tagLength: ENVELOPE.TAG_BITS,
            additionalData: headerAad(sealed)
        },
        key,
        fromBase64(sealed.ct)
    );
    return JSON.parse(decoder.decode(plain));
}
