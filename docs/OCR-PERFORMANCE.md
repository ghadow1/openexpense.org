# OCR performance and source tags

OpenExpense reads receipts entirely in the browser. The OCR path is tuned to use modern desktop hardware when it is available, while staying conservative on mobile, data-saver, and low-memory sessions.

## Runtime path

1. A scan starts from the toolbar or floating scan button.
2. Images decode with `createImageBitmap()` when the browser supports it, then fall back to `Image`.
3. PDFs load `pdfjs-dist` only when a PDF is selected. Native PDF text is used directly when enough text is present.
4. Image-only receipts and scanned PDFs pass through PP-OCRv5 with the `cross-line` recognition strategy.
5. The review sheet shows merchant, amount, date, notes, confidence, preview, and raw text before anything is saved.

## Cross-platform behavior

- **Desktop-class sessions:** idle warmup can download and initialize OCR after the app has booted, so the first scan feels faster.
- **Mobile and constrained sessions:** save-data, 2G-class connections, and low-memory devices skip idle warmup. OCR still loads on demand when the user scans.
- **Intent warmup:** hover, touch, or keyboard focus on scan controls starts OCR warmup just before a likely scan.
- **Camera preference:** coarse pointers and narrower screens request the rear camera with `capture="environment"`; desktop upload flows keep the file picker generic.
- **PDF previews:** rendered PDF previews prefer blob-backed object URLs instead of base64 data URLs, reducing main-thread string pressure on large invoices.

## Tunable constants

OCR settings live in `src/config.js` under `OCR_CONFIG`.

- `dependencies`: CDN pins for PP-OCRv5, PDF.js, and OCR peer imports.
- `canvas`: minimum and maximum OCR canvas sides, PDF preview sizing, and JPEG quality.
- `recognition`: OCR strategy, PDF text thresholds, and low-confidence threshold.
- `warmup`: idle timeout, fallback delay, connection classes to skip, and the minimum device memory for idle warmup.
- `sourceTags`: the searchable tag vocabulary used in comments.

Keep the import map in `index.html` synchronized with `OCR_CONFIG.dependencies.peerImports` whenever OCR peer versions change.

## Source tags

Use these tags in nearby comments when changing OCR/platform behavior:

- `@ocr-deps` - CDN pins, import maps, and lazy-loaded OCR/PDF dependencies.
- `@ocr-engine` - OCR engine initialization, warmup, model loading, and recognition settings.
- `@ocr-pdf` - PDF.js loading, native text extraction, page rendering, and scanned-PDF fallback.
- `@ocr-pipeline` - image decoding, canvas preparation, OCR execution, and normalization.
- `@ocr-parse` - merchant, date, amount, tax, line-item, and confidence parsing.
- `@ocr-ui` - scan controls, progress UI, review sheet, and scan-again flow.
- `@platform` - mobile, desktop, network, save-picker, camera, and browser capability choices.
- `@perf` - memory, network, canvas, preload, worker, and object URL performance work.
- `@privacy` - local-only processing, encrypted storage, and user confirmation boundaries.

## Review checklist for OCR changes

- Does the change keep receipt images, PDFs, OCR text, and parsed fields on device?
- Are new dependency pins documented in `OCR_CONFIG` and mirrored in `index.html` when needed?
- Will the path avoid eager model downloads on save-data, 2G-class, and low-memory devices?
- Are generated previews revoked through `Utils.revokeObjectUrl()` when the review sheet closes or scanning fails?
- Can a future contributor find the changed subsystem by searching the relevant source tag?
