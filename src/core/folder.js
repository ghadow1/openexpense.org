/**
 * OpenExpense — export folder (not the portable key)
 *
 * Remembers a FileSystemDirectoryHandle for the user's OpenExpense folder.
 * That handle is not key.json and cannot decrypt a ledger. iPhone and many
 * Android browsers have no directory picker; those paths use the share sheet.
 */
import { metaGet, metaPut } from './persist.js';
import { Utils } from './utils.js';
import {
    FILE_LIMITS,
    kidsMatch,
    matchLedgerPairNames,
    validateEncFile,
    validateKeyFile
} from './ledger-file.js';

export const EXPORT_FOLDER_NAME = 'OpenExpense';
const META_KEY = 'export-folder-v1';

/** undefined = not probed, null = none, handle = linked folder */
let cachedHandle = undefined;

export function canUseDirectoryPicker() {
    return typeof window !== 'undefined'
        && typeof window.showDirectoryPicker === 'function'
        && window.isSecureContext
        && !Utils.isIOS();
}

async function permissionOk(handle) {
    if (!handle?.queryPermission) return false;
    try {
        const opts = { mode: 'readwrite' };
        let state = await handle.queryPermission(opts);
        if (state !== 'granted' && handle.requestPermission) {
            state = await handle.requestPermission(opts);
        }
        return state === 'granted';
    } catch {
        return false;
    }
}

export function peekSavedFolder() {
    return cachedHandle || null;
}

export async function getSavedFolder() {
    if (cachedHandle !== undefined) {
        if (!cachedHandle) return null;
        if (!await permissionOk(cachedHandle)) {
            await clearSavedFolder();
            return null;
        }
        return cachedHandle;
    }

    try {
        const handle = await metaGet(META_KEY);
        if (!handle) {
            cachedHandle = null;
            return null;
        }
        if (!await permissionOk(handle)) {
            await clearSavedFolder();
            return null;
        }
        cachedHandle = handle;
        return handle;
    } catch {
        cachedHandle = null;
        return null;
    }
}

export async function rememberFolder(handle) {
    if (!handle) return;
    cachedHandle = handle;
    try {
        await metaPut(META_KEY, handle);
    } catch (err) {
        console.error('[OpenExpense] could not remember export folder:', err);
    }
}

export async function clearSavedFolder() {
    cachedHandle = null;
    try {
        await metaPut(META_KEY, null);
    } catch (_) { }
}

export async function listFolderFileNames(folder) {
    const names = [];
    if (!folder?.values) return names;
    try {
        for await (const entry of folder.values()) {
            if (entry?.kind === 'file' && entry.name) names.push(entry.name);
        }
    } catch {
        return names;
    }
    return names;
}

export async function resolveOverwriteNames(folder, ledgerName) {
    const names = await listFolderFileNames(folder);
    const pair = matchLedgerPairNames(names, ledgerName);
    const set = new Set(names);
    const ledgerExists = set.has(pair.ledger);
    const keyExists = set.has(pair.key);
    if (!ledgerExists && !keyExists) return pair;
    if (!ledgerExists || !keyExists) {
        const conflict = new Error('FOLDER_CONFLICT');
        conflict.code = 'FOLDER_CONFLICT';
        throw conflict;
    }

    try {
        const [enc, keyFile] = await Promise.all([
            readFolderJson(folder, pair.ledger),
            readFolderJson(folder, pair.key)
        ]);
        if (!validateEncFile(enc).ok || !validateKeyFile(keyFile).ok || !kidsMatch(enc, keyFile)) {
            throw new Error('not an OpenExpense pair');
        }
    } catch (err) {
        const conflict = new Error('FOLDER_CONFLICT');
        conflict.code = 'FOLDER_CONFLICT';
        conflict.cause = err;
        throw conflict;
    }
    return pair;
}

async function readFolderJson(folder, name) {
    const handle = await folder.getFileHandle(name);
    const file = await handle.getFile();
    if (file.size > FILE_LIMITS.maxBytes) throw new Error('existing file is too large');
    return JSON.parse(await file.text());
}

function isOpenExpenseName(name) {
    return String(name || '').trim().toLowerCase() === EXPORT_FOLDER_NAME.toLowerCase();
}

export async function ensureOpenExpenseFolder(parent) {
    if (!parent) return null;
    if (isOpenExpenseName(parent.name)) return parent;
    return parent.getDirectoryHandle(EXPORT_FOLDER_NAME, { create: true });
}

export async function pickExportFolder({ useDefault = true } = {}) {
    if (!canUseDirectoryPicker()) return null;
    const parent = await window.showDirectoryPicker({
        id: 'openexpense-export',
        mode: 'readwrite',
        startIn: 'documents'
    });
    const folder = useDefault ? await ensureOpenExpenseFolder(parent) : parent;
    await rememberFolder(folder);
    return folder;
}

export async function writeBlobsToFolder(folder, files) {
    const stamp = `${Date.now()}-${globalThis.crypto?.randomUUID?.() || Math.random().toString(36).slice(2)}`;
    const staged = files.map(({ blob, name }) => ({
        blob,
        name: `.openexpense-recovery-${stamp}-${name}`
    }));

    const writeOne = async ({ blob, name }) => {
        const handle = await folder.getFileHandle(name, { create: true });
        const writable = await handle.createWritable();
        try {
            await writable.write(blob);
            await writable.close();
        } catch (err) {
            try { await writable.abort?.(); } catch (_) { }
            throw err;
        }
        const written = await handle.getFile();
        if (written.size !== blob.size) throw new Error('FOLDER_WRITE_VERIFY_FAILED');
    };

    const removeStaged = async () => {
        if (!folder?.removeEntry) return;
        await Promise.all(staged.map(({ name }) => folder.removeEntry(name).catch(() => {})));
    };

    try {
        try {
            for (const file of staged) await writeOne(file);
        } catch (err) {
            await removeStaged();
            throw err;
        }

        try {
            for (const file of files) await writeOne(file);
        } catch (err) {
            const partial = new Error('FOLDER_PARTIAL_SAVE');
            partial.code = 'FOLDER_PARTIAL_SAVE';
            partial.recoveryNames = staged.map(({ name }) => name);
            partial.cause = err;
            throw partial;
        }

        await removeStaged();
    } catch (err) {
        if (err?.name === 'NotAllowedError' || err?.name === 'SecurityError') {
            await clearSavedFolder();
            const lost = new Error('FOLDER_PERMISSION');
            lost.code = 'FOLDER_PERMISSION';
            throw lost;
        }
        throw err;
    }
}
