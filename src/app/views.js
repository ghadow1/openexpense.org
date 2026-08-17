/**
 * OpenExpense — view switching
 *
 * Toggles the two top-level panes: Expenses (`#view-app`) and
 * Privacy & Help (`#view-docs`). Also owns the first-visit welcome modal.
 */
import { STORAGE_KEYS } from '../config.js';
import { lockBodyScroll, unlockBodyScroll } from '../ui/scroll-lock.js';
import { render } from './render.js';
import { shouldShowNotFound } from '../core/routes.js';

export { shouldShowNotFound };

const KNOWN_VIEWS = new Set(['app', 'docs']);

export function switchView(viewName) {
    if (!KNOWN_VIEWS.has(viewName)) return;

    const appView = document.getElementById('view-app');
    const docsView = document.getElementById('view-docs');
    const tabApp = document.getElementById('vt-app');
    const tabDocs = document.getElementById('vt-docs');

    if (viewName === 'app') {
        if (appView) appView.classList.remove('hidden');
        if (docsView) docsView.classList.add('hidden');
        if (tabApp) {
            tabApp.classList.add('active');
            tabApp.setAttribute('aria-current', 'page');
        }
        if (tabDocs) {
            tabDocs.classList.remove('active');
            tabDocs.removeAttribute('aria-current');
        }
        render();
    } else {
        if (appView) appView.classList.add('hidden');
        if (docsView) docsView.classList.remove('hidden');
        if (tabApp) {
            tabApp.classList.remove('active');
            tabApp.removeAttribute('aria-current');
        }
        if (tabDocs) {
            tabDocs.classList.add('active');
            tabDocs.setAttribute('aria-current', 'page');
        }
    }

    window.scrollTo(0, 0);
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
