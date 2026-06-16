import { zipSync, unzipSync, strToU8, strFromU8 } from 'fflate';

export const BUNDLE = {
    ENC_NAME: 'ledger.enc.json',
    KEY_NAME: 'ledger.key.json',
    README_NAME: 'README.txt',
    ENC_FORMAT: 'openexpense-encrypted',
    KEY_FORMAT: 'openexpense-key',
    VERSION: 1
};

function subtleCrypto() {
    const c = globalThis.crypto;
    return c && c.subtle ? c : null;
}

function abToBase64(buf) {
    const bytes = new Uint8Array(buf);
    let bin = '';
    for (let i = 0; i < bytes.length; i++) bin += String.fromCharCode(bytes[i]);
    return btoa(bin);
}

function base64ToU8(b64) {
    const bin = atob(b64);
    const out = new Uint8Array(bin.length);
    for (let i = 0; i < bin.length; i++) out[i] = bin.charCodeAt(i);
    return out;
}

// Encrypt a payload object under a fresh, single-use AES-256-GCM key.
// Returns the encrypted envelope and the key as a portable JWK.
export async function encryptBundle(payload) {
    const c = subtleCrypto();
    if (!c) throw new Error('Web Crypto API unavailable');

    const key = await c.subtle.generateKey({ name: 'AES-GCM', length: 256 }, true, ['encrypt', 'decrypt']);
    const iv = c.getRandomValues(new Uint8Array(12));
    const data = strToU8(JSON.stringify(payload));
    const ct = await c.subtle.encrypt({ name: 'AES-GCM', iv }, key, data);
    const jwk = await c.subtle.exportKey('jwk', key);

    const enc = {
        format: BUNDLE.ENC_FORMAT,
        version: BUNDLE.VERSION,
        alg: 'AES-GCM',
        iv: abToBase64(iv.buffer),
        ct: abToBase64(ct),
        createdAt: Date.now()
    };
    const keyFile = { format: BUNDLE.KEY_FORMAT, version: BUNDLE.VERSION, key: jwk };
    return { enc, keyFile };
}

export async function decryptBundle(enc, keyFile) {
    const c = subtleCrypto();
    if (!c) throw new Error('Web Crypto API unavailable');

    const jwk = isKeyFile(keyFile) ? keyFile.key : keyFile;
    const key = await c.subtle.importKey('jwk', jwk, { name: 'AES-GCM' }, false, ['decrypt']);
    const iv = base64ToU8(enc.iv);
    const ct = base64ToU8(enc.ct);
    const buf = await c.subtle.decrypt({ name: 'AES-GCM', iv }, key, ct);
    return JSON.parse(strFromU8(new Uint8Array(buf)));
}

export function isEncFile(obj) {
    return !!obj && typeof obj === 'object'
        && (obj.format === BUNDLE.ENC_FORMAT || (typeof obj.iv === 'string' && typeof obj.ct === 'string'));
}

export function isKeyFile(obj) {
    return !!obj && typeof obj === 'object'
        && (obj.format === BUNDLE.KEY_FORMAT || (obj.kty && obj.k) || (obj.key && obj.key.kty));
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
            'To restore: open openexpense.org and use Import, then select this .zip\n' +
            '(or load the two files individually).\n\n' +
            'Security tip: anyone with BOTH files can read your data. For sensitive\n' +
            'backups, store or send the key file separately from the encrypted file.\n'
        )
    };
    return zipSync(files, { level: 6 });
}

export function unzipBundle(u8) {
    const entries = unzipSync(u8);
    const out = {};
    for (const name of Object.keys(entries)) {
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
