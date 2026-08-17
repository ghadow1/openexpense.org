/**
 * OpenExpense — shared constants
 *
 * Calendar labels, version string, localStorage preference keys, and the
 * light/dark token maps consumed by theme.js and the PDF exporter.
 */
export const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

export const CONFIG = {
    version: "Version 2.1.0",
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
    ledgerFace: 'oe-ledger-face'
};

export const THEMES = {
    light: {
        bg: '#f4f6f9', surface: '#ffffff', surface2: '#eef2f6',
        border: '#e2e8f0', borderStrong: '#cbd5e1',
        text: '#2d3748', text2: '#64748b', textMuted: '#94a3b8', textStrong: '#1a202c',
        accent: '#1170cf', accentHover: '#0a4d9a',
        btnBg: '#ffffff', btnText: '#1a202c', btnBorder: '#d0d7e2',
        inputBg: '#ffffff', inputBorder: '#d0d7e2',
        dayBg: '#ffffff', dayBorder: '#e8edf3',
        overlay: 'rgba(0, 34, 68, 0.46)',
        pillBg: '#e8f1fb', pillText: '#0a4d9a', pillBorder: '#b6d4f0',
        dangerBg: '#fef2f2', dangerText: '#b91c1c', dangerBorder: '#fca5a5',
        shadowSm: '0 1px 2px rgba(0, 34, 68, 0.05), 0 0 0 1px rgba(0, 34, 68, 0.04)',
        shadowHover: 'rgba(0, 34, 68, 0.08)',
        success: '#16a34a',
        income: '#059669',
        incomeSoft: 'rgba(5, 150, 105, 0.12)',
        incomeText: '#047857',
        incomeBorder: '#6ee7b7',
        accentRing: 'rgba(17, 112, 207, 0.24)', thumbBg: '#ffffff',
        modalShadow: '0 20px 48px -16px rgba(0, 34, 68, 0.22), 0 0 0 1px rgba(0, 34, 68, 0.06)',
        glass: '#ffffff',
        glassBorder: '#e2e8f0',
        accentSoft: 'rgba(17, 112, 207, 0.10)',
        shadowMd: '0 2px 8px rgba(0, 34, 68, 0.06), 0 0 0 1px rgba(0, 34, 68, 0.04)',
        shadowLg: '0 16px 40px -18px rgba(0, 34, 68, 0.18), 0 0 0 1px rgba(0, 34, 68, 0.05)',
        header: '#002244',
        headerText: '#ffffff'
    },
    dark: {
        bg: '#0b0f19', surface: '#131b2e', surface2: '#1e293b',
        border: '#334155', borderStrong: '#475569',
        text: '#e2e8f0', text2: '#94a3b8', textMuted: '#64748b', textStrong: '#f8fafc',
        accent: '#3b82f6', accentHover: '#60a5fa',
        btnBg: '#131b2e', btnText: '#f8fafc', btnBorder: '#334155',
        inputBg: '#131b2e', inputBorder: '#334155',
        dayBg: '#131b2e', dayBorder: '#1e293b',
        overlay: 'rgba(2, 6, 16, 0.72)',
        pillBg: '#1e3a5f', pillText: '#93c5fd', pillBorder: '#1d4ed8',
        dangerBg: '#450a0a', dangerText: '#fca5a5', dangerBorder: '#7f1d1d',
        shadowSm: '0 1px 2px rgba(0, 0, 0, 0.35), 0 0 0 1px rgba(255, 255, 255, 0.04)',
        shadowHover: 'rgba(0, 0, 0, 0.4)',
        success: '#22c55e',
        income: '#34d399',
        incomeSoft: 'rgba(52, 211, 153, 0.14)',
        incomeText: '#6ee7b7',
        incomeBorder: '#059669',
        accentRing: 'rgba(59, 130, 246, 0.32)', thumbBg: '#1e293b',
        modalShadow: '0 24px 56px -16px rgba(0, 0, 0, 0.55), 0 0 0 1px rgba(255, 255, 255, 0.05)',
        glass: '#131b2e',
        glassBorder: '#334155',
        accentSoft: 'rgba(59, 130, 246, 0.16)',
        shadowMd: '0 2px 10px rgba(0, 0, 0, 0.35), 0 0 0 1px rgba(255, 255, 255, 0.04)',
        shadowLg: '0 20px 48px -16px rgba(0, 0, 0, 0.55), 0 0 0 1px rgba(255, 255, 255, 0.05)',
        header: '#081c38',
        headerText: '#f8fafc'
    }
};
