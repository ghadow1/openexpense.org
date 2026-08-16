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

// @ocr-deps @platform
// Keep browser-only OCR dependency pins in one place so index.html import maps,
// lazy imports, and docs can be reviewed together when mobile/desktop engines move.
export const OCR_CONFIG = {
    dependencies: {
        paddleOcr: '6.4.0',
        pdfjs: '6.2.108',
        peerImports: {
            onnxruntimeWeb: '1.27.0',
            ppuOcv: '4.0.0'
        },
        fontsourceInter: '5.3.0',
        tablerIcons: '3.46.0'
    },
    get ocrCdn() {
        return `https://cdn.jsdelivr.net/npm/ppu-paddle-ocr@${this.dependencies.paddleOcr}/web/index.js`;
    },
    get pdfCdn() {
        return `https://cdn.jsdelivr.net/npm/pdfjs-dist@${this.dependencies.pdfjs}/build/pdf.mjs`;
    },
    get pdfWorker() {
        return `https://cdn.jsdelivr.net/npm/pdfjs-dist@${this.dependencies.pdfjs}/build/pdf.worker.min.mjs`;
    },
    canvas: {
        minOcrSide: 1000,
        maxOcrSide: 2400,
        maxPdfPreviewSide: 2400,
        maxPdfScale: 2.5,
        imagePreviewQuality: 0.9,
        warmupSize: 64
    },
    pdf: {
        nativeTextMinChars: 12,
        nativeTextMinLines: 2
    },
    warmup: {
        idleTimeoutMs: 8000,
        fallbackDelayMs: 3000,
        minDeviceMemoryGb: 4,
        minHardwareConcurrency: 4,
        blockedEffectiveTypes: ['slow-2g', '2g']
    },
    tags: ['@ocr-deps', '@ocr-engine', '@ocr-pdf', '@ocr-pipeline', '@ocr-parse', '@ocr-ui', '@platform', '@perf']
};

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
