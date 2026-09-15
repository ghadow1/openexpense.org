# Receipt OCR performance and code tags

OpenExpense reads receipts, invoices, and screenshots in the browser. There is
no upload path: PDF.js, ONNX Runtime Web, PP-OCRv6 Tiny, WASM files, and models
are either bundled into lazy chunks or served from `vendor/` on the same origin.

## Human-readable tags

Use these tags in nearby comments when editing the receipt pipeline. They make
performance-sensitive code searchable without forcing long comments into the hot
path.

| Tag | Meaning | Primary files |
| --- | --- | --- |
| `@ocr-deps` | Same-origin OCR/PDF workers, WASM, models, and dictionaries | `src/config.js`, `src/features/receipt.js`, `docs/DEPENDENCIES.md` |
| `@ocr-engine` | PP-OCR / ONNX runtime setup and warmup | `src/features/receipt.js` |
| `@ocr-pdf` | PDF text extraction, page caps, and first-page raster preview | `src/config.js`, `src/features/receipt.js` |
| `@ocr-pipeline` | Image decode, resize, enhancement passes, preview encoding | `src/config.js`, `src/features/receipt.js` |
| `@ocr-parse` | Score gates and parser trust thresholds | `src/config.js`, `src/features/receipt-parse.js` |
| `@platform` | Phone, tablet, desktop, secure-context, and isolation choices | `src/config.js`, `src/core/utils.js`, `src/features/receipt-picker.js` |
| `@perf` | Startup, memory, thread, and byte budgets | `src/config.js`, `scripts/qc-*.mjs` |

## Source of truth

`OCR_CONFIG` in `src/config.js` owns the receipt OCR contract:

- `assets`: local PDF worker, ONNX WASM path, PP-OCRv6 Tiny detection and
  recognition models, and dictionary.
- `runtime`: WebAssembly execution provider and thread ceilings.
- `limits`: file size, PDF pages/text size, image dimensions, and enhancement
  pixel budget.
- `scoring`: when a first pass is good enough and when enhanced retries stop.
- `progress`: user-visible progress breakpoints for slower mobile scans.
- `preview`: JPEG quality used for the local review sheet preview.

Keep numbers there first. `src/features/receipt.js` should read the named
contract instead of adding one-off literals.

## Cross-platform runtime policy

The receipt picker stays synchronous in `src/features/receipt-picker.js` so
phones keep native camera/file user activation. The expensive OCR stack is
lazy-loaded only after a file is chosen.

| Platform capability | Behavior |
| --- | --- |
| Phone / coarse pointer | Prefer camera capture and keep ONNX at one WASM thread. |
| Desktop without cross-origin isolation | Keep one WASM thread, which works on GitHub Pages and older browsers. |
| Desktop with `crossOriginIsolated` and `SharedArrayBuffer` | Allow up to `OCR_CONFIG.runtime.desktopThreads` ONNX WASM threads, capped by `navigator.hardwareConcurrency`. |
| Modern image decoders | Try `createImageBitmap(..., { imageOrientation: 'from-image' })`, then fall back to `Image`. |
| Text-based PDF | Use PDF text before OCR; rasterize the first page only for preview or fallback OCR. |

This keeps the default path compatible while still letting newer desktop
browsers use threaded WASM when the deployment headers support it.

## Dependency and model upgrades

Do not bump OCR/PDF npm packages by themselves. A safe upgrade includes:

1. Updating `package.json` and `package-lock.json`.
2. Reviewing and replacing same-origin assets under `vendor/`.
3. Updating `vendor/SHA256SUMS`.
4. Running `npm run build` so lazy chunks point at the reviewed runtime.
5. Running `npm test` and a browser smoke test with one image receipt and one
   text-based PDF.

The dependency policy remains in [`DEPENDENCIES.md`](DEPENDENCIES.md).

## Performance budget checklist

- Startup JavaScript stays below the committed lite budget; receipt OCR remains
  in lazy chunks.
- Inputs over `OCR_CONFIG.limits.maxFileBytes` fail before decode.
- PDFs over `maxPdfPages`, `maxExtractedLines`, or `maxExtractedChars` stop
  before exhausting memory.
- Images are resized to the `minOcrSide` / `maxOcrSide` range before OCR.
- Enhancement passes cap pixels with `maxEnhancementPixels`.
- Weak OCR opens editable fields with a low-confidence hint instead of saving
  automatically.

## Verification

Run:

```bash
npm run build
npm test
git diff --check HEAD
```

`scripts/qc-ocr-performance.mjs` guards this document, the code tags, the
central config, and the test hook.
