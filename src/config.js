export const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

export const CONFIG = {
    version: "Version 2.1.0",
    buildEnv: "Production",
    defaultTheme: "light"
};

export const OCR_CONFIG = {
    dependencies: {
        // Keep these CDN pins aligned with the import map in index.html.
        paddleOcrCdn: 'https://cdn.jsdelivr.net/npm/ppu-paddle-ocr@5.8.0/web/index.js',
        pdfJsCdn: 'https://cdn.jsdelivr.net/npm/pdfjs-dist@4.10.38/build/pdf.mjs',
        pdfWorkerCdn: 'https://cdn.jsdelivr.net/npm/pdfjs-dist@4.10.38/build/pdf.worker.min.mjs',
        peerImportMap: {
            'onnxruntime-web': 'https://cdn.jsdelivr.net/npm/onnxruntime-web@1.23.2/dist/ort.bundle.min.mjs',
            'ppu-ocv/canvas-web': 'https://cdn.jsdelivr.net/npm/ppu-ocv@3.2.2/index.canvas-web.js'
        },
        modelDownloadNote: 'First scan downloads models (~5 MB OCR, PDF reader on demand), then caches locally.'
    },
    stages: {
        engineLoad: { tag: 'ocr.engine.load', label: 'Loading OCR engine...', progress: 0.08 },
        modelDownload: { tag: 'ocr.model.download', label: 'Downloading models (first scan only)...', progress: 0.2 },
        warmup: { tag: 'ocr.engine.warmup', label: 'Warming up...', progress: 0.88 },
        ready: { tag: 'ocr.engine.ready', label: 'Ready', progress: 1 },
        pdfLoad: { tag: 'ocr.pdf.load', label: 'Loading PDF...', progress: 0.25 },
        pdfText: { tag: 'ocr.pdf.text', label: 'Reading PDF page', progressStart: 0.25, progressEnd: 0.5 },
        pdfPreview: { tag: 'ocr.pdf.preview', label: 'Rendering preview...', progress: 0.55 },
        textRead: { tag: 'ocr.text.read', label: 'Reading text...', progress: 0.55 },
        done: { tag: 'ocr.done', label: 'Done', progress: 1 }
    },
    profiles: {
        mobile: {
            tag: 'ocr.profile.mobile',
            minSide: 900,
            maxSide: 1800,
            sourceMaxSide: 1800,
            pdfMaxSide: 1800,
            pdfScaleCap: 2,
            previewQuality: 0.82,
            idleWarmupDelayMs: 6000
        },
        default: {
            tag: 'ocr.profile.default',
            minSide: 1000,
            maxSide: 2400,
            sourceMaxSide: 2400,
            pdfMaxSide: 2400,
            pdfScaleCap: 2.5,
            previewQuality: 0.86,
            idleWarmupDelayMs: 3000
        },
        desktop: {
            tag: 'ocr.profile.desktop',
            minSide: 1200,
            maxSide: 3000,
            sourceMaxSide: 3000,
            pdfMaxSide: 3000,
            pdfScaleCap: 3,
            previewQuality: 0.9,
            idleWarmupDelayMs: 1500
        }
    },
    parsing: {
        lowConfidenceThreshold: 0.55,
        lineReplacements: [
            { tag: 'ocr.fix.zoom-lowercase-i', pattern: /\bzooml\b/gi, replacement: 'Zoom' },
            { tag: 'ocr.fix.decimal-bar', pattern: /(\d)[|lI](\d{2})\b/g, replacement: '$1.$2' }
        ],
        textReplacements: [
            { tag: 'ocr.fix.zoom-company', pattern: /\bzooml\b/gi, replacement: 'Zoom Communications' },
            { tag: 'ocr.fix.zoom-communications', pattern: /zoom\s*c[o0]mmunications/gi, replacement: 'Zoom Communications' }
        ],
        merchantAliases: [
            { tag: 'merchant.zoom-company', pattern: /zoom\s+communications?,?\s*inc\.?/i, name: 'Zoom Communications, Inc.' },
            { tag: 'merchant.zoom-short', pattern: /\bzoom[l1i]?\b/i, name: 'Zoom Communications, Inc.' },
            { tag: 'merchant.amazon', pattern: /amazon\.?\s*com/i, name: 'Amazon' },
            { tag: 'merchant.whole-foods', pattern: /whole\s*foods/i, name: 'Whole Foods' },
            { tag: 'merchant.costco', pattern: /costco\s*wholesale/i, name: 'Costco' },
            { tag: 'merchant.target', pattern: /target\s*(store|corp)?/i, name: 'Target' },
            { tag: 'merchant.walmart', pattern: /walmart/i, name: 'Walmart' },
            { tag: 'merchant.starbucks', pattern: /starbucks/i, name: 'Starbucks' }
        ]
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
