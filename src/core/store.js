/**
 * OpenExpense — in-memory store
 *
 * Single source of truth for the ledger, plan, theme, and UI selection.
 * Features call patch(); persist.js and the renderer subscribe().
 */
import { CONFIG, THEMES } from '../config.js';

const state = {
    currentDate: new Date(),
    events: {},
    budgets: {},
    plan: {},
    ledgerName: '',
    isDark: CONFIG.defaultTheme === 'dark',
    autosaveEnabled: true,
    storageEncrypted: true,
    selectedKey: null,
    editingIndex: null,
    ledgerFace: 'expense',
    trackerFilter: 'all',
    shellTab: 'overview'
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
