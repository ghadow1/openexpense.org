import { CONFIG, THEMES } from '../config.js';

// tag: state-store - single in-memory app state for calendar data, UI prefs,
// and modal selection. patch() fans changed keys to render and persistence
// subscribers; sensitive ledger data is encrypted before it reaches IndexedDB.
const state = {
    currentDate: new Date(),
    events: {},
    ledgerName: '',
    isDark: CONFIG.defaultTheme === 'dark',
    autosaveEnabled: true,
    storageEncrypted: true,
    selectedKey: null,
    editingIndex: null
};

const listeners = new Set();

export function getState() {
    return state;
}

export function getColors() {
    return state.isDark ? THEMES.dark : THEMES.light;
}

export function patch(partial) {
    Object.assign(state, partial);
    listeners.forEach(fn => fn(partial));
}

export function subscribe(fn) {
    listeners.add(fn);
    return () => listeners.delete(fn);
}
