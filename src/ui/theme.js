/**
 * OpenExpense — theme application
 *
 * Writes THEMES tokens onto :root CSS variables and persists the choice.
 * Professional (light) is the navy banking skin. Black Card is the OLED swap.
 */
import { STORAGE_KEYS, THEME_FACES } from '../config.js';
import { getState, patch, getColors } from '../core/store.js';

export function themeFace(isDark = getState().isDark) {
    return isDark ? THEME_FACES.dark : THEME_FACES.light;
}

export function applyTheme() {
    const c = getColors();
    const root = document.documentElement;
    const { isDark } = getState();
    const face = themeFace(isDark);

    root.dataset.theme = isDark ? 'dark' : 'light';
    root.dataset.themeFace = face.id;

    Object.keys(c).forEach(k => root.style.setProperty(`--${k.replace(/[A-Z]/g, m => "-" + m.toLowerCase())}`, c[k]));
    root.style.setProperty('--day-bg', c.dayBg);
    root.style.setProperty('--day-border', c.dayBorder);
    root.style.setProperty('--pill-bg', c.pillBg);
    root.style.setProperty('--accent-ring', c.accentRing);
    root.style.setProperty('--thumb-bg', c.thumbBg);
    root.style.setProperty('--modal-shadow', c.modalShadow);

    const metas = document.querySelectorAll('meta[name="theme-color"]');
    if (!metas.length) {
        const meta = document.createElement('meta');
        meta.name = 'theme-color';
        document.head.appendChild(meta);
        meta.content = c.header || c.bg;
    } else {
        metas.forEach((meta) => { meta.content = c.header || c.bg; });
    }
}

export function setTheme(isDark) {
    patch({ isDark });
    try { localStorage.setItem(STORAGE_KEYS.theme, isDark ? 'dark' : 'light'); } catch (_) { }
}
