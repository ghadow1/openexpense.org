import { STORAGE_KEYS } from '../config.js';
import { getState, patch } from '../core/store.js';
import { Utils } from '../core/utils.js';
import { Toast } from '../ui/toast.js';
import {
    encryptBundle, decryptBundle, zipBundle, unzipBundle, entryToJson,
    isEncFile, isKeyFile, BUNDLE
} from '../core/bundle.js';
import { confirmDialog } from '../ui/confirm.js';
import { saveLedger } from '../core/persist.js';

export const Ledger = {
    _pendingEnc: null,
    _pendingKey: null,

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
        const { ledgerName, events } = getState();
        return {
            name: ledgerName || '',
            events,
            savedAt: Date.now()
        };
    },

    // Autosave persists the ledger to encrypted local storage (IndexedDB) using
    // the device key — no files involved. Export is the manual encrypted .zip.
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

    zipFilename() {
        const base = Utils.sanitizeFilename(getState().ledgerName) || 'ledger';
        const stamp = Utils.dateKey(new Date().getFullYear(), new Date().getMonth(), new Date().getDate());
        return `${base}-${stamp}.zip`;
    },

    // Persist a Blob using the best available mechanism for the platform:
    // native save picker on desktop, share sheet on mobile, download fallback.
    async saveBlob(blob, filename, description, accept) {
        if (Utils.canUseSavePicker()) {
            try {
                const handle = await window.showSaveFilePicker({
                    suggestedName: filename,
                    types: [{ description, accept }]
                });
                const writable = await handle.createWritable();
                await writable.write(blob);
                await writable.close();
                return 'saved';
            } catch (err) {
                if (err?.name === 'AbortError') return 'abort';
            }
        }

        const file = new File([blob], filename, { type: blob.type });
        if (Utils.isMobile() && navigator.share && navigator.canShare?.({ files: [file] })) {
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

    // Export the ledger as an encrypted .zip set: an AES-256-GCM ciphertext of
    // the ledger plus the key needed to decrypt it. No plaintext leaves the app.
    async export() {
        try {
            const { enc, keyFile } = await encryptBundle(Ledger.exportPayload());
            const zipped = zipBundle(enc, keyFile);
            const blob = new Blob([zipped], { type: 'application/zip' });
            const result = await Ledger.saveBlob(
                blob,
                Ledger.zipFilename(),
                'OpenExpense encrypted export',
                { 'application/zip': ['.zip'] }
            );
            if (result === 'abort') return;
            Toast.show('Exported encrypted ledger + key as a .zip.', 'success');
        } catch (err) {
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

    // Wipe all expenses and the ledger name on this device after confirmation.
    async clearLedger() {
        const { events, ledgerName } = getState();
        const hasData = Object.keys(events).length > 0 || !!ledgerName;
        if (!hasData) {
            Toast.show('Calendar is already empty.', 'info');
            return;
        }

        const ok = await confirmDialog({
            title: 'Clear calendar?',
            message: 'This permanently wipes every logged expense and the ledger name on this device. This cannot be undone — export a backup first if you need one.',
            confirmText: 'Clear everything',
            cancelText: 'Cancel',
            danger: true
        });
        if (!ok) return;

        patch({ events: {}, ledgerName: '', selectedKey: null, editingIndex: null });
        // Clearing must remove the stored copy too, even if autosave is paused.
        saveLedger({ name: '', events: {}, savedAt: Date.now() });
        Toast.show('Calendar cleared.', 'success');
    },

    async handleImport(evt) {
        const f = evt.target.files && evt.target.files[0];
        if (evt.target) evt.target.value = '';
        if (!f) return;

        try {
            const isZip = /\.zip$/i.test(f.name)
                || f.type === 'application/zip'
                || f.type === 'application/x-zip-compressed';
            if (isZip) {
                await Ledger.importZip(f);
            } else {
                await Ledger.importJsonFile(f);
            }
        } catch (err) {
            console.error('[OpenExpense] import failed:', err);
            Toast.show('Could not read that file.', 'error');
        }
    },

    async importZip(file) {
        const buf = new Uint8Array(await file.arrayBuffer());
        let entries;
        try {
            entries = unzipBundle(buf);
        } catch {
            Toast.show('That .zip could not be opened.', 'error');
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
            Ledger._pendingEnc = enc;
            Toast.show('Loaded encrypted ledger. Now Import its key to decrypt.', 'info');
        } else if (keyFile) {
            Ledger._pendingKey = keyFile;
            Toast.show('Loaded key. Now Import the encrypted ledger.', 'info');
        } else {
            Toast.show('No OpenExpense ledger found inside that .zip.', 'error');
        }
    },

    async importJsonFile(file) {
        let obj;
        try {
            obj = JSON.parse(await file.text());
        } catch {
            Toast.show('Invalid file. Choose a valid OpenExpense export.', 'error');
            return;
        }

        if (isKeyFile(obj)) {
            Ledger._pendingKey = obj;
            if (!await Ledger.tryFinishPending(file.name)) {
                Toast.show('Key loaded. Now Import the encrypted ledger (.zip or .json).', 'info');
            }
            return;
        }

        if (isEncFile(obj)) {
            Ledger._pendingEnc = obj;
            if (!await Ledger.tryFinishPending(file.name)) {
                Toast.show('Encrypted ledger loaded. Now Import its key file.', 'info');
            }
            return;
        }

        const importedEvents = (obj && typeof obj === 'object') ? (obj.events || obj) : null;
        if (!importedEvents || typeof importedEvents !== 'object' || Array.isArray(importedEvents)) {
            Toast.show('Unrecognized file format.', 'error');
            return;
        }
        Ledger.applyImportedLedger(
            { name: Ledger.nameFromImport(file.name, obj), events: importedEvents },
            file.name
        );
    },

    async tryFinishPending(srcName) {
        if (!(Ledger._pendingEnc && Ledger._pendingKey)) return false;
        const enc = Ledger._pendingEnc;
        const keyFile = Ledger._pendingKey;
        Ledger._pendingEnc = null;
        Ledger._pendingKey = null;
        await Ledger.decryptAndApply(enc, keyFile, srcName);
        return true;
    },

    async decryptAndApply(enc, keyFile, srcName) {
        let payload;
        try {
            payload = await decryptBundle(enc, keyFile);
        } catch (err) {
            console.error('[OpenExpense] decrypt failed:', err);
            Toast.show('That key does not match the encrypted ledger.', 'error');
            return;
        }
        Ledger.applyImportedLedger(payload, srcName);
    },

    applyImportedLedger(payload, srcName) {
        const importedEvents = (payload && payload.events && typeof payload.events === 'object' && !Array.isArray(payload.events))
            ? payload.events
            : null;
        if (!importedEvents) {
            Toast.show('Decrypted data is not a valid ledger.', 'error');
            return;
        }

        const { events: current, ledgerName } = getState();
        const hasData = Object.keys(current).length > 0 || ledgerName;
        if (hasData && !confirm('Import will replace your current ledger. Continue?')) return;

        patch({
            ledgerName: Ledger.nameFromImport(srcName, payload),
            events: importedEvents
        });
        const count = Object.values(importedEvents).reduce((sum, list) => sum + (Array.isArray(list) ? list.length : 0), 0);
        Toast.show(`Imported ${count} item${count === 1 ? '' : 's'}.`, 'success');
    }
};
