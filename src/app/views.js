/**
 * OpenExpense — view switching
 *
 * Toggles the two top-level panes: Expenses (`#view-app`) and
 * Privacy & Help (`#view-docs`). Also owns the first-visit welcome modal.
 */
import { STORAGE_KEYS } from '../config.js';
import { lockBodyScroll, unlockBodyScroll } from '../ui/scroll-lock.js';
import { render } from './render.js';

export function switchView(viewName) {
    const appView = document.getElementById('view-app');
    const docsView = document.getElementById('view-docs');
    const tabApp = document.getElementById('vt-app');
    const tabDocs = document.getElementById('vt-docs');

    if (viewName === 'app') {
        if (appView) appView.classList.remove('hidden');
        if (docsView) docsView.classList.add('hidden');
        if (tabApp) tabApp.classList.add('active');
        if (tabDocs) tabDocs.classList.remove('active');
        render();
    } else {
        if (appView) appView.classList.add('hidden');
        if (docsView) docsView.classList.remove('hidden');
        if (tabApp) tabApp.classList.remove('active');
        if (tabDocs) tabDocs.classList.add('active');
    }

    window.scrollTo(0, 0);
}

export function switchDocTab(tabName) {
    document.querySelectorAll('.docs-pane').forEach(p => p.classList.remove('active'));
    document.querySelectorAll('.docs-nav-tab').forEach(t => t.classList.remove('active'));
    document.getElementById(`pane-${tabName}`)?.classList.add('active');
    document.getElementById(`dt-${tabName}`)?.classList.add('active');
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
