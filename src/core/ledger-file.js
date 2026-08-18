/**
 * OpenExpense — ledger file quality control
 *
 * Validates encrypted envelopes and key.json files, binds them with a kid,
 * and sanitizes decrypted ledgers (expense + income in one events map).
 * Portable keys never go to IndexedDB or localStorage — only to a download.
 * The same sanitize path is reused for import, IndexedDB load, and autosave.
 */
import { Utils } from './utils.js';
import { normalizeRepeat } from './series.js';
import { BUNDLE, isEncFile, isKeyFile } from './bundle.js';
import { ENVELOPE } from './envelope.js';

const DATE_KEY = /^\d{4}-\d{2}-\d{2}$/;
const KID_KEY = /^[a-f0-9]{16,64}$/i;
const FORBIDDEN_KEYS = new Set(['__proto__', 'constructor', 'prototype']);

export const FILE_LIMITS = {
    // A cheap pre-filter so a hostile file cannot force a huge parse; the real
    // bound on what gets kept is maxEntries/maxDays below. It has to stay above
    // anything this app can itself export, or a user's own backup would be
    // refused on the way back in: 25k entries with 500-char notes is ~19 MB.
    maxBytes: 32 * 1024 * 1024,
    maxDays: 4000,
    maxPerDay: 250,
    maxEntries: 25000,
    maxTitle: 200,
    maxNote: 2000,
    maxPrice: 1e9,
    maxCategory: 40,
    maxSource: 24,
    maxSourceId: 80
};

export function ledgerFileBase(ledgerName) {
    return Utils.sanitizeFilename(ledgerName) || 'ledger';
}

function pairForStem(stem) {
    return {
        stem,
        ledger: `${stem}.json`,
        key: `${stem}.key.json`
    };
}

/** Dated pair for one-off downloads / share sheets. */
export function exportFilenames(ledgerName) {
    const base = ledgerFileBase(ledgerName);
    const now = new Date();
    const stamp = Utils.dateKey(now.getFullYear(), now.getMonth(), now.getDate());
    return pairForStem(`${base}-${stamp}`);
}

/** Stable pair so a linked folder overwrites the same JSON each save. */
export function stableExportFilenames(ledgerName) {
    return pairForStem(ledgerFileBase(ledgerName));
}

function escapeRegExp(value) {
    return String(value).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

/**
 * Prefer an existing pair in the folder so Save updates that JSON.
 * Falls back to the stable `{name}.json` names when none exist yet.
 */
export function matchLedgerPairNames(fileNames, ledgerName) {
    const stable = stableExportFilenames(ledgerName);
    const base = ledgerFileBase(ledgerName);
    const names = Array.isArray(fileNames) ? fileNames : [];
    const set = new Set(names);

    if (set.has(stable.ledger)) return stable;

    const dated = new RegExp(`^${escapeRegExp(base)}-(\\d{4}-\\d{2}-\\d{2})\\.json$`);
    const stamps = [];
    for (const name of names) {
        const match = typeof name === 'string' ? name.match(dated) : null;
        if (match) stamps.push(match[1]);
    }
    if (stamps.length) {
        stamps.sort();
        return pairForStem(`${base}-${stamps[stamps.length - 1]}`);
    }
    return stable;
}

function formatOk(value, expected) {
    return value == null || value === expected;
}

/** v1 files stay readable, so both versions validate. */
function versionOk(value) {
    return value == null || value === BUNDLE.LEGACY_VERSION || value === ENVELOPE.VERSION;
}

function algOk(value) {
    return value == null || value === 'AES-GCM' || value === ENVELOPE.ALG;
}

function isV2(obj) {
    return Number(obj?.version) === ENVELOPE.VERSION;
}

function kidOk(value) {
    return value == null || (typeof value === 'string' && KID_KEY.test(value));
}

function base64ByteLength(value, { urlSafe = false } = {}) {
    if (typeof value !== 'string' || !value) return -1;
    const pattern = urlSafe ? /^[A-Za-z0-9_-]+$/ : /^[A-Za-z0-9+/]+={0,2}$/;
    if (!pattern.test(value)) return -1;
    const raw = value.replace(/=+$/, '');
    const remainder = raw.length % 4;
    if (remainder === 1) return -1;
    return Math.floor((raw.length * 6) / 8);
}

export function isValidDateKey(key) {
    if (typeof key !== 'string' || !DATE_KEY.test(key)) return false;
    const y = Number(key.slice(0, 4));
    const m = Number(key.slice(5, 7));
    const d = Number(key.slice(8, 10));
    const dt = new Date(Date.UTC(y, m - 1, d));
    return dt.getUTCFullYear() === y && dt.getUTCMonth() === m - 1 && dt.getUTCDate() === d;
}

export function validateEncFile(obj) {
    if (!isEncFile(obj)) {
        return { ok: false, error: 'That file is not an OpenExpense encrypted ledger.' };
    }
    if (!formatOk(obj.format, BUNDLE.ENC_FORMAT)) {
        return { ok: false, error: 'Unrecognized encrypted ledger format.' };
    }
    if (!versionOk(obj.version)) {
        return { ok: false, error: 'This encrypted ledger version is not supported.' };
    }
    if (!algOk(obj.alg)) {
        return { ok: false, error: 'Encrypted ledger uses an unsupported algorithm.' };
    }
    if (!kidOk(obj.kid)) {
        return { ok: false, error: 'Encrypted ledger has an invalid key id.' };
    }
    if (typeof obj.iv !== 'string' || !obj.iv || typeof obj.ct !== 'string' || !obj.ct) {
        return { ok: false, error: 'Encrypted ledger is missing ciphertext.' };
    }
    if (base64ByteLength(obj.iv) !== ENVELOPE.IV_BYTES
        || base64ByteLength(obj.ct) < 16
        || obj.ct.length > FILE_LIMITS.maxBytes) {
        return { ok: false, error: 'Encrypted ledger ciphertext is not usable.' };
    }
    if (isV2(obj)) {
        if (obj.kdf !== ENVELOPE.KDF) {
            return { ok: false, error: 'Encrypted ledger uses an unsupported key derivation.' };
        }
        if (base64ByteLength(obj.salt) !== ENVELOPE.SALT_BYTES) {
            return { ok: false, error: 'Encrypted ledger has an invalid salt.' };
        }
        if (base64ByteLength(obj.commit) !== ENVELOPE.COMMIT_BYTES) {
            return { ok: false, error: 'Encrypted ledger is missing its key commitment.' };
        }
    }
    return { ok: true };
}

function validateWrap(wrap) {
    if (wrap.kdf !== ENVELOPE.WRAP_KDF) {
        return { ok: false, error: 'key.json uses an unsupported passphrase derivation.' };
    }
    const iterations = Number(wrap.iterations);
    if (!Number.isInteger(iterations) || iterations < ENVELOPE.MIN_WRAP_ITERATIONS) {
        return { ok: false, error: 'key.json asks for too little passphrase work to be safe.' };
    }
    if (base64ByteLength(wrap.salt) !== ENVELOPE.WRAP_SALT_BYTES
        || base64ByteLength(wrap.iv) !== ENVELOPE.IV_BYTES
        || base64ByteLength(wrap.ct) !== ENVELOPE.SECRET_BYTES + 16) {
        return { ok: false, error: 'key.json passphrase material is not usable.' };
    }
    return { ok: true };
}

export function validateKeyFile(obj) {
    if (!isKeyFile(obj)) {
        return { ok: false, error: 'That file is not an OpenExpense key.json.' };
    }
    if (!formatOk(obj.format, BUNDLE.KEY_FORMAT)) {
        return { ok: false, error: 'Unrecognized key.json format.' };
    }
    if (!versionOk(obj.version)) {
        return { ok: false, error: 'This key.json version is not supported.' };
    }
    if (!algOk(obj.alg)) {
        return { ok: false, error: 'key.json uses an unsupported algorithm.' };
    }
    if (!kidOk(obj.kid)) {
        return { ok: false, error: 'key.json has an invalid key id.' };
    }

    if (isV2(obj)) {
        if (obj.kdf !== ENVELOPE.KDF) {
            return { ok: false, error: 'key.json uses an unsupported key derivation.' };
        }
        if (obj.wrap && typeof obj.wrap === 'object') return validateWrap(obj.wrap);
        if (base64ByteLength(obj.secret) !== ENVELOPE.SECRET_BYTES) {
            return { ok: false, error: 'key.json does not contain a 256-bit master secret.' };
        }
        return { ok: true };
    }

    const jwk = obj.key && obj.key.kty ? obj.key : obj;
    if (jwk.kty !== 'oct' || base64ByteLength(jwk.k, { urlSafe: true }) !== 32) {
        return { ok: false, error: 'key.json does not contain a 256-bit AES key.' };
    }
    if (jwk.alg && jwk.alg !== 'A256GCM') {
        return { ok: false, error: 'key.json is not an AES-256-GCM key.' };
    }
    return { ok: true };
}

export function kidsMatch(enc, keyFile) {
    const encKid = enc?.kid != null ? String(enc.kid) : '';
    const keyKid = keyFile?.kid != null ? String(keyFile.kid) : '';
    if (!encKid && !keyKid) return true;
    return !!encKid && encKid === keyKid;
}

/** Overwrite portable key material so a dropped reference cannot be reused. */
export function wipeKeyFile(keyFile) {
    if (!keyFile || typeof keyFile !== 'object') return;
    if (keyFile.key && typeof keyFile.key === 'object') {
        if (typeof keyFile.key.k === 'string') keyFile.key.k = '';
        delete keyFile.key.k;
    }
    if (typeof keyFile.k === 'string') {
        keyFile.k = '';
        delete keyFile.k;
    }
    if (typeof keyFile.secret === 'string') {
        keyFile.secret = '';
        delete keyFile.secret;
    }
    if (keyFile.wrap && typeof keyFile.wrap === 'object') {
        if (typeof keyFile.wrap.ct === 'string') keyFile.wrap.ct = '';
        delete keyFile.wrap.ct;
    }
}

export function classifyJson(obj) {
    if (!obj || typeof obj !== 'object' || Array.isArray(obj)) return 'unknown';
    if (isKeyFile(obj)) return 'key';
    if (isEncFile(obj)) return 'enc';
    if (obj.events && typeof obj.events === 'object' && !Array.isArray(obj.events)) return 'plaintext';
    const keys = Object.keys(obj);
    if (keys.length && keys.every((key) => isValidDateKey(key) || FORBIDDEN_KEYS.has(key))) {
        return 'plaintext-events';
    }
    return 'unknown';
}

export async function readJsonFile(file) {
    if (!file) return { ok: false, error: 'No file selected.' };
    if (typeof file.size === 'number' && file.size > FILE_LIMITS.maxBytes) {
        return { ok: false, error: 'That file is too large to open.' };
    }
    let text;
    try {
        text = await file.text();
    } catch {
        return { ok: false, error: 'Could not read that file.' };
    }
    if (text.length > FILE_LIMITS.maxBytes) {
        return { ok: false, error: 'That file is too large to open.' };
    }
    try {
        const obj = JSON.parse(text);
        if (!obj || typeof obj !== 'object' || Array.isArray(obj)) {
            return { ok: false, error: 'Invalid file. Choose a valid OpenExpense export.' };
        }
        return { ok: true, obj };
    } catch {
        return { ok: false, error: 'Invalid file. Choose a valid OpenExpense export.' };
    }
}

export function sanitizeEntry(raw) {
    if (!raw || typeof raw !== 'object') return null;
    const title = String(raw.title ?? '').trim().slice(0, FILE_LIMITS.maxTitle);
    if (!title) return null;

    const entry = { title };
    const price = parseFloat(raw.price);
    if (Number.isFinite(price) && Math.abs(price) <= FILE_LIMITS.maxPrice) {
        entry.price = price;
    }
    const note = String(raw.note ?? '').trim();
    if (note) entry.note = note.slice(0, FILE_LIMITS.maxNote);
    if (raw.recurring) entry.recurring = true;
    if (raw.paid) entry.paid = true;
    if (raw.kind === 'income') entry.kind = 'income';
    if (raw.recurring) entry.repeat = normalizeRepeat(raw.repeat);
    const category = String(raw.category ?? '').trim().slice(0, FILE_LIMITS.maxCategory);
    if (category) entry.category = category;
    const source = String(raw.source ?? '').trim().slice(0, FILE_LIMITS.maxSource);
    if (source) entry.source = source;
    const sourceId = String(raw.sourceId ?? raw.source_id ?? '').trim().slice(0, FILE_LIMITS.maxSourceId);
    if (sourceId) entry.sourceId = sourceId;
    return entry;
}

/** One events map holds both expense and income. No second ledger file. */
export function sanitizeLedger(payload) {
    if (!payload || typeof payload !== 'object') return null;
    const raw = payload.events && typeof payload.events === 'object' && !Array.isArray(payload.events)
        ? payload.events
        : (payload && !payload.name && !payload.savedAt && !Array.isArray(payload) ? payload : null);
    if (!raw || typeof raw !== 'object' || Array.isArray(raw)) return null;

    const events = {};
    let days = 0;
    let total = 0;
    const dates = Object.keys(raw).sort();
    for (const date of dates) {
        if (FORBIDDEN_KEYS.has(date) || !isValidDateKey(date)) continue;
        const list = raw[date];
        if (!Array.isArray(list)) continue;
        const rows = [];
        for (const item of list) {
            if (rows.length >= FILE_LIMITS.maxPerDay || total >= FILE_LIMITS.maxEntries) break;
            const entry = sanitizeEntry(item);
            if (entry) {
                rows.push(entry);
                total += 1;
            }
        }
        if (!rows.length) continue;
        if (days >= FILE_LIMITS.maxDays) break;
        events[date] = rows;
        days += 1;
    }

    return {
        name: Utils.sanitizeFilename(payload.name ?? payload.ledgerName ?? ''),
        events,
        savedAt: Number(payload.savedAt) || Date.now()
    };
}

export function countEntries(events) {
    return Object.values(events || {}).reduce((sum, list) => (
        sum + (Array.isArray(list) ? list.length : 0)
    ), 0);
}
