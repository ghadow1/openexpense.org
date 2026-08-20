/**
 * OpenExpense — shell switching
 *
 * Four primary tabs: Overview, Tracker, Planner, and Privacy.
 * Privacy is the existing docs pane. Overview keeps Potential Savings
 * (or the desktop compact strip). Tracker keeps the All / Expenses /
 * Income filter. Overview hides the register; Tracker hides the calendar.
 * Hide rules live on `html[data-shell]`.
 */
import { STORAGE_KEYS } from '../config.js';
import { getState, patch } from '../core/store.js';
import { lockBodyScroll, unlockBodyScroll } from '../ui/scroll-lock.js';
import { activateDialogFocus, deactivateDialogFocus } from '../ui/dialog-focus.js';
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
 * `.ledger-stage` is not a pane. CSS shows or hides `#cal-col`,
 * `#sidebar`, and `.tracker-toolbar` inside that shared board.
 * Desktop and tablet flatten the wrappers so the visible node can
 * use the full `#view-app` column.
 *
 * @param {string} tab
 */
export function applyShell(tab) {
    const next = SHELL_TABS.includes(tab) ? tab : 'overview';
    const appView = document.getElementById('view-app');
    const docsView = document.getElementById('view-docs');
    const skipLink = document.getElementById('skip-link');
    const privacy = next === 'privacy';

    document.documentElement.dataset.shell = next;
    if (appView) {
        appView.classList.toggle('hidden', privacy);
        appView.hidden = privacy;
        appView.setAttribute('aria-hidden', privacy ? 'true' : 'false');
    }
    if (docsView) {
        docsView.classList.toggle('hidden', !privacy);
        docsView.hidden = !privacy;
        docsView.setAttribute('aria-hidden', privacy ? 'false' : 'true');
    }
    if (skipLink) {
        skipLink.href = privacy ? '#view-docs' : '#view-app';
        skipLink.textContent = privacy ? 'Skip to privacy and documentation' : 'Skip to expense ledger';
    }

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
    if (tab !== 'privacy') render({ shellTab: true });
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
    document.querySelectorAll('.docs-pane').forEach((candidate) => {
        const on = candidate === pane;
        candidate.classList.toggle('active', on);
        candidate.hidden = !on;
        candidate.setAttribute('aria-hidden', on ? 'false' : 'true');
    });
    document.querySelectorAll('.docs-nav-tab').forEach((candidate) => {
        const on = candidate === tab;
        candidate.classList.toggle('active', on);
        candidate.setAttribute('aria-selected', on ? 'true' : 'false');
        candidate.tabIndex = on ? 0 : -1;
    });
}

/**
 * Arrow-key behavior required by the WAI-ARIA tabs pattern.
 * Click handling remains delegated through `[data-tab]` in main.js.
 */
export function handleDocTabKeydown(event) {
    const current = event.target.closest?.('.docs-nav-tab[data-tab]');
    if (!current) return;
    const tabs = [...document.querySelectorAll('.docs-nav-tab[data-tab]')];
    const index = tabs.indexOf(current);
    if (index < 0) return;

    let nextIndex = null;
    if (event.key === 'ArrowRight' || event.key === 'ArrowDown') nextIndex = (index + 1) % tabs.length;
    if (event.key === 'ArrowLeft' || event.key === 'ArrowUp') nextIndex = (index - 1 + tabs.length) % tabs.length;
    if (event.key === 'Home') nextIndex = 0;
    if (event.key === 'End') nextIndex = tabs.length - 1;
    if (nextIndex == null) return;

    event.preventDefault();
    const next = tabs[nextIndex];
    switchDocTab(next.dataset.tab);
    next.focus();
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
        activateDialogFocus(
            modal.querySelector('[role="dialog"]'),
            modal.querySelector('[data-action="close-welcome"]')
        );
        try { localStorage.setItem(STORAGE_KEYS.visited, 'true'); } catch (_) { }
    }
}

export function closeWelcomeModal() {
    const modal = document.getElementById('welcome-modal');
    if (!modal?.classList.contains('open')) return;
    deactivateDialogFocus(modal.querySelector('[role="dialog"]'));
    modal.classList.remove('open');
    if (!document.getElementById('modal')?.classList.contains('open')) {
        document.body.classList.remove('modal-open');
    }
    unlockBodyScroll();
}
