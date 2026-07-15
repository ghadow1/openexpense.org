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
    // --- Platform probes ----------------------------------------------------
    isMobile: () => window.matchMedia(`(max-width: ${BREAKPOINTS.mobile}px)`).matches,
    prefersCamera: () => window.matchMedia(`(max-width: ${BREAKPOINTS.camera}px), (pointer: coarse)`).matches,
    canUseSavePicker: () => typeof window.showSaveFilePicker === 'function'
        && window.isSecureContext
        && !Utils.isMobile(),
    platformProfile() {
        const width = window.innerWidth || document.documentElement?.clientWidth || BREAKPOINTS.calendarTablet;
        const coarsePointer = window.matchMedia('(pointer: coarse)').matches;
        const memory = Number(navigator.deviceMemory || 4);

        if (width <= BREAKPOINTS.mobile || (coarsePointer && width <= BREAKPOINTS.camera)) return 'mobile';
        if (width <= BREAKPOINTS.camera || memory < OCR_CONFIG.warmup.minDeviceMemoryGb) return 'tablet';
        return 'desktop';
    },
    ocrCanvasProfile() {
        return OCR_CONFIG.canvasProfiles[Utils.platformProfile()] || OCR_CONFIG.canvasProfiles.desktop;
    },
    shouldWarmOcr() {
        const connection = navigator.connection || navigator.mozConnection || navigator.webkitConnection;
        const effectiveType = String(connection?.effectiveType || '').toLowerCase();
        const lowMemory = Number(navigator.deviceMemory || 4) < OCR_CONFIG.warmup.minDeviceMemoryGb;

        if (connection?.saveData || lowMemory) return false;
        return !OCR_CONFIG.warmup.skipConnectionTypes.includes(effectiveType);
    },
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
