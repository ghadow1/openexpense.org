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
    // @platform
    isMobile: () => window.matchMedia('(max-width: 640px)').matches,
    prefersCamera: () => window.matchMedia('(max-width: 900px), (pointer: coarse)').matches,
    hasTouchInput: () => navigator.maxTouchPoints > 0
        || window.matchMedia('(pointer: coarse)').matches,
    getConnectionInfo() {
        const connection = navigator.connection || navigator.mozConnection || navigator.webkitConnection;
        return {
            effectiveType: connection?.effectiveType || '',
            saveData: !!connection?.saveData
        };
    },
    // @perf @platform
    shouldWarmOcr(ocrConfig) {
        const policy = ocrConfig?.warmup || {};
        const connection = Utils.getConnectionInfo();
        const blockedTypes = policy.blockedConnectionTypes || [];

        if (connection.saveData) return false;
        if (blockedTypes.includes(connection.effectiveType)) return false;
        if (navigator.hardwareConcurrency
            && navigator.hardwareConcurrency < (policy.minHardwareConcurrency || 1)) return false;
        if (navigator.deviceMemory
            && navigator.deviceMemory < (policy.minDeviceMemoryGb || 0)) return false;

        return true;
    },
    canvasToPreviewUrl(canvas, type = 'image/jpeg', quality = 0.9) {
        if (!canvas) return Promise.resolve('');
        if (typeof canvas.toBlob !== 'function') return Promise.resolve(canvas.toDataURL(type, quality));
        return new Promise((resolve) => {
            canvas.toBlob((blob) => {
                resolve(blob ? URL.createObjectURL(blob) : canvas.toDataURL(type, quality));
            }, type, quality);
        });
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
