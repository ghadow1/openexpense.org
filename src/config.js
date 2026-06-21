export const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

export const CONFIG = {
    version: "Version 2.1.0",
    buildEnv: "Production",
    defaultTheme: "light"
};

// localStorage only holds non-sensitive UI preferences. The ledger itself
// (including its name) lives encrypted in IndexedDB (see core/persist.js +
// core/crypto.js), never in plaintext localStorage.
export const STORAGE_KEYS = { theme: 'oe-theme', visited: 'hasVisited', autosave: 'oe-autosave' };

export const OCR_CONFIG = {
    runtime: {
        // OCR runs locally in the browser. Keep these pins explicit so peer
        // dependencies in index.html and the lazy imports stay in sync.
        engineUrl: 'https://cdn.jsdelivr.net/npm/ppu-paddle-ocr@5.8.0/web/index.js',
        pdfUrl: 'https://cdn.jsdelivr.net/npm/pdfjs-dist@4.10.38/build/pdf.mjs',
        pdfWorkerUrl: 'https://cdn.jsdelivr.net/npm/pdfjs-dist@4.10.38/build/pdf.worker.min.mjs',
        recognition: { strategy: 'cross-line' }
    },
    canvas: {
        minSide: 1000,
        desktopMaxSide: 2600,
        mobileMaxSide: 1800,
        constrainedMaxSide: 1400,
        pdfPreviewMaxSide: 2400,
        pdfPreviewMaxScale: 2.5,
        jpegPreviewQuality: 0.9
    },
    warmup: {
        idleTimeoutMs: 8000,
        fallbackDelayMs: 3000,
        sampleSize: 64
    },
    progress: {
        loadEngine: ['Loading OCR engine...', 0.08],
        downloadModels: ['Downloading models (first scan only)...', 0.2],
        warmup: ['Warming up...', 0.88],
        readText: ['Reading text...', 0.55],
        pdfLoad: ['Loading PDF...', 0.25],
        pdfRenderPreview: ['Rendering preview...', 0.55],
        ready: ['Ready', 1],
        done: ['Done', 1]
    },
    codeTags: {
        scanInput: 'receipt.scan-input',
        quickScanButton: 'receipt.quick-scan',
        progressDialog: 'ocr.progress-dialog',
        reviewDialog: 'ocr.review-dialog',
        reviewMerchant: 'ocr.review.merchant',
        reviewAmount: 'ocr.review.amount',
        reviewDate: 'ocr.review.date',
        reviewNotes: 'ocr.review.notes',
        reviewRawText: 'ocr.review.raw-text'
    }
};

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
