/**
 * OpenExpense — in-memory host session
 *
 * Banking apps that only need the engine (no calendar UI) use this.
 * The live page wraps the same methods around the app store.
 */
import { sanitizeLedger } from '../core/ledger-file.js';
import { mergeTransactions } from './map.js';
import { snapshot } from './insights.js';

export function createSession(initial = {}) {
    const cleaned = sanitizeLedger(initial) || { name: '', events: {} };
    let name = cleaned.name || '';
    let events = cleaned.events || {};
    const listeners = new Set();

    const emit = () => {
        const state = { name, events };
        listeners.forEach((fn) => fn(state));
        return state;
    };

    return {
        get() {
            return { name, events };
        },
        set(payload) {
            const next = sanitizeLedger(payload || {}) || { name: '', events: {} };
            name = next.name || '';
            events = next.events || {};
            return emit();
        },
        importTransactions(list) {
            events = mergeTransactions(events, list);
            return emit();
        },
        getSnapshot(date) {
            return snapshot(events, date);
        },
        subscribe(fn) {
            listeners.add(fn);
            return () => listeners.delete(fn);
        }
    };
}
