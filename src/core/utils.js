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
    // Network and memory hints are advisory only; browsers omit them freely.
    getConnectionInfo() {
        return navigator.connection || navigator.mozConnection || navigator.webkitConnection || null;
    },
    isLowMemoryDevice(minGb = 2) {
        return typeof navigator.deviceMemory === 'number' && navigator.deviceMemory > 0 && navigator.deviceMemory < minGb;
    },
    shouldWarmOcr(config) {
        const warmup = config?.warmup || {};
        const connection = Utils.getConnectionInfo();
        if (connection?.saveData) return false;
        if (warmup.slowEffectiveTypes?.includes(connection?.effectiveType)) return false;
        if (Utils.isLowMemoryDevice(warmup.minDeviceMemoryGb ?? 2)) return false;
        return true;
    },
    async decodeImage(file, url) {
        if (typeof createImageBitmap === 'function') {
            try {
                return await createImageBitmap(file, { imageOrientation: 'from-image' });
            } catch (_) {
                // Safari and older Chromium builds can reject options; fall back below.
            }
        }

        return new Promise((resolve, reject) => {
            const el = new Image();
            el.onload = () => resolve(el);
            el.onerror = () => reject(new Error('Could not load image'));
            el.src = url;
        });
    },
    canvasToPreviewUrl(canvas, quality = 0.9) {
        if (typeof canvas.toBlob !== 'function') return Promise.resolve(canvas.toDataURL('image/jpeg', quality));
        return new Promise((resolve) => {
            canvas.toBlob((blob) => {
                resolve(blob ? URL.createObjectURL(blob) : canvas.toDataURL('image/jpeg', quality));
            }, 'image/jpeg', quality);
        });
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
