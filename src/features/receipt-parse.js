/**
 * OpenExpense — receipt / invoice text parser
 *
 * Turns OCR (or PDF) lines into { merchant, date, total, tax, items, kind }.
 * Public API: normalizeOcrText, normalizeLines, textQuality, parseReceipt.
 */
import { Utils } from '../core/utils.js';

const MONTHS = { jan: 1, feb: 2, mar: 3, apr: 4, may: 5, jun: 6, jul: 7, aug: 8, sep: 9, oct: 10, nov: 11, dec: 12 };

const TOTAL_LABEL = /(?:grand\s*)?total(?:\s*(?:due|amount|sale|charge))?|amount\s*due|balance\s*due|total\s*due|pay\s*(?:this\s*)?amount|please\s*pay|amount\s*paid|you\s*paid|invoice\s*total|order\s*total|card\s*total|new\s*charges|amount\s*owing|to\s*pay|gesamt(?:betrag)?|total\s*ttc|montant\s*d[uû]/i;
const WEAK_TOTAL = /\b(?:amount|balance|charge|paid|due)\b/i;
const ANTI_TOTAL = /sub\s*-?total|tax(?:es|able)?|vat|gst|hst|tip|gratuity|change|cash|tender|visa|mastercard|amex|discover|debit|credit\s*card|auth(?:orization)?|approval|surcharge|fee(?!d)|discount|savings|qty|quantity|change\s*due|payment\s*method/i;
const SKIP_MERCHANT = /^(receipt|invoice|tax\s*invoice|statement|bill|thank\s*you|welcome|customer\s*copy|merchant\s*copy|store\s*#|terminal|cashier|www\.|http|tel|phone|fax|date|time|invoice\s*#|account|sold\s*to|bill\s*to|ship\s*to|page\s*\d)/i;
const ADDRESS = /\b(street|st\.|blvd|boulevard|ave|avenue|floor|suite|drive|road|rd\.|lane|ln\.|p\.?\s*o\.?\s*box)\b/i;
const KNOWN_MERCHANTS = [
    [/zoom\s+communications?/i, 'Zoom Communications'],
    [/\bzoom[l1i]?\b/i, 'Zoom Communications'],
    [/amazon\.?\s*com|amzn/i, 'Amazon'],
    [/whole\s*foods/i, 'Whole Foods'],
    [/costco/i, 'Costco'],
    [/wal\s*-?mart/i, 'Walmart'],
    [/walgreens/i, 'Walgreens'],
    [/\bcvs\b/i, 'CVS'],
    [/starbucks/i, 'Starbucks'],
    [/target\b/i, 'Target'],
    [/home\s*depot/i, 'Home Depot'],
    [/lowe'?s/i, "Lowe's"],
    [/best\s*buy/i, 'Best Buy'],
    [/mcdonald'?s/i, "McDonald's"],
    [/chipotle/i, 'Chipotle'],
    [/uber\s*eats/i, 'Uber Eats'],
    [/\buber\b/i, 'Uber'],
    [/doordash/i, 'DoorDash'],
    [/\blyft\b/i, 'Lyft'],
    [/netflix/i, 'Netflix'],
    [/spotify/i, 'Spotify'],
    [/apple\.?\s*com|apple\s*store|itunes/i, 'Apple'],
    [/google\s*(one|cloud|workspace|play)?/i, 'Google'],
    [/microsoft|office\s*365/i, 'Microsoft'],
    [/adobe/i, 'Adobe'],
    [/github/i, 'GitHub'],
    [/openai|chatgpt/i, 'OpenAI'],
    [/shell\s*(oil|station)?/i, 'Shell'],
    [/chevron/i, 'Chevron'],
    [/exxon|mobil/i, 'ExxonMobil'],
    [/bp\s*(gas|station)?/i, 'BP'],
    [/stripe/i, 'Stripe'],
    [/shopify/i, 'Shopify'],
    [/paypal/i, 'PayPal'],
    [/square/i, 'Square']
];

export function normalizeOcrText(text) {
    return String(text || '')
        .replace(/[|]/g, ' ')
        .replace(/(\d)[, ](\d{3})(?=\D|$)/g, '$1$2')
        .replace(/(\d)[lI](\d{2})\b/g, '$1.$2')
        .replace(/\bO(\d)/g, '0$1')
        .replace(/(\d)O\b/g, '$10')
        .replace(/\bS(?=\d)/g, '5')
        .replace(/\bzooml\b/gi, 'Zoom')
        .replace(/[ \t]+/g, ' ')
        .trim();
}

export function normalizeLines(lineList) {
    return (lineList || [])
        .map((line) => normalizeOcrText(line))
        .filter(Boolean);
}

function parseMoneyToken(raw) {
    if (raw == null) return null;
    let s = String(raw).trim();
    if (!s) return null;
    s = s.replace(/(?:usd|eur|gbp|cad|aud|\$|€|£)\s*/ig, '');
    s = s.replace(/[^\d,.\-]/g, '');
    if (!s) return null;

    const eu = /^\d{1,3}(?:\.\d{3})+,\d{2}$/.test(s) || (/^\d+,\d{2}$/.test(s) && !/\./.test(s));
    if (eu) s = s.replace(/\./g, '').replace(',', '.');
    else s = s.replace(/,/g, '');

    const value = parseFloat(s);
    if (!Number.isFinite(value) || value < 0 || value > 1_000_000) return null;
    return Math.round(value * 100) / 100;
}

function allMoneyOnLine(line) {
    const amounts = [];
    const patterns = [
        /(?:usd|cad|aud|\$)\s*(\d{1,3}(?:,\d{3})*(?:\.\d{2})?|\d+\.\d{2}|\d+,\d{2})/gi,
        /(\d{1,3}(?:,\d{3})*\.\d{2}|\d+,\d{2}|\d+\.\d{2})\s*(?:usd|eur|gbp|cad|aud|\$|€|£)/gi,
        /(?:€|£)\s*(\d{1,3}(?:[.,]\d{3})*[.,]\d{2}|\d+[.,]\d{2})/gi,
        /(?<![A-Za-z./])(\d{1,3}(?:,\d{3})*\.\d{2}|\d+,\d{2}|\d+\.\d{2})(?!\d)/g
    ];
    const seen = new Set();
    for (const pat of patterns) {
        for (const match of String(line).matchAll(pat)) {
            const value = parseMoneyToken(match[1] || match[0]);
            if (value == null || seen.has(value)) continue;
            if (value >= 10000 && !/[\$€£]|usd|eur/i.test(line)) continue;
            seen.add(value);
            amounts.push(value);
        }
        if (amounts.length) break;
    }
    return amounts;
}

function moneyOnLine(line) {
    const amounts = allMoneyOnLine(line);
    return amounts.length ? amounts[amounts.length - 1] : null;
}

function isAddressOrMeta(line) {
    const t = String(line || '').trim();
    return ADDRESS.test(t)
        || /,\s*[A-Z]{2}\s+\d{5}/.test(t)
        || /\b\d{1,5}\s+\w+\s+(street|st|blvd|ave|rd|dr)\b/i.test(t)
        || /^invoice\s*#?/i.test(t)
        || /^account\s*(number|#)/i.test(t)
        || /federal\s*employer|ein\b/i.test(t)
        || /purchase\s*order/i.test(t)
        || /^(sold|bill|ship)\s*to/i.test(t)
        || /^\d{5}(-\d{4})?$/.test(t)
        || /www\.|https?:\/\//i.test(t)
        || /\b\d{3}[-. )]\d{3}[-.]\d{4}\b/.test(t);
}

function detectKind(text, lines) {
    const blob = `${text}\n${(lines || []).join('\n')}`.toLowerCase();
    const invoiceHits = (blob.match(/invoice|amount due|bill to|due date|billing period|statement/g) || []).length;
    const receiptHits = (blob.match(/subtotal|change due|cashier|thank you|store #|terminal|card ending/g) || []).length;
    if (invoiceHits >= 2 && invoiceHits > receiptHits) return 'invoice';
    if (/utility|electric|gas bill|water bill|statement of account/.test(blob)) return 'bill';
    return 'receipt';
}

function fuzzyMonth(word) {
    const w = String(word || '').toLowerCase().replace(/[^a-z]/g, '');
    if (!w) return null;
    if (MONTHS[w.slice(0, 3)]) return w.slice(0, 3);
    let best = null;
    let bestDist = 3;
    for (const key of Object.keys(MONTHS)) {
        let dist = Math.abs(w.length - key.length);
        for (let i = 0; i < Math.min(w.length, key.length); i++) dist += w[i] === key[i] ? 0 : 1;
        if (dist < bestDist) { bestDist = dist; best = key; }
    }
    return bestDist <= 2 ? best : null;
}

function validIsoDate(yearInput, monthInput, dayInput) {
    let year = Number(yearInput);
    const month = Number(monthInput);
    const day = Number(dayInput);
    if (year < 100) year += year >= 70 ? 1900 : 2000;
    if (!Number.isInteger(year) || !Number.isInteger(month) || !Number.isInteger(day)
        || year < 2000 || year > 2100 || month < 1 || month > 12 || day < 1) {
        return null;
    }

    // Date constructors normalize impossible dates (February 31 → March 3).
    // Round-tripping the UTC fields rejects that silent rollover before an OCR
    // suggestion can place a transaction on the wrong calendar day.
    const candidate = new Date(Date.UTC(year, month - 1, day));
    if (candidate.getUTCFullYear() !== year
        || candidate.getUTCMonth() !== month - 1
        || candidate.getUTCDate() !== day) {
        return null;
    }
    return `${year}-${Utils.pad(month)}-${Utils.pad(day)}`;
}

function parseDate(text, lines) {
    const sources = [...(lines || []), text];
    const found = [];

    for (const src of sources) {
        const norm = normalizeOcrText(src).replace(/[|:]/g, ' ');
        const labeled = /(?:invoice|due|service|issue|order|trans(?:action)?)?\s*date[:\s]+/i.test(norm);
        const push = (value) => { if (value) found.push({ value, labeled }); };

        let m = norm.match(/(?:invoice|due|service|issue|order)?\s*date[:\s]+([a-z]{3,9})\s+(\d{1,2}),?\s+(\d{2,4})/i);
        if (m) push(validIsoDate(m[3], MONTHS[fuzzyMonth(m[1])] || 0, m[2]));

        m = norm.match(/([a-z]{3,9})\s+(\d{1,2}),?\s+(\d{2,4})/i);
        if (m) {
            const mon = fuzzyMonth(m[1]);
            if (mon) push(validIsoDate(m[3], MONTHS[mon], m[2]));
        }

        m = norm.match(/(\d{1,2})\s+([a-z]{3,9})\s+(\d{2,4})/i);
        if (m) {
            const mon = fuzzyMonth(m[2]);
            if (mon) push(validIsoDate(m[3], MONTHS[mon], m[1]));
        }

        m = norm.match(/(\d{4})[-/.](\d{1,2})[-/.](\d{1,2})/);
        if (m) {
            push(validIsoDate(m[1], m[2], m[3]));
            // Do not let the generic MM/DD/YY branch reinterpret the tail of
            // an invalid ISO date (2026-02-31) as the valid 2031-02-26.
            continue;
        }

        m = norm.match(/(\d{1,2})[-/.](\d{1,2})[-/.](\d{2,4})/);
        if (m) {
            let mm = +m[1];
            let dd = +m[2];
            if (mm > 12 && dd <= 12) [mm, dd] = [dd, mm];
            push(validIsoDate(m[3], mm, dd));
        }
    }

    return (found.find((d) => d.labeled) || found[0] || {}).value || null;
}

function scoreAmount(line) {
    const lower = String(line || '').toLowerCase();
    const amt = moneyOnLine(line);
    if (amt == null) return null;

    let score = 10;
    if (TOTAL_LABEL.test(lower)) score += 140;
    else if (WEAK_TOTAL.test(lower) && !ANTI_TOTAL.test(lower)) score += 55;
    if (ANTI_TOTAL.test(lower) && !TOTAL_LABEL.test(lower)) score -= 110;
    if (isAddressOrMeta(line)) score -= 200;
    if (amt < 0.01) score -= 80;
    if (amt >= 1000 && !/[\$€£]|usd|total|due/i.test(line)) score -= 80;
    if (/\b(tel|phone|fax|store|terminal|#)\b/i.test(lower)) score -= 60;
    return { amt, score, line };
}

function parseTotalFromText(text) {
    const re = /(?:grand\s*total|amount\s*due|balance\s*due|total\s*due|please\s*pay|pay\s*this\s*amount|invoice\s*total|order\s*total|\btotal\b)[:\s]*[\$€£]?\s*(\d{1,3}(?:,\d{3})*(?:\.\d{2})?|\d+[.,]\d{2})/gi;
    let best = null;
    for (const match of String(text || '').matchAll(re)) {
        const value = parseMoneyToken(match[1]);
        if (value != null) best = value;
    }
    return best;
}

function pickTotal(lines, text, kind) {
    const labeled = [];
    const weak = [];
    for (const line of lines) {
        const scored = scoreAmount(line);
        if (!scored) continue;
        if (scored.score >= 80) labeled.push(scored);
        else if (scored.score > 0) weak.push(scored);
    }

    if (labeled.length) {
        labeled.sort((a, b) => b.score - a.score || b.amt - a.amt);
        return labeled[0].amt;
    }

    const fromText = parseTotalFromText(text);
    if (fromText != null) return fromText;

    if (kind === 'invoice' || kind === 'bill') {
        const due = String(text).match(/(?:amount|balance|total)\s*due[:\s]*[\$€£]?\s*([\d,]+(?:\.\d{2})?)/i);
        if (due) {
            const value = parseMoneyToken(due[1]);
            if (value != null) return value;
        }
    }

    const plausible = weak
        .map((row) => row.amt)
        .filter((amt) => amt >= 0.5 && amt < 20_000);
    if (!plausible.length) return null;
    return Math.max(...plausible);
}

function parseMerchant(lineList, text) {
    const blob = String(text || '');
    for (const [pat, name] of KNOWN_MERCHANTS) {
        if (pat.test(blob)) return name;
    }

    const companyPat = /\b(inc\.?|llc\.?|corp\.?|ltd\.?|co\.|communications|incorporated|restaurant|cafe|café|market|grocery|pharmacy)\b/i;
    for (const line of lineList.slice(0, 20)) {
        if (isAddressOrMeta(line) || SKIP_MERCHANT.test(line) || allMoneyOnLine(line).length) continue;
        if (companyPat.test(line) && (line.match(/[A-Za-z]/g) || []).length >= 4) {
            return line.replace(/\s{2,}/g, ' ').trim().slice(0, 60);
        }
    }

    for (const line of lineList.slice(0, 10)) {
        if (isAddressOrMeta(line) || SKIP_MERCHANT.test(line)) continue;
        const letters = (line.match(/[A-Za-z]/g) || []).length;
        const digits = (line.match(/\d/g) || []).length;
        if (letters >= 4 && letters > digits * 2 && line.length >= 4 && line.length <= 48) {
            return line.replace(/\s{2,}/g, ' ').trim().slice(0, 60);
        }
    }

    return lineList.find((l) => l.length >= 3 && !/^\d+$/.test(l) && !SKIP_MERCHANT.test(l))?.slice(0, 60) || '';
}

function parseItems(lineList) {
    const skip = /sub\s*-?total|\btax(?:es)?\b|vat|gst|hst|fees|surcharges|change|tender|payment|visa|mastercard|amex|debit|credit|tip|balance\s*forward|payment\s*terms|currency|qty|quantity/i;
    const items = [];
    for (const line of lineList) {
        if (skip.test(line) || TOTAL_LABEL.test(line) || isAddressOrMeta(line)) continue;
        const charge = line.match(/charge\s*(?:name)?[:\s]+(.+)/i);
        if (charge) {
            items.push(charge[1].trim().slice(0, 72));
            continue;
        }
        const amt = moneyOnLine(line);
        if (amt != null && amt > 0 && /[A-Za-z]/.test(line)) {
            items.push(line.replace(/\s{2,}/g, ' ').trim().slice(0, 72));
        }
        if (items.length >= 8) break;
    }
    return items;
}

function parseTax(lineList) {
    for (const line of lineList) {
        if (/\b(?:sales\s*)?tax(?:es)?\b|vat|gst|hst|fees?\s*&?\s*surcharges?/i.test(line) && !TOTAL_LABEL.test(line)) {
            const amounts = allMoneyOnLine(line);
            if (amounts.length) return amounts[amounts.length - 1];
        }
    }
    return null;
}

export function textQuality(text, lines) {
    const body = String(text || '');
    const letters = (body.match(/[A-Za-z]/g) || []).length;
    const money = allMoneyOnLine(body).length;
    return {
        letters,
        lines: (lines || []).length,
        money,
        usable: letters >= 18 && (lines || []).length >= 2
    };
}

export function parseReceipt(text, lines, confidence = 0) {
    const lineList = normalizeLines(lines && lines.length ? lines : String(text || '').split('\n'));
    const body = normalizeOcrText(text || lineList.join('\n'));
    const kind = detectKind(body, lineList);
    const total = pickTotal(lineList, body, kind);
    const merchant = parseMerchant(lineList, body);
    const items = parseItems(lineList);
    const tax = parseTax(lineList);
    const quality = textQuality(body, lineList);

    return {
        kind,
        merchant,
        total,
        tax,
        date: parseDate(body, lineList),
        items,
        rawText: body,
        confidence,
        lowConfidence: (confidence > 0 && confidence < 0.55) || !quality.usable || total == null
    };
}
