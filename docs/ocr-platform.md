# OCR receipt platform guide

OpenExpense receipt scanning is designed for modern mobile and desktop browsers while keeping receipt images and invoice text on the user's device.

## Runtime stack

| Layer | Current resource | Why it exists |
| --- | --- | --- |
| OCR engine | `ppu-paddle-ocr@5.8.0` | Browser build of PP-OCRv5 used for receipt image recognition. |
| OCR inference | `onnxruntime-web@1.23.2` | Import-map peer dependency used by the OCR package. |
| OCR image ops | `ppu-ocv/canvas-web@3.2.2` | Import-map peer dependency for canvas preprocessing. |
| PDF reader | `pdfjs-dist@4.10.38` | Loaded only for PDF invoices to extract text and render preview/fallback OCR. |

The CDN pins are centralized in `src/config.js` as `OCR_CONFIG.cdn`. The OCR peer imports must stay in sync with the import map in `index.html` because the browser resolves those bare specifiers before `ppu-paddle-ocr` executes.

## Human-readable code tags

Use these tags in comments, docs, and code search when working on the receipt platform:

- `receipt-ocr`
- `pp-ocrv5-browser`
- `pdf-invoice`
- `mobile-camera`
- `desktop-file`
- `device-only`

The canonical tag set lives in `OCR_CONFIG.tags` and is mirrored in module headers for `src/features/receipt.js`, `src/features/ledger.js`, `src/core/utils.js`, and `src/main.js`.

## Cross-platform performance behavior

### Mobile and tablet

- The Scan action sets `capture="environment"` when the viewport or pointer indicates a camera-first device.
- OCR warmup starts on scan intent instead of unconditional page load, which avoids a large first-load model download for users who never scan.
- Canvas preprocessing uses `OCR_CONFIG.canvas.mobileMaxSide` on constrained camera-first devices to reduce WASM memory use and recognition latency.
- HEIC/HEIF files are accepted so supporting browsers can decode them, but OpenExpense does not ship a separate HEIC transcoder. Unsupported browsers should receive the browser's normal file/image decode failure.

### Desktop

- Desktop file selection keeps `capture` off and accepts image files or PDFs.
- Capable desktop/high-memory contexts can warm the OCR engine during idle time.
- Canvas preprocessing uses the larger desktop max side to preserve OCR accuracy for high-resolution screenshots and invoice images.
- Encrypted exports use the native File System Access save picker when available in a secure context.

### PDFs

- PDF.js is loaded only after selecting a PDF.
- Embedded PDF text is parsed before OCR. If enough text is present, OCR is skipped and the review sheet receives high confidence.
- Image-only/scanned PDFs render the first page to canvas for preview and OCR fallback.

## Receipt pipeline map

1. `Receipt.pickImage()` decides camera vs file-picker behavior and starts scan-intent warmup.
2. `Receipt.recognizeText()` routes PDFs to `pdfToCanvasAndText()` and images to `fileToCanvas()`.
3. `Receipt.prepareForOcr()` enforces platform-aware canvas bounds.
4. `Receipt.ocrCanvas()` runs region OCR first and only runs flattened OCR when no text was found.
5. `Receipt.parse()` extracts merchant, total, tax, date, and line-item notes for user review.
6. `Receipt.showPreview()` asks the user to confirm or edit every parsed field before saving.

## Validation checklist

- Run `npm ci` when dependencies are missing.
- Run `npm run build` after editing `src/`; this also removes stale generated chunks before rebuilding.
- Serve from `http://localhost:8765` or HTTPS. OCR and encryption require a browser context rather than a direct `file://` open.
- Smoke-test at least one desktop image/PDF scan and one mobile-width camera/file selection path when changing OCR behavior.
