# OCR performance and code tags

OpenExpense reads receipts, invoices, bills, screenshots, and PDFs entirely in
the browser. There is no OCR API and no upload path. This guide documents the
small set of source tags used around the receipt pipeline so future cleanup
keeps mobile and desktop performance visible in code review.

## Tag legend

| Tag | Meaning | Primary files |
| --- | --- | --- |
| `@ocr-deps` | Same-origin OCR/PDF assets: wasm runtime, models, dictionary, and worker. | `src/config.js`, `src/features/receipt.js`, `vendor/` |
| `@ocr-engine` | OCR service construction, ONNX Runtime options, recognition strategy, and warmup. | `src/config.js`, `src/features/receipt.js` |
| `@ocr-pdf` | PDF.js loading, embedded text extraction, and first-page preview rendering. | `src/features/receipt.js` |
| `@ocr-pipeline` | Image decode, EXIF orientation, canvas resize, contrast pass, binary retry, and preview flow. | `src/features/receipt.js` |
| `@ocr-parse` | Text quality checks and the merchant/date/total parser handoff. | `src/features/receipt.js`, `src/features/receipt-parse.js` |
| `@platform` | Browser and device choices such as camera capture, coarse pointer behavior, and desktop wasm threading. | `src/core/utils.js`, `src/features/receipt-picker.js`, `src/features/receipt.js` |
| `@perf` | Explicit resource limits: file size, pages, text length, canvas dimensions, enhancement pixels, and retry thresholds. | `src/config.js`, `src/features/receipt.js` |

## Source of truth

`OCR_CONFIG` in `src/config.js` is the canonical place for receipt-reading
limits and runtime knobs. Keep these values centralized:

- same-origin asset paths for PP-OCRv6 Tiny, ONNX Runtime wasm, and PDF.js;
- file, PDF, text, canvas, and enhancement ceilings;
- mobile/tablet/desktop thread budgets;
- OCR recognition strategy and warmup size;
- score thresholds that decide when to stop retrying enhanced images.

The scanner imports that object instead of declaring local copies. When a value
changes, update this guide and the QC check in `scripts/qc-ocr-performance.mjs`
in the same commit.

## Cross-platform performance rules

- Prefer embedded PDF text before OCR. It is faster, more accurate for invoices,
  and avoids rasterizing every page.
- Track PDF extracted text length incrementally. Repeated whole-document joins
  create avoidable work on long invoices.
- Decode photos with `createImageBitmap()` when available so modern browsers can
  honor image orientation before drawing to canvas. Keep the `Image` fallback for
  older desktop browsers and locked-down webviews.
- Normalize the longest OCR side before inference. Very small screenshots need
  enough pixels for text; oversized camera photos should not allocate huge wasm
  tensors.
- Keep enhancement pixels lower than OCR input pixels. Contrast and binary
  retries read and write every pixel, which is where low-memory phones feel pain
  first.
- Use more than one ONNX wasm thread only when the page is cross-origin
  isolated. Without those headers, SharedArrayBuffer-backed wasm threading is
  unavailable and the safe budget is one thread.
- Preserve the synchronous picker module. Native camera/file pickers need the
  original user activation, while OCR dependencies should remain lazy-loaded.

## Dependency policy

OCR dependency upgrades are not just `package.json` edits. Review the same-origin
files in `vendor/`, refresh checksums, run the focused receipt smoke path, and
commit generated bundles after `npm run build`.
