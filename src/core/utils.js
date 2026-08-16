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
    matchesMedia: (query) => typeof window !== 'undefined'
        && typeof window.matchMedia === 'function'
        && window.matchMedia(query).matches,
    isMobile: () => Utils.matchesMedia('(max-width: 640px)'),
    isCoarsePointer: () => Utils.matchesMedia('(pointer: coarse)'),
    prefersCamera: () => Utils.matchesMedia('(max-width: 900px)') || Utils.isCoarsePointer(),
    connectionInfo() {
        const nav = typeof navigator !== 'undefined' ? navigator : {};
        const connection = nav.connection || nav.mozConnection || nav.webkitConnection || {};
        return {
            effectiveType: String(connection.effectiveType || '').toLowerCase(),
            saveData: !!connection.saveData
        };
    },
    deviceMemoryGb: () => Number((typeof navigator !== 'undefined' && navigator.deviceMemory) || 0),
    hardwareConcurrency: () => Number((typeof navigator !== 'undefined' && navigator.hardwareConcurrency) || 0),
    shouldWarmOcr(ocrConfig) {
        const { warmup } = ocrConfig;
        const connection = Utils.connectionInfo();
        const memory = Utils.deviceMemoryGb();
        const cores = Utils.hardwareConcurrency();

        if (connection.saveData || warmup.avoidEffectiveTypes.includes(connection.effectiveType)) return false;
        if (memory && memory < warmup.minDeviceMemoryGb) return false;
        if (cores && cores < warmup.minHardwareConcurrency) return false;
        return true;
    },
    ocrCanvasBudget(ocrConfig, sourceType = 'image') {
        const { image } = ocrConfig;
        const memory = Utils.deviceMemoryGb();
        const mobileLike = Utils.prefersCamera();
        let maxSide = mobileLike ? image.mobileMaxSide : image.desktopMaxSide;

        if (memory && memory < ocrConfig.warmup.minDeviceMemoryGb) {
            maxSide = Math.min(maxSide, image.lowMemoryMaxSide);
        }
        if (sourceType === 'pdf') {
            maxSide = Math.min(maxSide, image.pdfPreviewMaxSide);
        }

        return { minSide: image.minSide, maxSide };
    },
    async canvasToPreviewUrl(canvas, type = 'image/jpeg', quality = 0.86) {
        if (typeof canvas.toBlob === 'function') {
            const blob = await new Promise((resolve) => canvas.toBlob(resolve, type, quality));
            if (blob) return URL.createObjectURL(blob);
        }
        return canvas.toDataURL(type, quality);
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
