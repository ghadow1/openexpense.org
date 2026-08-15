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
    getConnectionInfo() {
        const nav = typeof navigator !== 'undefined' ? navigator : {};
        const connection = nav.connection || nav.mozConnection || nav.webkitConnection || null;
        return {
            saveData: !!connection?.saveData,
            effectiveType: String(connection?.effectiveType || ''),
            downlink: Number(connection?.downlink || 0),
            deviceMemory: Number(nav.deviceMemory || 0)
        };
    },
    shouldWarmOcr(config) {
        const { saveData, effectiveType, deviceMemory } = Utils.getConnectionInfo();
        const warmup = config?.warmup || {};
        if (warmup.skipWhenSaveData && saveData) return false;
        if (warmup.skipEffectiveTypes?.includes(effectiveType)) return false;
        if (deviceMemory && warmup.minDeviceMemoryGb && deviceMemory < warmup.minDeviceMemoryGb) return false;
        return true;
    },
    ocrCanvasSize(source, canvasConfig = {}) {
        const minSide = canvasConfig.minSide || 1000;
        const maxSide = canvasConfig.maxSide || 2400;
        let width = source.width;
        let height = source.height;
        const longest = Math.max(width, height);

        if (!longest) return { width, height, resized: false };
        if (longest < minSide) {
            const scale = minSide / longest;
            width = Math.round(width * scale);
            height = Math.round(height * scale);
        } else if (longest > maxSide) {
            const scale = maxSide / longest;
            width = Math.round(width * scale);
            height = Math.round(height * scale);
        }

        return { width, height, resized: width !== source.width || height !== source.height };
    },
    createObjectUrl(blob) {
        return typeof URL !== 'undefined' && typeof URL.createObjectURL === 'function'
            ? URL.createObjectURL(blob)
            : null;
    },
    revokeObjectUrl(url) {
        if (url && !url.startsWith('data:') && typeof URL !== 'undefined' && typeof URL.revokeObjectURL === 'function') {
            URL.revokeObjectURL(url);
        }
    },
    async decodeImageFile(file) {
        if (typeof createImageBitmap === 'function') {
            try {
                return await createImageBitmap(file, { imageOrientation: 'from-image' });
            } catch (_) {
                // Fall through to HTMLImageElement for browsers without full HEIC/EXIF support.
            }
        }

        const url = Utils.createObjectUrl(file);
        if (!url) throw new Error('Could not create image preview');
        try {
            return await new Promise((resolve, reject) => {
                const el = new Image();
                el.onload = () => resolve(el);
                el.onerror = () => reject(new Error('Could not load image'));
                el.src = url;
            });
        } finally {
            Utils.revokeObjectUrl(url);
        }
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
