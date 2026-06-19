import { THEMES } from '../config.js';

/** @param {string} hex #rrggbb */
function hexToRgb(hex) {
    const n = parseInt(hex.slice(1), 16);
    return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
}

/** @param {[number, number, number]} rgb */
function rgbHex([r, g, b]) {
    return `#${[r, g, b].map(v => v.toString(16).padStart(2, '0')).join('')}`;
}

/** Blend overlay onto base; alpha is overlay weight (0–1). */
function mixHex(baseHex, overlayHex, alpha) {
    const base = hexToRgb(baseHex);
    const over = hexToRgb(overlayHex);
    return rgbHex(base.map((b, i) => Math.round(b * (1 - alpha) + over[i] * alpha)));
}

/** Map site theme tokens to PDF draw colors (hex strings for jsPDF). */
export function getPdfTheme(isDark) {
    const t = isDark ? THEMES.dark : THEMES.light;

    return {
        page: t.bg,
        surface: t.surface,
        card: t.surface2,
        cardAlt: t.surface,
        border: t.border,
        borderStrong: t.borderStrong,
        text: t.textStrong,
        textSecondary: t.text,
        muted: t.text2,
        accent: t.accent,
        accentHover: t.accentHover,
        success: t.success,
        successBg: mixHex(t.surface2, t.success, isDark ? 0.14 : 0.12),
        danger: t.dangerText,
        dangerBg: t.dangerBg,
        pending: t.accent,
        paid: t.success,
        heroBg: mixHex(t.surface2, t.accent, 0.12),
        accentTint: mixHex(t.surface2, t.accent, 0.1),
        accentBorder: mixHex(t.border, t.accent, 0.28),
        pillBg: t.pillBg,
        pillText: t.pillText,
        radius: { hero: 12, card: 10, bar: 4, sm: 6 },
        font: 'Inter',
        fontFallback: 'helvetica'
    };
}

/** Capsule corner radius — jsPDF breaks when radius exceeds half width/height. */
export function pillRadius(w, h, max = 8) {
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

function setFill(doc, hex) { doc.setFillColor(hex); }
function setDraw(doc, hex) { doc.setDrawColor(hex); }
function setText(doc, hex) { doc.setTextColor(hex); }

/** Left-aligned section label with thin rule beneath. */
export function drawSectionLabel(doc, theme, c, x, y, w, title) {
    setDocFont(doc, theme, 'bold', 9);
    setText(doc, c.text);
    doc.text(title, x, y);
    setDraw(doc, c.border);
    doc.setLineWidth(0.5);
    doc.line(x, y + 6, x + w, y + 6);
    return 18;
}

const INTER_BASE = 'https://cdn.jsdelivr.net/npm/@fontsource/inter@5.2.5/files/inter-latin';
const INTER_FILES = [
    { weight: '400', style: 'normal' },
    { weight: '700', style: 'bold' }
];

let fontsPromise = null;
let interAvailable = false;

/** Load Inter into jsPDF VFS (cached). Returns true when Inter is usable. */
export async function loadPdfFonts(doc) {
    if (fontsPromise) return fontsPromise;

    fontsPromise = (async () => {
        try {
            for (const { weight, style } of INTER_FILES) {
                const file = `inter-latin-${weight}-normal.ttf`;
                const res = await fetch(`${INTER_BASE}-${weight}-normal.ttf`);
                if (!res.ok) return false;
                const bytes = new Uint8Array(await res.arrayBuffer());
                let binary = '';
                for (let i = 0; i < bytes.length; i++) binary += String.fromCharCode(bytes[i]);
                doc.addFileToVFS(file, btoa(binary));
                doc.addFont(file, 'Inter', style);
            }
            interAvailable = !!doc.getFontList().Inter;
            return interAvailable;
        } catch {
            return false;
        }
    })();

    return fontsPromise;
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
