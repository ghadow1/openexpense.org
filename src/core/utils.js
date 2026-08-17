/**
 * OpenExpense — shared helpers
 *
 * Dates, money, HTML escaping, tooltips, and filename sanitizing.
 * Used across calendar, modal, ledger, and summary views.
 */
export const Utils = {
    pad: (n) => String(n).padStart(2, '0'),
    dateKey: (y, m, d) => `${y}-${Utils.pad(m + 1)}-${Utils.pad(d)}`,
    getPrice: (e) => {
        if (e.price !== undefined && e.price !== null && e.price !== "") return parseFloat(e.price);
        const match = e.note?.match(/\$(\d+\.?\d*)/);
        return match ? parseFloat(match[1]) : 0;
    },
    /** Legacy entries without `kind` are expenses. */
    entryKind: (e) => (e?.kind === 'income' ? 'income' : 'expense'),
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
    isIOS: () => {
        const ua = navigator.userAgent || '';
        return /iPad|iPhone|iPod/.test(ua)
            || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
    },
    isAndroid: () => /Android/i.test(navigator.userAgent || ''),
    isMobile: () => window.matchMedia('(max-width: 640px)').matches,
    isPhone: () => /iPhone|iPod/.test(navigator.userAgent || '')
        || /Android.+Mobile/i.test(navigator.userAgent || '')
        || (Utils.isMobile() && window.matchMedia('(pointer: coarse)').matches),
    prefersCamera: () => window.matchMedia('(max-width: 900px), (pointer: coarse)').matches
        || Utils.isPhone(),
    canUseSavePicker: () => typeof window.showSaveFilePicker === 'function'
        && window.isSecureContext
        && !Utils.isPhone()
        && !Utils.isIOS(),
    canShareFiles: (files) => typeof navigator.share === 'function'
        && typeof navigator.canShare === 'function'
        && !!files?.length
        && navigator.canShare({ files }),
    sanitizeFilename(name) {
        return String(name ?? '').trim().replace(/[<>:"/\\|?*\x00-\x1f]/g, '').replace(/\s+/g, ' ').slice(0, 80);
    },
    filenameToLedgerName(filename) {
        return Utils.sanitizeFilename(String(filename ?? '')
            .replace(/\.key\.json$/i, '')
            .replace(/\.(enc\.)?json$/i, '')
            .replace(/\.zip$/i, ''));
    },
    formatMoney(value) {
        return `$${Number(value || 0).toFixed(2)}`;
    }
};
