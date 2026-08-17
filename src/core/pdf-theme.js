/**
 * OpenExpense — PDF theme tokens
 *
 * Maps the on-screen light/dark palettes onto jsPDF colors, fonts, and
 * brochure primitives (brand mark, cards, kickers). Glyphs stay in the
 * Inter latin set so month labels never render as mojibake.
 */
import { THEMES } from '../config.js';

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
    return String(value ?? '')
        .replace(/[\u2018\u2019]/g, "'")
        .replace(/[\u201C\u201D]/g, '"')
        .replace(/[\u2013\u2014]/g, '-')
        .replace(/\u2026/g, '...')
        .replace(/\u00D7/g, 'x')
        .replace(/[^\x09\x0A\x0D\x20-\x7E\xA0-\xFF]/g, '');
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
        brandNavy: '#0f172a',
        brandIndigo: '#059669',
        brandInk: '#f8fafc',
        brandMuted: '#94a3b8',
        brandStripe: '#047857',
        brandChip: '#34d399',
        brandCard: '#f8fafc',
        income: t.income,
        radius: { hero: 12, card: 8, bar: 3, sm: 5, mark: 9 },
        font: 'Inter',
        fontFallback: 'helvetica'
    };
}

/** Capsule corner radius — jsPDF breaks when radius exceeds half width/height. */
function pillRadius(w, h, max = 8) {
    return Math.min(w / 2, h / 2, max);
}

/** Draw a rounded pill/badge. Fill and stroke are separate passes. */
export function drawPill(doc, x, y, w, h, { fill, stroke, lineWidth = 0.4 } = {}) {
    const r = pillRadius(w, h);
    if (fill != null) {
        doc.setFillColor(fill);
        doc.roundedRect(x, y, w, h, r, r, 'F');
    }
    if (stroke != null) {
        doc.setDrawColor(stroke);
        doc.setLineWidth(lineWidth);
        doc.roundedRect(x, y, w, h, r, r, 'S');
    }
}

export function setFill(doc, hex) { doc.setFillColor(hex); }
export function setDraw(doc, hex) { doc.setDrawColor(hex); }
export function setText(doc, hex) { doc.setTextColor(hex); }

/** Rounded content card. Optional top accent bar. */
export function drawCard(doc, x, y, w, h, c, { fill, stroke, accent, radius } = {}) {
    const r = Math.min(radius ?? c.radius.card, w / 2, h / 2);
    setFill(doc, fill || c.card);
    doc.roundedRect(x, y, w, h, r, r, 'F');
    if (stroke) {
        setDraw(doc, stroke === true ? c.border : stroke);
        doc.setLineWidth(0.45);
        doc.roundedRect(x, y, w, h, r, r, 'S');
    }
    if (accent) {
        setFill(doc, accent);
        doc.rect(x, y, w, 3, 'F');
    }
}

/**
 * OpenExpense card mark — same silhouette as icons/icon.svg,
 * drawn with rects so the PDF does not need an SVG embed.
 */
export function drawBrandMark(doc, x, y, size, c) {
    const r = size * 0.28;
    setFill(doc, c.brandIndigo);
    doc.roundedRect(x, y, size, size, r, r, 'F');

    const cx = x + size * 0.16;
    const cy = y + size * 0.30;
    const cw = size * 0.68;
    const ch = size * 0.44;
    const cr = Math.max(1.4, size * 0.08);

    setFill(doc, c.brandCard);
    doc.roundedRect(cx, cy, cw, ch, cr, cr, 'F');

    setFill(doc, c.brandStripe);
    doc.rect(cx, cy + ch * 0.24, cw, Math.max(1.6, ch * 0.16), 'F');

    setFill(doc, c.brandChip);
    doc.roundedRect(
        cx + cw * 0.12,
        cy + ch * 0.58,
        cw * 0.24,
        Math.max(2, ch * 0.20),
        1, 1, 'F'
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

const INTER_BASE = 'https://cdn.jsdelivr.net/npm/@fontsource/inter@5.2.5/files/inter-latin';
const INTER_FILES = [
    { weight: '400', style: 'normal' },
    { weight: '700', style: 'bold' }
];

let fontCache = null;
let interAvailable = false;

async function fetchInterFonts() {
    const loaded = [];
    for (const { weight, style } of INTER_FILES) {
        const file = `inter-latin-${weight}-normal.ttf`;
        const res = await fetch(`${INTER_BASE}-${weight}-normal.ttf`);
        if (!res.ok) return null;
        const bytes = new Uint8Array(await res.arrayBuffer());
        let binary = '';
        for (let i = 0; i < bytes.length; i++) binary += String.fromCharCode(bytes[i]);
        loaded.push({ file, style, b64: btoa(binary) });
    }
    return loaded;
}

/** Load Inter into this jsPDF document (font bytes cached). */
export async function loadPdfFonts(doc) {
    try {
        if (!fontCache) fontCache = await fetchInterFonts();
        if (!fontCache) {
            interAvailable = false;
            return false;
        }
        for (const { file, style, b64 } of fontCache) {
            doc.addFileToVFS(file, b64);
            doc.addFont(file, 'Inter', style);
        }
        interAvailable = !!doc.getFontList().Inter;
        return interAvailable;
    } catch {
        interAvailable = false;
        return false;
    }
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
