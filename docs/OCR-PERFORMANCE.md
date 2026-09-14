# OCR performance and source tags

Receipt scanning is a local-first feature. Camera photos, screenshots, PDF
invoices, OCR models, and parsed text stay in the browser. The app uses modern
mobile and desktop browser primitives where available, then falls back to safe
single-threaded paths on constrained or non-isolated runtimes.

## Runtime contract

| Area | Contract |
| --- | --- |
| Assets | OCR, PDF, WASM, model, and dictionary files load from this origin under `vendor/`. |
| Startup | Receipt capture opens synchronously, but OCR/PDF modules lazy-load only after a user chooses a file. |
| Mobile | Phone and coarse-pointer flows keep ONNX/WASM inference single-threaded and bound image sizes before canvas work. |
| Desktop | Cross-origin-isolated desktop browsers may use multiple WASM threads, capped by `OCR_CONFIG.runtime`. |
| PDF | Text extraction runs before OCR. Native invoice text wins when it contains a merchant and total. |
| Images | `createImageBitmap()` handles modern orientation paths; the `Image` fallback keeps older browsers usable. |
| Review | OCR output is advisory. The review sheet is the required save boundary. |

## Configuration owners

`src/config.js` exports `OCR_CONFIG`, the central place for:

- `assets`: same-origin PDF worker, ONNX WASM path, OCR models, and dictionary.
- `limits`: file size, PDF page/text caps, canvas dimensions, and enhancement
  pixel budgets.
- `scoring`: thresholds and weights used to decide whether another OCR pass is
  worth the extra CPU.
- `runtime`: mobile/desktop thread caps and the minimum core count before
  desktop threading is considered.

`src/features/receipt.js` consumes those values. Do not introduce new receipt
size, page, model, or score constants directly in the scanner.

## Human-readable tags

These comments are intentionally short labels for reviewers and future agents:

| Tag | Meaning |
| --- | --- |
| `@ocr-deps` | Same-origin OCR/PDF dependencies, models, workers, and dictionaries. |
| `@ocr-engine` | Runtime initialization and model warm-up. |
| `@ocr-pdf` | PDF text extraction, worker setup, and first-page raster preview. |
| `@ocr-pipeline` | Multi-pass OCR flow from raw image to parsed lines. |
| `@ocr-parse` | Heuristics that turn OCR/PDF text into merchant, total, date, tax, and notes. |
| `@platform` | Browser/device capability choices such as camera capture, orientation, and WASM threads. |
| `@perf` | Explicit resource budgets, lazy-loading, scoring thresholds, and CPU trade-offs. |

## Change checklist

When changing receipt scanning:

1. Keep executable code and models same-origin.
2. Keep the picker path synchronous so mobile browsers preserve the camera/file
   user gesture.
3. Update `OCR_CONFIG` before changing scanner constants.
4. Check both mobile and desktop consequences for canvas size, memory, and WASM
   threads.
5. Run `npm run build` and `npm test`, then commit generated bundles with the
   source change.
