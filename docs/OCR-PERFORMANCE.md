# OCR performance and platform notes

OpenExpense receipt reading is a local browser pipeline. It uses current web
platform primitives when they are available, keeps OCR and PDF code out of the
startup bundle, and serves executable runtimes and models from this origin.

## Human-readable source tags

Search these tags when changing receipt capture, OCR, or parser behavior:

| Tag | Meaning | Primary files |
| --- | --- | --- |
| `@ocr-deps` | Dependency names, same-origin assets, and version-review boundary | `src/config.js`, `docs/DEPENDENCIES.md` |
| `@ocr-engine` | Lazy PP-OCR initialization, ONNX Runtime Web setup, and model warmup | `src/features/receipt.js` |
| `@ocr-pdf` | PDF.js text extraction and preview-page raster fallback | `src/features/receipt.js` |
| `@ocr-pipeline` | Image/PDF routing, OCR pass escalation, and review data flow | `src/features/receipt.js` |
| `@ocr-parse` | Merchant, date, total, tax, and item extraction from recognized text | `src/features/receipt-parse.js` |
| `@platform` | Mobile camera, touch, share, image decode, and desktop file APIs | `src/core/utils.js`, `src/features/receipt-picker.js`, `src/features/receipt.js` |
| `@perf` | Pixel, page, line, memory, and confidence thresholds | `src/config.js`, `src/features/receipt.js`, `src/features/receipt-parse.js` |

## Cross-platform resource contract

- Camera and file selection happen synchronously in `receipt-picker.js` so
  iOS, Android, and desktop browsers keep their user activation.
- Images prefer `createImageBitmap()` with `imageOrientation: "from-image"`
  when the browser supports it. Safari and older browsers use an `Image`
  fallback.
- PDF invoices use embedded text first. OCR runs on a rendered first-page
  preview only when native PDF text is missing or weaker than OCR output.
- ONNX Runtime Web uses the checked-in `vendor/ort/` WASM assets and a single
  worker thread by default. That keeps mobile memory predictable; desktops
  still benefit from the same SIMD-enabled runtime file when supported.
- OCR input is normalized to the shared size envelope in `OCR_CONFIG.limits`.
  Small photos are upscaled enough for text detection, oversized photos are
  downscaled before OCR, and high-contrast retry passes cap pixel reads.
- No receipt pixels, PDF text, ledger JSON, or key material is sent to a
  remote service. New OCR resources must remain bundled or same-origin.

## Change checklist

1. Update `OCR_CONFIG` in `src/config.js` before changing inline OCR limits.
2. Keep model/runtime assets under `vendor/` and update `vendor/SHA256SUMS`
   when reviewed assets change.
3. Update `docs/DEPENDENCIES.md` when OCR, PDF, font, icon, or runtime
   dependencies change.
4. Preserve lazy imports for OCR/PDF code so the first app load stays small.
5. Run `npm run build` and `npm test`; commit generated bundles with source.
