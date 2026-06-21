import { Utils } from '../core/utils.js';
import { patch } from '../core/store.js';
import { Toast } from '../ui/toast.js';
import { saveExpense } from './modal.js';

const OCR_LOG_TAG = '[OpenExpense][OCR]';
const OCR_MIN_SIDE = 1000;
const OCR_DESKTOP_MAX_SIDE = 2400;
const OCR_MOBILE_MAX_SIDE = 2000;
const PDF_MAX_SCALE = 2.5;

export const Receipt = {
    // Lazy-loaded from CDN on first scan. index.html must define an import map for
    // onnxruntime-web and ppu-ocv/canvas-web (peer deps of ppu-paddle-ocr).
    OCR_CDN: 'https://cdn.jsdelivr.net/npm/ppu-paddle-ocr@5.8.0/web/index.js',
    PDF_CDN: 'https://cdn.jsdelivr.net/npm/pdfjs-dist@4.10.38/build/pdf.mjs',
    PDF_WORKER: 'https://cdn.jsdelivr.net/npm/pdfjs-dist@4.10.38/build/pdf.worker.min.mjs',
    _service: null,
    _initPromise: null,
    _pdfjs: null,
    _pdfjsPromise: null,
    _previewUrl: null,
    _lastFile: null,

    // [OCR:entry] File picking keeps the platform-native path: camera capture on
    // coarse/mobile pointers, regular file picker on desktop.
    isPdf(file) {
        if (!file) return false;
        const type = (file.type || '').toLowerCase();
        const name = (file.name || '').toLowerCase();
        return type === 'application/pdf' || name.endsWith('.pdf');
    },

    pickImage() {
        const input = document.getElementById('receipt-scan-input');
        if (!input) return;
        input.value = '';
        if (Utils.prefersCamera()) input.setAttribute('capture', 'environment');
        else input.removeAttribute('capture');
        input.click();
    },

    // [OCR:engine] The OCR model is large enough to lazy-load, then warm during
    // idle time so repeat scans use the browser's cached WASM/model resources.
    warmEngine() {
        if (Receipt._warmStarted) return Receipt._warmPromise;
        Receipt._warmStarted = true;
        Receipt._warmPromise = Receipt.ensureEngine().catch(() => {});
        return Receipt._warmPromise;
    },

    async ensureEngine(onProgress) {
        if (Receipt._service) return Receipt._service;
        if (Receipt._initPromise) return Receipt._initPromise;

        Receipt._initPromise = (async () => {
            onProgress?.('Loading OCR engine…', 0.08);
            const { PaddleOcrService } = await import(Receipt.OCR_CDN);
            onProgress?.('Downloading models (first scan only)…', 0.2);
            const service = new PaddleOcrService({ recognition: { strategy: 'cross-line' } });
            await service.initialize();
            onProgress?.('Warming up…', 0.88);
            const warm = document.createElement('canvas');
            warm.width = warm.height = 64;
            const ctx = warm.getContext('2d');
            ctx.fillStyle = '#fff';
            ctx.fillRect(0, 0, 64, 64);
            ctx.fillStyle = '#000';
            ctx.font = '20px sans-serif';
            ctx.fillText('A', 20, 40);
            try { await service.recognize(warm, { flatten: true }); } catch (_) { }
            Receipt._service = service;
            onProgress?.('Ready', 1);
            return service;
        })();

        try {
            return await Receipt._initPromise;
        } catch (err) {
            Receipt._initPromise = null;
            throw err;
        }
    },

    // [OCR:pdf] Prefer a PDF's embedded text layer when available. It is faster,
    // more accurate, and avoids unnecessary canvas OCR work on mobile devices.
    async loadPdfJs() {
        if (Receipt._pdfjs) return Receipt._pdfjs;
        if (Receipt._pdfjsPromise) return Receipt._pdfjsPromise;

        Receipt._pdfjsPromise = (async () => {
            const pdfjs = await import(/* @vite-ignore */ Receipt.PDF_CDN);
            pdfjs.GlobalWorkerOptions.workerSrc = Receipt.PDF_WORKER;
            Receipt._pdfjs = pdfjs;
            return pdfjs;
        })();

        try {
            return await Receipt._pdfjsPromise;
        } catch (err) {
            Receipt._pdfjsPromise = null;
            throw err;
        }
    },

    linesFromPdfTextContent(textContent) {
        let block = '';
        const lines = [];
        for (const item of textContent.items) {
            block += item.str;
            if (item.hasEOL) {
                const trimmed = block.trim();
                if (trimmed) lines.push(trimmed);
                block = '';
            }
        }
        const tail = block.trim();
        if (tail) lines.push(tail);
        return lines;
    },

    // [OCR:sizing] Desktop keeps the 2400 px detail cap; mobile/camera or
    // lower-memory devices use 2000 px to reduce canvas allocation spikes.
    ocrSizingProfile() {
        const memory = Number(navigator.deviceMemory || 0);
        const constrained = Utils.prefersCamera() || (memory > 0 && memory <= 4);
        return {
            minSide: OCR_MIN_SIDE,
            maxSide: constrained ? OCR_MOBILE_MAX_SIDE : OCR_DESKTOP_MAX_SIDE
        };
    },

    async pdfToCanvasAndText(file, onProgress) {
        onProgress?.('Loading PDF…', 0.25);
        const pdfjs = await Receipt.loadPdfJs();
        const data = new Uint8Array(await file.arrayBuffer());
        const doc = await pdfjs.getDocument({ data }).promise;

        const allLines = [];
        for (let pageNum = 1; pageNum <= doc.numPages; pageNum++) {
            onProgress?.(`Reading PDF page ${pageNum}…`, 0.25 + (pageNum / doc.numPages) * 0.25);
            const page = await doc.getPage(pageNum);
            const textContent = await page.getTextContent();
            allLines.push(...Receipt.linesFromPdfTextContent(textContent));
        }

        onProgress?.('Rendering preview…', 0.55);
        const page = await doc.getPage(1);
        const baseViewport = page.getViewport({ scale: 1 });
        const { maxSide } = Receipt.ocrSizingProfile();
        const scale = Math.min(PDF_MAX_SCALE, maxSide / Math.max(baseViewport.width, baseViewport.height));
        const viewport = page.getViewport({ scale });
        const canvas = document.createElement('canvas');
        canvas.width = Math.round(viewport.width);
        canvas.height = Math.round(viewport.height);
        await page.render({ canvasContext: canvas.getContext('2d'), viewport }).promise;

        const lines = Receipt.normalizeLines(allLines);
        const text = Receipt.normalizeText(lines.join('\n'), lines);
        const previewUrl = canvas.toDataURL('image/jpeg', 0.9);

        return {
            canvas: Receipt.prepareForOcr(canvas),
            text,
            lines,
            previewUrl,
            hasExtractedText: text.trim().length >= 12 || lines.length >= 2
        };
    },

    // [OCR:recognition] Run structured recognition first so parser heuristics get
    // usable line boundaries; fall back to flattened text when an engine returns
    // text without regions.
    async ocrCanvas(service, canvas, onProgress) {
        onProgress?.('Reading text…', 0.55);

        let result = await service.recognize(canvas, { flatten: false });
        let flatResult = null;
        let lines = Receipt.linesFromResult(result);
        let text = (result.text || '').trim();

        if (!lines.length && !text) {
            flatResult = await service.recognize(canvas, { flatten: true });
            text = (flatResult.text || '').trim();
            lines = Receipt.buildLineList(result, flatResult);
        } else {
            if (!lines.length && text) {
                lines = text.split('\n').map(l => l.trim()).filter(Boolean);
            }
            lines = Receipt.normalizeLines(lines);
        }

        if (!text) text = lines.join('\n');
        text = Receipt.normalizeText(text, lines);
        const confidence = Math.max(result.confidence ?? 0, flatResult?.confidence ?? 0);
        return { text, lines, confidence };
    },

    async decodeImage(file, previewUrl) {
        if (typeof createImageBitmap === 'function') {
            try {
                return await createImageBitmap(file, { imageOrientation: 'from-image' });
            } catch (_) {
                try { return await createImageBitmap(file); } catch (_) { }
            }
        }

        return new Promise((resolve, reject) => {
            const el = new Image();
            el.onload = () => resolve(el);
            el.onerror = () => reject(new Error('Could not load image'));
            el.src = previewUrl;
        });
    },

    // [OCR:canvas] Decode with createImageBitmap when available so modern mobile
    // and desktop browsers can use their optimized image pipeline; HTMLImageElement
    // remains the compatibility path.
    async fileToCanvas(file) {
        const url = URL.createObjectURL(file);
        let bitmap = null;
        try {
            const img = await Receipt.decodeImage(file, url);
            bitmap = typeof img.close === 'function' ? img : null;
            const { maxSide } = Receipt.ocrSizingProfile();
            let { width, height } = img;
            if (width > maxSide || height > maxSide) {
                const scale = maxSide / Math.max(width, height);
                width = Math.round(width * scale);
                height = Math.round(height * scale);
            }
            const canvas = document.createElement('canvas');
            canvas.width = width;
            canvas.height = height;
            const ctx = canvas.getContext('2d');
            ctx.fillStyle = '#fff';
            ctx.fillRect(0, 0, width, height);
            ctx.drawImage(img, 0, 0, width, height);
            return { canvas: Receipt.prepareForOcr(canvas), previewUrl: url };
        } catch (err) {
            URL.revokeObjectURL(url);
            throw err;
        } finally {
            bitmap?.close();
        }
    },

    prepareForOcr(source) {
        const { minSide, maxSide } = Receipt.ocrSizingProfile();
        let w = source.width;
        let h = source.height;
        const longest = Math.max(w, h);

        if (longest < minSide) {
            const scale = minSide / longest;
            w = Math.round(w * scale);
            h = Math.round(h * scale);
        } else if (longest > maxSide) {
            const scale = maxSide / longest;
            w = Math.round(w * scale);
            h = Math.round(h * scale);
        }

        if (w === source.width && h === source.height) return source;

        const canvas = document.createElement('canvas');
        canvas.width = w;
        canvas.height = h;
        const ctx = canvas.getContext('2d');
        ctx.fillStyle = '#fff';
        ctx.fillRect(0, 0, w, h);
        ctx.imageSmoothingEnabled = true;
        ctx.imageSmoothingQuality = 'high';
        ctx.drawImage(source, 0, 0, w, h);
        return canvas;
    },

    linesFromResult(result) {
        return (result?.lines || []).map(line =>
            line.map(r => r.text).join(' ').replace(/\s{2,}/g, ' ').trim()
        ).filter(Boolean);
    },

    buildLineList(result, flatResult) {
        const fromRegions = Receipt.linesFromResult(result);
        const fromFlat = (flatResult?.text || '')
            .split('\n')
            .map(l => l.replace(/\s{2,}/g, ' ').trim())
            .filter(Boolean);

        const lineList = fromRegions.length >= fromFlat.length ? fromRegions : fromFlat;
        if (!lineList.length) return Receipt.normalizeLines(fromFlat.length ? fromFlat : fromRegions);
        return Receipt.normalizeLines(lineList);
    },

    normalizeLines(lineList) {
        return lineList.map(line => line
            .replace(/\bzooml\b/gi, 'Zoom')
            .replace(/(\d)[|lI](\d{2})\b/g, '$1.$2')
            .replace(/\s+/g, ' ')
            .trim()
        ).filter(Boolean);
    },

    normalizeText(text, lines) {
        const body = (text || lines.join('\n'))
            .replace(/\bzooml\b/gi, 'Zoom Communications')
            .replace(/zoom\s*c[o0]mmunications/gi, 'Zoom Communications');
        return body;
    },

    // [OCR:pipeline] Dispatch by file type, keep a preview URL for the review
    // sheet, and only invoke OCR when cheaper extraction paths are not enough.
    async recognizeText(file, onProgress) {
        if (Receipt.isPdf(file)) {
            const pdf = await Receipt.pdfToCanvasAndText(file, onProgress);
            Receipt._previewUrl = pdf.previewUrl;

            if (pdf.hasExtractedText) {
                onProgress?.('Done', 1);
                return {
                    text: pdf.text,
                    lines: pdf.lines,
                    confidence: 0.95,
                    previewUrl: pdf.previewUrl
                };
            }

            const service = await Receipt.ensureEngine(onProgress);
            const ocr = await Receipt.ocrCanvas(service, pdf.canvas, onProgress);
            return { ...ocr, previewUrl: pdf.previewUrl };
        }

        const service = await Receipt.ensureEngine(onProgress);
        const { canvas, previewUrl } = await Receipt.fileToCanvas(file);
        Receipt._previewUrl = previewUrl;
        const ocr = await Receipt.ocrCanvas(service, canvas, onProgress);
        return { ...ocr, previewUrl };
    },

    async scan(file) {
        Receipt._lastFile = file;
        const progress = Receipt.showProgress();
        try {
            const ocr = await Receipt.recognizeText(file, (label, pct) => progress.set(label, pct));
            progress.close();
            const parsed = Receipt.parse(ocr.text, ocr.lines, ocr.confidence);
            if (!ocr.lines.length && !ocr.text.trim()) {
                parsed.lowConfidence = true;
                const hint = Receipt.isPdf(file)
                    ? 'No text found in this PDF — fill in the fields manually or try a screenshot.'
                    : 'No text detected — fill in the fields manually or try a clearer photo.';
                Toast.show(hint, 'error');
            }
            Receipt.showPreview(parsed, ocr.previewUrl);
        } catch (err) {
            console.error(`${OCR_LOG_TAG} scan failed:`, err);
            progress.close();
            if (Receipt._previewUrl && !Receipt._previewUrl.startsWith('data:')) {
                URL.revokeObjectURL(Receipt._previewUrl);
            }
            Receipt._previewUrl = null;
            const hint = Receipt.isPdf(file)
                ? 'Could not read this PDF. Try re-downloading the invoice or use a screenshot.'
                : 'Receipt scanning failed. Try a clearer photo with good lighting.';
            Toast.show(hint, 'error');
        } finally {
            Receipt._lastFile = null;
        }
    },

    showProgress() {
        const backdrop = document.createElement('div');
        backdrop.className = 'backdrop open';
        backdrop.id = 'ocr-progress';
        backdrop.innerHTML = `
            <div class="modal-shell ocr-progress" role="status" aria-live="polite">
                <i class="ti ti-scan ocr-progress-icon"></i>
                <strong>Reading receipt…</strong>
                <p class="ocr-progress-note">First scan downloads models (~5 MB OCR, PDF reader on demand), then caches locally.</p>
                <div class="bar"><span></span></div>
                <small class="ocr-pct">Starting…</small>
            </div>`;
        Utils.hideTooltip();
        document.body.appendChild(backdrop);
        document.body.classList.add('modal-open');
        const fill = backdrop.querySelector('.bar > span');
        const pct = backdrop.querySelector('.ocr-pct');
        return {
            set(label, p) {
                const v = Math.round((p || 0) * 100);
                fill.style.width = `${v}%`;
                pct.textContent = typeof label === 'string' ? `${label} (${v}%)` : `${v}%`;
            },
            close() {
                backdrop.remove();
                if (!document.getElementById('ocr-preview') && !document.getElementById('modal')?.classList.contains('open')) {
                    document.body.classList.remove('modal-open');
                }
            }
        };
    },

    // [OCR:parse] Heuristics below turn OCR text into reviewable ledger fields.
    // They intentionally favor editable suggestions over automatic posting.
    moneyOnLine(line) {
        const amounts = [];
        for (const m of line.matchAll(/\$\s*(\d{1,6}[.,]\d{2})/g)) {
            const v = parseFloat(m[1].replace(',', '.'));
            if (!isNaN(v) && v >= 0 && v < 100_000) amounts.push(v);
        }
        if (amounts.length) return amounts[amounts.length - 1];

        for (const m of line.matchAll(/(?<!\d)(\d{1,4}[.,]\d{2})(?!\d)/g)) {
            const v = parseFloat(m[1].replace(',', '.'));
            if (!isNaN(v) && v >= 0 && v < 100_000) amounts.push(v);
        }
        return amounts.length ? amounts[amounts.length - 1] : null;
    },

    allMoneyOnLine(line) {
        const amounts = [];
        for (const m of line.matchAll(/\$\s*(\d{1,6}[.,]\d{2})/g)) {
            const v = parseFloat(m[1].replace(',', '.'));
            if (!isNaN(v) && v >= 0 && v < 100_000) amounts.push(v);
        }
        if (!amounts.length) {
            for (const m of line.matchAll(/(?<!\d)(\d{1,4}[.,]\d{2})(?!\d)/g)) {
                const v = parseFloat(m[1].replace(',', '.'));
                if (!isNaN(v) && v >= 0 && v < 100_000) amounts.push(v);
            }
        }
        return amounts;
    },

    isAddressOrMeta(line) {
        return /\b(street|st\.|blvd|boulevard|ave|avenue|floor|suite|drive|road|rd\.)\b/i.test(line)
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
        const months = ['jan', 'feb', 'mar', 'apr', 'may', 'jun', 'jul', 'aug', 'sep', 'oct', 'nov', 'dec'];
        if (months.includes(w.slice(0, 3))) return w.slice(0, 3);
        let best = null, bestDist = 3;
        for (const m of months) {
            let dist = 0;
            for (let i = 0; i < Math.min(w.length, m.length); i++) dist += w[i] === m[i] ? 0 : 1;
            dist += Math.abs(w.length - m.length);
            if (dist < bestDist) { bestDist = dist; best = m; }
        }
        return bestDist <= 2 ? best : null;
    },

    parseDate(text, lines) {
        const months = { jan: 1, feb: 2, mar: 3, apr: 4, may: 5, jun: 6, jul: 7, aug: 8, sep: 9, oct: 10, nov: 11, dec: 12 };
        const iso = (y, m, d) => {
            y = +y; m = +m; d = +d;
            if (y < 100) y += 2000;
            if (m < 1 || m > 12 || d < 1 || d > 31) return null;
            return `${y}-${Utils.pad(m)}-${Utils.pad(d)}`;
        };
        const sources = [...(lines || []), text];

        for (const src of sources) {
            const norm = src.replace(/[|:]/g, ' ').replace(/\s+/g, ' ');
            let m = norm.match(/(?:invoice|due|service|issue)?\s*date[:\s]+([a-z]{3,9})\s+(\d{1,2}),?\s+(\d{2,4})/i);
            if (m) {
                const mon = Receipt.fuzzyMonth(m[1]);
                if (mon) return iso(m[3], months[mon], m[2]);
            }
            m = norm.match(/([a-z]{3,9})\s+(\d{1,2}),?\s+(\d{2,4})/i);
            if (m) {
                const mon = Receipt.fuzzyMonth(m[1]);
                if (mon) return iso(m[3], months[mon], m[2]);
            }
            m = norm.match(/(\d{4})[-/.](\d{1,2})[-/.](\d{1,2})/);
            if (m) return iso(m[1], m[2], m[3]);
            m = norm.match(/(\d{1,2})[-/.](\d{1,2})[-/.](\d{2,4})/);
            if (m) {
                let mm = +m[1], dd = +m[2];
                if (mm > 12 && dd <= 12) [mm, dd] = [dd, mm];
                return iso(m[3], mm, dd);
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
        if (Receipt.isAddressOrMeta(line)) score -= 200;

        const amt = Receipt.moneyOnLine(line);
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
            if (Receipt.isAddressOrMeta(line)) continue;
            const amounts = Receipt.allMoneyOnLine(line);
            if (!amounts.length) continue;

            if (amounts.length >= 2) {
                const rowTotal = Receipt.rowTotalFromAmounts(amounts);
                if (rowTotal != null) rows.push(rowTotal);
                continue;
            }

            let paired = null;
            for (let j = i + 1; j < Math.min(i + 4, lineList.length); j++) {
                const next = Receipt.allMoneyOnLine(lineList[j]);
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
            const amounts = Receipt.allMoneyOnLine(line);
            if (amounts.length < 2 || Receipt.isAddressOrMeta(line)) continue;
            const rowTotal = Receipt.rowTotalFromAmounts(amounts);
            if (rowTotal == null) continue;
            sum += rowTotal;
            rows++;
        }
        return rows > 0 ? Math.round(sum * 100) / 100 : null;
    },

    inferTotalFromAmounts(lineList) {
        const amounts = [];
        for (const line of lineList) {
            if (Receipt.isAddressOrMeta(line)) continue;
            amounts.push(...Receipt.allMoneyOnLine(line));
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
        const known = [
            [/zoom\s+communications?,?\s*inc\.?/i, 'Zoom Communications, Inc.'],
            [/\bzoom[l1i]?\b/i, 'Zoom Communications, Inc.'],
            [/amazon\.?\s*com/i, 'Amazon'],
            [/whole\s*foods/i, 'Whole Foods'],
            [/costco\s*wholesale/i, 'Costco'],
            [/target\s*(store|corp)?/i, 'Target'],
            [/walmart/i, 'Walmart'],
            [/starbucks/i, 'Starbucks']
        ];

        for (const [pat, name] of known) {
            if (pat.test(text)) return name;
        }

        for (const line of lineList.slice(0, 25)) {
            if (Receipt.isAddressOrMeta(line) || skipPat.test(line.trim())) continue;
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
            if (Receipt.isAddressOrMeta(line)) continue;
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
        const skip = /sub\s*-?total|taxes|fees|surcharges|change|tender|payment|visa|mastercard|amex|debit|credit|tip|balance\s*forward|payment\s*terms|currency|certificate|charge\s*description|billing\s*period/i;
        const totalKey = /(grand\s*total|amount\s*due|balance\s*due|total\s*due|\btotal\b)/i;
        const items = [];

        for (const line of lineList) {
            if (skip.test(line) || totalKey.test(line) || Receipt.isAddressOrMeta(line)) continue;

            const charge = line.match(/charge\s*name[:\s]+(.+)/i);
            if (charge) {
                items.push(charge[1].trim().slice(0, 72));
                continue;
            }

            if (/\$\s*\d+\.\d{2}/.test(line)) {
                const amt = Receipt.moneyOnLine(line);
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
            const scored = Receipt.scoreAmount(line);
            if (scored && scored.score > bestScore) {
                bestScore = scored.score;
                total = scored.amt;
            }
        }

        const invoiceSum = Receipt.sumInvoiceRowTotals(lineList);
        const clustered = Receipt.collectInvoiceAmounts(lineList);
        const textTotal = Receipt.parseTotalFromText(text);

        for (const candidate of [textTotal, clustered, invoiceSum, Receipt.inferTotalFromAmounts(lineList)]) {
            if (candidate != null && (total == null || total > 500 || candidate > (total || 0))) {
                total = candidate;
            }
        }

        if (total == null) {
            const amounts = lineList
                .filter(l => !Receipt.isAddressOrMeta(l))
                .map(Receipt.moneyOnLine)
                .filter(v => v != null && v > 0 && v < 10_000);
            if (amounts.length) total = amounts.reduce((a, b) => a + b, 0);
            if (total != null) total = Math.round(total * 100) / 100;
        }

        let tax = null;
        for (const line of lineList) {
            if (/\btax(es)?\b|fees?\s*&?\s*surcharges?/i.test(line)) {
                const amounts = Receipt.allMoneyOnLine(line);
                if (amounts.length) tax = amounts[amounts.length - 1];
            }
        }

        const merchant = Receipt.parseMerchant(lineList, text);
        const items = Receipt.parseItems(lineList);

        return {
            merchant,
            total,
            tax,
            date: Receipt.parseDate(text, lineList),
            items,
            rawText: text,
            confidence,
            lowConfidence: confidence > 0 && confidence < 0.55
        };
    },

    // [OCR:review] The scan result always goes through a human-readable review
    // sheet before it becomes an expense record.
    showPreview(parsed, previewUrl) {
        Receipt.closePreview();
        const today = Utils.dateKey(new Date().getFullYear(), new Date().getMonth(), new Date().getDate());
        const noteParts = [...parsed.items];
        if (parsed.tax != null) noteParts.push(`Tax: $${parsed.tax.toFixed(2)}`);
        const confPct = parsed.confidence ? Math.round(parsed.confidence * 100) : null;
        const confClass = parsed.lowConfidence ? 'ocr-conf-low' : 'ocr-conf-ok';

        const backdrop = document.createElement('div');
        backdrop.className = 'backdrop open';
        backdrop.id = 'ocr-preview';
        backdrop.innerHTML = `
            <div class="modal-shell ocr-sheet" role="dialog" aria-modal="true" aria-label="Review scanned receipt">
                <div class="ocr-sheet-header">
                    <div>
                        <h3 class="modal-title">Review receipt</h3>
                        ${confPct != null ? `<span class="ocr-conf ${confClass}">${confPct}% match</span>` : ''}
                    </div>
                    <button class="close-modal" type="button" data-act="cancel" aria-label="Close"><i class="ti ti-x"></i></button>
                </div>
                ${parsed.lowConfidence ? `<p class="ocr-hint"><i class="ti ti-info-circle"></i> Low confidence — please double-check the fields below.</p>` : ''}
                ${previewUrl ? `<div class="ocr-thumb-wrap"><img class="ocr-thumb" src="${previewUrl}" alt=""></div>` : ''}
                <div class="ocr-body">
                    <div class="ocr-field">
                        <label class="field-label" for="ocr-title">Title / Merchant</label>
                        <input class="text-input" type="text" id="ocr-title" spellcheck="false" autocomplete="off"
                            value="${Utils.escapeHtml(parsed.merchant)}" placeholder="e.g. Whole Foods">
                    </div>
                    <div class="ocr-grid">
                        <div class="ocr-field ocr-field-amount">
                            <label class="field-label" for="ocr-amount">Amount</label>
                            <div class="amount-wrap">
                                <span class="amount-prefix">$</span>
                                <input class="text-input amount-input" type="text" inputmode="decimal" id="ocr-amount"
                                    value="${parsed.total != null ? parsed.total.toFixed(2) : ''}" placeholder="0.00">
                            </div>
                        </div>
                        <div class="ocr-field">
                            <label class="field-label" for="ocr-date">Date</label>
                            <input class="text-input" type="date" id="ocr-date" value="${parsed.date || today}">
                        </div>
                    </div>
                    <div class="ocr-field">
                        <label class="field-label" for="ocr-note">Notes</label>
                        <textarea class="text-input" id="ocr-note" rows="3" placeholder="Line items and details">${Utils.escapeHtml(noteParts.join('\n'))}</textarea>
                    </div>
                    <details class="ocr-raw">
                        <summary>View raw scanned text</summary>
                        <pre>${Utils.escapeHtml(parsed.rawText || 'No text recognized.')}</pre>
                    </details>
                </div>
                <div class="modal-actions ocr-actions ocr-actions-stack">
                    <button class="btn-primary" type="button" data-act="save"><i class="ti ti-check"></i> Save expense</button>
                    <button class="btn-secondary" type="button" data-act="save-scan"><i class="ti ti-camera"></i> Save &amp; scan another</button>
                    <button class="btn-ghost" type="button" data-act="cancel">Cancel</button>
                </div>
            </div>`;

        backdrop.addEventListener('click', (e) => { if (e.target === backdrop) Receipt.closePreview(); });
        backdrop.querySelectorAll('[data-act="cancel"]').forEach(b => b.onclick = Receipt.closePreview);
        backdrop.querySelector('[data-act="save"]').onclick = () => Receipt.saveFromPreview(false);
        backdrop.querySelector('[data-act="save-scan"]').onclick = () => Receipt.saveFromPreview(true);
        Utils.hideTooltip();
        document.body.classList.add('modal-open');
        document.body.appendChild(backdrop);

        const thumb = backdrop.querySelector('.ocr-thumb');
        const thumbWrap = thumb?.closest('.ocr-thumb-wrap');
        if (thumb && thumbWrap) {
            const reveal = () => thumbWrap.classList.add('is-ready');
            const hide = () => thumbWrap.remove();
            thumb.addEventListener('load', reveal, { once: true });
            thumb.addEventListener('error', hide, { once: true });
            if (thumb.complete && thumb.naturalWidth > 0) reveal();
        }

        backdrop.querySelector('#ocr-title').focus();
    },

    closePreview() {
        document.getElementById('ocr-preview')?.remove();
        if (!document.getElementById('modal')?.classList.contains('open')) {
            document.body.classList.remove('modal-open');
        }
        if (Receipt._previewUrl && !Receipt._previewUrl.startsWith('data:')) {
            URL.revokeObjectURL(Receipt._previewUrl);
        }
        Receipt._previewUrl = null;
    },

    saveFromPreview(scanAnother = false) {
        const dateStr = document.getElementById('ocr-date')?.value;
        const title = document.getElementById('ocr-title')?.value.trim();
        const amountRaw = document.getElementById('ocr-amount')?.value.replace(/[^0-9.]/g, '');
        const note = document.getElementById('ocr-note')?.value.trim();

        if (!title) { Toast.show('Please enter a title or merchant name.', 'error'); return; }
        if (!dateStr) { Toast.show('Please choose a date.', 'error'); return; }

        const ok = saveExpense({
            dateKey: dateStr,
            title,
            price: amountRaw,
            note,
            paid: true
        });
        if (!ok) return;

        const [y, m, d] = dateStr.split('-').map(Number);
        patch({ currentDate: new Date(y, m - 1, d), selectedKey: null, editingIndex: null });

        Receipt.closePreview();
        Toast.show(scanAnother ? 'Saved — ready for next receipt.' : 'Expense saved to your calendar.', 'success');

        if (scanAnother) {
            window.setTimeout(() => Receipt.pickImage(), 350);
        }
    },

    apply() {
        Receipt.saveFromPreview(false);
    }
};
