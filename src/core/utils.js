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
    // @platform @perf
    getConnectionInfo() {
        const connection = navigator.connection || navigator.mozConnection || navigator.webkitConnection;
        return {
            saveData: Boolean(connection?.saveData),
            effectiveType: connection?.effectiveType || '',
            deviceMemory: Number(navigator.deviceMemory || 0),
            coarsePointer: window.matchMedia('(pointer: coarse)').matches,
            viewportWidth: window.innerWidth || document.documentElement?.clientWidth || 0
        };
    },
    // @ocr-engine @platform @perf
    shouldWarmOcr(ocrConfig) {
        const info = Utils.getConnectionInfo();
        const platform = ocrConfig?.platform || {};
        if (platform.skipWarmupOnSaveData && info.saveData) return false;
        if (platform.skipWarmupEffectiveTypes?.includes(info.effectiveType)) return false;
        if (info.deviceMemory && info.deviceMemory < platform.minWarmupDeviceMemoryGb) return false;
        if (
            info.coarsePointer
            && platform.skipWarmupOnCoarsePointerBelowPx
            && info.viewportWidth > 0
            && info.viewportWidth < platform.skipWarmupOnCoarsePointerBelowPx
        ) return false;
        return true;
    },
    // @ocr-pipeline @platform
    async decodeImageFile(file) {
        if (typeof createImageBitmap === 'function') {
            try {
                return await createImageBitmap(file, { imageOrientation: 'from-image' });
            } catch (_) {
                // Fall back for Safari/HEIC paths that expose the API but reject the file.
            }
        }

        const url = URL.createObjectURL(file);
        try {
            return await new Promise((resolve, reject) => {
                const image = new Image();
                image.onload = () => resolve(image);
                image.onerror = () => reject(new Error('Could not load image'));
                image.src = url;
            });
        } finally {
            URL.revokeObjectURL(url);
        }
    },
    // @ocr-ui @platform @perf
    async canvasToPreviewUrl(canvas, quality = 0.9) {
        if (canvas.toBlob) {
            const blob = await new Promise(resolve => canvas.toBlob(resolve, 'image/jpeg', quality));
            if (blob) return URL.createObjectURL(blob);
        }
        return canvas.toDataURL('image/jpeg', quality);
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
