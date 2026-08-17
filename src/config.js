/**
 * OpenExpense — shared constants
 *
 * Calendar labels, version string, localStorage preference keys, and the
 * light/dark token maps consumed by theme.js and the PDF exporter.
 */
export const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

export const CONFIG = {
    version: "Version 2.2.0",
    buildEnv: "Production",
    defaultTheme: "light"
};

// localStorage only holds non-sensitive UI preferences. The ledger itself
// (including its name) lives encrypted in IndexedDB (see core/persist.js +
// core/crypto.js), never in plaintext localStorage.
export const STORAGE_KEYS = {
    theme: 'oe-theme',
    visited: 'hasVisited',
    autosave: 'oe-autosave',
    ledgerFace: 'oe-ledger-face',
    dashView: 'oe-dash-view'
};

export const THEMES = {
    light: {
        bg: '#ffffff', surface: '#ffffff', surface2: '#f0f4f8',
        border: '#c5d0dc', borderStrong: '#8fa3b8',
        text: '#2d3748', text2: '#64748b', textMuted: '#94a3b8', textStrong: '#1a202c',
        accent: '#1170cf', accentHover: '#0a4d9a',
        btnBg: '#ffffff', btnText: '#1a202c', btnBorder: '#d0d7e2',
        inputBg: '#ffffff', inputBorder: '#d0d7e2',
        dayBg: '#ffffff', dayBorder: '#e8edf3',
        overlay: 'rgba(0, 34, 68, 0.46)',
        pillBg: '#e8f1fb', pillText: '#0a4d9a', pillBorder: '#b6d4f0',
        dangerBg: '#fef2f2', dangerText: '#b91c1c', dangerBorder: '#fca5a5',
        shadowSm: 'none',
        shadowHover: 'transparent',
        success: '#16a34a',
        income: '#059669',
        incomeSoft: 'rgba(5, 150, 105, 0.12)',
        incomeText: '#047857',
        incomeBorder: '#6ee7b7',
        accentRing: 'rgba(17, 112, 207, 0.24)', thumbBg: '#ffffff',
        modalShadow: '0 0 0 1px #c5d0dc',
        glass: '#ffffff',
        glassBorder: '#c5d0dc',
        accentSoft: 'rgba(17, 112, 207, 0.10)',
        shadowMd: 'none',
        shadowLg: 'none',
        header: '#002244',
        headerText: '#ffffff'
    },
    dark: {
        bg: '#000000', surface: '#000000', surface2: '#0a0a0a',
        border: '#3a3a3a', borderStrong: '#6b6b6b',
        text: '#f5f5f5', text2: '#a3a3a3', textMuted: '#737373', textStrong: '#ffffff',
        accent: '#7dd3fc', accentHover: '#bae6fd',
        btnBg: '#000000', btnText: '#ffffff', btnBorder: '#3a3a3a',
        inputBg: '#000000', inputBorder: '#3a3a3a',
        dayBg: '#000000', dayBorder: '#2e2e2e',
        overlay: 'rgba(0, 0, 0, 0.78)',
        pillBg: '#111111', pillText: '#e8ff4d', pillBorder: '#3a3a3a',
        dangerBg: '#1a0a0a', dangerText: '#fda4af', dangerBorder: '#7f1d1d',
        shadowSm: 'none',
        shadowHover: 'transparent',
        success: '#c6f135',
        income: '#c6f135',
        incomeSoft: 'rgba(198, 241, 53, 0.12)',
        incomeText: '#e8ff4d',
        incomeBorder: '#84994a',
        accentRing: 'rgba(125, 211, 252, 0.28)', thumbBg: '#111111',
        modalShadow: '0 0 0 1px #3a3a3a',
        glass: '#000000',
        glassBorder: '#3a3a3a',
        accentSoft: 'rgba(125, 211, 252, 0.12)',
        shadowMd: 'none',
        shadowLg: 'none',
        header: '#000000',
        headerText: '#ffffff'
    }
};
