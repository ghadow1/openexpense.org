import { OCR_CONFIG } from '../config.js';

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
    isMobile: () => window.matchMedia('(max-width: 640px)').matches,
    prefersCamera: () => window.matchMedia('(max-width: 900px), (pointer: coarse)').matches,
    canUseSavePicker: () => typeof window.showSaveFilePicker === 'function'
        && window.isSecureContext
        && !Utils.isMobile(),
    // @platform @perf Runtime capability snapshot for mobile/desktop OCR choices.
    platformProfile() {
        const connection = navigator.connection || navigator.mozConnection || navigator.webkitConnection;
        return {
            isMobile: Utils.isMobile(),
            prefersCamera: Utils.prefersCamera(),
            saveData: !!connection?.saveData,
            effectiveType: connection?.effectiveType || '',
            downlink: Number(connection?.downlink || 0),
            deviceMemory: Number(navigator.deviceMemory || 0),
            hardwareConcurrency: Number(navigator.hardwareConcurrency || 0),
            supportsImageBitmap: typeof createImageBitmap === 'function',
            supportsOffscreenCanvas: typeof OffscreenCanvas === 'function'
        };
    },
    // @ocr-engine @perf Avoid surprise model downloads on constrained sessions.
    shouldWarmOcr(profile = Utils.platformProfile()) {
        if (profile.saveData) return false;
        if (/(^|-)2g$/i.test(profile.effectiveType)) return false;
        if (profile.deviceMemory && profile.deviceMemory < OCR_CONFIG.warmup.minDeviceMemoryGb) return false;
        return true;
    },
    // @ocr-pipeline @platform Keep OCR canvases accurate without overusing RAM.
    ocrCanvasBounds(profile = Utils.platformProfile()) {
        const constrained = profile.saveData
            || /(^|-)2g$/i.test(profile.effectiveType)
            || (profile.deviceMemory && profile.deviceMemory < OCR_CONFIG.warmup.minDeviceMemoryGb);
        return {
            minSide: OCR_CONFIG.canvas.minSide,
            maxSide: constrained ? OCR_CONFIG.canvas.constrainedMaxSide : OCR_CONFIG.canvas.maxSide
        };
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
