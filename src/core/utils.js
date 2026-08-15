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
    canUseSavePicker: () => typeof window.showSaveFilePicker === 'function'
        && window.isSecureContext
        && !Utils.isMobile(),
    getConnectionInfo() {
        const connection = navigator.connection || navigator.mozConnection || navigator.webkitConnection;
        const deviceMemory = Number(navigator.deviceMemory) || null;
        const hardwareConcurrency = Number(navigator.hardwareConcurrency) || null;
        return {
            saveData: !!connection?.saveData,
            effectiveType: String(connection?.effectiveType || '').toLowerCase(),
            downlink: Number(connection?.downlink) || null,
            deviceMemory,
            hardwareConcurrency,
            coarsePointer: window.matchMedia('(pointer: coarse)').matches
        };
    },
    shouldWarmOcr(config) {
        const info = Utils.getConnectionInfo();
        const constrainedTypes = config?.platform?.constrainedEffectiveTypes || [];
        if (info.saveData || constrainedTypes.includes(info.effectiveType)) return false;
        if (info.deviceMemory && info.deviceMemory <= (config?.platform?.lowMemoryGb || 2)) return false;
        return !(info.coarsePointer
            && info.deviceMemory
            && info.hardwareConcurrency
            && info.deviceMemory <= 4
            && info.hardwareConcurrency <= (config?.platform?.lowCoreCount || 4));
    },
    async decodeImageFile(file, objectUrl) {
        // @ocr-pipeline @perf
        // createImageBitmap can decode off the main thread on modern mobile/desktop browsers.
        if (typeof createImageBitmap === 'function') {
            try {
                return await createImageBitmap(file, { imageOrientation: 'from-image' });
            } catch (_) {
                try { return await createImageBitmap(file); } catch (_) { }
            }
        }

        return new Promise((resolve, reject) => {
            const el = new Image();
            el.decoding = 'async';
            el.onload = () => resolve(el);
            el.onerror = () => reject(new Error('Could not load image'));
            el.src = objectUrl;
        });
    },
    async canvasToPreviewUrl(canvas, quality = 0.9) {
        // @ocr-pdf @perf
        // Blob URLs avoid the large base64 strings produced by toDataURL on PDF previews.
        if (typeof canvas.toBlob === 'function') {
            const blob = await new Promise(resolve => canvas.toBlob(resolve, 'image/jpeg', quality));
            if (blob) return URL.createObjectURL(blob);
        }
        return canvas.toDataURL('image/jpeg', quality);
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
