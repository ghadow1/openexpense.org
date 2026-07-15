# OCR performance and code tags

OpenExpense reads receipts entirely in the browser. Ledger data, receipt images,
PDF contents, and extracted text are not uploaded to an OpenExpense backend.
The OCR, ONNX, OpenCV canvas, PDF.js, and icon assets are fetched from the CDN
listed in `src/config.js` and `index.html`, then handled locally by the browser.

## Source tags

Use these tags when navigating OCR-related code. They are intentionally short and
human-readable so browser errors, code search, and future reviews point to the
same concepts.

| Tag | Source | Purpose |
| --- | --- | --- |
| `[OCR:idle-warmup]` | `src/main.js` | Schedules low-priority OCR warmup only on capable devices. |
| `[OCR:engine-load]` | `src/features/receipt.js` | Lazy-loads PaddleOCR and warms the model. |
| `[OCR:pdf-loader]` | `src/features/receipt.js` | Loads PDF.js only for PDF receipts and invoices. |
| `[OCR:pdf-text-first]` | `src/features/receipt.js` | Extracts selectable PDF text before falling back to OCR. |
| `[OCR:recognize]` | `src/features/receipt.js` | Runs structured OCR, then flat text fallback. |
| `[OCR:image-decode]` | `src/features/receipt.js` | Uses `createImageBitmap` where available, with an image element fallback. |
| `[OCR:canvas-normalize]` | `src/features/receipt.js` | Bounds receipt image size for accuracy without mobile memory spikes. |
| `[OCR:parse-review]` | `src/features/receipt.js` | Converts OCR text into editable receipt suggestions. |
| `[OCR:preview-confirm]` | `src/features/receipt.js` | Keeps human review before ledger writes. |

## Cross-platform performance rules

- Keep OCR lazy. The base app should start without loading OCR, ONNX, OpenCV, or
  PDF.js. Manual scanning may load them on demand.
- Gate idle warmup with `Utils.shouldWarmOcr()`. Respect data saver, very slow
  effective connection types, and low-memory devices.
- Keep OCR sizing in `OCR_CONFIG.canvas`. Receipt photos should be large enough
  for small text but bounded to avoid unnecessary memory on mobile cameras.
- Prefer text-first PDFs. Selectable invoices parse faster and more accurately
  than raster OCR; scanned PDFs still render through the shared canvas path.
- Prefer modern browser primitives when they are safe. `createImageBitmap` gives
  newer desktop and mobile browsers a faster decode path, while the image element
  fallback preserves older Safari and embedded browser support.
- Keep import-map peer versions in `index.html` aligned with
  `OCR_CONFIG.dependencies` in `src/config.js`.

## User-facing behavior

OCR is a suggestion engine, not an autopilot. Every scanned receipt opens a
review sheet where the user confirms merchant, amount, date, and notes before
anything is saved to the encrypted local ledger.

HEIC/HEIF decoding is browser-dependent. The file picker accepts those formats
for modern mobile devices, but the app reports a clear fallback hint when a
browser cannot decode them.
