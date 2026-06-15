import { getState, patch } from '../core/store.js';
import { Utils } from '../core/utils.js';
import { UI } from '../ui/components.js';
import { Toast } from '../ui/toast.js';
import { syncLedgerNameInput, render } from '../app/render.js';

export const Ledger = {
    setLedgerName(name) {
        patch({ ledgerName: Utils.sanitizeFilename(name) });
        syncLedgerNameInput();
    },

    nameFromImport(filename, payload) {
        const fromJson = payload?.name ?? payload?.ledgerName;
        if (fromJson && String(fromJson).trim()) return Utils.sanitizeFilename(String(fromJson).trim());
        return Utils.filenameToLedgerName(filename);
    },

    import() {
        const input = document.getElementById('ledger-import-input');
        if (!input) return;
        input.value = '';
        input.click();
    },

    async saveWithPicker(json, filename) {
        const handle = await window.showSaveFilePicker({
            suggestedName: filename,
            types: [{
                description: 'OpenExpense ledger',
                accept: { 'application/json': ['.json'] }
            }]
        });
        const writable = await handle.createWritable();
        await writable.write(json);
        await writable.close();
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

    async export() {
        const { ledgerName, events } = getState();
        const payload = {
            name: ledgerName || '',
            events
        };
        const json = JSON.stringify(payload, null, 2);
        const filename = Utils.exportFilename(ledgerName);
        const blob = new Blob([json], { type: 'application/json' });
        const file = new File([blob], filename, { type: 'application/json' });
        const shareTitle = ledgerName || 'OpenExpense Ledger';

        if (Utils.canUseSavePicker()) {
            try {
                await Ledger.saveWithPicker(json, filename);
                Toast.show('Ledger saved.', 'success');
                return;
            } catch (err) {
                if (err?.name === 'AbortError') return;
            }
        }

        if (Utils.isMobile() && navigator.share && navigator.canShare?.({ files: [file] })) {
            try {
                await navigator.share({ files: [file], title: shareTitle });
                Toast.show('Ledger shared.', 'success');
                return;
            } catch (err) {
                if (err?.name === 'AbortError') return;
            }
        }

        Ledger.downloadFallback(blob, filename);
        Toast.show('Ledger exported.', 'success');
    },

    handleImport(evt) {
        const f = evt.target.files && evt.target.files[0];
        if (!f) return;

        const { events, ledgerName } = getState();
        const hasData = Object.keys(events).length > 0 || ledgerName;
        if (hasData) {
            const ok = confirm('Import will replace your current ledger. Continue?');
            if (!ok) { evt.target.value = ''; return; }
        }

        const r = new FileReader();
        r.onload = () => {
            try {
                const p = JSON.parse(r.result);
                const importedEvents = (p && typeof p === 'object') ? (p.events || p) : null;
                if (!importedEvents || typeof importedEvents !== 'object' || Array.isArray(importedEvents)) {
                    throw new Error('Unexpected structure');
                }
                patch({
                    ledgerName: Ledger.nameFromImport(f.name, p),
                    events: importedEvents
                });
                render();
                const count = Object.values(importedEvents).reduce((sum, list) => sum + (Array.isArray(list) ? list.length : 0), 0);
                Toast.show(`Imported ${count} item${count === 1 ? '' : 's'}.`, 'success');
            } catch {
                Toast.show('Invalid ledger file. Choose a valid OpenExpense .json export.', 'error');
            }
        };
        r.onerror = () => Toast.show('Could not read that file.', 'error');
        r.readAsText(f);
        evt.target.value = '';
    }
};
