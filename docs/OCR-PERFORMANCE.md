# OCR performance and readable tags

OpenExpense receipt scanning is a browser-only pipeline. Photos, PDFs, and parsed text stay on the user's device; no receipt content is uploaded.

## Pipeline

1. `index.html` exposes the scan controls and the hidden file input.
2. `src/features/receipt.js` accepts images, HEIC/HEIF where the browser can decode them, and PDFs.
3. PDFs are parsed with PDF.js text extraction first. If the PDF has little or no embedded text, the first page is rendered to canvas for OCR.
4. Images are decoded with `createImageBitmap` when available, then fall back to `HTMLImageElement`.
5. PP-OCRv5 runs in the browser through `ppu-paddle-ocr` and ONNX Runtime Web.
6. Parsed merchant, amount, date, and notes are shown in a review sheet. The app never saves OCR output without user confirmation.

## Dependency pins

Keep these values together:

- `src/config.js` -> `OCR_CONFIG.dependencies`
- `index.html` -> import map for `onnxruntime-web` and `ppu-ocv/canvas-web`

The OCR engine is intentionally lazy-loaded. Avoid moving it into the main bundle because that would slow first paint for users who never scan receipts.

## Platform profiles

`OCR_CONFIG.canvasProfiles` trades accuracy, memory, and battery by device class:

- `mobile`: smaller canvases for camera captures and low-memory browsers.
- `tablet`: middle ground for coarse-pointer devices and narrower desktop windows.
- `desktop`: larger canvases for sharper invoice text when memory is usually less constrained.

`Utils.ocrCanvasProfile()` is the only place that should choose a profile. If breakpoints change, update `BREAKPOINTS` and the profile selection together.

## Warmup rules

OCR warmup happens in two ways:

- Intent warmup: pointer, touch, or focus on a scan control starts OCR early when the network is not constrained.
- Idle warmup: desktops may start OCR during idle time.

`Utils.shouldWarmOcr()` blocks warmup on Data Saver, very slow effective connection types, mobile/coarse-pointer idle sessions, and low-memory desktops. Manual scans always call `ensureEngine()` so users can still scan on constrained devices.

## Human-readable code tags

Stable OCR UI hooks live in `OCR_CONFIG.tags` and render as `data-oe-tag` attributes:

| Tag | Purpose |
| --- | --- |
| `ocr.scan.intent` | Visible scan buttons and intent warmup |
| `ocr.scan.file-input` | Hidden receipt file input |
| `ocr.scan.progress` | OCR progress modal |
| `ocr.review.sheet` | Editable review dialog |
| `ocr.review.raw-text` | Raw recognized text disclosure |
| `ocr.review.save` | Save expense action |
| `ocr.review.save-and-scan` | Save and open the next scan |
| `ocr.review.cancel` | Dismiss review actions |

Prefer these tags in browser automation and future refactors. They are more durable than class names, which primarily exist for styling.

## Validation

After OCR or bundle changes:

```bash
npm run validate
```

`validate` rebuilds the static assets. The `prebuild` step removes stale root `app.js` and `chunk-*.js` files before esbuild writes the current bundle.
