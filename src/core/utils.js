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
    isMobile: () => window.matchMedia(`(max-width: ${BREAKPOINTS.mobileMax}px)`).matches,
    isCoarsePointer: () => window.matchMedia('(pointer: coarse)').matches,
    prefersCamera: () => window.matchMedia(`(max-width: ${BREAKPOINTS.cameraMax}px), (pointer: coarse)`).matches,
    connectionInfo: () => navigator.connection || navigator.mozConnection || navigator.webkitConnection || null,
    deviceMemory: () => Number(navigator.deviceMemory || 0),
    shouldWarmOcr(reason = 'idle') {
        const connection = Utils.connectionInfo();
        const effectiveType = String(connection?.effectiveType || '').toLowerCase();

        if (connection?.saveData) return false;
        if (OCR_CONFIG.warmup.slowEffectiveTypes.includes(effectiveType)) return false;

        if (reason === 'idle') {
            const memory = Utils.deviceMemory();
            if (Utils.isMobile() || Utils.isCoarsePointer()) return false;
            if (memory > 0 && memory < OCR_CONFIG.warmup.minIdleDeviceMemoryGb) return false;
        }

        return true;
    },
    ocrCanvasProfile() {
        if (Utils.isMobile()) return OCR_CONFIG.canvasProfiles.mobile;
        if (window.matchMedia(`(max-width: ${BREAKPOINTS.desktopMin - 1}px), (pointer: coarse)`).matches) {
            return OCR_CONFIG.canvasProfiles.tablet;
        }
        return OCR_CONFIG.canvasProfiles.desktop;
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
