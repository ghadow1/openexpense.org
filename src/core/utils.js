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
    // Network Information and Device Memory are optional browser APIs, so keep
    // callers on a stable shape while using them when mobile engines expose them.
    connectionInfo() {
        const connection = navigator.connection || navigator.mozConnection || navigator.webkitConnection;
        return {
            saveData: !!connection?.saveData,
            effectiveType: String(connection?.effectiveType || '').toLowerCase(),
            deviceMemory: Number(navigator.deviceMemory || 0)
        };
    },
    shouldWarmOcr(config) {
        const info = Utils.connectionInfo();
        if (document.visibilityState === 'hidden') return false;
        if (info.saveData) return false;
        if (config?.warmup?.poorConnectionTypes?.includes(info.effectiveType)) return false;
        if (info.deviceMemory && info.deviceMemory < (config?.warmup?.lowMemoryGiB || 0)) return false;
        return true;
    },
    canUseSavePicker: () => typeof window.showSaveFilePicker === 'function'
        && window.isSecureContext
        && !Utils.isMobile(),
    async decodeImageFile(file, objectUrl) {
        if (typeof createImageBitmap === 'function') {
            try {
                const bitmap = await createImageBitmap(file, { imageOrientation: 'from-image' });
                return {
                    image: bitmap,
                    width: bitmap.width,
                    height: bitmap.height,
                    close: () => bitmap.close?.()
                };
            } catch (_) { }
        }

        return new Promise((resolve, reject) => {
            const image = new Image();
            image.onload = () => resolve({
                image,
                width: image.naturalWidth || image.width,
                height: image.naturalHeight || image.height,
                close: () => {}
            });
            image.onerror = () => reject(new Error('Could not load image'));
            image.src = objectUrl;
        });
    },
    canvasToPreviewUrl(canvas, type = 'image/jpeg', quality = 0.9) {
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
