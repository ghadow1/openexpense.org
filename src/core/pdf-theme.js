/**
 * OpenExpense — PDF theme tokens
 *
 * Maps the on-screen light/dark palettes onto jsPDF colors and fonts.
 * Drawing primitives go through pdf-frame so thin pills cannot crash jsPDF.
 * Glyphs stay in the Helvetica latin set so month labels never render as mojibake.
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
        fontFallback: 'helvetica'
    };
}
