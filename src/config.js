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

/**
 * On-device OCR contract.
 *
 * The tag names are human-readable anchors used by docs and QC. Keep them near
 * the limits they explain so a mobile or desktop performance pass has one
 * place to review before touching the receipt pipeline.
 */
export const OCR_CONFIG = {
    tags: {
        deps: '@ocr-deps',
        engine: '@ocr-engine',
        pdf: '@ocr-pdf',
        pipeline: '@ocr-pipeline',
        parse: '@ocr-parse',
        platform: '@platform',
        perf: '@perf'
    },
    assets: {
        pdfWorker: '/vendor/pdfjs/pdf.worker.min.mjs',
        wasm: '/vendor/ort/',
        detection: '/vendor/ocr-models/PP-OCRv6_tiny_det.ort',
        recognition: '/vendor/ocr-models/PP-OCRv6_tiny_rec.ort',
        dictionary: '/vendor/ocr-models/ppocrv6_tiny_dict.txt'
    },
    input: {
        maxFileBytes: 15 * 1024 * 1024
    },
    pdf: {
        maxPages: 20,
        maxExtractedLines: 5000,
        maxExtractedChars: 250000,
        previewMaxSide: 2400,
        previewMaxScale: 2.5,
        previewQuality: 0.92
    },
    image: {
        minSide: 1200,
        maxSideMobile: 2200,
        maxSideDesktop: 2600,
        enhancementMaxPixels: 1_800_000,
        bitmapOptions: { imageOrientation: 'from-image' }
    },
    runtime: {
        executionProviders: ['wasm'],
        recognitionStrategy: 'cross-line',
        mobileMaxThreads: 1,
        desktopMaxThreads: 4,
        minimumThreadedCores: 3
    },
    scoring: {
        highConfidence: 28,
        usableConfidence: 22,
        firstPassMinLines: 4,
        retryMinLines: 3,
        confidenceWeight: 40,
        letterWeight: 0.15,
        lineWeight: 2,
        moneyWeight: 8
    }
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
