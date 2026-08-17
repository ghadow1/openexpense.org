/**
 * OpenExpense — ledger file quality control
 *
 * Validates encrypted envelopes and key.json files, binds them with a kid,
 * and sanitizes decrypted ledgers (expense + income in one events map).
 * Portable keys never go to IndexedDB or localStorage — only to a download.
 */
import { Utils } from './utils.js';
import { normalizeRepeat } from './series.js';
import { BUNDLE, isEncFile, isKeyFile } from './bundle.js';

const DATE_KEY = /^\d{4}-\d{2}-\d{2}$/;
const FORBIDDEN_KEYS = new Set(['__proto__', 'constructor', 'prototype']);

export function exportFilenames(ledgerName) {
    const base = Utils.sanitizeFilename(ledgerName) || 'ledger';
    const now = new Date();
    const stamp = Utils.dateKey(now.getFullYear(), now.getMonth(), now.getDate());
    const stem = `${base}-${stamp}`;
    return {
        stem,
        ledger: `${stem}.json`,
        key: `${stem}.key.json`
    };
}

export function validateEncFile(obj) {
    if (!isEncFile(obj)) {
        return { ok: false, error: 'That file is not an OpenExpense encrypted ledger.' };
    }
    if (obj.format && obj.format !== BUNDLE.ENC_FORMAT) {
        return { ok: false, error: 'Unrecognized encrypted ledger format.' };
    }
    if (typeof obj.iv !== 'string' || !obj.iv || typeof obj.ct !== 'string' || !obj.ct) {
        return { ok: false, error: 'Encrypted ledger is missing ciphertext.' };
    }
    return { ok: true };
}

export function validateKeyFile(obj) {
    if (!isKeyFile(obj)) {
        return { ok: false, error: 'That file is not an OpenExpense key.json.' };
    }
    const jwk = obj.key && obj.key.kty ? obj.key : obj;
    if (jwk.kty !== 'oct' || typeof jwk.k !== 'string' || jwk.k.length < 16) {
        return { ok: false, error: 'key.json does not contain a usable AES key.' };
    }
    return { ok: true };
}

export function kidsMatch(enc, keyFile) {
    const encKid = enc?.kid != null ? String(enc.kid) : '';
    const keyKid = keyFile?.kid != null ? String(keyFile.kid) : '';
    if (!encKid && !keyKid) return true;
    return !!encKid && encKid === keyKid;
}

export function sanitizeEntry(raw) {
    if (!raw || typeof raw !== 'object') return null;
    const title = String(raw.title ?? '').trim().slice(0, 200);
    if (!title) return null;

    const entry = { title };
    const price = parseFloat(raw.price);
    if (Number.isFinite(price)) entry.price = price;
    const note = String(raw.note ?? '').trim();
    if (note) entry.note = note.slice(0, 2000);
    if (raw.recurring) entry.recurring = true;
    if (raw.paid) entry.paid = true;
    if (raw.kind === 'income') entry.kind = 'income';
    if (raw.recurring) entry.repeat = normalizeRepeat(raw.repeat);
    return entry;
}

/** One events map holds both expense and income. No second ledger file. */
export function sanitizeLedger(payload) {
    if (!payload || typeof payload !== 'object') return null;
    const raw = payload.events;
    if (!raw || typeof raw !== 'object' || Array.isArray(raw)) return null;

    const events = {};
    Object.keys(raw).forEach((date) => {
        if (FORBIDDEN_KEYS.has(date) || !DATE_KEY.test(date)) return;
        const list = raw[date];
        if (!Array.isArray(list)) return;
        const rows = list.map(sanitizeEntry).filter(Boolean);
        if (rows.length) events[date] = rows;
    });

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
