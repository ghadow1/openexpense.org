/**
 * OpenExpense — headless engine entry
 *
 * Bundled to /engine.js for banking hosts that map and hold ledger data
 * without loading the calendar UI.
 */
export { categorize } from './categorize.js';
export { mapTransaction, mapTransactions, mergeTransactions } from './map.js';
export { budgetStatus, detectRecurring, flagAnomalies, snapshot } from './insights.js';
export { createSession } from './session.js';
