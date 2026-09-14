# OCR performance and source tags

OpenExpense reads receipts entirely in the browser. The receipt path is built
for current mobile and desktop browsers without adding a server, account, or
remote OCR endpoint.

## Human-readable source tags

Search these tags when changing OCR behavior:

| Tag | Meaning |
| --- | --- |
| `@ocr-deps` | Same-origin OCR/PDF workers, WASM, models, and dictionaries |
| `@ocr-engine` | Lazy PP-OCRv6 Tiny and ONNX Runtime Web initialization |
| `@ocr-pdf` | PDF.js text extraction and preview rasterization |
| `@ocr-pipeline` | Scan flow, OCR retry strategy, and confidence scoring |
| `@ocr-parse` | Merchant, date, amount, tax, and item parsing from OCR text |
| `@platform` | Device/browser choices such as camera capture and image decoding |
| `@perf` | Size, pixel, page, and retry limits that keep the UI responsive |

Do not add tags to generated `app.js`, `engine.js`, or `chunk-*.js`; they are
rebuilt from `src/`.

## Runtime contract

Source of truth: `OCR_CONFIG` in `src/config.js`.

- Models, dictionaries, PDF.js, and ONNX Runtime Web assets are same-origin.
- Receipt dependencies are lazy-loaded only after the user starts scanning.
- Mobile and coarse-pointer devices prefer the rear camera through the native
  file input, while desktop keeps the file picker.
- Images use `createImageBitmap()` when available so modern browsers can decode
  off the main image element path and honor orientation metadata, with an
  `Image` fallback for older browsers.
- PDF invoices try native text extraction first. If the text parses into a
  merchant and total, OCR is skipped.
- OCR uses a single WASM thread by default. Raising this requires a full
  cross-origin isolation review because multi-threaded WASM depends on browser
  SharedArrayBuffer policy.

## Performance guardrails

The configured limits are intentionally shared by phone, tablet, and desktop:

- 15 MB maximum input file
- 20 maximum PDF pages
- 5,000 extracted PDF text lines or 250,000 extracted characters
- 1,200-2,600 px OCR image side range
- 1.8 MP maximum canvas enhancement work
- 2,400 px / 2.5x maximum PDF preview raster

These values trade accuracy against memory pressure on iOS Safari, Android
Chrome, and desktop Chromium/Firefox/Safari. If a future model needs larger
inputs, update the config, this document, and the QC script in the same change.

## Update checklist

1. Keep receipt pixels, PDF text, ledger data, and keys on-device.
2. Prefer browser-native APIs (`createImageBitmap`, native file capture,
   PDF.js text content) before adding custom work.
3. Keep OCR startup lazy; app boot should not download OCR chunks.
4. Change thresholds in `OCR_CONFIG.scoring`, not inside the scan loop.
5. Run `npm run build` and `npm test`, then commit source and generated bundles.
