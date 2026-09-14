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

/**
 * @ocr-deps @ocr-pipeline @platform @perf
 * Receipt OCR configuration lives here so mobile/desktop resource choices are
 * reviewable without reading the full scanner. Keep tag names human-readable:
 * docs/OCR-PERFORMANCE.md explains where each tag is used.
 */
export const OCR_CONFIG = {
    codeTags: {
        '@ocr-deps': 'same-origin OCR, ONNX, PDF.js, WASM, and model assets',
        '@ocr-engine': 'lazy OCR runtime initialization and warmup',
        '@ocr-pdf': 'PDF text extraction, preview, and OCR fallback',
        '@ocr-pipeline': 'image preparation, recognition, parsing, and review',
        '@ocr-parse': 'merchant, date, total, tax, and item heuristics',
        '@ocr-ui': 'scan progress, review sheet, and user confirmation',
        '@platform': 'mobile, tablet, desktop, and browser capability branches',
        '@perf': 'bounded memory, CPU, canvas, and startup costs'
    },
    dependencies: {
        ocr: 'ppu-paddle-ocr',
        runtime: 'onnxruntime-web',
        pdf: 'pdfjs-dist'
    },
    assets: {
        pdfWorker: '/vendor/pdfjs/pdf.worker.min.mjs',
        wasmPath: '/vendor/ort/',
        models: {
            detection: '/vendor/ocr-models/PP-OCRv6_tiny_det.ort',
            recognition: '/vendor/ocr-models/PP-OCRv6_tiny_rec.ort',
            dictionary: '/vendor/ocr-models/ppocrv6_tiny_dict.txt'
        }
    },
    limits: {
        maxFileBytes: 15 * 1024 * 1024,
        maxPdfPages: 20,
        maxExtractedLines: 5000,
        maxExtractedChars: 250000
    },
    runtime: {
        mobileThreads: 1,
        desktopThreads: 2,
        maxThreads: 4,
        lowMemoryGB: 4,
        lowCoreCount: 2,
        slowConnectionTypes: ['slow-2g', '2g']
    },
    image: {
        minSide: 1200,
        maxSide: 2600,
        enhancementMaxPixels: 1800000,
        binaryLightThreshold: 168,
        binaryDarkThreshold: 96
    },
    pdf: {
        previewMaxSide: 2400,
        previewMaxScale: 2.5,
        previewJpegQuality: 0.92,
        extractedTextConfidence: 0.95,
        fallbackTextConfidence: 0.9
    },
    scoring: {
        goodScore: 28,
        goodLines: 4,
        usableScore: 22,
        usableLines: 3,
        confidenceWeight: 40,
        letterWeight: 0.15,
        lineWeight: 2,
        moneyWeight: 8
    }
};

/** User-facing theme names. Storage still uses light / dark. */
export const THEME_FACES = {
    light: { id: 'professional', label: 'Professional', nextLabel: 'Black Card', nextIcon: 'credit-card' },
    dark: { id: 'black-card', label: 'Black Card', nextLabel: 'Professional', nextIcon: 'briefcase' }
};

// localStorage only holds non-sensitive UI preferences. The ledger itself
// (including its name) lives encrypted in IndexedDB (see core/persist.js +
// core/crypto.js), never in plaintext localStorage.
// These string values are frozen — existing browsers already store them.
export const STORAGE_KEYS = {
    theme: 'oe-theme',
    visited: 'hasVisited',
    autosave: 'oe-autosave',
    ledgerFace: 'oe-ledger-face',
    dashView: 'oe-dash-view',
    shellTab: 'oe-shell-tab',
    trackerFilter: 'oe-tracker-filter',
    // Whether exports ask for a passphrase. Only the choice is stored here,
    // never the passphrase itself.
    exportPassphrase: 'oe-export-passphrase'
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
        success: '#1170cf',
        income: '#1170cf',
        incomeSoft: 'rgba(17, 112, 207, 0.12)',
        incomeText: '#0a4d9a',
        incomeBorder: '#b6d4f0',
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
    // Black Card is monochrome: black, greys, white and nothing else. Meaning
    // that colour used to carry — accent, income, danger — is carried by
    // brightness instead, so the scale from #737373 to #ffffff is doing real
    // work here and the steps in it should not be flattened.
    dark: {
        bg: '#000000', surface: '#000000', surface2: '#0a0a0a',
        border: '#3a3a3a', borderStrong: '#6b6b6b',
        text: '#f5f5f5', text2: '#a3a3a3', textMuted: '#737373', textStrong: '#ffffff',
        accent: '#ffffff', accentHover: '#d4d4d4',
        btnBg: '#000000', btnText: '#ffffff', btnBorder: '#3a3a3a',
        inputBg: '#000000', inputBorder: '#3a3a3a',
        dayBg: '#000000', dayBorder: '#2e2e2e',
        overlay: 'rgba(0, 0, 0, 0.78)',
        pillBg: '#111111', pillText: '#f5f5f5', pillBorder: '#3a3a3a',
        // Danger has no red to lean on, so it reads through a brighter border
        // and the brightest text in the palette.
        dangerBg: '#141414', dangerText: '#ffffff', dangerBorder: '#8a8a8a',
        shadowSm: 'none',
        shadowHover: 'transparent',
        success: '#ffffff',
        income: '#ffffff',
        incomeSoft: 'rgba(255, 255, 255, 0.12)',
        incomeText: '#ffffff',
        incomeBorder: '#6b6b6b',
        accentRing: 'rgba(255, 255, 255, 0.28)', thumbBg: '#111111',
        modalShadow: '0 0 0 1px #3a3a3a',
        glass: '#000000',
        glassBorder: '#3a3a3a',
        accentSoft: 'rgba(255, 255, 255, 0.12)',
        shadowMd: 'none',
        shadowLg: 'none',
        header: '#000000',
        headerText: '#ffffff'
    }
};
