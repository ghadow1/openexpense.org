# OCR performance and source tags

OpenExpense reads receipts on the device. Camera images, screenshots, and PDF
invoices stay in the browser; there is no upload path or server OCR fallback.

## Human-readable code tags

Use these tags when touching the receipt pipeline so future cleanup can find the
owner without guessing from filenames.

| Tag | Owner | Meaning |
| --- | --- | --- |
| `@ocr-deps` | `src/config.js` | Same-origin model, worker, WASM, and runtime budget settings |
| `@ocr-engine` | `src/features/receipt.js` | Lazy PP-OCR / onnxruntime setup and warmup |
| `@ocr-pdf` | `src/features/receipt.js` | Native PDF text extraction and bounded first-page rendering |
| `@ocr-pipeline` | `src/features/receipt.js` | File-to-canvas, enhancement, scoring, and retry order |
| `@ocr-parse` | `src/features/receipt-parse.js` | Merchant, date, total, tax, and item heuristics |
| `@platform` | `src/core/utils.js`, `src/features/receipt-picker.js` | Mobile/desktop capability checks and native picker choices |
| `@perf` | This document and QC | Cross-platform performance budgets and verification |

## Cross-platform runtime model

- **Phone-first capture:** `receipt-picker.js` preserves the user gesture and
  adds `capture="environment"` when the browser looks camera-first or
  coarse-pointer. Desktop and tablet users keep the wider file chooser.
- **Modern image decode:** `receipt.js` tries `createImageBitmap()` with EXIF
  orientation, then falls back to `Image` for older WebViews.
- **PDF shortcut:** PDF.js reads embedded text from each page before OCR. If the
  extracted text has a merchant and total, the OCR model is skipped.
- **Bounded pixels:** `OCR_CONFIG.image` keeps OCR inputs between 1200 and 2600
  pixels on the longest side, and caps enhancement work at 1.8 million pixels.
- **Predictable WASM:** onnxruntime uses the checked-in same-origin WASM assets
  and one worker thread. That avoids mobile memory spikes while desktop still
  benefits from the SIMD-enabled runtime file in `vendor/ort/`.
- **Lazy dependencies:** OCR, PDF.js, and models load only when the user starts a
  receipt scan. Normal ledger startup does not pay the OCR cost.

## Dependency and asset policy

OCR dependencies are pinned in `package-lock.json`, and matching runtime/model
assets are checked into `vendor/`. Do not bump `ppu-paddle-ocr`,
`onnxruntime-web`, or `pdfjs-dist` without updating the corresponding vendored
files and checksums in the same change.

When upgrading to a newer mobile or desktop OCR stack:

1. Update the npm package.
2. Replace the matching `vendor/` assets from that exact package/version.
3. Update `vendor/SHA256SUMS`.
4. Run a local OCR smoke test with at least one phone photo and one PDF invoice.
5. Run `npm run build`, `npm test`, and `git diff --check HEAD`.

## Performance checklist

- Keep file and PDF limits in `OCR_CONFIG.limits`; do not reintroduce magic
  numbers in `receipt.js`.
- Keep scoring thresholds in `OCR_CONFIG.scoring`; retry order should remain
  original image, contrast image, then binary image.
- Prefer capability checks over user-agent checks when a reliable Web API exists.
- Preserve same-origin model and worker paths so content security policy and
  offline caching stay understandable.
- Add a focused QC assertion when a tag, limit, asset path, or dependency rule
  changes.

`scripts/qc-ocr-performance.mjs` checks the source tags and the most important
`@perf` invariants so the documentation stays attached to executable code.
