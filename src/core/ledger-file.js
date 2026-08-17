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

const DATE_KEY = /^\d{4}-\d{2}-\d{2}$/;
const KID_KEY = /^[a-f0-9]{16,64}$/i;
const FORBIDDEN_KEYS = new Set(['__proto__', 'constructor', 'prototype']);

export const FILE_LIMITS = {
    maxBytes: 8 * 1024 * 1024,
    maxDays: 4000,
    maxPerDay: 250,
    maxEntries: 25000,
    maxTitle: 200,
    maxNote: 2000,
    maxPrice: 1e9
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

function versionOk(value) {
    return value == null || value === BUNDLE.VERSION;
}

function algOk(value) {
    return value == null || value === 'AES-GCM';
}

function kidOk(value) {
    return value == null || (typeof value === 'string' && KID_KEY.test(value));
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
    if (obj.iv.length > 64 || obj.ct.length > FILE_LIMITS.maxBytes) {
        return { ok: false, error: 'Encrypted ledger ciphertext is not usable.' };
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
    const jwk = obj.key && obj.key.kty ? obj.key : obj;
    if (jwk.kty !== 'oct' || typeof jwk.k !== 'string' || jwk.k.length < 16 || jwk.k.length > 512) {
        return { ok: false, error: 'key.json does not contain a usable AES key.' };
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
