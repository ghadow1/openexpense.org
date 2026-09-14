# OCR performance and source tags

OpenExpense reads receipts, invoices, screenshots, and text-based PDFs in the
browser. There is no upload path: OCR code, PDF code, WASM, and model files are
bundled into the site or served from `/vendor/` on the same origin.

## Human-readable source tags

Use these tags in module headers or short comments when changing OCR behavior.
They are mirrored in `OCR_CONFIG.sourceTagLegend` in `src/config.js`.

| Tag | Meaning |
| --- | --- |
| `@ocr-deps` | Same-origin OCR/PDF dependencies and vendored model paths. |
| `@ocr-engine` | Model initialization, ONNX runtime setup, and OCR scoring. |
| `@ocr-pdf` | PDF text extraction and first-page raster preview handling. |
| `@ocr-pipeline` | Image/PDF preprocessing, retry order, and canvas sizing. |
| `@ocr-parse` | Text normalization and receipt/invoice field extraction. |
| `@ocr-ui` | Receipt progress, preview, correction, and save workflow. |
| `@platform` | Browser capability checks for phone, tablet, and desktop. |
| `@perf` | Memory, threading, raster, and retry thresholds. |

## Platform contract

The scanner uses runtime feature checks rather than a separate mobile or desktop
build.

- **Phones and constrained-memory browsers** use a smaller OCR raster ceiling and
  single-threaded WASM to avoid canvas allocation spikes.
- **Touch tablets** keep the mobile/constrained raster path because browser tab
  memory pressure is closer to phones than workstations.
- **Desktop browsers** may use multiple WASM threads when the page is
  `crossOriginIsolated` and `SharedArrayBuffer` is available. Without those
  platform features, desktop falls back to the same single-thread path.
- **Image decoding** prefers `createImageBitmap()` for modern browsers and falls
  back to `Image` for compatibility.
- **PDFs** try native text extraction first. If the extracted text contains a
  usable merchant and total, OCR is skipped; otherwise the first page is rastered
  and passed through the same OCR pipeline.

Keep new mobile APIs progressive. Camera, file picker, PDF, canvas, WebAssembly,
and File System Access behaviors must keep working when a browser lacks one
optional capability.

## Review checklist for OCR changes

1. Update `OCR_CONFIG` for dependency paths, file limits, canvas dimensions,
   retry thresholds, confidence thresholds, or thread caps.
2. Keep OCR imports lazy from `src/main.js`; first paint must not load models.
3. Keep all runtime assets same-origin and documented in `docs/DEPENDENCIES.md`.
4. Run `npm run build` after `src/` edits and commit generated bundles.
5. Run `npm test`; parser changes should add cases in `scripts/qc-engine.mjs`.

The goal is predictable cross-platform performance: use newer browser features
when present, but keep the privacy-first offline path available on iOS, Android,
tablet browsers, and desktop browsers.
