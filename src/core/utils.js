/**
 * @module oe/platform-utils
 * @tag platform:mobile-desktop
 * @tag privacy:dom-only
 */

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
    // @section platform-profile
    getDeviceProfile() {
        const mobileViewport = window.matchMedia('(max-width: 640px)').matches;
        const tabletViewport = window.matchMedia('(max-width: 900px)').matches;
        const coarsePointer = window.matchMedia('(pointer: coarse)').matches;
        const connection = navigator.connection || navigator.mozConnection || navigator.webkitConnection;
        const effectiveType = String(connection?.effectiveType || '').toLowerCase();
        const prefersReducedData = Boolean(connection?.saveData || effectiveType === 'slow-2g' || effectiveType === '2g');
        const memoryGB = Number(navigator.deviceMemory || 0);
        const tier = mobileViewport ? 'mobile' : (tabletViewport || coarsePointer ? 'tablet' : 'desktop');
        const canUseSavePicker = typeof window.showSaveFilePicker === 'function'
            && window.isSecureContext
            && tier === 'desktop';

        return {
            tier,
            isMobile: tier === 'mobile',
            isTablet: tier === 'tablet',
            isDesktop: tier === 'desktop',
            prefersCamera: tabletViewport || coarsePointer,
            canUseSavePicker,
            prefersReducedData,
            memoryGB
        };
    },
    isMobile: () => Utils.getDeviceProfile().isMobile,
    prefersCamera: () => Utils.getDeviceProfile().prefersCamera,
    canUseSavePicker: () => Utils.getDeviceProfile().canUseSavePicker,
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
