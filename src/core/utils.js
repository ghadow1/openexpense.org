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
    isCoarsePointer: () => window.matchMedia('(pointer: coarse)').matches,
    prefersCamera: () => window.matchMedia('(max-width: 900px), (pointer: coarse)').matches,
    connectionInfo: () => navigator.connection || navigator.mozConnection || navigator.webkitConnection || null,
    // @platform @perf
    // Avoid eager OCR downloads on constrained mobile sessions; user-initiated
    // scans still load the engine on demand.
    shouldWarmOcr() {
        const connection = Utils.connectionInfo();
        if (connection?.saveData) return false;
        if (OCR_CONFIG.warmup.slowConnectionTypes.includes(connection?.effectiveType)) return false;
        const memory = Number(navigator.deviceMemory || 0);
        if (memory > 0 && memory < OCR_CONFIG.warmup.minDeviceMemoryGb) return false;
        return true;
    },
    canUseSavePicker: () => typeof window.showSaveFilePicker === 'function'
        && window.isSecureContext
        && !Utils.isMobile(),
    canShareFiles(files) {
        if (typeof navigator.share !== 'function' || typeof navigator.canShare !== 'function') return false;
        try {
            return navigator.canShare({ files });
        } catch (_) {
            return false;
        }
    },
    async decodeImageFile(file, previewUrl) {
        if (typeof createImageBitmap === 'function') {
            for (const options of [{ imageOrientation: 'from-image' }, undefined]) {
                try {
                    const bitmap = await createImageBitmap(file, options);
                    return { image: bitmap, close: () => bitmap.close?.() };
                } catch (_) { }
            }
        }

        const url = previewUrl || URL.createObjectURL(file);
        try {
            const image = await new Promise((resolve, reject) => {
                const el = new Image();
                el.onload = () => resolve(el);
                el.onerror = () => reject(new Error('Could not load image'));
                el.src = url;
            });
            return {
                image,
                close: () => {
                    if (!previewUrl) URL.revokeObjectURL(url);
                }
            };
        } catch (err) {
            if (!previewUrl) URL.revokeObjectURL(url);
            throw err;
        }
    },
    async canvasToPreviewUrl(canvas, type = OCR_CONFIG.canvas.previewType, quality = OCR_CONFIG.canvas.previewQuality) {
        if (typeof canvas.toBlob === 'function') {
            const blob = await new Promise(resolve => canvas.toBlob(resolve, type, quality));
            if (blob) return URL.createObjectURL(blob);
        }
        return canvas.toDataURL(type, quality);
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
