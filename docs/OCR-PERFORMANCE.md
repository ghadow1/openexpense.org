# OCR performance and source tags

OpenExpense reads receipts, invoices, and bills inside the browser. There is no
OCR service, account, analytics stream, or remote receipt upload. The app uses
the platform features already present on modern phones and desktop browsers:
native file/camera pickers, `createImageBitmap()` when available, canvas
rasterization, PDF text extraction, WebAssembly inference, and IndexedDB/browser
HTTP caches for same-origin model files.

## Human-readable source tags

Use these tags in comments, tests, and pull requests when changing receipt OCR.
They are intentionally plain text so `rg "@ocr-pipeline"` finds the relevant
code quickly.

| Tag | Meaning |
| --- | --- |
| `@ocr-deps` | Same-origin PDF worker, ONNX WASM runtime, and OCR model files |
| `@ocr-engine` | Lazy setup for PP-OCRv6 Tiny and ONNX Runtime Web |
| `@ocr-pdf` | Native PDF text extraction and first-page raster preview |
| `@ocr-pipeline` | Decode, normalize, enhance, recognize, parse, and review |
| `@ocr-parse` | Merchant, date, total, tax, item, and confidence heuristics |
| `@platform` | Browser capability choices across iOS, Android, tablet, and desktop |
| `@perf` | Resource limits, canvas sizing, warm-up, and retry thresholds |

The canonical tag list lives in `OCR_TAGS` in `src/config.js`. The runtime
limits and model paths live next to it in `OCR_CONFIG`.

## Pipeline

1. `features/receipt-picker.js` opens the native picker synchronously so mobile
   browsers keep the user activation needed for camera capture.
2. `main.js` dynamically imports `features/receipt.js` only after a file is
   chosen, keeping startup light on both phone and desktop.
3. PDF receipts go through PDF.js text extraction first. If the extracted text
   already has a merchant and total, OCR is skipped.
4. Image receipts prefer `createImageBitmap()` with EXIF orientation support,
   then fall back to `Image` for older browsers.
5. The canvas is resized for the current platform profile before recognition.
   Smaller mobile limits reduce memory pressure; desktop keeps more detail for
   small receipt text.
6. OCR runs first on the normalized image, then retries contrast and binary
   enhancement only when the first pass scores poorly.
7. `features/receipt-parse.js` converts text into a review sheet. Users confirm
   the merchant, amount, date, and notes before anything enters the ledger.

## Current resource contract

| Area | Contract |
| --- | --- |
| File size | 15 MB maximum receipt/PDF input |
| PDF pages | 20 pages maximum before the scan is rejected |
| PDF text | 5,000 extracted lines or 250,000 characters maximum |
| OCR input | Long side upscales to at least 1,200 px for legibility |
| Mobile photo canvas | Long side caps at 2,200 px to avoid low-memory crashes |
| Desktop photo canvas | Long side caps at 2,600 px for better small-text recall |
| Enhancement canvas | 1.3 MP on mobile, 1.8 MP on desktop |
| Runtime | Same-origin ONNX Runtime Web WASM, single threaded for GitHub Pages |

Single-thread WASM is deliberate. GitHub Pages does not send the isolation
headers required by browser thread pools, and the single-thread path works
across Safari, Firefox, Chromium, iOS, and Android.

## Dependency update rule

OCR updates should move code, models, and documentation together:

1. Update `package.json` / `package-lock.json`.
2. Refresh reviewed assets under `vendor/` and `vendor/SHA256SUMS`.
3. Confirm `OCR_CONFIG` still points to same-origin files.
4. Run a local receipt/PDF smoke test in a browser.
5. Run `npm run build` and `npm test`.

Do not switch OCR assets to CDN URLs or hosted APIs. Receipt pixels, recognized
text, ledger JSON, and encryption keys must stay on the user's device.
