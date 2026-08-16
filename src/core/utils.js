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
    connectionInfo() {
        const conn = navigator.connection || navigator.mozConnection || navigator.webkitConnection;
        return conn ? {
            saveData: !!conn.saveData,
            effectiveType: conn.effectiveType || '',
            downlink: conn.downlink || 0,
            rtt: conn.rtt || 0
        } : { saveData: false, effectiveType: '', downlink: 0, rtt: 0 };
    },
    isLowMemoryDevice(minGb = 4) {
        return typeof navigator.deviceMemory === 'number' && navigator.deviceMemory < minGb;
    },
    hasLimitedCpu(minCores = 4) {
        return typeof navigator.hardwareConcurrency === 'number' && navigator.hardwareConcurrency < minCores;
    },
    shouldWarmOcr(ocrConfig) {
        const warmup = ocrConfig?.warmup || {};
        if (warmup.enabled === false) return false;
        const connection = Utils.connectionInfo();
        if (connection.saveData) return false;
        if ((warmup.blockedEffectiveTypes || []).includes(connection.effectiveType)) return false;
        if (Utils.isLowMemoryDevice(warmup.minDeviceMemoryGb)) return false;
        if (Utils.hasLimitedCpu(warmup.minHardwareConcurrency)) return false;
        return true;
    },
    async decodeImageFile(file) {
        const previewUrl = URL.createObjectURL(file);
        if (typeof createImageBitmap === 'function') {
            try {
                const bitmap = await createImageBitmap(file, { imageOrientation: 'from-image' });
                return {
                    source: bitmap,
                    width: bitmap.width,
                    height: bitmap.height,
                    previewUrl,
                    close: () => bitmap.close?.()
                };
            } catch (_) {
                // Fall back to HTMLImageElement for browsers without full codec support.
            }
        }

        try {
            const img = await new Promise((resolve, reject) => {
                const el = new Image();
                el.decoding = 'async';
                el.onload = () => resolve(el);
                el.onerror = () => reject(new Error('Could not load image'));
                el.src = previewUrl;
            });
            return {
                source: img,
                width: img.naturalWidth || img.width,
                height: img.naturalHeight || img.height,
                previewUrl,
                close: () => {}
            };
        } catch (err) {
            URL.revokeObjectURL(previewUrl);
            throw err;
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
