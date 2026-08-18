/**
 * OpenExpense — PDF theme tokens
 *
 * Maps the on-screen light/dark palettes onto jsPDF colors and fonts.
 * Drawing primitives go through pdf-frame so thin pills cannot crash jsPDF.
 * Glyphs stay in the Helvetica latin set so month labels never render as mojibake.
 */
import { THEMES } from '../config.js';
import { fillBox, pdfSafeText as frameSafeText, strokeBox } from './pdf-frame.js';

/** @param {string} hex #rrggbb */
function hexToRgb(hex) {
    const n = parseInt(hex.slice(1), 16);
    return [(n >> 16) & 255, (n >> 8) & 255, (n >> 0) & 255];
}

/** @param {[number, number, number]} rgb */
function rgbHex([r, g, b]) {
    return `#${[r, g, b].map(v => v.toString(16).padStart(2, '0')).join('')}`;
}

/** Blend overlay onto base; alpha is overlay weight (0–1). */
export function mixHex(baseHex, overlayHex, alpha) {
    const base = hexToRgb(baseHex);
    const over = hexToRgb(overlayHex);
    return rgbHex(base.map((b, i) => Math.round(b * (1 - alpha) + over[i] * alpha)));
}

/**
 * Strip glyphs that Inter latin / Helvetica cannot draw.
 * The previous diamond marker became "%AE" in the monthly list.
 */
export function safePdfText(value) {
    return frameSafeText(value);
}

/** Map site theme tokens to PDF draw colors (hex strings for jsPDF). */
export function getPdfTheme(isDark, kind = 'expense') {
    const t = isDark ? THEMES.dark : THEMES.light;
    const income = kind === 'income';
    const accent = income ? t.income : t.accent;
    const paper = isDark ? t.bg : '#f3f1eb';
    const card = isDark ? t.surface : '#ffffff';

    return {
        page: paper,
        surface: t.surface,
        card,
        cardAlt: isDark ? t.surface2 : '#f7f5ef',
        border: t.border,
        borderStrong: t.borderStrong,
        text: t.textStrong,
        textSecondary: t.text,
        muted: t.text2,
        accent,
        accentHover: income ? t.incomeText : t.accentHover,
        success: t.success,
        successBg: mixHex(card, t.success, isDark ? 0.16 : 0.12),
        danger: t.dangerText,
        dangerBg: t.dangerBg,
        pending: accent,
        paid: t.success,
        heroBg: mixHex(card, accent, 0.12),
        accentTint: mixHex(card, accent, isDark ? 0.18 : 0.1),
        accentBorder: mixHex(t.border, accent, 0.32),
        pillBg: t.pillBg,
        pillText: t.pillText,
        brandNavy: '#002244',
        brandIndigo: '#1170cf',
        brandInk: '#f8fafc',
        brandMuted: '#93c5fd',
        brandStripe: '#0a4d9a',
        brandChip: '#3b82f6',
        brandCard: '#f8fafc',
        income: t.income,
        radius: { hero: 12, card: 8, bar: 3, sm: 5, mark: 9 },
        font: 'Inter',
        fontFallback: 'helvetica'
    };
}

/** Draw a rounded pill/badge. Fill and stroke are separate passes. */
export function drawPill(doc, x, y, w, h, { fill, stroke, lineWidth = 0.4 } = {}) {
    const radius = Math.min(8, Math.abs(w) / 2, Math.abs(h) / 2);
    if (fill != null) fillBox(doc, x, y, w, h, fill, radius);
    if (stroke != null) strokeBox(doc, x, y, w, h, stroke, radius, lineWidth);
}

export function setFill(doc, hex) { doc.setFillColor(hex); }
export function setDraw(doc, hex) { doc.setDrawColor(hex); }
export function setText(doc, hex) { doc.setTextColor(hex); }

/** Rounded content card. Optional top accent bar. */
export function drawCard(doc, x, y, w, h, c, { fill, stroke, accent, radius } = {}) {
    const r = radius ?? c.radius.card;
    fillBox(doc, x, y, w, h, fill || c.card, r);
    if (stroke) strokeBox(doc, x, y, w, h, stroke === true ? c.border : stroke, r, 0.45);
    if (accent) fillBox(doc, x, y, w, 3, accent, 0);
}

/**
 * OpenExpense card mark — same silhouette as icons/icon.svg,
 * drawn with rects so the PDF does not need an SVG embed.
 */
export function drawBrandMark(doc, x, y, size, c) {
    fillBox(doc, x, y, size, size, c.brandIndigo, size * 0.28);

    const cx = x + size * 0.16;
    const cy = y + size * 0.30;
    const cw = size * 0.68;
    const ch = size * 0.44;
    const cr = Math.max(1.4, size * 0.08);

    fillBox(doc, cx, cy, cw, ch, c.brandCard, cr);
    fillBox(doc, cx, cy + ch * 0.24, cw, Math.max(1.6, ch * 0.16), c.brandStripe, 0);
    fillBox(
        doc,
        cx + cw * 0.12,
        cy + ch * 0.58,
        cw * 0.24,
        Math.max(2, ch * 0.20),
        c.brandChip,
        1
    );
}

/** Left-aligned section label with thin rule beneath. */
export function drawSectionLabel(doc, theme, c, x, y, w, title) {
    setDocFont(doc, theme, 'bold', 10);
    setText(doc, c.text);
    doc.text(safePdfText(title), x, y);
    setDraw(doc, c.border);
    doc.setLineWidth(0.5);
    doc.line(x, y + 6, x + w, y + 6);
    return 18;
}

/** Small uppercase kicker used on brochure spreads. */
export function drawKicker(doc, theme, c, x, y, text) {
    setDocFont(doc, theme, 'bold', 8);
    setText(doc, c.accent);
    doc.text(safePdfText(text).toUpperCase(), x, y);
}

let interAvailable = false;

/** PDF generation stays offline and uses jsPDF's built-in Helvetica. */
export async function loadPdfFonts() {
    interAvailable = false;
    return false;
}

export function getActiveFontName(theme) {
    return interAvailable ? theme.font : theme.fontFallback;
}

function fontFamily(theme) {
    return getActiveFontName(theme);
}

/** @param {'normal'|'bold'} weight */
export function setDocFont(doc, theme, weight = 'normal', size = 10) {
    doc.setFont(fontFamily(theme), weight);
    doc.setFontSize(size);
}

export function setDocFontItalic(doc, theme, size = 10) {
    doc.setFont(fontFamily(theme), interAvailable ? 'normal' : 'italic');
    doc.setFontSize(size);
}
