# OCR receipt performance

OpenExpense receipt reading is local-first: receipt pixels, PDF text, ledger
data, and keys stay in the browser. The scanner uses modern browser features
when they are available, but every feature must preserve the same-origin,
offline-capable model.

## Human-readable code tags

These tags mark the OCR path in source and make reviews faster:

| Tag | Meaning |
| --- | --- |
| `@ocr-deps` | OCR, PDF, model, worker, and runtime dependency boundaries |
| `@ocr-engine` | PP-OCR / ONNX runtime initialization and warmup |
| `@ocr-pdf` | PDF.js text extraction and first-page preview rendering |
| `@ocr-pipeline` | Image/PDF recognition flow before the review sheet |
| `@ocr-parse` | Merchant, date, total, tax, and line-item parsing |
| `@platform` | Phone, tablet, desktop, camera, or browser capability decisions |
| `@perf` | Size caps, scoring thresholds, and bounded retry work |

If a scanner change moves one of those responsibilities, move the matching tag
with it and update this document.

## Cross-platform runtime contract

| Surface | Browser capability used | Performance rule |
| --- | --- | --- |
| Phone camera | Native file input with `capture="environment"` when a coarse/small screen is detected | Prefer direct camera capture, smaller decode canvases, and one WASM thread |
| Tablet | Same picker path as phone, larger canvas budget than phone | Keep enough pixels for invoices and screenshots without desktop memory pressure |
| Desktop | File picker, larger decode canvas, optional threaded WASM | Use more detail and enable multi-threaded WASM only when the page is cross-origin isolated |
| Images | `createImageBitmap()` with EXIF orientation, then `Image` fallback | Decode off the main thread when supported; keep a safe fallback for older browsers |
| PDFs | PDF.js native text extraction before OCR | Skip OCR when the PDF already has usable text and a parsed merchant/total |

Threaded ONNX WASM requires `SharedArrayBuffer` and a cross-origin-isolated
page. GitHub Pages may not provide those headers, so `src/features/receipt.js`
falls back to one thread automatically.

## Tunables

The canonical OCR settings live in `OCR_CONFIG` inside `src/config.js`.

- `assets` must stay under `/vendor/` so OCR code, workers, WASM, dictionaries,
  and models are served from the OpenExpense origin.
- `limits` bounds file size, PDF pages, and extracted PDF text.
- `canvas` sets decode, OCR, PDF render, and enhancement sizes for phone,
  tablet, and desktop profiles.
- `runtime` describes the ONNX execution provider and safe WASM thread caps.
- `scoring` controls when the scanner stops after a good pass or spends another
  bounded contrast pass.

Run `npm test` after changing these values. The OCR QC test checks that docs,
source tags, config, and scanner behavior stay aligned.

## Change checklist

1. Keep OCR and PDF dependencies lazy-loaded from the receipt path.
2. Keep models, workers, and WASM same-origin and update `vendor/SHA256SUMS`
   when vendored binaries change.
3. Prefer capability checks over user-agent-only branches.
4. Preserve the PDF native-text fast path before OCR.
5. Rebuild generated bundles with `npm run build` after source edits.
