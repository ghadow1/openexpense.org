/**
 * OpenExpense — shared helpers
 *
 * Dates, money, HTML escaping, tooltips, and filename sanitizing.
 * Used across calendar, modal, ledger, and summary views.
 */
export const Utils = {
    pad: (number) => String(number).padStart(2, '0'),
    dateKey: (year, zeroBasedMonth, dayOfMonth) => (
        `${year}-${Utils.pad(zeroBasedMonth + 1)}-${Utils.pad(dayOfMonth)}`
    ),
    /**
     * Convert decimal input to integer cents without binary half-cent drift.
     * Decimal ties round away from zero (1.005 → 101, -1.005 → -101).
     */
    toCents(value) {
        const numericAmount = Number(value);
        if (!Number.isFinite(numericAmount)) return 0;
        const decimalMatch = String(value).trim().match(
            /^([+-]?)(\d*)(?:\.(\d*))?(?:e([+-]?\d+))?$/i
        );
        if (!decimalMatch) return 0;

        const sign = decimalMatch[1] === '-' ? -1n : 1n;
        const integerDigits = decimalMatch[2] || '0';
        const fractionalDigits = decimalMatch[3] || '';
        const exponent = Number(decimalMatch[4] || 0);
        const allDigits = BigInt((integerDigits + fractionalDigits).replace(/^0+(?=\d)/, '') || '0');
        const centsScale = exponent - fractionalDigits.length + 2;
        let absoluteCents;

        if (centsScale >= 0) {
            absoluteCents = allDigits * (10n ** BigInt(centsScale));
        } else {
            const divisor = 10n ** BigInt(-centsScale);
            const wholeCents = allDigits / divisor;
            const discardedDigits = allDigits % divisor;
            absoluteCents = wholeCents + (discardedDigits * 2n >= divisor ? 1n : 0n);
        }
        return Number(sign * absoluteCents);
    },
    fromCents(cents) {
        return (Number(cents) || 0) / 100;
    },
    getPrice: (entry) => {
        let parsedAmount = 0;
        if (entry.price !== undefined && entry.price !== null && entry.price !== "") {
            parsedAmount = parseFloat(entry.price);
        }
        else {
            const priceInLegacyNote = entry.note?.match(/\$(\d+\.?\d*)/);
            parsedAmount = priceInLegacyNote ? parseFloat(priceInLegacyNote[1]) : 0;
        }
        return Utils.fromCents(Utils.toCents(parsedAmount));
    },
    /** Legacy entries without `kind` are expenses. */
    entryKind: (entry) => (entry?.kind === 'income' ? 'income' : 'expense'),
    escapeHtml: (value) => String(value ?? '').replace(/[&<>"']/g, (character) => ({
        '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
    }[character])),
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
        el.addEventListener('mousemove', (pointerEvent) => {
            if (Utils.overlayOpen()) return;
            tt.style.left = `${pointerEvent.clientX}px`;
            tt.style.top = `${pointerEvent.clientY - 15}px`;
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
