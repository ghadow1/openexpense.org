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
    // tag: platform-mobile-layout - calendar and save flows collapse at the
    // same viewport width so phone/tablet behavior stays predictable.
    isMobile: () => window.matchMedia(`(max-width: ${BREAKPOINTS.mobileMax}px)`).matches,
    // tag: platform-camera-input - phones and coarse pointers should open the
    // rear camera first; desktop keeps the normal file picker for PDFs/images.
    prefersCamera: () => window.matchMedia(`(max-width: ${BREAKPOINTS.cameraPromptMax}px), (pointer: coarse)`).matches,
    canUseSavePicker: () => typeof window.showSaveFilePicker === 'function'
        && window.isSecureContext
        && !Utils.isMobile(),
    // tag: ocr-idle-warmup - warming the OCR model improves first-scan latency
    // on capable devices, but manual scans still load on demand when skipped.
    shouldWarmOcr() {
        const connection = navigator.connection || navigator.mozConnection || navigator.webkitConnection;
        if (connection?.saveData) return false;
        if (OCR_CONFIG.warmup.skipEffectiveTypes.includes(connection?.effectiveType)) return false;
        if (typeof navigator.deviceMemory === 'number'
            && navigator.deviceMemory < OCR_CONFIG.warmup.minDeviceMemoryGb) {
            return false;
        }
        return true;
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
