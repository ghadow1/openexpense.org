# Receipt OCR guide

OpenExpense reads receipts entirely in the browser. Photos, image uploads, and PDFs are processed on the user's device; scanned values are always reviewed before an expense is saved.

## Human-readable code tags

`src/features/receipt.js` uses short tags to make the pipeline easy to scan:

- `[ocr:engine]` - lazy PP-OCRv5/ONNX loading and idle warm-up.
- `[ocr:pdf]` - PDF.js text extraction and scanned-PDF fallback.
- `[ocr:canvas]` - image normalization for OCR quality and device limits.
- `[ocr:parser]` - merchant, total, tax, date, and item heuristics.

Shared resource pins and performance bounds live in `src/config.js` under `OCR_RESOURCES`.

## Platform behavior

### Mobile

- `Utils.prefersCamera()` sets `capture="environment"` for narrow or coarse-pointer devices, which lets current mobile browsers offer the rear camera first.
- Images are capped at a 2400px long edge before OCR. This keeps memory use predictable on phones while preserving enough detail for small receipt text.
- The review sheet is the only write gate. OCR suggestions are editable, and nothing is saved until the user confirms.

### Desktop

- Desktop keeps the standard file picker and supports drag/download-oriented workflows.
- Large images are downscaled to the same OCR bound so laptop browsers do not spend extra CPU on pixels that do not improve recognition.
- Digital PDFs are parsed through PDF.js text extraction first, which is faster than OCR and avoids loading the OCR model when the invoice already has embedded text.

## Runtime resources

The base app stays small. OCR and PDF code are lazy-loaded from jsDelivr only when needed:

- `ppu-paddle-ocr` provides PP-OCRv5.
- `onnxruntime-web` and `ppu-ocv/canvas-web` are import-map peers in `index.html`.
- `pdfjs-dist` is loaded only for PDFs.

Keep CDN versions in `src/config.js` and the `index.html` import map in sync. The first OCR scan downloads model assets, then normal browser caching makes later scans faster.

## Parser strategy

The parser intentionally favors explicit receipt signals over guesses:

1. Score lines containing `grand total`, `amount due`, or similar labels.
2. Sum invoice-like row totals when a receipt is structured as quantity/unit/total rows.
3. Fall back to conservative amount inference only when no labeled total is found.
4. Extract dates from common numeric and month-name formats.
5. Keep raw OCR text visible in the review sheet for human verification.

When changing parser heuristics, test both store receipts and invoice-style PDFs. A fix for one layout can easily overfit another.

## Rebuild notes

Run `npm run build` after editing source. The build script removes stale `app.js` and `chunk-*.js` files before esbuild emits the current deploy assets.
