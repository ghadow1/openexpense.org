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
    // @platform @perf
    // Idle OCR warm-up is helpful on desktops and current phones, but wasteful on
    // data-saver, 2G-class, or very low-memory sessions. Manual scans still load
    // the engine on demand through Receipt.ensureEngine().
    shouldWarmOcr() {
        const connection = Utils.connectionInfo();
        if (connection?.saveData) return false;
        if (/^(slow-)?2g$/i.test(connection?.effectiveType || '')) return false;

        const memoryGb = Number(navigator.deviceMemory || 0);
        return !memoryGb || memoryGb > OCR_CONFIG.warmup.maxLowMemoryDeviceGb;
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
