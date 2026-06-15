import { STORAGE_KEYS } from '../config.js';
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
        try { localStorage.setItem(STORAGE_KEYS.visited, 'true'); } catch (_) { }
    }
}

export function closeWelcomeModal() {
    document.getElementById('welcome-modal')?.classList.remove('open');
}
