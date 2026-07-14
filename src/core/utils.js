import { OCR_CONFIG, PLATFORM_CONFIG } from '../config.js';

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
    mqMax: (px) => window.matchMedia(`(max-width: ${px}px)`).matches,
    mqMin: (px) => window.matchMedia(`(min-width: ${px}px)`).matches,
    isMobile: () => Utils.mqMax(PLATFORM_CONFIG.breakpoints.mobile),
    isCoarsePointer: () => window.matchMedia('(pointer: coarse)').matches,
    prefersCamera: () => Utils.mqMax(PLATFORM_CONFIG.breakpoints.cameraPreferred) || Utils.isCoarsePointer(),
    hasReducedDataPreference() {
        const connection = navigator.connection || navigator.mozConnection || navigator.webkitConnection;
        if (!connection) return false;
        if (connection.saveData) return true;
        return PLATFORM_CONFIG.ocrWarmup.skipEffectiveTypes.includes(connection.effectiveType);
    },
    shouldWarmOcr: () => !Utils.hasReducedDataPreference(),
    ocrCanvasProfile() {
        if (Utils.prefersCamera() || Utils.hasReducedDataPreference()) return OCR_CONFIG.canvasProfiles.mobile;
        if (Utils.mqMin(PLATFORM_CONFIG.breakpoints.desktopOcr) && (navigator.deviceMemory || 4) >= 8) {
            return OCR_CONFIG.canvasProfiles.desktop;
        }
        return OCR_CONFIG.canvasProfiles.default;
    },
    canUseSavePicker: () => typeof window.showSaveFilePicker === 'function'
        && (!PLATFORM_CONFIG.savePicker.secureContextRequired || window.isSecureContext)
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
