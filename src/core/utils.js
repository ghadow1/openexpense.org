import { BREAKPOINTS, OCR_CONFIG } from '../config.js';

export const Utils = {
    pad: (n) => String(n).padStart(2, '0'),
    dateKey: (y, m, d) => `${y}-${Utils.pad(m + 1)}-${Utils.pad(d)}`,
    getPrice: (e) => {
        if (e.price !== undefined && e.price !== null && e.price !== "") return parseFloat(e.price);
        const match = e.note?.match(/\$(\d+\.?\d*)/);
        return match ? parseFloat(match[1]) : 0;
    },
    escapeHtml: (value) => String(value ?? '').replace(/[&<>"']/g, (ch) => ({
        '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
    }[ch])),
    hideTooltip: () => {
        const tt = document.getElementById('global-tooltip');
        if (!tt) return;
        tt.style.opacity = '0';
        tt.textContent = '';
    },
    overlayOpen: () => document.body.classList.contains('modal-open')
        || !!document.querySelector('.backdrop.open'),
    bindTooltip: (el, text) => {
        if (!text) return;
        const tt = document.getElementById('global-tooltip');
        if (!tt) return;
        el.addEventListener('mouseenter', () => {
            if (Utils.overlayOpen()) return;
            tt.textContent = text;
            tt.style.opacity = '1';
        });
        el.addEventListener('mousemove', (e) => {
            if (Utils.overlayOpen()) return;
            tt.style.left = `${e.clientX}px`;
            tt.style.top = `${e.clientY - 15}px`;
        });
        el.addEventListener('mouseleave', () => {
            tt.style.opacity = '0';
            tt.textContent = '';
        });
    },
    isMobile: () => window.matchMedia(`(max-width: ${BREAKPOINTS.mobile}px)`).matches,
    isTablet: () => window.matchMedia(`(max-width: ${BREAKPOINTS.tablet}px)`).matches,
    prefersCamera: () => window.matchMedia(`(max-width: ${BREAKPOINTS.cameraHint}px), (pointer: coarse)`).matches,
    connectionInfo: () => navigator.connection || navigator.webkitConnection || navigator.mozConnection || null,
    deviceMemoryGb: () => Number.isFinite(navigator.deviceMemory) ? navigator.deviceMemory : null,
    isSaveDataEnabled: () => !!Utils.connectionInfo()?.saveData,
    effectiveConnectionType: () => Utils.connectionInfo()?.effectiveType || '',
    isVerySlowConnection: () => OCR_CONFIG.warmup.skipEffectiveTypes.includes(Utils.effectiveConnectionType()),
    supportsImageBitmap: () => typeof createImageBitmap === 'function',
    // OE-PERF: Match OCR canvas budgets to the likely device class. Manual scans
    // still work everywhere; this only chooses the amount of image data to feed OCR.
    ocrPlatformProfile() {
        if (Utils.isMobile()) return 'mobile';
        if (Utils.isTablet()) return 'tablet';
        return 'desktop';
    },
    ocrCanvasBounds() {
        return OCR_CONFIG.canvas[Utils.ocrPlatformProfile()] || OCR_CONFIG.canvas.desktop;
    },
    shouldWarmOcr() {
        if (Utils.isSaveDataEnabled() || Utils.isVerySlowConnection()) return false;

        const memory = Utils.deviceMemoryGb();
        return memory == null || memory >= OCR_CONFIG.warmup.minDeviceMemoryGb;
    },
    canUseSavePicker: () => typeof window.showSaveFilePicker === 'function'
        && window.isSecureContext
        && !Utils.isMobile(),
    sanitizeFilename(name) {
        return String(name ?? '').trim().replace(/[<>:"/\\|?*\x00-\x1f]/g, '').replace(/\s+/g, ' ').slice(0, 80);
    },
    filenameToLedgerName(filename) {
        return Utils.sanitizeFilename(String(filename ?? '').replace(/\.(zip|json)$/i, ''));
    },
    formatMoney(value) {
        return `$${Number(value || 0).toFixed(2)}`;
    }
};
