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
    connectionInfo: () => navigator.connection || navigator.mozConnection || navigator.webkitConnection || null,
    // @platform @perf Coarse capability buckets are enough for OCR sizing without fingerprinting.
    deviceProfile() {
        const memoryGb = Number(navigator.deviceMemory || 0);
        const cores = Number(navigator.hardwareConcurrency || 0);
        const isCoarse = window.matchMedia('(pointer: coarse)').matches;
        const isSmallViewport = window.matchMedia('(max-width: 900px)').matches;

        if ((memoryGb && memoryGb <= OCR_CONFIG.warmup.lowMemoryGb) || (cores && cores <= 4)) return 'constrained';
        if (!isCoarse && !isSmallViewport && (memoryGb >= 8 || cores >= 8)) return 'desktop';
        return 'balanced';
    },
    ocrMaxSide() {
        const profile = Utils.deviceProfile();
        if (profile === 'constrained') return OCR_CONFIG.preprocessing.lowMemoryMaxOcrSide;
        if (profile === 'desktop') return OCR_CONFIG.preprocessing.desktopMaxOcrSide;
        return OCR_CONFIG.preprocessing.defaultMaxOcrSide;
    },
    shouldWarmOcr() {
        const connection = Utils.connectionInfo();
        const effectiveType = String(connection?.effectiveType || '').toLowerCase();
        const slowTypes = OCR_CONFIG.warmup.slowConnectionTypes;

        if (connection?.saveData) return false;
        if (slowTypes.includes(effectiveType)) return false;
        return Utils.deviceProfile() !== 'constrained';
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
