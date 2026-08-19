/**
 * OpenExpense — on-device receipt scan
 *
 * Lazy-loads PP-OCRv5 and pdf.js from jsDelivr, enhances the image, then
 * hands text to receipt-parse.js. Nothing is uploaded.
 */
import { Utils } from '../core/utils.js';
import { patch } from '../core/store.js';
import { Toast } from '../ui/toast.js';
import { lockBodyScroll, unlockBodyScroll } from '../ui/scroll-lock.js';
import { activateDialogFocus, deactivateDialogFocus } from '../ui/dialog-focus.js';
import { renderModal, saveExpense } from './modal.js';
import { normalizeLines, normalizeOcrText, parseReceipt, textQuality } from './receipt-parse.js';
import { actionBusy, runLocked } from '../ui/action-lock.js';
import { receiptDateContext } from '../core/receipt-date.js';

const RECEIPT_LIMITS = {
    maxFileBytes: 15 * 1024 * 1024,
    maxPdfPages: 20,
    maxExtractedLines: 5000,
    maxExtractedChars: 250000
};

function displayDate(key) {
    const [year, month, day] = String(key || '').split('-').map(Number);
    if (!year || !month || !day) return String(key || '');
    return new Date(year, month - 1, day).toLocaleDateString('en-US', {
        weekday: 'short',
        month: 'short',
        day: 'numeric',
        year: 'numeric'
    });
}

export const Receipt = {
    // Executable OCR/PDF code and models are bundled or served from this origin.
    PDF_WORKER: '/vendor/pdfjs/pdf.worker.min.mjs',
    OCR_ASSETS: {
        wasm: '/vendor/ort/',
        detection: '/vendor/ocr-models/PP-OCRv6_tiny_det.ort',
        recognition: '/vendor/ocr-models/PP-OCRv6_tiny_rec.ort',
        dictionary: '/vendor/ocr-models/ppocrv6_tiny_dict.txt'
    },
    _service: null,
    _initPromise: null,
    _pdfjs: null,
    _pdfjsPromise: null,
    _previewUrl: null,
    _lastFile: null,
    _pendingIntendedDate: null,

    isPdf(file) {
        if (!file) return false;
        const type = (file.type || '').toLowerCase();
        const name = (file.name || '').toLowerCase();
        return type === 'application/pdf' || name.endsWith('.pdf');
    },

    pickImage({ intendedDate = null } = {}) {
        if (actionBusy()) {
            Toast.show('Please wait — another action is still running.', 'info', 2800);
            return;
        }
        const input = document.getElementById('receipt-scan-input');
        if (!input) return;
        Receipt._pendingIntendedDate = intendedDate;
        input.value = '';
        if (Utils.prefersCamera()) input.setAttribute('capture', 'environment');
        else input.removeAttribute('capture');
        input.click();
    },

    async ensureEngine(onProgress) {
        if (Receipt._service) return Receipt._service;
        if (Receipt._initPromise) return Receipt._initPromise;

        Receipt._initPromise = (async () => {
            onProgress?.('Loading OCR engine…', 0.08);
            const ort = await import('onnxruntime-web');
            ort.env.wasm.wasmPaths = Receipt.OCR_ASSETS.wasm;
            ort.env.wasm.numThreads = 1;
            const { PaddleOcrService } = await import('ppu-paddle-ocr/web');
            onProgress?.('Loading local OCR models…', 0.2);
            const service = new PaddleOcrService({
                session: { executionProviders: ['wasm'] },
                model: {
                    detection: Receipt.OCR_ASSETS.detection,
                    recognition: Receipt.OCR_ASSETS.recognition,
                    charactersDictionary: Receipt.OCR_ASSETS.dictionary
                },
                recognition: { strategy: 'cross-line' }
            });
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

    async loadPdfJs() {
        if (Receipt._pdfjs) return Receipt._pdfjs;
        if (Receipt._pdfjsPromise) return Receipt._pdfjsPromise;

        Receipt._pdfjsPromise = (async () => {
            const pdfjs = await import('pdfjs-dist/build/pdf.mjs');
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

    async pdfToCanvasAndText(file, onProgress) {
        onProgress?.('Loading PDF…', 0.25);
        const pdfjs = await Receipt.loadPdfJs();
        const data = new Uint8Array(await file.arrayBuffer());
        const doc = await pdfjs.getDocument({ data }).promise;
        if (doc.numPages > RECEIPT_LIMITS.maxPdfPages) {
            throw new Error('PDF_PAGE_LIMIT');
        }

        const allLines = [];
        for (let pageNum = 1; pageNum <= doc.numPages; pageNum++) {
            onProgress?.(`Reading PDF page ${pageNum}…`, 0.25 + (pageNum / doc.numPages) * 0.25);
            const page = await doc.getPage(pageNum);
            const textContent = await page.getTextContent();
            allLines.push(...Receipt.linesFromPdfTextContent(textContent));
            if (allLines.length > RECEIPT_LIMITS.maxExtractedLines
                || allLines.join('\n').length > RECEIPT_LIMITS.maxExtractedChars) {
                throw new Error('PDF_TEXT_LIMIT');
            }
        }

        onProgress?.('Rendering preview…', 0.55);
        const page = await doc.getPage(1);
        const baseViewport = page.getViewport({ scale: 1 });
        const scale = Math.min(2.5, 2400 / Math.max(baseViewport.width, baseViewport.height));
        const viewport = page.getViewport({ scale });
        const canvas = document.createElement('canvas');
        canvas.width = Math.round(viewport.width);
        canvas.height = Math.round(viewport.height);
        await page.render({ canvasContext: canvas.getContext('2d'), viewport }).promise;

        const lines = normalizeLines(allLines);
        const text = normalizeOcrText(lines.join('\n'));
        const previewUrl = canvas.toDataURL('image/jpeg', 0.92);
        const quality = textQuality(text, lines);

        return {
            canvas: Receipt.prepareForOcr(canvas),
            text,
            lines,
            previewUrl,
            hasExtractedText: quality.usable && quality.money > 0
        };
    },

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
        } else if (!lines.length && text) {
            lines = text.split('\n').map((l) => l.trim()).filter(Boolean);
        }

        lines = normalizeLines(lines);
        if (!text) text = lines.join('\n');
        text = normalizeOcrText(text);
        const confidence = Math.max(result.confidence ?? 0, flatResult?.confidence ?? 0);
        return { text, lines, confidence };
    },

    scoreOcr(ocr) {
        const quality = textQuality(ocr.text, ocr.lines);
        return (ocr.confidence || 0) * 40 + quality.letters * 0.15 + quality.lines * 2 + quality.money * 8;
    },

    async ocrBest(service, canvas, onProgress) {
        const first = await Receipt.ocrCanvas(service, canvas, onProgress);
        if (Receipt.scoreOcr(first) >= 28 && first.lines.length >= 4) return first;

        onProgress?.('Enhancing photo…', 0.68);
        const contrast = Receipt.enhanceForOcr(canvas, 'contrast');
        const second = await Receipt.ocrCanvas(service, contrast, onProgress);
        let best = Receipt.scoreOcr(second) > Receipt.scoreOcr(first) ? second : first;
        if (Receipt.scoreOcr(best) >= 22 && best.lines.length >= 3) return best;

        onProgress?.('Retrying high-contrast…', 0.82);
        const binary = Receipt.enhanceForOcr(canvas, 'binary');
        const third = await Receipt.ocrCanvas(service, binary, onProgress);
        if (Receipt.scoreOcr(third) > Receipt.scoreOcr(best)) best = third;
        return best;
    },

    async fileToCanvas(file) {
        const url = URL.createObjectURL(file);
        try {
            let source = null;
            if (typeof createImageBitmap === 'function') {
                try {
                    source = await createImageBitmap(file, { imageOrientation: 'from-image' });
                } catch (_) { /* fall back to Image */ }
            }
            if (!source) {
                source = await new Promise((resolve, reject) => {
                    const el = new Image();
                    el.onload = () => resolve(el);
                    el.onerror = () => reject(new Error('Could not load this image. Try a JPG, PNG, or PDF.'));
                    el.src = url;
                });
            }
            const maxSide = 2600;
            let width = source.width;
            let height = source.height;
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
            ctx.drawImage(source, 0, 0, width, height);
            if (typeof source.close === 'function') source.close();
            return { canvas: Receipt.prepareForOcr(canvas), previewUrl: url };
        } catch (err) {
            URL.revokeObjectURL(url);
            throw err;
        }
    },

    prepareForOcr(source) {
        const minSide = 1200;
        const maxSide = 2600;
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

    enhanceForOcr(source, mode = 'contrast') {
        const maxPx = 1_800_000;
        let w = source.width;
        let h = source.height;
        if (w * h > maxPx) {
            const scale = Math.sqrt(maxPx / (w * h));
            w = Math.round(w * scale);
            h = Math.round(h * scale);
        }
        const canvas = document.createElement('canvas');
        canvas.width = w;
        canvas.height = h;
        const ctx = canvas.getContext('2d', { willReadFrequently: true });
        ctx.fillStyle = '#fff';
        ctx.fillRect(0, 0, w, h);
        ctx.drawImage(source, 0, 0, w, h);

        const img = ctx.getImageData(0, 0, w, h);
        const data = img.data;
        let min = 255;
        let max = 0;
        for (let i = 0; i < data.length; i += 4) {
            const g = 0.299 * data[i] + 0.587 * data[i + 1] + 0.114 * data[i + 2];
            if (g < min) min = g;
            if (g > max) max = g;
        }
        const range = Math.max(18, max - min);
        for (let i = 0; i < data.length; i += 4) {
            let g = 0.299 * data[i] + 0.587 * data[i + 1] + 0.114 * data[i + 2];
            g = ((g - min) / range) * 255;
            g = Math.max(0, Math.min(255, (g - 128) * 1.35 + 128));
            if (mode === 'binary') g = g > 168 ? 255 : (g < 96 ? 0 : g);
            data[i] = data[i + 1] = data[i + 2] = g;
        }
        ctx.putImageData(img, 0, 0);
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
        if (!lineList.length) return normalizeLines(fromFlat.length ? fromFlat : fromRegions);
        return normalizeLines(lineList);
    },

    async recognizeText(file, onProgress) {
        if (Receipt.isPdf(file)) {
            const pdf = await Receipt.pdfToCanvasAndText(file, onProgress);
            Receipt._previewUrl = pdf.previewUrl;

            if (pdf.hasExtractedText) {
                const parsed = parseReceipt(pdf.text, pdf.lines, 0.95);
                if (parsed.total != null && parsed.merchant) {
                    onProgress?.('Done', 1);
                    return {
                        text: pdf.text,
                        lines: pdf.lines,
                        confidence: 0.95,
                        previewUrl: pdf.previewUrl
                    };
                }
            }

            const service = await Receipt.ensureEngine(onProgress);
            const ocr = await Receipt.ocrBest(service, pdf.canvas, onProgress);
            if (pdf.hasExtractedText && Receipt.scoreOcr(pdf) >= Receipt.scoreOcr(ocr)) {
                return { text: pdf.text, lines: pdf.lines, confidence: 0.9, previewUrl: pdf.previewUrl };
            }
            return { ...ocr, previewUrl: pdf.previewUrl };
        }

        const service = await Receipt.ensureEngine(onProgress);
        const { canvas, previewUrl } = await Receipt.fileToCanvas(file);
        Receipt._previewUrl = previewUrl;
        const ocr = await Receipt.ocrBest(service, canvas, onProgress);
        return { ...ocr, previewUrl };
    },

    async scan(file, { intendedDate = Receipt._pendingIntendedDate } = {}) {
        Receipt._pendingIntendedDate = null;
        return runLocked('scan', async () => {
            if (!file || (typeof file.size === 'number' && file.size > RECEIPT_LIMITS.maxFileBytes)) {
                Toast.show('That receipt file is too large. Use a file under 15 MB.', 'error', 5200);
                return;
            }
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
                Receipt.showPreview(parsed, ocr.previewUrl, intendedDate);
            } catch (err) {
                console.error('OCR error:', err);
                progress.close();
                if (Receipt._previewUrl && !Receipt._previewUrl.startsWith('data:')) {
                    URL.revokeObjectURL(Receipt._previewUrl);
                }
                Receipt._previewUrl = null;
                const hint = Receipt.isPdf(file)
                    ? 'Could not read this PDF. Try a text-based invoice, a screenshot, or a clearer scan.'
                    : 'Could not read this image. Try a flatter photo, better lighting, or a PDF invoice.';
                Toast.show(hint, 'error');
            } finally {
                Receipt._lastFile = null;
            }
        });
    },

    showProgress() {
        const backdrop = document.createElement('div');
        backdrop.className = 'backdrop open';
        backdrop.id = 'ocr-progress';
        backdrop.innerHTML = `
            <div class="modal-shell ocr-progress" role="status" aria-live="polite">
                <i class="ti ti-scan ocr-progress-icon" aria-hidden="true"></i>
                <strong>Reading document…</strong>
                <p class="ocr-progress-note">Works with paper receipts, PDF invoices, and screenshots. First scan downloads models (~5 MB), then caches locally.</p>
                <div class="bar"><span></span></div>
                <small class="ocr-pct">Starting…</small>
            </div>`;
        Utils.hideTooltip();
        document.body.appendChild(backdrop);
        document.body.classList.add('modal-open');
        lockBodyScroll();
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
                unlockBodyScroll();
            }
        };
    },

    parse(text, lines, confidence = 0) {
        return parseReceipt(text, lines, confidence);
    },

    showPreview(parsed, previewUrl, intendedDate = null) {
        Receipt.closePreview();
        const today = Utils.dateKey(new Date().getFullYear(), new Date().getMonth(), new Date().getDate());
        const dateContext = receiptDateContext({
            detectedDate: parsed.date,
            intendedDate,
            today
        });
        const noteParts = [...parsed.items];
        if (parsed.tax != null) noteParts.push(`Tax: $${parsed.tax.toFixed(2)}`);
        const confPct = parsed.confidence ? Math.round(parsed.confidence * 100) : null;
        const confClass = parsed.lowConfidence ? 'ocr-conf-low' : 'ocr-conf-ok';

        const backdrop = document.createElement('div');
        backdrop.className = 'backdrop open';
        backdrop.id = 'ocr-preview';
        backdrop.innerHTML = `
            <div class="modal-shell ocr-sheet" role="dialog" aria-modal="true" aria-labelledby="ocr-preview-title"
                ${dateContext.intendedDate ? `data-source-day="${dateContext.intendedDate}"` : ''}>
                <div class="ocr-sheet-header">
                    <div>
                        <h2 class="modal-title" id="ocr-preview-title">${parsed.kind === 'invoice' ? 'Review invoice' : parsed.kind === 'bill' ? 'Review bill' : 'Review receipt'}</h2>
                        ${confPct != null ? `<span class="ocr-conf ${confClass}">${confPct}% match</span>` : ''}
                    </div>
                    <button class="close-modal" type="button" data-act="cancel" aria-label="Close"><i class="ti ti-x" aria-hidden="true"></i></button>
                </div>
                ${parsed.lowConfidence ? `<p class="ocr-hint"><i class="ti ti-info-circle" aria-hidden="true"></i> Low confidence — please double-check the fields below.</p>` : ''}
                ${previewUrl ? `<div class="ocr-thumb-wrap"><img class="ocr-thumb" src="${previewUrl}" alt="Scanned receipt preview"></div>` : ''}
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
                            <input class="text-input" type="date" id="ocr-date" value="${dateContext.initialDate}"
                                ${dateContext.mismatch ? 'aria-describedby="ocr-date-question"' : ''}>
                        </div>
                    </div>
                    ${dateContext.mismatch ? `
                    <fieldset class="ocr-date-check" id="ocr-date-question">
                        <legend><i class="ti ti-calendar-question" aria-hidden="true"></i> Which date should this expense use?</legend>
                        <p>The receipt date does not match the day you opened. Confirm one before saving.</p>
                        <label>
                            <input type="radio" name="ocr-date-choice" value="${dateContext.detectedDate}">
                            <span><strong>Receipt date</strong><small>${displayDate(dateContext.detectedDate)}</small></span>
                        </label>
                        <label>
                            <input type="radio" name="ocr-date-choice" value="${dateContext.intendedDate}">
                            <span><strong>Selected day</strong><small>${displayDate(dateContext.intendedDate)}</small></span>
                        </label>
                    </fieldset>` : ''}
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
                    <button class="btn-primary" type="button" data-act="save" ${dateContext.mismatch ? 'disabled' : ''}><i class="ti ti-check" aria-hidden="true"></i> Save expense</button>
                    <button class="btn-secondary" type="button" data-act="save-scan" ${dateContext.mismatch ? 'disabled' : ''}><i class="ti ti-camera" aria-hidden="true"></i> Save &amp; scan another</button>
                    <button class="btn-ghost" type="button" data-act="cancel">Cancel</button>
                </div>
            </div>`;

        backdrop.addEventListener('click', (e) => { if (e.target === backdrop) Receipt.closePreview(); });
        backdrop.addEventListener('keydown', (event) => {
            if (event.key !== 'Escape') return;
            event.preventDefault();
            Receipt.closePreview();
        });
        backdrop.querySelectorAll('[data-act="cancel"]').forEach(b => b.onclick = Receipt.closePreview);
        backdrop.querySelector('[data-act="save"]').onclick = () => Receipt.saveFromPreview(false);
        backdrop.querySelector('[data-act="save-scan"]').onclick = () => Receipt.saveFromPreview(true);
        backdrop.querySelectorAll('input[name="ocr-date-choice"]').forEach((choice) => {
            choice.addEventListener('change', () => {
                const input = backdrop.querySelector('#ocr-date');
                if (input) input.value = choice.value;
                backdrop.querySelectorAll('[data-act="save"], [data-act="save-scan"]')
                    .forEach((button) => { button.disabled = false; });
            });
        });
        Utils.hideTooltip();
        document.body.classList.add('modal-open');
        lockBodyScroll();
        document.body.appendChild(backdrop);
        const prefersFieldFocus = !Utils.isPhone()
            && !window.matchMedia('(pointer: coarse)').matches;
        activateDialogFocus(
            backdrop.querySelector('[role="dialog"]'),
            backdrop.querySelector(prefersFieldFocus ? '#ocr-title' : '[data-act="cancel"]')
        );

        const thumb = backdrop.querySelector('.ocr-thumb');
        const thumbWrap = thumb?.closest('.ocr-thumb-wrap');
        if (thumb && thumbWrap) {
            const reveal = () => thumbWrap.classList.add('is-ready');
            const hide = () => thumbWrap.remove();
            thumb.addEventListener('load', reveal, { once: true });
            thumb.addEventListener('error', hide, { once: true });
            if (thumb.complete && thumb.naturalWidth > 0) reveal();
        }

    },

    closePreview() {
        const preview = document.getElementById('ocr-preview');
        const hadPreview = !!preview;
        deactivateDialogFocus(preview?.querySelector('[role="dialog"]'));
        preview?.remove();
        if (!document.getElementById('modal')?.classList.contains('open')) {
            document.body.classList.remove('modal-open');
        }
        if (hadPreview) unlockBodyScroll();
        if (Receipt._previewUrl && !Receipt._previewUrl.startsWith('data:')) {
            URL.revokeObjectURL(Receipt._previewUrl);
        }
        Receipt._previewUrl = null;
    },

    saveFromPreview(scanAnother = false) {
        const preview = document.getElementById('ocr-preview');
        const sourceDay = preview?.querySelector('[role="dialog"]')?.dataset.sourceDay || '';
        if (preview?.querySelector('.ocr-date-check')
            && !preview.querySelector('input[name="ocr-date-choice"]:checked')) {
            Toast.show('Choose the receipt date or the selected day before saving.', 'error');
            return;
        }
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
        patch({
            currentDate: new Date(y, m - 1, d),
            selectedKey: sourceDay ? dateStr : null,
            editingIndex: null
        });

        Receipt.closePreview();
        if (sourceDay) renderModal();
        Toast.show(scanAnother ? 'Saved — ready for next receipt.' : 'Expense saved to your calendar.', 'success');

        if (scanAnother) {
            window.setTimeout(() => Receipt.pickImage({
                intendedDate: sourceDay ? dateStr : null
            }), 350);
        }
    }
};
