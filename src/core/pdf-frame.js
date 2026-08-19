/**
 * Crash-proof jsPDF drawing. jsPDF throws when roundedRect radius exceeds
 * half the box, when fill color is undefined, or when text is not a string.
 * Every public helper here is safe to call with dirty numbers.
 */

const HEX6 = /^#([0-9a-f]{6})$/i;
const HEX3 = /^#([0-9a-f]{3})$/i;

export const PDF_MARGIN = 36;
export const PDF_PAGE_W = 612;
export const PDF_PAGE_H = 792;
export const PDF_CONTENT_W = PDF_PAGE_W - PDF_MARGIN * 2;
export const PDF_FOOTER_H = 56;
/** Lowest y a content block may occupy (footer lives below this). */
export const PDF_BOTTOM = PDF_PAGE_H - PDF_FOOTER_H;

/** Expand #rgb / #rrggbb to a guaranteed 6-digit hex, or fallback. */
export function pdfHex(value, fallback = '#111827') {
    const raw = String(value || '').trim();
    const six = raw.match(HEX6);
    if (six) return `#${six[1].toLowerCase()}`;
    const three = raw.match(HEX3);
    if (three) {
        const [r, g, b] = three[1].split('');
        return `#${r}${r}${g}${g}${b}${b}`.toLowerCase();
    }
    return fallback;
}

export function pdfNum(value, fallback = 0) {
    const n = Number(value);
    return Number.isFinite(n) ? n : fallback;
}

export function pdfFinite(value) {
    const n = Number(value);
    return Number.isFinite(n);
}

/** Latin-safe string. Fancy punctuation becomes ASCII; diamonds drop. */
export function pdfSafeText(value) {
    if (value == null) return '';
    return String(value)
        .replace(/[\u2018\u2019]/g, "'")
        .replace(/[\u201C\u201D]/g, '"')
        .replace(/[\u2013\u2014]/g, '-')
        .replace(/\u2026/g, '...')
        .replace(/\u00D7/g, 'x')
        .replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F]/g, '')
        .replace(/[^\x09\x0A\x0D\x20-\x7E\xA0-\xFF]/g, '')
        .replace(/[ \t]+/g, ' ')
        .trim();
}

export function setPdfFill(doc, color, fallback) {
    doc.setFillColor(pdfHex(color, fallback || '#ffffff'));
}

export function setPdfStroke(doc, color, fallback) {
    doc.setDrawColor(pdfHex(color, fallback || '#d1d5db'));
}

export function setPdfTextColor(doc, color, fallback) {
    doc.setTextColor(pdfHex(color, fallback || '#111827'));
}

/**
 * Clamp a rounded-rect radius so jsPDF never throws.
 * Returns 0 when the box is too small to round.
 */
export function clampRadius(w, h, r) {
    const width = Math.abs(pdfNum(w));
    const height = Math.abs(pdfNum(h));
    const radius = Math.max(0, pdfNum(r));
    if (width < 0.6 || height < 0.6) return 0;
    return Math.min(radius, width / 2, height / 2);
}

export function canDrawBox(w, h) {
    return pdfFinite(w) && pdfFinite(h) && Math.abs(w) >= 0.6 && Math.abs(h) >= 0.6;
}

/** Fill a rectangle. Uses rect when rounding is too tight for jsPDF. */
export function fillBox(doc, x, y, w, h, color, radius = 0) {
    if (!canDrawBox(w, h) || !pdfFinite(x) || !pdfFinite(y)) return false;
    setPdfFill(doc, color);
    const r = clampRadius(w, h, radius);
    try {
        if (r < 0.45) doc.rect(x, y, w, h, 'F');
        else doc.roundedRect(x, y, w, h, r, r, 'F');
        return true;
    } catch {
        try {
            doc.rect(x, y, w, h, 'F');
            return true;
        } catch {
            return false;
        }
    }
}

/** Stroke a rectangle. */
export function strokeBox(doc, x, y, w, h, color, radius = 0, lineWidth = 0.6) {
    if (!canDrawBox(w, h) || !pdfFinite(x) || !pdfFinite(y)) return false;
    setPdfStroke(doc, color);
    doc.setLineWidth(Math.max(0.2, pdfNum(lineWidth, 0.6)));
    const r = clampRadius(w, h, radius);
    try {
        if (r < 0.45) doc.rect(x, y, w, h, 'S');
        else doc.roundedRect(x, y, w, h, r, r, 'S');
        return true;
    } catch {
        try {
            doc.rect(x, y, w, h, 'S');
            return true;
        } catch {
            return false;
        }
    }
}

/** Fill + stroke. */
export function paintBox(doc, x, y, w, h, fill, stroke, radius = 0, lineWidth = 0.6) {
    const okFill = fill ? fillBox(doc, x, y, w, h, fill, radius) : canDrawBox(w, h);
    if (stroke) strokeBox(doc, x, y, w, h, stroke, radius, lineWidth);
    return okFill;
}

export function fillRule(doc, x, y, w, color, thickness = 0.6) {
    const t = Math.max(0.3, pdfNum(thickness));
    return fillBox(doc, x, y, w, t, color, 0);
}

export function fillPage(doc, color) {
    return fillBox(doc, 0, 0, PDF_PAGE_W, PDF_PAGE_H, color, 0);
}

/**
 * Track + filled share. A non-zero share always gets at least 0.6pt so
 * jsPDF never sees a rounded sliver thinner than its radius.
 */
export function fillPortion(doc, x, y, w, h, share, fill, track, radius = 0) {
    fillBox(doc, x, y, w, h, track, radius);
    const portion = Math.max(0, Math.min(1, pdfNum(share)));
    if (portion <= 0 || !canDrawBox(w, h)) return false;
    const pw = Math.min(w, Math.max(0.6, w * portion));
    return fillBox(doc, x, y, pw, h, fill, radius);
}

export function writePdfText(doc, text, x, y, options = {}) {
    if (!pdfFinite(x) || !pdfFinite(y)) return;
    const value = pdfSafeText(text);
    if (!value) return;
    try {
        if (options.maxWidth && pdfFinite(options.maxWidth) && options.maxWidth > 8) {
            doc.text(value, x, y, { maxWidth: options.maxWidth, align: options.align });
        } else if (options.align) {
            doc.text(value, x, y, { align: options.align });
        } else {
            doc.text(value, x, y);
        }
    } catch {
        try {
            doc.text(value.slice(0, 180), x, y);
        } catch {
            /* never throw from text */
        }
    }
}

export function setPdfFont(doc, family, style, size) {
    try {
        doc.setFont(family || 'helvetica', style || 'normal');
    } catch {
        doc.setFont('helvetica', 'normal');
    }
    const pt = pdfNum(size, 10);
    if (pt > 0) doc.setFontSize(pt);
}

export function wrapPdfLines(doc, text, maxWidth, maxLines = 4) {
    const value = pdfSafeText(text);
    if (!value) return [''];
    const width = Math.max(12, pdfNum(maxWidth, 120));
    let lines;
    try {
        lines = doc.splitTextToSize(value, width);
    } catch {
        lines = [value];
    }
    if (!Array.isArray(lines) || !lines.length) return [''];
    const limit = Math.max(1, pdfNum(maxLines, 4));
    if (lines.length <= limit) return lines.map((line) => pdfSafeText(line));
    const kept = lines.slice(0, limit).map((line) => pdfSafeText(line));
    const last = kept[limit - 1] || '';
    kept[limit - 1] = last.length > 3 ? `${last.slice(0, Math.max(1, last.length - 1))}...` : '...';
    return kept;
}
