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
    /**
     * Imported work factors are untrusted. A ceiling prevents a key file from
     * turning one password attempt into an effectively unbounded CPU task.
     * Raising the writer above this value requires a format-policy update.
     */
    MAX_WRAP_ITERATIONS: 1200000,
    SECRET_BYTES: 32,
    SALT_BYTES: 32,
    WRAP_SALT_BYTES: 16,
    IV_BYTES: 12,
    COMMIT_BYTES: 32,
    TAG_BITS: 128,
    /** Matches the largest encrypted ledger accepted by ledger-file.js. */
    MAX_CIPHERTEXT_BYTES: 32 * 1024 * 1024
};

const INFO_ENC = 'openexpense/v2/enc';
const INFO_COMMIT = 'openexpense/v2/commit';

const encoder = new TextEncoder();
const decoder = new TextDecoder();

function webcrypto() {
    const cryptoApi = globalThis.crypto;
    if (!cryptoApi || !cryptoApi.subtle) {
        throw new Error('Web Crypto API unavailable (requires a secure context)');
    }
    return cryptoApi;
}

/** getRandomValues refuses more than 65,536 bytes at once, so fill in chunks. */
const RANDOM_CHUNK = 65536;

export function randomBytes(length) {
    const cryptoApi = webcrypto();
    const randomOutput = new Uint8Array(length);
    for (let byteOffset = 0; byteOffset < length; byteOffset += RANDOM_CHUNK) {
        cryptoApi.getRandomValues(
            randomOutput.subarray(byteOffset, Math.min(byteOffset + RANDOM_CHUNK, length))
        );
    }
    return randomOutput;
}

// Building the binary string one character at a time costs ~430ms for a 6 MB
// ciphertext on the export path. Batching through fromCharCode makes it ~50ms.
const B64_CHUNK = 0x8000;

export function toBase64(bytes) {
    const byteArray = bytes instanceof Uint8Array ? bytes : new Uint8Array(bytes);
    let binaryString = '';
    for (let byteOffset = 0; byteOffset < byteArray.length; byteOffset += B64_CHUNK) {
        binaryString += String.fromCharCode.apply(
            null,
            byteArray.subarray(byteOffset, byteOffset + B64_CHUNK)
        );
    }
    return btoa(binaryString);
}

export function fromBase64(value) {
    const binaryString = atob(String(value));
    const decodedBytes = new Uint8Array(binaryString.length);
    for (let byteOffset = 0; byteOffset < binaryString.length; byteOffset += 1) {
        decodedBytes[byteOffset] = binaryString.charCodeAt(byteOffset);
    }
    return decodedBytes;
}

/** Compare without leaking where two byte strings first differ. */
export function equalBytes(expectedBytes, actualBytes) {
    if (!(expectedBytes instanceof Uint8Array) || !(actualBytes instanceof Uint8Array)) return false;
    if (expectedBytes.length !== actualBytes.length) return false;
    let accumulatedDifference = 0;
    for (let byteOffset = 0; byteOffset < expectedBytes.length; byteOffset += 1) {
        accumulatedDifference |= expectedBytes[byteOffset] ^ actualBytes[byteOffset];
    }
    return accumulatedDifference === 0;
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
    const cryptoApi = webcrypto();
    const base = await hkdfBase(secret);
    const key = await cryptoApi.subtle.deriveKey(
        { name: 'HKDF', hash: 'SHA-256', salt, info: encoder.encode(INFO_ENC) },
        base,
        { name: 'AES-GCM', length: 256 },
        false,
        ['encrypt', 'decrypt']
    );
    const commitment = new Uint8Array(await cryptoApi.subtle.deriveBits(
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
    const cryptoApi = webcrypto();
    const base = await cryptoApi.subtle.importKey(
        'raw',
        encoder.encode(String(passphrase).normalize('NFKC')),
        'PBKDF2',
        false,
        ['deriveKey']
    );
    return cryptoApi.subtle.deriveKey(
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
    const cryptoApi = webcrypto();
    const salt = randomBytes(ENVELOPE.WRAP_SALT_BYTES);
    const iv = randomBytes(ENVELOPE.IV_BYTES);
    const iterations = ENVELOPE.WRAP_ITERATIONS;
    const saltB64 = toBase64(salt);
    const key = await passphraseKey(passphrase, salt, iterations);
    const ciphertext = await cryptoApi.subtle.encrypt(
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
        ct: toBase64(new Uint8Array(ciphertext))
    };
}

export async function unwrapSecret(wrap, passphrase, { kid = '' } = {}) {
    if (!wrap || typeof wrap !== 'object') throw new Error('ENVELOPE_BAD_WRAP');
    if (wrap.kdf !== ENVELOPE.WRAP_KDF) throw new Error('ENVELOPE_BAD_WRAP_KDF');
    const iterations = Number(wrap.iterations);
    if (!Number.isInteger(iterations) || iterations < ENVELOPE.MIN_WRAP_ITERATIONS) {
        throw new Error('ENVELOPE_WEAK_WRAP');
    }
    if (iterations > ENVELOPE.MAX_WRAP_ITERATIONS) throw new Error('ENVELOPE_EXCESSIVE_WRAP');
    if (!passphrase) throw new Error('ENVELOPE_NO_PASSPHRASE');

    const cryptoApi = webcrypto();
    const salt = fromBase64(wrap.salt);
    const iv = fromBase64(wrap.iv);
    const ciphertext = fromBase64(wrap.ct);
    if (salt.length !== ENVELOPE.WRAP_SALT_BYTES
        || iv.length !== ENVELOPE.IV_BYTES
        || ciphertext.length !== ENVELOPE.SECRET_BYTES + (ENVELOPE.TAG_BITS / 8)) {
        throw new Error('ENVELOPE_BAD_WRAP');
    }
    const key = await passphraseKey(passphrase, salt, iterations);
    const plaintext = await cryptoApi.subtle.decrypt(
        {
            name: 'AES-GCM',
            iv,
            tagLength: ENVELOPE.TAG_BITS,
            additionalData: wrapContext({ kid, iterations, salt: wrap.salt })
        },
        key,
        ciphertext
    );
    const secret = new Uint8Array(plaintext);
    if (secret.length !== ENVELOPE.SECRET_BYTES) throw new Error('ENVELOPE_BAD_SECRET');
    return secret;
}

/**
 * Seal a payload. `header` carries the caller's identifying fields (format,
 * kid, createdAt …); this adds the cryptographic ones and authenticates all of
 * them together.
 */
export async function sealPayload(payload, secret, header = {}) {
    const cryptoApi = webcrypto();
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

    const ciphertext = await cryptoApi.subtle.encrypt(
        { name: 'AES-GCM', iv, tagLength: ENVELOPE.TAG_BITS, additionalData: headerAad(sealed) },
        key,
        encoder.encode(JSON.stringify(payload))
    );
    sealed.ct = toBase64(new Uint8Array(ciphertext));
    return sealed;
}

export async function openPayload(sealed, secret) {
    if (!sealed || typeof sealed !== 'object') throw new Error('ENVELOPE_BAD_INPUT');
    const cryptoApi = webcrypto();
    const salt = fromBase64(sealed.salt);
    const iv = fromBase64(sealed.iv);
    const publishedCommitment = fromBase64(sealed.commit);
    const ciphertext = fromBase64(sealed.ct);
    if (salt.length !== ENVELOPE.SALT_BYTES
        || iv.length !== ENVELOPE.IV_BYTES
        || publishedCommitment.length !== ENVELOPE.COMMIT_BYTES
        || ciphertext.length < ENVELOPE.TAG_BITS / 8
        || ciphertext.length > ENVELOPE.MAX_CIPHERTEXT_BYTES) {
        throw new Error('ENVELOPE_BAD_INPUT');
    }
    const { key, commitment } = await deriveEnvelopeKeys(secret, salt);

    // Answer "is this the right key?" before touching the ciphertext, so a
    // wrong key can never be resolved into a second valid-looking plaintext.
    if (!equalBytes(commitment, publishedCommitment)) {
        throw new Error('ENVELOPE_KEY_MISMATCH');
    }

    const plaintext = await cryptoApi.subtle.decrypt(
        {
            name: 'AES-GCM',
            iv,
            tagLength: ENVELOPE.TAG_BITS,
            additionalData: headerAad(sealed)
        },
        key,
        ciphertext
    );
    return JSON.parse(decoder.decode(plaintext));
}
