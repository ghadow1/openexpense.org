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
    // @platform @perf
    // Network/device hints are coarse and optional, so use them only to avoid
    // speculative warmup work. Manual receipt scans still load OCR on demand.
    connectionInfo: () => navigator.connection || navigator.mozConnection || navigator.webkitConnection || null,
    isConstrainedNetwork(ocrConfig) {
        const connection = Utils.connectionInfo();
        if (!connection) return false;
        const slowTypes = ocrConfig?.warmup?.skipEffectiveTypes || [];
        return connection.saveData || slowTypes.includes(connection.effectiveType);
    },
    hasLowMemory(ocrConfig) {
        const min = ocrConfig?.warmup?.minDeviceMemoryGb;
        return Number.isFinite(navigator.deviceMemory)
            && Number.isFinite(min)
            && navigator.deviceMemory < min;
    },
    hasLowHardwareConcurrency(ocrConfig) {
        const min = ocrConfig?.warmup?.minHardwareConcurrency;
        return Number.isFinite(navigator.hardwareConcurrency)
            && Number.isFinite(min)
            && navigator.hardwareConcurrency < min;
    },
    shouldWarmOcr(ocrConfig) {
        return !Utils.isConstrainedNetwork(ocrConfig)
            && !Utils.hasLowMemory(ocrConfig)
            && !Utils.hasLowHardwareConcurrency(ocrConfig);
    },
    async canvasToPreviewUrl(canvas, ocrConfig) {
        const type = ocrConfig?.canvas?.previewType || 'image/jpeg';
        const quality = ocrConfig?.canvas?.previewQuality ?? 0.9;
        if (typeof canvas.toBlob !== 'function') return canvas.toDataURL(type, quality);

        const blob = await new Promise(resolve => canvas.toBlob(resolve, type, quality));
        return blob ? URL.createObjectURL(blob) : canvas.toDataURL(type, quality);
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
