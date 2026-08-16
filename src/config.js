export const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

export const CONFIG = {
    version: "Version 2.1.0",
    buildEnv: "Production",
    defaultTheme: "light"
};

// @ocr-deps @platform @perf
// Central OCR resource contract. Keep these CDN pins and thresholds in sync
// with index.html and docs/OCR-PERFORMANCE.md when changing the scanner.
export const OCR_CONFIG = {
    tags: [
        '@ocr-deps',
        '@ocr-engine',
        '@ocr-pdf',
        '@ocr-pipeline',
        '@ocr-parse',
        '@ocr-ui',
        '@platform',
        '@perf'
    ],
    dependencies: {
        engineLabel: 'PP-OCRv5',
        engineVersion: '6.4.0',
        ocrCdn: 'https://cdn.jsdelivr.net/npm/ppu-paddle-ocr@6.4.0/web/index.js',
        pdfjsVersion: '6.2.108',
        pdfCdn: 'https://cdn.jsdelivr.net/npm/pdfjs-dist@6.2.108/build/pdf.mjs',
        pdfWorker: 'https://cdn.jsdelivr.net/npm/pdfjs-dist@6.2.108/build/pdf.worker.min.mjs',
        peerImports: {
            onnxruntimeWeb: 'https://cdn.jsdelivr.net/npm/onnxruntime-web@1.27.0/dist/ort.bundle.min.mjs',
            ppuOcvCanvasWeb: 'https://cdn.jsdelivr.net/npm/ppu-ocv@4.0.0/index.canvas-web.js'
        }
    },
    image: {
        minSide: 1000,
        maxSide: 2400,
        pdfMaxScale: 2.5,
        previewQuality: 0.88
    },
    pdf: {
        extractedTextMinChars: 12,
        extractedTextMinLines: 2
    },
    warmup: {
        idleTimeoutMs: 8000,
        fallbackDelayMs: 3000,
        skipEffectiveTypes: ['slow-2g', '2g'],
        maxMobileDeviceMemoryGb: 2,
        probeCanvasSize: 64
    },
    engineOptions: {
        recognition: { strategy: 'cross-line' }
    }
};

// localStorage only holds non-sensitive UI preferences. The ledger itself
// (including its name) lives encrypted in IndexedDB (see core/persist.js +
// core/crypto.js), never in plaintext localStorage.
export const STORAGE_KEYS = { theme: 'oe-theme', visited: 'hasVisited', autosave: 'oe-autosave' };

export const THEMES = {
    light: {
        bg: '#f2f3f7', surface: '#ffffff', surface2: '#eef0f5',
        border: '#e4e7ee', borderStrong: '#cfd5e0',
        text: '#3d4654', text2: '#7a8494', textMuted: '#93a0b0', textStrong: '#111318',
        accent: '#4f46e5', accentHover: '#4338ca',
        btnBg: '#ffffff', btnText: '#3d4654', btnBorder: '#d0d5e0',
        inputBg: '#ffffff', inputBorder: '#d0d5e0',
        dayBg: '#ffffff', dayBorder: '#eceef3',
        overlay: 'rgba(15, 18, 28, 0.42)',
        pillBg: '#eef0ff', pillText: '#3730a3', pillBorder: '#c7d2fe',
        dangerBg: '#fef2f2', dangerText: '#b91c1c', dangerBorder: '#fca5a5',
        shadowSm: '0 1px 2px rgba(15, 18, 28, 0.04), 0 0 0 1px rgba(15, 18, 28, 0.03)',
        shadowHover: 'rgba(15, 18, 28, 0.08)',
        success: '#16a34a',
        accentRing: 'rgba(79, 70, 229, 0.22)', thumbBg: '#ffffff',
        modalShadow: '0 28px 64px -16px rgba(15, 18, 28, 0.22), 0 0 0 1px rgba(15, 18, 28, 0.05)',
        glass: 'rgba(255, 255, 255, 0.72)',
        glassBorder: 'rgba(255, 255, 255, 0.55)',
        accentSoft: 'rgba(79, 70, 229, 0.10)',
        shadowMd: '0 10px 28px -14px rgba(15, 18, 28, 0.16), 0 0 0 1px rgba(15, 18, 28, 0.04)',
        shadowLg: '0 28px 56px -20px rgba(15, 18, 28, 0.22), 0 0 0 1px rgba(15, 18, 28, 0.05)'
    },
    dark: {
        bg: '#0b0c10', surface: '#14161c', surface2: '#1c1f28',
        border: '#2a2e38', borderStrong: '#3a3f4c',
        text: '#b6bac6', text2: '#7d8290', textMuted: '#5c6170', textStrong: '#f4f5f7',
        accent: '#818cf8', accentHover: '#a5b4fc',
        btnBg: '#14161c', btnText: '#e6e8ee', btnBorder: '#2a2e38',
        inputBg: '#14161c', inputBorder: '#2a2e38',
        dayBg: '#14161c', dayBorder: '#1c1f28',
        overlay: 'rgba(4, 5, 8, 0.68)',
        pillBg: '#1e1b4b', pillText: '#c7d2fe', pillBorder: '#3730a3',
        dangerBg: '#450a0a', dangerText: '#fca5a5', dangerBorder: '#7f1d1d',
        shadowSm: '0 1px 2px rgba(0, 0, 0, 0.35), 0 0 0 1px rgba(255, 255, 255, 0.03)',
        shadowHover: 'rgba(0, 0, 0, 0.35)',
        success: '#22c55e',
        accentRing: 'rgba(129, 140, 248, 0.28)', thumbBg: '#1c1f28',
        modalShadow: '0 32px 72px -18px rgba(0, 0, 0, 0.58), 0 0 0 1px rgba(255, 255, 255, 0.06)',
        glass: 'rgba(20, 22, 28, 0.72)',
        glassBorder: 'rgba(255, 255, 255, 0.08)',
        accentSoft: 'rgba(129, 140, 248, 0.14)',
        shadowMd: '0 12px 32px -16px rgba(0, 0, 0, 0.5), 0 0 0 1px rgba(255, 255, 255, 0.04)',
        shadowLg: '0 32px 64px -20px rgba(0, 0, 0, 0.58), 0 0 0 1px rgba(255, 255, 255, 0.06)'
    }
};
