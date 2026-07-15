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
    media: (query) => typeof window !== 'undefined'
        && typeof window.matchMedia === 'function'
        && window.matchMedia(query).matches,
    isMobile: () => Utils.media(`(max-width: ${OCR_CONFIG.platform.mobileViewportPx}px)`),
    isCoarsePointer: () => Utils.media('(pointer: coarse)'),
    prefersCamera: () => Utils.media(`(max-width: ${OCR_CONFIG.platform.cameraViewportPx}px), (pointer: coarse)`),
    canUseSavePicker: () => typeof window !== 'undefined'
        && typeof window.showSaveFilePicker === 'function'
        && window.isSecureContext
        && !Utils.isMobile(),
    getConnection: () => {
        if (typeof navigator === 'undefined') return null;
        return navigator.connection || navigator.mozConnection || navigator.webkitConnection || null;
    },
    prefersReducedData() {
        const conn = Utils.getConnection();
        return !!conn?.saveData;
    },
    isSlowConnection() {
        const effectiveType = Utils.getConnection()?.effectiveType;
        return !!effectiveType && OCR_CONFIG.warmup.blockedEffectiveTypes.includes(effectiveType);
    },
    hasConstrainedMemory() {
        if (typeof navigator === 'undefined') return false;
        const memoryGb = navigator.deviceMemory;
        return typeof memoryGb === 'number' && memoryGb > 0 && memoryGb < OCR_CONFIG.warmup.minDeviceMemoryGb;
    },
    shouldWarmOcr() {
        return !Utils.prefersReducedData()
            && !Utils.isSlowConnection()
            && !Utils.hasConstrainedMemory();
    },
    scheduleIdleTask(callback, { timeout = OCR_CONFIG.warmup.idleTimeoutMs, delay = OCR_CONFIG.warmup.idleDelayMs } = {}) {
        if (typeof requestIdleCallback === 'function') return requestIdleCallback(callback, { timeout });
        return globalThis.setTimeout(callback, delay);
    },
    calendarDensity(colEl) {
        const colW = colEl?.clientWidth || 0;
        const { platform } = OCR_CONFIG;

        if (Utils.isMobile()) return 'mobile';
        if (colW > 0 && colW < platform.compactCalendarPx) return 'compact';
        if (colW > 0 && colW < platform.narrowCalendarPx) return 'narrow';
        if (colW > 0 && colW < platform.tabletCalendarPx) return 'tablet';
        if (Utils.media(`(max-width: ${platform.tabletViewportPx}px)`)) return 'tablet';
        return 'desktop';
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
