/**
 * @module oe/config
 * @tag config:runtime
 * @tag ocr:platform-pins
 *
 * Keep user-facing runtime settings here so browser, mobile, and desktop
 * behavior can be audited without spelunking through feature modules.
 */

export const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

export const CONFIG = {
    version: "Version 2.1.0",
    buildEnv: "Production",
    defaultTheme: "light"
};

const OCR_VERSIONS = {
    paddleOcr: '5.8.3',
    onnxRuntimeWeb: '1.27.0',
    ppuOcv: '3.2.2',
    // PDF.js stays on the verified browser module path used by this static app.
    pdfjsDist: '4.10.38'
};

export const OCR_CONFIG = {
    versions: OCR_VERSIONS,
    urls: {
        paddleOcr: `https://cdn.jsdelivr.net/npm/ppu-paddle-ocr@${OCR_VERSIONS.paddleOcr}/web/index.js`,
        onnxRuntimeWeb: `https://cdn.jsdelivr.net/npm/onnxruntime-web@${OCR_VERSIONS.onnxRuntimeWeb}/dist/ort.bundle.min.mjs`,
        ppuOcvCanvas: `https://cdn.jsdelivr.net/npm/ppu-ocv@${OCR_VERSIONS.ppuOcv}/index.canvas-web.js`,
        pdfjs: `https://cdn.jsdelivr.net/npm/pdfjs-dist@${OCR_VERSIONS.pdfjsDist}/build/pdf.mjs`,
        pdfWorker: `https://cdn.jsdelivr.net/npm/pdfjs-dist@${OCR_VERSIONS.pdfjsDist}/build/pdf.worker.min.mjs`
    },
    image: {
        minSide: 1000,
        maxSide: {
            mobile: 1600,
            tablet: 2000,
            desktop: 2400
        },
        pdfScaleCap: 2.5,
        previewQuality: {
            mobile: 0.82,
            tablet: 0.86,
            desktop: 0.9
        }
    },
    warmup: {
        idleTimeoutMs: 8000,
        mobileDelayMs: 4500,
        skipIdleWhenDeviceMemoryAtOrBelowGB: 4
    }
};

// localStorage only holds non-sensitive UI preferences. The ledger itself
// (including its name) lives encrypted in IndexedDB (see core/persist.js +
// core/crypto.js), never in plaintext localStorage.
export const STORAGE_KEYS = { theme: 'oe-theme', visited: 'hasVisited', autosave: 'oe-autosave' };

export const THEMES = {
    light: {
        bg: '#f9f9fb', surface: '#ffffff', surface2: '#f1f5f9',
        border: '#e2e8f0', borderStrong: '#cbd5e1',
        text: '#334155', text2: '#94a3b8', textMuted: '#94a3b8', textStrong: '#0f172a',
        accent: '#6366f1', accentHover: '#1d4ed8',
        btnBg: '#ffffff', btnText: '#334155', btnBorder: '#cbd5e1',
        inputBg: '#ffffff', inputBorder: '#cbd5e1',
        dayBg: '#ffffff', dayBorder: '#efeff2',
        overlay: 'rgba(15, 23, 42, 0.4)',
        pillBg: '#f1f5f9', pillText: '#1e40af', pillBorder: '#bfdbfe',
        dangerBg: '#fef2f2', dangerText: '#b91c1c', dangerBorder: '#fca5a5',
        shadowSm: '0 1px 2px 0 rgba(0, 0, 0, 0.05)', shadowHover: 'rgba(15, 23, 42, 0.03)', success: '#16a34a',
        accentRing: 'rgba(99, 102, 241, 0.22)', thumbBg: '#ffffff',
        modalShadow: '0 24px 48px -12px rgba(15, 23, 42, 0.18), 0 0 0 1px rgba(15, 23, 42, 0.04)'
    },
    dark: {
        bg: '#09090b', surface: '#18181b', surface2: '#27272a',
        border: '#3f3f46', borderStrong: '#52525b',
        text: '#a1a1aa', text2: '#71717a', textMuted: '#52525b', textStrong: '#fafafa',
        accent: '#3b82f6', accentHover: '#60a5fa',
        btnBg: '#18181b', btnText: '#e4e4e7', btnBorder: '#3f3f46',
        inputBg: '#18181b', inputBorder: '#3f3f46',
        dayBg: '#18181b', dayBorder: '#27272a',
        overlay: 'rgba(0, 0, 0, 0.65)',
        pillBg: '#1e3a8a', pillText: '#bfdbfe', pillBorder: '#1e40af',
        dangerBg: '#450a0a', dangerText: '#fca5a5', dangerBorder: '#7f1d1d',
        shadowSm: '0 1px 2px 0 rgba(0, 0, 0, 0.4)', shadowHover: 'rgba(0, 0, 0, 0.3)', success: '#22c55e',
        accentRing: 'rgba(59, 130, 246, 0.28)', thumbBg: '#27272a',
        modalShadow: '0 24px 64px -16px rgba(0, 0, 0, 0.55), 0 0 0 1px rgba(255, 255, 255, 0.06)'
    }
};
