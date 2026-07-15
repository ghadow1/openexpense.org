const MONTHS = { jan: 1, feb: 2, mar: 3, apr: 4, may: 5, jun: 6, jul: 7, aug: 8, sep: 9, oct: 10, nov: 11, dec: 12 };
const MONTH_NAMES = Object.keys(MONTHS);

const ADDRESS_OR_META_PATTERN = /\b(street|st\.|blvd|boulevard|ave|avenue|floor|suite|drive|road|rd\.)\b/i;
const SUMMARY_LINE_PATTERN = /sub\s*-?total|taxes|fees|surcharges|tip|change|tender|payment\s*method|visa|mastercard|amex|balance\s*forward|amount\s*due|balance\s*due|total\s*due|\btotal\b/i;
const ITEM_SKIP_PATTERN = /sub\s*-?total|taxes|fees|surcharges|change|tender|payment|visa|mastercard|amex|debit|credit|tip|balance\s*forward|payment\s*terms|currency|certificate|charge\s*description|billing\s*period/i;
const TOTAL_KEY_PATTERN = /(grand\s*total|amount\s*due|balance\s*due|total\s*due|\btotal\b)/i;

const KNOWN_MERCHANTS = [
    [/zoom\s+communications?,?\s*inc\.?/i, 'Zoom Communications, Inc.'],
    [/\bzoom[l1i]?\b/i, 'Zoom Communications, Inc.'],
    [/amazon\.?\s*com/i, 'Amazon'],
    [/whole\s*foods/i, 'Whole Foods'],
    [/costco\s*wholesale/i, 'Costco'],
    [/target\s*(store|corp)?/i, 'Target'],
    [/walmart/i, 'Walmart'],
    [/starbucks/i, 'Starbucks']
];

function pad(n) {
    return String(n).padStart(2, '0');
}

function isoDate(y, m, d) {
    y = +y;
    m = +m;
    d = +d;
    if (y < 100) y += 2000;
    if (m < 1 || m > 12 || d < 1 || d > 31) return null;
    return `${y}-${pad(m)}-${pad(d)}`;
}

function validAmount(value, max = 100_000) {
    return !Number.isNaN(value) && value >= 0 && value < max;
}

export const ReceiptParser = {
    // OCR_PARSE_CORRECTIONS: keep low-risk substitutions here so vendor/model
    // quirks do not spread through the receipt pipeline.
    normalizeLines(lineList) {
        return lineList.map(line => line
            .replace(/\bzooml\b/gi, 'Zoom')
            .replace(/(\d)[|lI](\d{2})\b/g, '$1.$2')
            .replace(/\s+/g, ' ')
            .trim()
        ).filter(Boolean);
    },

    normalizeText(text, lines = []) {
        return (text || lines.join('\n'))
            .replace(/\bzooml\b/gi, 'Zoom Communications')
            .replace(/zoom\s*c[o0]mmunications/gi, 'Zoom Communications');
    },

    // OCR_PARSE_MONEY: prefer explicit currency matches, then plain decimal
    // amounts. The last amount on a receipt row is usually the line total.
    allMoneyOnLine(line) {
        const amounts = [];
        for (const m of line.matchAll(/\$\s*(\d{1,6}[.,]\d{2})/g)) {
            const v = parseFloat(m[1].replace(',', '.'));
            if (validAmount(v)) amounts.push(v);
        }
        if (!amounts.length) {
            for (const m of line.matchAll(/(?<!\d)(\d{1,4}[.,]\d{2})(?!\d)/g)) {
                const v = parseFloat(m[1].replace(',', '.'));
                if (validAmount(v)) amounts.push(v);
            }
        }
        return amounts;
    },

    moneyOnLine(line) {
        const amounts = ReceiptParser.allMoneyOnLine(line);
        return amounts.length ? amounts[amounts.length - 1] : null;
    },

    isAddressOrMeta(line) {
        return ADDRESS_OR_META_PATTERN.test(line)
            || /,\s*[A-Z]{2}\s+\d{5}/.test(line)
            || /\b\d{1,5}\s+\w+\s+(street|st|blvd|ave)/i.test(line)
            || /^invoice\s*#?/i.test(line)
            || /^account\s*(number|#)/i.test(line)
            || /federal\s*employer/i.test(line)
            || /purchase\s*order/i.test(line)
            || /^(sold|bill)\s*to/i.test(line)
            || /^\d{5}(-\d{4})?$/.test(line.trim());
    },

    fuzzyMonth(word) {
        const w = word.toLowerCase().replace(/[^a-z]/g, '');
        if (MONTH_NAMES.includes(w.slice(0, 3))) return w.slice(0, 3);

        let best = null;
        let bestDist = 3;
        for (const month of MONTH_NAMES) {
            let dist = 0;
            for (let i = 0; i < Math.min(w.length, month.length); i++) {
                dist += w[i] === month[i] ? 0 : 1;
            }
            dist += Math.abs(w.length - month.length);
            if (dist < bestDist) {
                bestDist = dist;
                best = month;
            }
        }
        return bestDist <= 2 ? best : null;
    },

    parseDate(text, lines = []) {
        const sources = [...lines, text];

        for (const src of sources) {
            const norm = src.replace(/[|:]/g, ' ').replace(/\s+/g, ' ');
            let match = norm.match(/(?:invoice|due|service|issue)?\s*date[:\s]+([a-z]{3,9})\s+(\d{1,2}),?\s+(\d{2,4})/i);
            if (match) {
                const mon = ReceiptParser.fuzzyMonth(match[1]);
                if (mon) return isoDate(match[3], MONTHS[mon], match[2]);
            }

            match = norm.match(/([a-z]{3,9})\s+(\d{1,2}),?\s+(\d{2,4})/i);
            if (match) {
                const mon = ReceiptParser.fuzzyMonth(match[1]);
                if (mon) return isoDate(match[3], MONTHS[mon], match[2]);
            }

            match = norm.match(/(\d{4})[-/.](\d{1,2})[-/.](\d{1,2})/);
            if (match) return isoDate(match[1], match[2], match[3]);

            match = norm.match(/(\d{1,2})[-/.](\d{1,2})[-/.](\d{2,4})/);
            if (match) {
                let mm = +match[1];
                let dd = +match[2];
                if (mm > 12 && dd <= 12) [mm, dd] = [dd, mm];
                return isoDate(match[3], mm, dd);
            }
        }
        return null;
    },

    scoreAmount(line) {
        const lower = line.toLowerCase();
        let score = 0;
        if (/grand\s*total|amount\s*due|balance\s*due|total\s*due|total\s*amount/i.test(lower)) score += 120;
        else if (/\btotal\b/i.test(lower) && !/sub|taxes|fees|surcharges/i.test(lower)) score += 90;
        else if (/\bamount\b/i.test(lower)) score += 70;
        if (/sub\s*-?total|taxes|fees|surcharges|tip|change|tender|payment\s*method|visa|mastercard|amex/i.test(lower)) score -= 80;
        if (ReceiptParser.isAddressOrMeta(line)) score -= 200;

        const amt = ReceiptParser.moneyOnLine(line);
        if (amt == null) return null;
        if (amt < 0.01) score -= 60;
        if (amt >= 1000 && !/\$\s*\d/.test(line)) score -= 150;
        return { amt, score, line };
    },

    rowTotalFromAmounts(amounts) {
        if (amounts.length >= 3) return amounts[amounts.length - 1];
        if (amounts.length === 2) {
            const [a, b] = amounts;
            if (b < a && b < 1 && a > 0) return Math.round((a + b) * 100) / 100;
            return b;
        }
        return amounts.length === 1 ? amounts[0] : null;
    },

    collectInvoiceAmounts(lineList) {
        const rows = [];
        for (let i = 0; i < lineList.length; i++) {
            const line = lineList[i];
            if (ReceiptParser.isAddressOrMeta(line) || SUMMARY_LINE_PATTERN.test(line)) continue;
            const amounts = ReceiptParser.allMoneyOnLine(line);
            if (!amounts.length) continue;

            if (amounts.length >= 2) {
                const rowTotal = ReceiptParser.rowTotalFromAmounts(amounts);
                if (rowTotal != null) rows.push(rowTotal);
                continue;
            }

            let paired = null;
            for (let j = i + 1; j < Math.min(i + 4, lineList.length); j++) {
                if (SUMMARY_LINE_PATTERN.test(lineList[j])) break;
                const next = ReceiptParser.allMoneyOnLine(lineList[j]);
                if (!next.length) continue;
                if (next.length === 1 && next[0] < amounts[0] && next[0] < 1 && amounts[0] > 0) {
                    paired = Math.round((amounts[0] + next[0]) * 100) / 100;
                }
                break;
            }
            rows.push(paired != null ? paired : amounts[0]);
        }

        const positive = rows.filter(v => v > 0 && v < 500);
        if (!positive.length) return null;
        return Math.round(positive.reduce((a, b) => a + b, 0) * 100) / 100;
    },

    parseTotalFromText(text) {
        const triple = text.match(/\$\s*(\d+\.\d{2})\s+\$\s*(\d+\.\d{2})\s+\$\s*(\d+\.\d{2})/);
        if (triple) {
            const a = parseFloat(triple[1]);
            const b = parseFloat(triple[2]);
            const c = parseFloat(triple[3]);
            if (Math.abs(c - (a + b)) < 0.06) return c;
        }
        const due = text.match(/(?:amount|balance|total)\s*due[:\s]*\$?\s*(\d+\.\d{2})/i);
        if (due) return parseFloat(due[1]);
        return null;
    },

    sumInvoiceRowTotals(lineList) {
        let sum = 0;
        let rows = 0;
        for (const line of lineList) {
            if (ReceiptParser.isAddressOrMeta(line) || SUMMARY_LINE_PATTERN.test(line)) continue;
            const amounts = ReceiptParser.allMoneyOnLine(line);
            if (amounts.length < 2) continue;
            const rowTotal = ReceiptParser.rowTotalFromAmounts(amounts);
            if (rowTotal == null) continue;
            sum += rowTotal;
            rows++;
        }
        return rows > 0 ? Math.round(sum * 100) / 100 : null;
    },

    inferTotalFromAmounts(lineList) {
        const amounts = [];
        for (const line of lineList) {
            if (ReceiptParser.isAddressOrMeta(line)) continue;
            amounts.push(...ReceiptParser.allMoneyOnLine(line));
        }
        const positive = amounts.filter(a => a > 0 && a < 500);
        if (!positive.length) return null;

        const subtotals = positive.filter(a => a >= 1);
        const fees = positive.filter(a => a > 0 && a < 1);
        if (subtotals.length && fees.length) {
            return Math.round((Math.max(...subtotals) + Math.max(...fees)) * 100) / 100;
        }

        return Math.max(...positive);
    },

    parseMerchant(lineList, text) {
        const companyPat = /\b(inc\.?|llc\.?|corp\.?|ltd\.?|communications|incorporated)\b/i;
        const skipPat = /^(invoice|zoom)$/i;

        for (const [pat, name] of KNOWN_MERCHANTS) {
            if (pat.test(text)) return name;
        }

        for (const line of lineList.slice(0, 25)) {
            if (ReceiptParser.isAddressOrMeta(line) || skipPat.test(line.trim())) continue;
            if (companyPat.test(line)) {
                return line.replace(/\s{2,}/g, ' ').trim().slice(0, 60);
            }
        }

        const zoomMatch = text.match(/zoom\s+communications,?\s*inc\.?/i);
        if (zoomMatch) return zoomMatch[0].replace(/\s+/g, ' ').trim();

        for (const line of lineList.slice(0, 12)) {
            const trimmed = line.trim();
            if (/^zoom[l1i]?$/i.test(trimmed) || /^zoom\s*communications/i.test(trimmed)) {
                return 'Zoom Communications, Inc.';
            }
        }

        for (const line of lineList.slice(0, 12)) {
            if (ReceiptParser.isAddressOrMeta(line)) continue;
            const letters = (line.match(/[A-Za-z]/g) || []).length;
            const digits = (line.match(/\d/g) || []).length;
            if (letters >= 5 && letters > digits * 2 && line.length >= 5) {
                return line.replace(/\s{2,}/g, ' ').trim().slice(0, 60);
            }
        }

        for (const line of lineList.slice(0, 6)) {
            if (/^zoom\b/i.test(line.trim())) return 'Zoom Communications, Inc.';
        }
        return lineList.find(l => l.length >= 3 && !/^\d+$/.test(l))?.slice(0, 60) || '';
    },

    parseItems(lineList) {
        const items = [];

        for (const line of lineList) {
            if (ITEM_SKIP_PATTERN.test(line) || TOTAL_KEY_PATTERN.test(line) || ReceiptParser.isAddressOrMeta(line)) continue;

            const charge = line.match(/charge\s*name[:\s]+(.+)/i);
            if (charge) {
                items.push(charge[1].trim().slice(0, 72));
                continue;
            }

            if (/\$\s*\d+\.\d{2}/.test(line)) {
                const amt = ReceiptParser.moneyOnLine(line);
                if (amt != null && amt > 0) {
                    items.push(line.replace(/\s{2,}/g, ' ').trim().slice(0, 72));
                }
            }
            if (items.length >= 6) break;
        }
        return items;
    },

    parse(text, lines, confidence = 0) {
        const lineList = (lines && lines.length)
            ? lines
            : text.split('\n').map(l => l.trim()).filter(Boolean);

        let total = null;
        let bestScore = -Infinity;
        for (const line of lineList) {
            const scored = ReceiptParser.scoreAmount(line);
            if (scored && scored.score > bestScore) {
                bestScore = scored.score;
                total = scored.amt;
            }
        }

        const invoiceSum = ReceiptParser.sumInvoiceRowTotals(lineList);
        const clustered = ReceiptParser.collectInvoiceAmounts(lineList);
        const textTotal = ReceiptParser.parseTotalFromText(text);

        // OCR_PARSE_TOTAL: start with the strongest labeled line, then let
        // explicit text totals and row-sum strategies replace suspicious small
        // or oversized candidates. This keeps receipts and invoices in one path.
        for (const candidate of [textTotal, clustered, invoiceSum, ReceiptParser.inferTotalFromAmounts(lineList)]) {
            if (candidate != null && (total == null || total > 500 || candidate > (total || 0))) {
                total = candidate;
            }
        }

        if (total == null) {
            const amounts = lineList
                .filter(l => !ReceiptParser.isAddressOrMeta(l))
                .map(ReceiptParser.moneyOnLine)
                .filter(v => v != null && v > 0 && v < 10_000);
            if (amounts.length) total = amounts.reduce((a, b) => a + b, 0);
            if (total != null) total = Math.round(total * 100) / 100;
        }

        let tax = null;
        for (const line of lineList) {
            if (/\btax(es)?\b|fees?\s*&?\s*surcharges?/i.test(line)) {
                const amounts = ReceiptParser.allMoneyOnLine(line);
                if (amounts.length) tax = amounts[amounts.length - 1];
            }
        }

        return {
            merchant: ReceiptParser.parseMerchant(lineList, text),
            total,
            tax,
            date: ReceiptParser.parseDate(text, lineList),
            items: ReceiptParser.parseItems(lineList),
            rawText: text,
            confidence,
            lowConfidence: confidence > 0 && confidence < 0.55
        };
    }
};
