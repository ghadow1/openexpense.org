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
    hardwareConcurrency: () => Number(navigator.hardwareConcurrency || 0) || null,
    deviceMemory: () => Number(navigator.deviceMemory || 0) || null,
    prefersReducedData: () => !!navigator.connection?.saveData,
    ocrPlatformTier() {
        const cores = Utils.hardwareConcurrency();
        const memory = Utils.deviceMemory();
        const coarsePointer = window.matchMedia('(pointer: coarse)').matches;
        const mobileViewport = window.matchMedia('(max-width: 760px)').matches;

        if (Utils.prefersReducedData() || mobileViewport || coarsePointer || (memory && memory <= 4) || (cores && cores <= 4)) {
            return 'mobile';
        }

        if (!Utils.isMobile() && ((memory && memory >= 8) || (cores && cores >= 8))) {
            return 'desktop';
        }

        return 'default';
    },
    getOcrProfile(profiles) {
        const tier = Utils.ocrPlatformTier();
        return profiles[tier] || profiles.default;
    },
    shouldWarmOcr() {
        if (Utils.prefersReducedData()) return false;
        const tier = Utils.ocrPlatformTier();
        const cores = Utils.hardwareConcurrency();
        const memory = Utils.deviceMemory();
        return tier !== 'mobile' || ((cores == null || cores >= 6) && (memory == null || memory >= 4));
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
