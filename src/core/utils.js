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
    // @platform
    isMobile: () => window.matchMedia('(max-width: 640px)').matches,
    prefersCamera: () => window.matchMedia('(max-width: 900px), (pointer: coarse)').matches,
    hasTouch: () => navigator.maxTouchPoints > 0 || window.matchMedia('(pointer: coarse)').matches,
    getConnectionInfo: () => navigator.connection || navigator.mozConnection || navigator.webkitConnection || null,
    canUseSavePicker: () => typeof window.showSaveFilePicker === 'function'
        && window.isSecureContext
        && !Utils.isMobile(),
    canUseShareSheet: (payload = {}) => typeof navigator.share === 'function'
        && (!navigator.canShare || navigator.canShare(payload)),
    shouldWarmOcr() {
        const connection = Utils.getConnectionInfo();
        if (connection?.saveData) return false;
        if (OCR_CONFIG.warmup.blockedEffectiveTypes.includes(connection?.effectiveType)) return false;
        if (navigator.deviceMemory && navigator.deviceMemory < OCR_CONFIG.warmup.minDeviceMemoryGb) return false;
        return true;
    },
    // @platform @ocr-pipeline
    async decodeImageFile(file) {
        if (typeof createImageBitmap === 'function') {
            try {
                const bitmap = await createImageBitmap(file, { imageOrientation: 'from-image' });
                return {
                    image: bitmap,
                    width: bitmap.width,
                    height: bitmap.height,
                    close: () => bitmap.close?.()
                };
            } catch (_) {
                // Some mobile browsers expose createImageBitmap but reject HEIC or
                // orientation options. The Image element fallback keeps scanning usable.
            }
        }

        const url = URL.createObjectURL(file);
        try {
            const image = await new Promise((resolve, reject) => {
                const el = new Image();
                el.onload = () => resolve(el);
                el.onerror = () => reject(new Error('Could not load image'));
                el.src = url;
            });
            return {
                image,
                width: image.naturalWidth || image.width,
                height: image.naturalHeight || image.height,
                close: () => URL.revokeObjectURL(url)
            };
        } catch (err) {
            URL.revokeObjectURL(url);
            throw err;
        }
    },
    // @perf
    canvasToPreviewUrl(canvas, type = OCR_CONFIG.image.previewMime, quality = OCR_CONFIG.image.previewQuality) {
        if (typeof canvas.toBlob !== 'function') return Promise.resolve(canvas.toDataURL(type, quality));
        return new Promise((resolve) => {
            canvas.toBlob((blob) => {
                resolve(blob ? URL.createObjectURL(blob) : canvas.toDataURL(type, quality));
            }, type, quality);
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
