# Receipt OCR performance guide

OpenExpense reads receipts entirely in the browser. There is no upload step and
no backend OCR service: photos, PDFs, parsed text, and review fields stay on the
current device until the user saves an expense into the encrypted local ledger.

## Runtime stack

- `src/features/receipt.js` lazy-loads PP-OCRv5 through `ppu-paddle-ocr`.
- `onnxruntime-web` and `ppu-ocv/canvas-web` are peer dependencies resolved by
  the import map in `index.html`.
- `pdfjs-dist` is loaded only for PDF receipts. Digital PDFs use embedded text
  first and fall back to OCR only when text extraction is insufficient.
- Shared pins, canvas limits, confidence thresholds, and warmup timings live in
  `OCR_CONFIG` in `src/config.js`.

When updating OCR packages, keep `OCR_CONFIG.dependencies.peerImportMap` in sync
with the `index.html` import map.

## Cross-platform performance policy

The OCR model is useful on modern mobile and desktop browsers, but camera images
and PDF pages can be very large. The app uses these guardrails:

- **Lazy model load**: the OCR engine downloads on first scan, then the browser
  cache handles later scans.
- **Idle warmup**: startup asks the browser to warm OCR during idle time so the
  first scan feels faster on capable devices.
- **Network-aware preload**: data-saver and very slow connections skip idle
  warmup. Manual scans still work and load OCR on demand.
- **Canvas bounds**: images are normalized to a longest side between
  `OCR_CONFIG.canvas.minSide` and `OCR_CONFIG.canvas.maxSide` to balance mobile
  memory use with text accuracy.
- **PDF fast path**: text-layer PDFs skip OCR. Scanned PDFs render a bounded
  first-page preview for OCR fallback.
- **Human review**: OCR never writes directly to the ledger. The review sheet is
  the required checkpoint for correcting merchant, amount, date, and notes.

## Browser and device notes

- Chrome, Edge, Safari, and Firefox can run the core app. OCR requires browser
  support for WebAssembly and the imported ONNX/OpenCV modules.
- Mobile browsers prefer `capture="environment"` so camera scans open the rear
  camera when available.
- Desktop Chromium browsers can export with the native save picker; mobile
  browsers use the share sheet when file sharing is supported.
- HEIC/HEIF files depend on native browser image decoding. Safari is usually the
  best-supported path; unsupported browsers should use a JPEG/PNG screenshot or
  a PDF invoice.

## Human-readable code tags

Use these tags when adding or reviewing receipt code:

- `@ocr-engine` for model loading, warmup, and recognition calls.
- `@ocr-preprocess` for image/PDF canvas sizing and normalization.
- `@ocr-parser` for text cleanup, total/date/merchant heuristics, and confidence.
- `@ocr-ui` for progress, preview, and save-review interactions.
- `@pdf-receipts` for PDF extraction and rendering paths.
- `@platform-mobile` and `@platform-desktop` for device-specific fallbacks in
  shared helpers.

These tags are intentionally plain comments so they work in any editor, grep,
or browser devtools view without extra tooling.

## Validation

Run the project validation after OCR or platform edits:

```bash
npm run validate
```

This performs a clean production bundle and rewrites `app.js` plus the current
`chunk-*.js` assets committed for the static site.
