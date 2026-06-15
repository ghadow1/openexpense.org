import { CONFIG, THEMES } from '../config.js';

const state = {
    currentDate: new Date(),
    events: {},
    ledgerName: '',
    isDark: CONFIG.defaultTheme === 'dark',
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
