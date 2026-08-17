/**
 * OpenExpense — export folder (not the portable key)
 *
 * Remembers a FileSystemDirectoryHandle for the user's OpenExpense folder.
 * That handle is not key.json and cannot decrypt a ledger. iPhone and many
 * Android browsers have no directory picker; those paths use the share sheet.
 */
import { metaGet, metaPut } from './persist.js';
import { Utils } from './utils.js';

export const EXPORT_FOLDER_NAME = 'OpenExpense';
const META_KEY = 'export-folder-v1';

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

export async function getSavedFolder() {
    try {
        const handle = await metaGet(META_KEY);
        if (!handle) return null;
        if (!await permissionOk(handle)) return null;
        return handle;
    } catch {
        return null;
    }
}

export async function rememberFolder(handle) {
    if (!handle) return;
    try {
        await metaPut(META_KEY, handle);
    } catch (err) {
        console.error('[OpenExpense] could not remember export folder:', err);
    }
}

export async function clearSavedFolder() {
    try {
        await metaPut(META_KEY, null);
    } catch (_) { }
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
    for (const { blob, name } of files) {
        const handle = await folder.getFileHandle(name, { create: true });
        const writable = await handle.createWritable();
        await writable.write(blob);
        await writable.close();
    }
}
