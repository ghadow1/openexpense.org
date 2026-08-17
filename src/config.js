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
        bg: '#f8fafc', surface: '#ffffff', surface2: '#f1f5f9',
        border: '#e2e8f0', borderStrong: '#cbd5e1',
        text: '#334155', text2: '#64748b', textMuted: '#94a3b8', textStrong: '#0f172a',
        accent: '#059669', accentHover: '#047857',
        btnBg: '#ffffff', btnText: '#0f172a', btnBorder: '#e2e8f0',
        inputBg: '#ffffff', inputBorder: '#e2e8f0',
        dayBg: '#ffffff', dayBorder: '#e2e8f0',
        overlay: 'rgba(15, 23, 42, 0.46)',
        pillBg: '#fff1f2', pillText: '#9f1239', pillBorder: '#fecdd3',
        dangerBg: '#fff1f2', dangerText: '#be123c', dangerBorder: '#fecdd3',
        shadowSm: '0 1px 2px rgba(15, 23, 42, 0.05), 0 0 0 1px rgba(15, 23, 42, 0.04)',
        shadowHover: 'rgba(15, 23, 42, 0.08)',
        success: '#059669',
        income: '#059669',
        incomeSoft: 'rgba(5, 150, 105, 0.12)',
        incomeText: '#047857',
        incomeBorder: '#6ee7b7',
        accentRing: 'rgba(5, 150, 105, 0.24)', thumbBg: '#ffffff',
        modalShadow: '0 20px 48px -16px rgba(15, 23, 42, 0.22), 0 0 0 1px rgba(15, 23, 42, 0.06)',
        glass: '#ffffff',
        glassBorder: '#e2e8f0',
        accentSoft: 'rgba(5, 150, 105, 0.10)',
        shadowMd: '0 2px 8px rgba(15, 23, 42, 0.06), 0 0 0 1px rgba(15, 23, 42, 0.04)',
        shadowLg: '0 16px 40px -18px rgba(15, 23, 42, 0.16), 0 0 0 1px rgba(15, 23, 42, 0.05)',
        header: '#0f172a',
        headerText: '#f8fafc'
    },
    dark: {
        bg: '#020617', surface: '#0f172a', surface2: '#1e293b',
        border: '#1e293b', borderStrong: '#334155',
        text: '#e2e8f0', text2: '#94a3b8', textMuted: '#64748b', textStrong: '#f8fafc',
        accent: '#34d399', accentHover: '#6ee7b7',
        btnBg: '#0f172a', btnText: '#f8fafc', btnBorder: '#1e293b',
        inputBg: '#0f172a', inputBorder: '#1e293b',
        dayBg: '#0f172a', dayBorder: '#1e293b',
        overlay: 'rgba(2, 6, 23, 0.72)',
        pillBg: '#3f1219', pillText: '#fda4af', pillBorder: '#881337',
        dangerBg: '#4c0519', dangerText: '#fda4af', dangerBorder: '#881337',
        shadowSm: '0 1px 2px rgba(0, 0, 0, 0.35), 0 0 0 1px rgba(255, 255, 255, 0.04)',
        shadowHover: 'rgba(0, 0, 0, 0.4)',
        success: '#34d399',
        income: '#34d399',
        incomeSoft: 'rgba(52, 211, 153, 0.14)',
        incomeText: '#6ee7b7',
        incomeBorder: '#059669',
        accentRing: 'rgba(52, 211, 153, 0.32)', thumbBg: '#1e293b',
        modalShadow: '0 24px 56px -16px rgba(0, 0, 0, 0.55), 0 0 0 1px rgba(255, 255, 255, 0.05)',
        glass: '#0f172a',
        glassBorder: '#1e293b',
        accentSoft: 'rgba(52, 211, 153, 0.16)',
        shadowMd: '0 2px 10px rgba(0, 0, 0, 0.35), 0 0 0 1px rgba(255, 255, 255, 0.04)',
        shadowLg: '0 20px 48px -16px rgba(0, 0, 0, 0.55), 0 0 0 1px rgba(255, 255, 255, 0.05)',
        header: '#020617',
        headerText: '#f8fafc'
    }
};
