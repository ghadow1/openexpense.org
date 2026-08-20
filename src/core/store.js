/**
 * OpenExpense — in-memory store
 *
 * Single source of truth for the ledger, plan, goals, theme, and UI selection.
 * Features call patch(); persist.js and the renderer subscribe().
 * Field meanings: docs/CODEMAP.md. Persistence writes name/events/budgets/plan/goals only.
 *
 * @typedef {'overview'|'tracker'|'planner'|'privacy'} ShellTab
 * @typedef {'all'|'expense'|'income'} TrackerFilter
 * @typedef {'expense'|'income'} LedgerFace
 *
 * @typedef {object} AppState
 * @property {Date} currentDate Visible month (any day in that month).
 * @property {Record<string, object[]>} events Date-keyed ledger (`YYYY-MM-DD`).
 * @property {Record<string, number>} budgets Monthly category caps.
 * @property {object} plan Planner rules (withhold, hold, 50/30/20, weekly pace).
 * @property {object[]} goals Ordered savings goals; array order is allocation priority.
 * @property {string} ledgerName Display / export name.
 * @property {boolean} isDark Black Card when true, Professional when false.
 * @property {boolean} autosaveEnabled Whether persist.js writes IndexedDB.
 * @property {boolean} storageEncrypted Web Crypto available in this context.
 * @property {string|null} selectedKey Open day sheet, or null.
 * @property {number|null} editingIndex Row index in that day, or null.
 * @property {LedgerFace} ledgerFace Which monthly-register face is showing.
 * @property {TrackerFilter} trackerFilter Calendar + toolbar filter.
 * @property {ShellTab} shellTab Active primary tab.
 */
import { CONFIG, THEMES } from '../config.js';

/** @type {AppState} */
const state = {
    currentDate: new Date(),
    events: {},
    budgets: {},
    plan: {},
    goals: [],
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

/** @returns {AppState} Live state object. Do not replace; patch() to update. */
export function getState() {
    return state;
}

export function getColors() {
    return state.isDark ? THEMES.dark : THEMES.light;
}

/**
 * Merge fields and notify subscribers with the partial that changed.
 * @param {Partial<AppState>} partial
 */
export function patch(partial) {
    Object.assign(state, partial);
    listeners.forEach(listener => listener(partial));
}

/**
 * @param {(partial: Partial<AppState>) => void} listener
 * @returns {() => void} Unsubscribe
 */
export function subscribe(listener) {
    listeners.add(listener);
    return () => listeners.delete(listener);
}
