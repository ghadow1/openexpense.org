import { STORAGE_KEYS } from '../config.js';
import { getState, patch, getColors } from '../core/store.js';

export function applyTheme() {
    const c = getColors();
    const root = document.documentElement;
    const { isDark } = getState();

    root.dataset.theme = isDark ? 'dark' : 'light';
    document.body.style.background = c.bg;

    Object.keys(c).forEach(k => root.style.setProperty(`--${k.replace(/[A-Z]/g, m => "-" + m.toLowerCase())}`, c[k]));
    root.style.setProperty('--day-bg', c.dayBg);
    root.style.setProperty('--day-border', c.dayBorder);
    root.style.setProperty('--pill-bg', c.pillBg);
    root.style.setProperty('--accent-ring', c.accentRing);
    root.style.setProperty('--thumb-bg', c.thumbBg);
    root.style.setProperty('--modal-shadow', c.modalShadow);
}

export function setTheme(isDark) {
    patch({ isDark });
    try { localStorage.setItem(STORAGE_KEYS.theme, isDark ? 'dark' : 'light'); } catch (_) { }
}
