export const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

export const CONFIG = {
    version: "Version 2.1.0",
    buildEnv: "Production",
    defaultTheme: "light"
};

/**
 * @module openexpense/config
 * Shared, human-readable tags for major capability surfaces.
 *
 * These labels are intentionally plain English so UI copy, logs, docs, and
 * contributor comments can refer to the same concepts without guessing what a
 * hard-coded number or CDN URL means.
 */
export const UI_TAGS = {
    receiptOcr: 'Receipt OCR',
    pdfReader: 'PDF reader',
    mobileCamera: 'Mobile camera capture',
    desktopSavePicker: 'Desktop save picker',
    mobileShareSheet: 'Mobile share sheet',
    offlinePrivate: 'Offline private processing'
};

/**
 * Client-only OCR and receipt parsing configuration.
 *
 * Dependency pins mirror the import map in index.html for bare-specifier peer
 * dependencies. Keep those peer versions in sync when updating OCR tech.
 */
export const OCR_CONFIG = {
    dependencies: {
        paddleOcr: 'https://cdn.jsdelivr.net/npm/ppu-paddle-ocr@5.8.0/web/index.js',
        pdfJs: 'https://cdn.jsdelivr.net/npm/pdfjs-dist@4.10.38/build/pdf.mjs',
        pdfWorker: 'https://cdn.jsdelivr.net/npm/pdfjs-dist@4.10.38/build/pdf.worker.min.mjs',
        peerImportMap: {
            onnxruntimeWeb: 'https://cdn.jsdelivr.net/npm/onnxruntime-web@1.23.2/dist/ort.bundle.min.mjs',
            opencvCanvas: 'https://cdn.jsdelivr.net/npm/ppu-ocv@3.2.2/index.canvas-web.js'
        }
    },
    canvas: {
        minSide: 1000,
        maxSide: 2400,
        pdfMaxScale: 2.5,
        warmupSide: 64
    },
    progress: {
        loadingEngine: { label: 'Loading OCR engine...', value: 0.08 },
        downloadingModels: { label: 'Downloading models (first scan only)...', value: 0.2 },
        warmingUp: { label: 'Warming up...', value: 0.88 },
        readingPdf: { label: 'Loading PDF...', value: 0.25 },
        renderingPreview: { label: 'Rendering preview...', value: 0.55 },
        readingText: { label: 'Reading text...', value: 0.55 },
        ready: { label: 'Ready', value: 1 },
        done: { label: 'Done', value: 1 }
    },
    lowConfidenceThreshold: 0.55,
    firstScanNote: 'First scan downloads models (~5 MB OCR, PDF reader on demand), then caches locally.'
};

export const PLATFORM_CONFIG = {
    breakpoints: {
        mobile: 640,
        cameraPreferred: 900,
        tablet: 900,
        calendarCompact: 640,
        calendarNarrow: 820,
        calendarTablet: 980
    },
    ocrWarmup: {
        idleTimeoutMs: 8000,
        fallbackDelayMs: 3000
    },
    objectUrlRevokeDelayMs: 1000
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
