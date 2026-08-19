/**
 * OpenExpense — shell switching
 *
 * Four primary tabs: Overview, Tracker, Planner, and Privacy.
 * Privacy is the existing docs pane. On a phone or tablet, Overview
 * keeps Left to spend and the calendar; Tracker keeps the spending
 * register. Desktop Overview still sits the compact strip beside the
 * calendar and register. Planner is its own workspace.
 */
import { STORAGE_KEYS } from '../config.js';
import { getState, patch } from '../core/store.js';
import { lockBodyScroll, unlockBodyScroll } from '../ui/scroll-lock.js';
import { render } from './render.js';
import { shouldShowNotFound } from '../core/routes.js';

export { shouldShowNotFound };

export const SHELL_TABS = ['overview', 'tracker', 'planner', 'privacy'];

function readStoredTab() {
    try {
        const stored = localStorage.getItem(STORAGE_KEYS.shellTab);
        if (SHELL_TABS.includes(stored)) return stored;
        const legacy = localStorage.getItem(STORAGE_KEYS.dashView);
        if (legacy === 'budget' || legacy === 'planner' || legacy === 'plan') return 'planner';
        if (legacy === 'overview' || legacy === 'income' || legacy === 'expense') return 'overview';
    } catch (_) { /* ignore */ }
    return 'overview';
}

/** Persist the bottom-tab name. Storage key is frozen (`oe-shell-tab`). */
export function persistShellTab(tab) {
    try { localStorage.setItem(STORAGE_KEYS.shellTab, tab); } catch (_) { /* ignore */ }
}

/**
 * Stamp `html[data-shell]`, swap `#view-app` / `#view-docs`, and hide
 * `[data-shell]` panes that are not this tab.
 *
 * `.ledger-stage` is not a pane. Frame CSS shows or hides `#cal-col`,
 * `#sidebar`, and `.tracker-toolbar` inside that shared board.
 *
 * @param {string} tab
 */
export function applyShell(tab) {
    const next = SHELL_TABS.includes(tab) ? tab : 'overview';
    const appView = document.getElementById('view-app');
    const docsView = document.getElementById('view-docs');
    const privacy = next === 'privacy';

    document.documentElement.dataset.shell = next;
    if (appView) appView.classList.toggle('hidden', privacy);
    if (docsView) docsView.classList.toggle('hidden', !privacy);

    document.querySelectorAll('[data-shell]').forEach((pane) => {
        const on = pane.dataset.shell === next;
        pane.hidden = !on;
        pane.setAttribute('aria-hidden', on ? 'false' : 'true');
    });

    document.querySelectorAll('.dock-tab[data-view]').forEach((btn) => {
        const on = btn.dataset.view === next;
        btn.classList.toggle('is-active', on);
        if (on) btn.setAttribute('aria-current', 'page');
        else btn.removeAttribute('aria-current');
    });
}

/**
 * Activate a bottom tab. Legacy aliases: `app` → last ledger tab, `docs` → privacy.
 * @param {string} viewName
 */
export function switchView(viewName) {
    let tab = viewName;
    if (viewName === 'app') tab = getState().shellTab === 'privacy' ? 'overview' : (getState().shellTab || 'overview');
    if (viewName === 'docs') tab = 'privacy';
    if (!SHELL_TABS.includes(tab)) return;

    persistShellTab(tab);
    if (getState().shellTab !== tab) patch({ shellTab: tab });
    applyShell(tab);
    if (tab !== 'privacy') render();
    window.scrollTo(0, 0);
}

export function bootShell() {
    const tab = readStoredTab();
    patch({ shellTab: tab });
    applyShell(tab);
}

export function switchDocTab(tabName) {
    const pane = document.getElementById(`pane-${tabName}`);
    const tab = document.getElementById(`dt-${tabName}`);
    if (!pane || !tab) return;
    document.querySelectorAll('.docs-pane').forEach(p => p.classList.remove('active'));
    document.querySelectorAll('.docs-nav-tab').forEach(t => t.classList.remove('active'));
    pane.classList.add('active');
    tab.classList.add('active');
}

export function showWelcome() {
    const modal = document.getElementById('welcome-modal');
    if (!modal) return;
    let visited = false;
    try { visited = !!localStorage.getItem(STORAGE_KEYS.visited); } catch (_) { }
    if (!visited) {
        modal.classList.add('open');
        document.body.classList.add('modal-open');
        lockBodyScroll();
        try { localStorage.setItem(STORAGE_KEYS.visited, 'true'); } catch (_) { }
    }
}

export function closeWelcomeModal() {
    const modal = document.getElementById('welcome-modal');
    if (!modal?.classList.contains('open')) return;
    modal.classList.remove('open');
    if (!document.getElementById('modal')?.classList.contains('open')) {
        document.body.classList.remove('modal-open');
    }
    unlockBodyScroll();
}
