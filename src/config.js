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

export const PLATFORM_CONFIG = {
    breakpoints: {
        mobile: 640,
        cameraPreferred: 900,
        sidebarStack: 900,
        calendarCompact: 640,
        calendarNarrow: 820,
        calendarTablet: 980,
        desktopOcr: 1100
    },
    savePicker: {
        secureContextRequired: true
    },
    ocrWarmup: {
        idleTimeoutMs: 8000,
        fallbackDelayMs: 3000,
        skipEffectiveTypes: ['slow-2g']
    }
};

export const UI_TAGS = {
    actions: {
        closeWelcome: 'close-welcome',
        closeModal: 'close-modal',
        scanReceipt: 'scan-receipt',
        quickAddToday: 'quick-add-today'
    },
    ocrPreviewActions: {
        cancel: 'receipt-cancel',
        save: 'receipt-save-expense',
        saveAndScan: 'receipt-save-and-scan-another'
    }
};

export const OCR_CONFIG = {
    dependencies: {
        paddleOcrUrl: 'https://cdn.jsdelivr.net/npm/ppu-paddle-ocr@5.8.0/web/index.js',
        pdfJsUrl: 'https://cdn.jsdelivr.net/npm/pdfjs-dist@4.10.38/build/pdf.mjs',
        pdfWorkerUrl: 'https://cdn.jsdelivr.net/npm/pdfjs-dist@4.10.38/build/pdf.worker.min.mjs',
        peerImportMap: {
            'onnxruntime-web': 'https://cdn.jsdelivr.net/npm/onnxruntime-web@1.23.2/dist/ort.bundle.min.mjs',
            'ppu-ocv/canvas-web': 'https://cdn.jsdelivr.net/npm/ppu-ocv@3.2.2/index.canvas-web.js'
        }
    },
    engine: {
        recognitionStrategy: 'cross-line',
        extractedPdfConfidence: 0.95,
        lowConfidenceThreshold: 0.55,
        minExtractedPdfTextChars: 12,
        minExtractedPdfLines: 2,
        warmupCanvasSize: 64,
        warmupText: 'A'
    },
    canvasProfiles: {
        mobile: { minSide: 900, maxSide: 1800 },
        default: { minSide: 1000, maxSide: 2400 },
        desktop: { minSide: 1200, maxSide: 2800 }
    },
    pdf: {
        maxScale: 2.5,
        previewJpegQuality: 0.9
    },
    progress: {
        loadingEngine: 'Loading OCR engine...',
        downloadingModels: 'Downloading models (first scan only)...',
        warmingUp: 'Warming up...',
        ready: 'Ready',
        loadingPdf: 'Loading PDF...',
        readingPdfPage: (pageNum) => `Reading PDF page ${pageNum}...`,
        renderingPreview: 'Rendering preview...',
        readingText: 'Reading text...',
        done: 'Done',
        cacheNote: 'First scan downloads models (~5 MB OCR, PDF reader on demand), then caches locally.'
    },
    normalization: {
        lineReplacements: [
            [/\bzooml\b/gi, 'Zoom'],
            [/(\d)[|lI](\d{2})\b/g, '$1.$2']
        ],
        textReplacements: [
            [/\bzooml\b/gi, 'Zoom Communications'],
            [/zoom\s*c[o0]mmunications/gi, 'Zoom Communications']
        ]
    },
    merchantAliases: [
        [/zoom\s+communications?,?\s*inc\.?/i, 'Zoom Communications, Inc.'],
        [/\bzoom[l1i]?\b/i, 'Zoom Communications, Inc.'],
        [/amazon\.?\s*com/i, 'Amazon'],
        [/whole\s*foods/i, 'Whole Foods'],
        [/costco\s*wholesale/i, 'Costco'],
        [/target\s*(store|corp)?/i, 'Target'],
        [/walmart/i, 'Walmart'],
        [/starbucks/i, 'Starbucks']
    ]
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
