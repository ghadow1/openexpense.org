export const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

export const CONFIG = {
    version: "Version 2.1.0",
    buildEnv: "Production",
    defaultTheme: "light"
};

// OE-PLATFORM: Shared breakpoints keep mobile, tablet, and desktop behavior
// aligned across JS modules instead of scattering magic viewport numbers.
export const BREAKPOINTS = {
    mobile: 640,
    cameraHint: 900,
    tablet: 900,
    calendarCompact: 640,
    calendarNarrow: 820,
    calendarTablet: 980
};

// OE-OCR: Centralized receipt-scanning constants. Keep the peer import URLs in
// index.html's import map in sync with dependencies.peerImports.
export const OCR_CONFIG = {
    dependencies: {
        ocrModule: 'https://cdn.jsdelivr.net/npm/ppu-paddle-ocr@5.8.0/web/index.js',
        pdfModule: 'https://cdn.jsdelivr.net/npm/pdfjs-dist@4.10.38/build/pdf.mjs',
        pdfWorker: 'https://cdn.jsdelivr.net/npm/pdfjs-dist@4.10.38/build/pdf.worker.min.mjs',
        peerImports: {
            'onnxruntime-web': 'https://cdn.jsdelivr.net/npm/onnxruntime-web@1.23.2/dist/ort.bundle.min.mjs',
            'ppu-ocv/canvas-web': 'https://cdn.jsdelivr.net/npm/ppu-ocv@3.2.2/index.canvas-web.js'
        }
    },
    engineOptions: {
        recognition: { strategy: 'cross-line' }
    },
    progress: {
        loadEngine: ['Loading OCR engine…', 0.08],
        downloadModels: ['Downloading models (first scan only)…', 0.2],
        warmup: ['Warming up…', 0.88],
        ready: ['Ready', 1],
        loadPdf: ['Loading PDF…', 0.25],
        renderPreview: ['Rendering preview…', 0.55],
        readText: ['Reading text…', 0.55],
        done: ['Done', 1],
        cacheNote: 'First scan downloads OCR/PDF assets, then your browser caches them for later scans.'
    },
    warmup: {
        canvasSize: 64,
        idleTimeoutMs: 8000,
        fallbackDelayMs: 3000,
        minDeviceMemoryGb: 3,
        skipEffectiveTypes: ['slow-2g', '2g']
    },
    canvas: {
        mobile: { minSide: 900, maxSide: 1800 },
        tablet: { minSide: 1000, maxSide: 2200 },
        desktop: { minSide: 1100, maxSide: 2400 }
    },
    pdf: {
        maxPreviewScale: 2.5,
        previewMaxSide: 2400,
        previewQuality: 0.9,
        extractedTextMinChars: 12,
        extractedTextMinLines: 2
    },
    confidence: {
        low: 0.55,
        extractedPdfText: 0.95
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
