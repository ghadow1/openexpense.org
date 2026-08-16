# OCR performance and source tags

OpenExpense reads receipts entirely in the browser. Photos, PDFs, extracted text, and parsed fields stay on the device; the scanner only downloads static OCR/PDF libraries from the CDN.

## Human-readable source tags

Use these tags when changing OCR or platform-sensitive behavior:

- `@ocr-deps` - CDN pins, import maps, and peer dependency URLs.
- `@ocr-engine` - OCR service creation, model warmup, and recognition options.
- `@ocr-pdf` - PDF.js loading, PDF text extraction, and PDF preview rendering.
- `@ocr-pipeline` - image decoding, canvas resizing, OCR input normalization, and result normalization.
- `@ocr-parse` - deterministic merchant/date/amount/item parsing heuristics.
- `@ocr-ui` - review sheet, progress state, confidence display, and save actions.
- `@platform` - browser capability checks for camera capture, save pickers, share sheets, memory, and network class.
- `@perf` - work that protects startup time, memory pressure, bundle size, or repeated scan speed.

These tags are intentionally plain comments so they remain searchable with `rg "@ocr-" src docs`.

## Resource strategy

The app keeps the initial `app.js` bundle focused on the ledger UI. OCR resources are lazy-loaded when the user scans a receipt, and the engine is warmed during idle time only when the platform has enough headroom.

Current OCR pins live in `src/config.js` under `OCR_CONFIG`:

| Resource | Current role |
| --- | --- |
| `ppu-paddle-ocr@6.4.0` | PP-OCRv5 browser OCR service |
| `onnxruntime-web@1.27.0` | runtime peer dependency for OCR inference |
| `ppu-ocv@4.0.0` | canvas/image processing peer dependency |
| `pdfjs-dist@6.2.108` | PDF text extraction and first-page preview |

Keep the `index.html` import map in sync with `OCR_CONFIG.dependencies.peerImports` whenever changing OCR versions.

## Cross-platform behavior

- Mobile and coarse-pointer devices request the rear camera by setting `capture="environment"` on the hidden receipt input.
- Desktop browsers keep the upload picker behavior and can still scan screenshots, image files, and PDFs.
- Data-saver, 2G-class, and very low-memory mobile sessions skip idle OCR warmup. Manual scanning still loads the engine on demand.
- Image decoding prefers `createImageBitmap()` when available and falls back to `HTMLImageElement` for Safari and file types that need browser-specific handling.
- OCR canvases are normalized between `OCR_CONFIG.image.minSide` and `OCR_CONFIG.image.maxSide` so small receipts gain enough pixels while large camera photos avoid unnecessary memory pressure.
- PDF invoices use native text extraction first. OCR is only used when a PDF does not expose enough text.
- PDF preview images prefer blob-backed object URLs instead of base64 data URLs to reduce memory churn.

## Review-before-save invariant

Receipt parsing is not an autopilot. The parser only suggests merchant, amount, date, tax, and notes. The `@ocr-ui` review sheet must remain editable and must require the user to confirm before `saveExpense()` writes to the encrypted ledger.

## Validation checklist for OCR changes

1. Update `OCR_CONFIG` and the `index.html` import map together.
2. Keep the scanner offline/local: no receipt image, PDF, extracted text, or parsed field should be sent to a server.
3. Rebuild generated assets with `npm run build`.
4. Run `npm run validate` and `git diff --check HEAD`.
