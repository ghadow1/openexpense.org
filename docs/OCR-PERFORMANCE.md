# OCR performance and source tags

OpenExpense reads receipts, invoices, screenshots, and PDF statements entirely
in the browser. The OCR stack is optimized for modern phone cameras, tablets,
and desktop upload workflows while preserving the local-first rule: receipt
pixels, PDF text, ledger entries, and keys never leave the device.

## Human-readable source tags

Short tags in comments mark the boundaries that matter when reviewing OCR,
platform, or performance work.

| Tag | Meaning | Primary files |
| --- | --- | --- |
| `@ocr-deps` | Same-origin OCR/PDF runtimes, workers, models, and dictionaries | `src/config.js`, `src/features/receipt.js` |
| `@ocr-engine` | Lazy ONNX Runtime + PP-OCRv6 initialization and warmup | `src/features/receipt.js` |
| `@ocr-pdf` | PDF.js worker setup, native PDF text, and first-page preview render | `src/features/receipt.js` |
| `@ocr-pipeline` | Image decode, canvas sizing, enhancement passes, and text recognition | `src/features/receipt.js` |
| `@ocr-parse` | Merchant, date, total, tax, item, and document-kind heuristics | `src/features/receipt-parse.js` |
| `@ocr-ui` | Progress and review sheets where a person confirms OCR suggestions | `src/features/receipt.js` |
| `@platform` | Phone/tablet/desktop capability checks and browser API choices | `src/core/utils.js`, `src/config.js` |
| `@perf` | Startup budget, lazy boundaries, canvas limits, and inference thresholds | `src/config.js`, `src/features/receipt.js` |

Use these tags for navigation only. Do not rename DOM ids, `data-*` hooks, or
CSS classes as part of a tag cleanup; those contracts are documented in
[`CODEMAP.md`](CODEMAP.md).

## Current OCR stack

| Resource | Current role |
| --- | --- |
| `ppu-paddle-ocr` | PP-OCRv6 Tiny detection and recognition, loaded only after receipt capture |
| `onnxruntime-web` | WASM inference runtime served from `/vendor/ort/` |
| `pdfjs-dist` | Native PDF text extraction and bounded first-page preview raster |
| `/vendor/ocr-models/` | Reviewed same-origin OCR model files and dictionary |
| Canvas APIs | Orientation-aware image decode, resize, and contrast/binary enhancement |

`src/config.js` owns `OCR_CONFIG`, the source of truth for OCR asset paths,
runtime settings, file/page/text caps, image sizing, PDF render limits, scoring
weights, and preview quality. Keep new OCR constants there unless they are
pure parsing heuristics local to `src/features/receipt-parse.js`.

## Cross-platform pipeline

1. `receipt-picker.js` opens the native camera/file chooser synchronously from
   the click handler. This protects iOS and Android user activation.
2. `receipt.js` lazy-loads OCR/PDF dependencies after the file is selected, so
   normal ledger startup stays inside the lightweight bundle budget.
3. PDFs try native text first. A text-based invoice can skip OCR when it has a
   merchant and total; otherwise the first page is rendered to a bounded canvas
   and recognized locally.
4. Images prefer `createImageBitmap()` with EXIF orientation, then fall back to
   `Image` for older desktop and mobile browsers.
5. Canvas dimensions are normalized before inference. Very small captures are
   upscaled for legibility; very large desktop scans are downscaled to protect
   memory and battery.
6. Low-quality first-pass OCR retries with contrast and binary enhancement.
7. The review sheet is always required. OCR output is a draft, not an automatic
   ledger write.

## Performance guardrails

| Guardrail | Why it exists |
| --- | --- |
| 15 MB receipt file cap | Avoids phone memory spikes and accidental large-document uploads |
| 20-page PDF cap | Keeps local PDF parsing bounded |
| Extracted line/text caps | Stops hostile or malformed PDFs from monopolizing the tab |
| One WASM OCR thread | Keeps behavior predictable across Safari, mobile Chrome, Firefox, and desktop |
| Bounded preview render | Gives desktop PDFs a usable preview without full-document raster cost |
| Bounded enhancement pixels | Keeps contrast and binary passes fast on mobile CPUs |
| Lazy OCR/PDF imports | Keeps first paint and day-to-day ledger work independent from receipt tech |

## Review checklist

- Keep all OCR, PDF, model, font, and runtime assets same-origin.
- Rebuild root bundles after `src/` edits: `npm run build`.
- Run `npm test` and `git diff --check HEAD`.
- Test a phone-width flow for native camera activation and a desktop flow for
  image/PDF upload when UI behavior changes.
- Treat OCR parser scores as heuristics. A person must confirm title, amount,
  and date before saving.
