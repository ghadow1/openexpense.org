/**
 * OpenExpense — ledger import / export / autosave
 *
 * One encrypted JSON holds expenses and income. Export writes that file plus
 * a sibling key.json. The portable key is never stored in this browser.
 */
import { STORAGE_KEYS } from '../config.js';
import { getState, patch } from '../core/store.js';
import { Utils } from '../core/utils.js';
import { Toast } from '../ui/toast.js';
import {
    encryptBundle, decryptBundle, unzipBundle, entryToJson,
    isEncFile, isKeyFile, needsPassphrase, BUNDLE, ZIP_LIMITS
} from '../core/bundle.js';
import {
    validateEncFile, validateKeyFile, kidsMatch, wipeKeyFile,
    sanitizeLedger, countEntries, exportFilenames, readJsonFile, classifyJson
} from '../core/ledger-file.js';
import { planIsDefault, sanitizePlan } from '../core/plan.js';
import { confirmDialog } from '../ui/confirm.js';
import { purgeStoredLedger, saveLedger } from '../core/persist.js';
import { clearCachedDeviceKey } from '../core/crypto.js';
import {
    canUseDirectoryPicker, getSavedFolder, pickExportFolder,
    writeBlobsToFolder, resolveOverwriteNames, EXPORT_FOLDER_NAME
} from '../core/folder.js';
import { runLocked } from '../ui/action-lock.js';
import { refreshExportButtons } from './export-buttons.js';
import { dismissUndo, offerDeleteUndo } from './undo-delete.js';

const PENDING_MS = 5 * 60 * 1000;
const JSON_ACCEPT = { 'application/json': ['.json'] };
const MIN_PASSPHRASE = 8;

function readPassphrasePref() {
    try { return localStorage.getItem(STORAGE_KEYS.exportPassphrase); } catch (_) { return null; }
}

function writePassphrasePref(value) {
    try { localStorage.setItem(STORAGE_KEYS.exportPassphrase, value); } catch (_) { }
}

export const Ledger = {
    _pendingEnc: null,
    _pendingKey: null,
    _pendingTimer: null,

    setLedgerName(name) {
        const ledgerName = Utils.sanitizeFilename(name);
        patch({ ledgerName });
    },

    nameFromImport(filename, payload) {
        const fromJson = payload?.name ?? payload?.ledgerName;
        if (fromJson && String(fromJson).trim()) return Utils.sanitizeFilename(String(fromJson).trim());
        return Utils.filenameToLedgerName(filename);
    },

    exportPayload() {
        const { ledgerName, events, budgets, plan, goals } = getState();
        const payload = {
            name: ledgerName || '',
            events,
            savedAt: Date.now()
        };
        if (budgets && Object.keys(budgets).length) payload.budgets = budgets;
        if (plan && !planIsDefault(plan)) payload.plan = sanitizePlan(plan);
        if (Array.isArray(goals) && goals.length) payload.goals = goals;
        return payload;
    },

    enableAutosave() {
        patch({ autosaveEnabled: true });
        try { localStorage.setItem(STORAGE_KEYS.autosave, 'true'); } catch (_) { }
        Toast.show('Autosave on — saving encrypted on this device.', 'success');
    },

    disableAutosave() {
        patch({ autosaveEnabled: false });
        try { localStorage.setItem(STORAGE_KEYS.autosave, 'false'); } catch (_) { }
        Toast.show("Autosave off — changes this session won't be saved on this device.", 'info');
    },

    toggleAutosave() {
        if (getState().autosaveEnabled) Ledger.disableAutosave();
        else Ledger.enableAutosave();
    },

    clearPending({ wipe = true } = {}) {
        if (wipe) wipeKeyFile(Ledger._pendingKey);
        Ledger._pendingEnc = null;
        Ledger._pendingKey = null;
        if (Ledger._pendingTimer) {
            clearTimeout(Ledger._pendingTimer);
            Ledger._pendingTimer = null;
        }
    },

    holdPending(partial) {
        if (partial.key && Ledger._pendingKey && Ledger._pendingKey !== partial.key) {
            wipeKeyFile(Ledger._pendingKey);
        }
        if (partial.enc) Ledger._pendingEnc = partial.enc;
        if (partial.key) Ledger._pendingKey = partial.key;
        if (Ledger._pendingTimer) clearTimeout(Ledger._pendingTimer);
        Ledger._pendingTimer = setTimeout(() => {
            Ledger.clearPending();
            Toast.show('Unlock key cleared from memory. Import the pair again.', 'info');
        }, PENDING_MS);
    },

    async saveBlob(blob, filename, description, accept) {
        if (Utils.canUseSavePicker()) {
            try {
                const handle = await window.showSaveFilePicker({
                    suggestedName: filename,
                    startIn: 'documents',
                    types: [{ description, accept }]
                });
                const writable = await handle.createWritable();
                try {
                    await writable.write(blob);
                    await writable.close();
                } catch (err) {
                    // Leaving the writable open strands its swap file on disk,
                    // and only close() commits, so the target keeps its old
                    // contents rather than a half-written export.
                    try { await writable.abort?.(); } catch (_) { }
                    throw err;
                }
                return 'saved';
            } catch (err) {
                if (err?.name === 'AbortError') return 'abort';
            }
        }

        const file = new File([blob], filename, { type: blob.type });
        if (Utils.isMobile() && Utils.canShareFiles([file])) {
            try {
                await navigator.share({ files: [file], title: getState().ledgerName || 'OpenExpense Export' });
                return 'shared';
            } catch (err) {
                if (err?.name === 'AbortError') return 'abort';
            }
        }

        Ledger.downloadFallback(blob, filename);
        return 'downloaded';
    },

    async resolveExportFolder(pickFolder = false) {
        if (!canUseDirectoryPicker()) return null;
        if (!pickFolder) {
            const saved = await getSavedFolder();
            if (saved) return saved;
        }

        const choice = await confirmDialog({
            title: pickFolder ? 'Choose a save folder' : `Save in ${EXPORT_FOLDER_NAME}?`,
            message: pickFolder
                ? `Pick any folder. To keep the default, choose a parent and OpenExpense will use (or create) the ${EXPORT_FOLDER_NAME} folder inside it.`
                : `Exports go in an ${EXPORT_FOLDER_NAME} folder (Documents on most phones and computers). Check the box to pick a different folder instead.`,
            confirmText: pickFolder ? 'Choose folder' : `Use ${EXPORT_FOLDER_NAME}`,
            cancelText: 'Cancel',
            checkbox: { label: 'Choose my own folder instead', checked: false }
        });
        if (!choice?.confirmed) return null;

        try {
            const folder = await pickExportFolder({ useDefault: !choice.checked });
            if (folder) await refreshExportButtons();
            return folder;
        } catch (err) {
            if (err?.name === 'AbortError') return null;
            throw err;
        }
    },

    async shareOrDownloadPair(encBlob, keyBlob, names) {
        const files = [
            new File([encBlob], names.ledger, { type: 'application/json' }),
            new File([keyBlob], names.key, { type: 'application/json' })
        ];
        if (Utils.canShareFiles(files)) {
            try {
                await navigator.share({
                    files,
                    title: `${EXPORT_FOLDER_NAME} backup`,
                    text: `Save both files in your ${EXPORT_FOLDER_NAME} folder in Files. Keep them together.`
                });
                return 'shared';
            } catch (err) {
                if (err?.name === 'AbortError') return 'abort';
            }
        }

        Ledger.downloadFallback(encBlob, names.ledger);
        await new Promise((resolve) => setTimeout(resolve, Utils.isIOS() ? 400 : 200));
        Ledger.downloadFallback(keyBlob, names.key);
        return 'downloaded';
    },

    downloadFallback(blob, filename) {
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = filename;
        a.rel = 'noopener';
        document.body.appendChild(a);
        a.click();
        a.remove();
        setTimeout(() => URL.revokeObjectURL(url), 1000);
    },

    bindFolderGesture(btn) {
        if (!btn || btn.dataset.folderGesture === '1') return;
        btn.dataset.folderGesture = '1';

        let timer = 0;
        let opened = false;
        const start = () => {
            opened = false;
            timer = window.setTimeout(() => {
                opened = true;
                Ledger.export({ pickFolder: true });
            }, 550);
        };
        const cancel = () => { window.clearTimeout(timer); };
        btn.addEventListener('pointerdown', start);
        btn.addEventListener('pointerup', cancel);
        btn.addEventListener('pointerleave', cancel);
        btn.addEventListener('pointercancel', cancel);
        btn.addEventListener('contextmenu', (e) => {
            e.preventDefault();
            cancel();
            opened = true;
            Ledger.export({ pickFolder: true });
        });
        btn.addEventListener('click', (e) => {
            if (opened) e.stopImmediatePropagation();
        }, true);
    },

    // Encrypted ledger.json (expense + income) then a sibling key.json.
    // The JWK is not written to IndexedDB or localStorage.
    // Linked folder: overwrite the existing pair. Long-press to change folder.
    async export({ pickFolder = false } = {}) {
        return runLocked('export', () => Ledger.writeExport({ pickFolder }));
    },

    /**
     * A passphrase is opt-in and asked about once. Saying no is remembered, so
     * export stays a single click for anyone who does not want one. A long-press
     * export reopens the question, which is the way back after saying no.
     */
    async resolveExportPassphrase({ reconsider = false } = {}) {
        const choice = reconsider ? null : readPassphrasePref();

        if (choice !== 'on' && choice !== 'off') {
            const offer = await confirmDialog({
                title: 'Add a passphrase?',
                message: 'Without one, anyone holding both exported files can read this ledger. '
                    + 'With one, key.json is useless on its own. It cannot be recovered — if you '
                    + 'forget it, the export cannot be opened.',
                confirmText: 'Use a passphrase',
                cancelText: 'Not now',
                field: {
                    type: 'password',
                    label: 'Passphrase',
                    placeholder: 'At least 8 characters',
                    repeatLabel: 'Repeat passphrase'
                },
                validate: ({ value, repeat }) => {
                    if (value.length < MIN_PASSPHRASE) return `Use at least ${MIN_PASSPHRASE} characters.`;
                    if (value !== repeat) return 'Those two do not match.';
                    return null;
                }
            });
            if (!offer?.confirmed) {
                // Only a deliberate "Not now" is remembered. Escaping out is
                // not an answer, so the offer comes back next time.
                if (!offer?.dismissed) writePassphrasePref('off');
                return { ok: true, passphrase: '' };
            }
            writePassphrasePref('on');
            return { ok: true, passphrase: offer.value };
        }

        if (choice === 'off') return { ok: true, passphrase: '' };

        const asked = await confirmDialog({
            title: 'Passphrase',
            message: 'Enter the passphrase to protect this export.',
            confirmText: 'Export',
            cancelText: 'Cancel',
            field: {
                type: 'password',
                label: 'Passphrase',
                placeholder: `At least ${MIN_PASSPHRASE} characters`,
                repeatLabel: 'Repeat passphrase'
            },
            checkbox: { label: 'Stop asking — export without a passphrase', checked: false },
            validate: ({ value, repeat, checked }) => {
                if (checked) return null;
                if (value.length < MIN_PASSPHRASE) return `Use at least ${MIN_PASSPHRASE} characters.`;
                if (value !== repeat) return 'Those two do not match.';
                return null;
            }
        });
        if (!asked?.confirmed) return { ok: false, passphrase: '' };
        if (asked.checked) {
            writePassphrasePref('off');
            return { ok: true, passphrase: '' };
        }
        return { ok: true, passphrase: asked.value };
    },

    async writeExport({ pickFolder = false } = {}) {
        try {
            const choice = await Ledger.resolveExportPassphrase({ reconsider: pickFolder });
            if (!choice.ok) return;
            // A forgotten passphrase cannot be recovered, so say so on the way out.
            const keyNote = choice.passphrase
                ? 'You will need your passphrase to open it again.'
                : 'not stored in this browser.';
            const { enc, keyFile } = await encryptBundle(
                Ledger.exportPayload(),
                { passphrase: choice.passphrase }
            );

            // Check the export against the same rules import enforces. Without
            // this a very large ledger writes a file that reads back as "too
            // large to open", so the save looks fine and the backup is dead.
            const usable = validateEncFile(enc);
            if (!usable.ok) {
                Toast.show(
                    `This ledger is too large to export as one file (${usable.error}) Archive an older year first, then export again.`,
                    'error',
                    7600
                );
                return;
            }

            const encBlob = new Blob([JSON.stringify(enc, null, 2)], { type: 'application/json' });
            const keyBlob = new Blob([JSON.stringify(keyFile, null, 2)], { type: 'application/json' });

            const folder = await Ledger.resolveExportFolder(pickFolder);
            const names = folder
                ? await resolveOverwriteNames(folder, getState().ledgerName)
                : exportFilenames(getState().ledgerName);
            const pair = [
                { blob: encBlob, name: names.ledger },
                { blob: keyBlob, name: names.key }
            ];

            if (folder) {
                await writeBlobsToFolder(folder, pair);
                await refreshExportButtons();
                Toast.show(
                    `Updated ${names.ledger} in your ${EXPORT_FOLDER_NAME} folder. The matching key is ${names.key} — ${keyNote}`,
                    'success',
                    5200
                );
                return;
            }
            if (canUseDirectoryPicker() && pickFolder) return;

            if (Utils.isPhone() || Utils.isIOS() || Utils.isAndroid() || !Utils.canUseSavePicker()) {
                const mobileResult = await Ledger.shareOrDownloadPair(encBlob, keyBlob, names);
                if (mobileResult === 'abort') return;
                Toast.show(
                    mobileResult === 'shared'
                        ? `Share both files into your ${EXPORT_FOLDER_NAME} folder in Files. Keep them together.`
                        : `Saved ledger.json and key.json. On iPhone or Android, move both into an ${EXPORT_FOLDER_NAME} folder in Files.`,
                    'success',
                    5600
                );
                return;
            }

            const ledgerResult = await Ledger.saveBlob(
                encBlob,
                names.ledger,
                'OpenExpense encrypted ledger',
                JSON_ACCEPT
            );
            if (ledgerResult === 'abort') return;

            const keyResult = await Ledger.saveBlob(
                keyBlob,
                names.key,
                'OpenExpense ledger key',
                JSON_ACCEPT
            );
            if (keyResult === 'abort') {
                Toast.show('Encrypted ledger was saved, but the key was not. Export again and keep both files.', 'error', 6000);
                return;
            }

            Toast.show(`Saved encrypted ledger.json and key.json. The key is only in that download — ${keyNote}`, 'success', 5200);
        } catch (err) {
            if (err?.code === 'FOLDER_PERMISSION' || err?.message === 'FOLDER_PERMISSION') {
                await refreshExportButtons();
                Toast.show('Folder access was removed. Tap Export to save again or long-press to pick a folder.', 'error', 5600);
                return;
            }
            if (err?.code === 'FOLDER_CONFLICT') {
                Toast.show(
                    'Matching filenames already exist but are not a valid OpenExpense pair. Choose another folder or rename those files.',
                    'error',
                    7600
                );
                return;
            }
            if (err?.code === 'FOLDER_PARTIAL_SAVE') {
                Toast.show(
                    'The update did not finish. A complete encrypted recovery pair was kept in the folder with “.openexpense-recovery” filenames.',
                    'error',
                    9000
                );
                return;
            }
            console.error('[OpenExpense] export failed:', err);
            Toast.show('Could not export. Encryption needs a secure (https) context.', 'error');
        }
    },

    import() {
        const input = document.getElementById('ledger-import-input');
        if (!input) return;
        input.value = '';
        input.click();
    },

    pickKeyFile() {
        const input = document.getElementById('ledger-key-input');
        if (!input) return;
        input.value = '';
        input.click();
    },

    async clearLedger() {
        return runLocked('clear', async () => {
            const { events, ledgerName } = getState();
            const hasData = Object.keys(events).length > 0 || !!ledgerName;
            if (!hasData) {
                Toast.show('Calendar is already empty.', 'info');
                return;
            }

            const ok = await confirmDialog({
                title: 'Clear calendar?',
                message: 'This permanently wipes every expense and income entry and the ledger name on this device. Export a backup first if you need one.',
                confirmText: 'Clear everything',
                cancelText: 'Cancel',
                danger: true
            });
            if (!ok?.confirmed) return;

            Ledger.clearPending();
            try {
                await purgeStoredLedger();
                clearCachedDeviceKey();
            } catch (err) {
                console.error('[OpenExpense] could not clear encrypted storage:', err);
                Toast.show('Could not clear encrypted storage. Nothing was removed.', 'error', 5200);
                return;
            }
            offerDeleteUndo(getState(), { count: countEntries(events) });
            patch({ events: {}, budgets: {}, plan: {}, goals: [], ledgerName: '', selectedKey: null, editingIndex: null });
            Toast.show('Calendar and device encryption key cleared.', 'success');
        });
    },

    async handleImport(evt) {
        const files = evt.target.files ? Array.from(evt.target.files) : [];
        if (evt.target) evt.target.value = '';
        if (!files.length) return;

        return runLocked('import', async () => {
            try {
                if (files.length > 1) {
                    await Ledger.importFileList(files);
                    return;
                }
                const f = files[0];
                const isZip = /\.zip$/i.test(f.name)
                    || f.type === 'application/zip'
                    || f.type === 'application/x-zip-compressed';
                if (isZip) await Ledger.importZip(f);
                else await Ledger.importJsonFile(f);
            } catch (err) {
                console.error('[OpenExpense] import failed:', err);
                Toast.show('Could not read that file.', 'error');
            }
        });
    },

    async importFileList(files) {
        let enc = null;
        let keyFile = null;
        let srcName = files[0]?.name || 'import';

        for (const file of files) {
            if (/\.zip$/i.test(file.name)) {
                await Ledger.importZip(file);
                return;
            }
            const parsed = await readJsonFile(file);
            if (!parsed.ok) continue;
            const kind = classifyJson(parsed.obj);
            if (kind === 'enc' && !enc) {
                enc = parsed.obj;
                srcName = file.name;
            } else if (kind === 'key' && !keyFile) {
                keyFile = parsed.obj;
            }
        }

        if (enc && keyFile) {
            await Ledger.decryptAndApply(enc, keyFile, srcName);
            return;
        }
        if (enc) {
            Ledger.holdPending({ enc });
            await Ledger.requestMatchingKey();
            return;
        }
        if (keyFile) {
            Ledger.holdPending({ key: keyFile });
            Toast.show('Key held in memory only. Now Import the encrypted ledger.json.', 'info');
            return;
        }
        Toast.show('No OpenExpense ledger and key pair in that selection.', 'error');
    },

    async handleKeyImport(evt) {
        const f = evt.target.files && evt.target.files[0];
        if (evt.target) evt.target.value = '';
        if (!f) return;
        return runLocked('import', async () => {
            try {
                await Ledger.importJsonFile(f, { expectKey: true });
            } catch (err) {
                console.error('[OpenExpense] key import failed:', err);
                Toast.show('Could not read that key.json.', 'error');
            }
        });
    },

    async importZip(file) {
        if (typeof file?.size === 'number' && file.size > ZIP_LIMITS.maxCompressedBytes) {
            Toast.show('That ZIP is too large to import safely.', 'error');
            return;
        }
        const buf = new Uint8Array(await file.arrayBuffer());
        let entries;
        try {
            entries = unzipBundle(buf);
        } catch (err) {
            const limited = err?.message === 'ZIP_TOO_LARGE' || err?.message === 'ZIP_EXPANSION_LIMIT';
            Toast.show(limited ? 'That ZIP expands beyond the safe import limit.' : 'That ZIP could not be opened.', 'error');
            return;
        }

        let enc = entries[BUNDLE.ENC_NAME] ? entryToJson(entries[BUNDLE.ENC_NAME]) : null;
        let keyFile = entries[BUNDLE.KEY_NAME] ? entryToJson(entries[BUNDLE.KEY_NAME]) : null;

        for (const name of Object.keys(entries)) {
            if (!/\.json$/i.test(name)) continue;
            const obj = entryToJson(entries[name]);
            if (!obj) continue;
            if (!enc && isEncFile(obj)) enc = obj;
            else if (!keyFile && isKeyFile(obj)) keyFile = obj;
        }

        if (enc && keyFile) {
            await Ledger.decryptAndApply(enc, keyFile, file.name);
            return;
        }
        if (enc) {
            Ledger.holdPending({ enc });
            await Ledger.requestMatchingKey();
        } else if (keyFile) {
            Ledger.holdPending({ key: keyFile });
            Toast.show('Key loaded in memory only. Now Import the encrypted ledger.json.', 'info');
        } else {
            Toast.show('No OpenExpense ledger found inside that .zip.', 'error');
        }
    },

    async importJsonFile(file, { expectKey = false } = {}) {
        const parsed = await readJsonFile(file);
        if (!parsed.ok) {
            Toast.show(parsed.error, 'error');
            return;
        }
        const obj = parsed.obj;

        if (isKeyFile(obj)) {
            const qc = validateKeyFile(obj);
            if (!qc.ok) {
                Toast.show(qc.error, 'error');
                return;
            }
            Ledger.holdPending({ key: obj });
            if (!await Ledger.tryFinishPending(file.name)) {
                Toast.show('Key held in memory only. Now Import the encrypted ledger.json.', 'info');
            }
            return;
        }

        if (expectKey) {
            Toast.show('That file is not a key.json.', 'error');
            return;
        }

        if (isEncFile(obj)) {
            const qc = validateEncFile(obj);
            if (!qc.ok) {
                Toast.show(qc.error, 'error');
                return;
            }
            Ledger.holdPending({ enc: obj });
            if (!await Ledger.tryFinishPending(file.name)) {
                await Ledger.requestMatchingKey();
            }
            return;
        }

        const ok = await confirmDialog({
            title: 'Unencrypted file',
            message: 'This JSON is not encrypted. Import it into this browser’s encrypted autosave? Future exports will be an encrypted ledger.json plus a key.json.',
            confirmText: 'Import and encrypt',
            cancelText: 'Cancel'
        });
        if (!ok?.confirmed) return;

        const cleaned = sanitizeLedger({
            name: Ledger.nameFromImport(file.name, obj),
            events: (obj && typeof obj === 'object') ? (obj.events || obj) : null,
            budgets: obj && typeof obj === 'object' ? obj.budgets : undefined,
            plan: obj && typeof obj === 'object' ? obj.plan : undefined
        });
        if (!cleaned) {
            Toast.show('Unrecognized file format.', 'error');
            return;
        }
        Ledger.applyImportedLedger(cleaned, file.name);
    },

    async requestMatchingKey() {
        const ok = await confirmDialog({
            title: 'This ledger is encrypted',
            message: 'Choose the matching key.json that was saved next to this file. OpenExpense does not keep that key in the browser.',
            confirmText: 'Choose key.json',
            cancelText: 'Cancel'
        });
        if (!ok?.confirmed) {
            Ledger.clearPending();
            return;
        }
        Ledger.pickKeyFile();
    },

    async tryFinishPending(srcName) {
        if (!(Ledger._pendingEnc && Ledger._pendingKey)) return false;
        const enc = Ledger._pendingEnc;
        const keyFile = Ledger._pendingKey;
        Ledger.clearPending({ wipe: false });
        await Ledger.decryptAndApply(enc, keyFile, srcName);
        return true;
    },

    /**
     * Ask for the passphrase, letting the user retry. A wrong one is only ever
     * reported as wrong — nothing about the ledger leaks before it is right.
     */
    async unlockWithPassphrase(enc, keyFile) {
        for (let attempt = 0; attempt < 3; attempt++) {
            const asked = await confirmDialog({
                title: 'Passphrase needed',
                message: attempt === 0
                    ? 'This ledger was exported with a passphrase. Enter it to open the file.'
                    : 'That passphrase did not open this ledger. Try again.',
                confirmText: 'Unlock',
                cancelText: 'Cancel',
                field: { type: 'password', label: 'Passphrase', placeholder: '' }
            });
            if (!asked?.confirmed || !asked.value) return null;

            try {
                return await decryptBundle(enc, keyFile, { passphrase: asked.value });
            } catch (err) {
                if (attempt === 2) {
                    console.error('[OpenExpense] passphrase unlock failed:', err);
                    Toast.show('That passphrase does not unlock this ledger.', 'error');
                    return null;
                }
            }
        }
        return null;
    },

    async decryptAndApply(enc, keyFile, srcName) {
        try {
            const encQc = validateEncFile(enc);
            const keyQc = validateKeyFile(keyFile);
            if (!encQc.ok) {
                Toast.show(encQc.error, 'error');
                return;
            }
            if (!keyQc.ok) {
                Toast.show(keyQc.error, 'error');
                return;
            }
            if (!kidsMatch(enc, keyFile)) {
                Toast.show('That key.json does not belong to this ledger file.', 'error');
                return;
            }

            let payload;
            if (needsPassphrase(keyFile)) {
                payload = await Ledger.unlockWithPassphrase(enc, keyFile);
                if (!payload) return;
            } else {
                try {
                    payload = await decryptBundle(enc, keyFile);
                } catch (err) {
                    console.error('[OpenExpense] decrypt failed:', err);
                    Toast.show('That key does not unlock this ledger.', 'error');
                    return;
                }
            }

            const cleaned = sanitizeLedger(payload);
            if (!cleaned) {
                Toast.show('Decrypted data is not a valid ledger.', 'error');
                return;
            }
            Ledger.applyImportedLedger(cleaned, srcName);
        } finally {
            wipeKeyFile(keyFile);
        }
    },

    applyImportedLedger(payload, srcName) {
        const cleaned = payload.events && typeof payload.events === 'object' && !Array.isArray(payload.events)
            ? payload
            : sanitizeLedger(payload);
        if (!cleaned?.events) {
            Toast.show('Decrypted data is not a valid ledger.', 'error');
            return;
        }

        const { events: current, ledgerName } = getState();
        const hasData = Object.keys(current).length > 0 || ledgerName;
        if (hasData && !confirm('Import will replace your current ledger. Continue?')) return;

        dismissUndo();
        patch({
            ledgerName: cleaned.name || Ledger.nameFromImport(srcName, cleaned),
            events: cleaned.events,
            budgets: cleaned.budgets || {},
            plan: cleaned.plan || {},
            goals: cleaned.goals || []
        });
        const count = countEntries(cleaned.events);
        Toast.show(`Imported ${count} item${count === 1 ? '' : 's'} (expenses and income).`, 'success');
    }
};

if (typeof window !== 'undefined') {
    // File pickers can hide the tab; do not wipe on visibilitychange.
    window.addEventListener('pagehide', () => Ledger.clearPending());
}
