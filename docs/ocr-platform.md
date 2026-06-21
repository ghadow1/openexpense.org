# OCR platform notes

OpenExpense keeps receipt reading private by running OCR in the browser. Photos,
screenshots, and PDFs stay on the device; only the reviewer-approved expense is
written to the encrypted ledger.

## Runtime pipeline

The receipt pipeline lives in `src/features/receipt.js` and is driven by
`OCR_CONFIG` in `src/config.js`.

1. `ocr.engine.load` lazy-loads PP-OCRv5 from jsDelivr on the first scan.
2. `ocr.model.download` initializes the model bundle; browser cache handles
   repeat scans.
3. `ocr.engine.warmup` runs a tiny synthetic canvas so the first real receipt
   does not pay all setup cost during recognition.
4. `ocr.pdf.load` and `ocr.pdf.page-text` extract embedded text from PDFs before
   falling back to OCR.
5. `ocr.pdf.preview` renders the first PDF page for review.
6. `ocr.image.read-text` recognizes camera images, screenshots, or rendered PDF
   pages.
7. `ocr.done` marks a text-extraction path that finished without model OCR.

These tags are intentionally human-readable and are exposed on the progress
dialog as `data-ocr-stage` for debugging, QA notes, and future telemetry-free
diagnostics.

## Cross-platform performance budgets

The app targets current mobile browsers and desktop browsers without native
wrappers. The most important OCR budgets are centralized in `OCR_CONFIG.canvas`:

- `minReadableSide`: upscales very small images so receipt text is large enough
  for recognition.
- `maxOcrSide`: caps camera photos and rendered pages to avoid excessive memory
  use on mobile GPUs while still giving desktop browsers high-resolution input.
- `pdfPreviewMaxScale` and `pdfPreviewMaxSide`: keep PDF preview rendering sharp
  but bounded.
- `jpegPreviewQuality`: keeps the review thumbnail readable without bloating DOM
  memory.
- `warmupSide`: controls the synthetic warmup canvas used during idle time.

Startup schedules OCR warmup through `requestIdleCallback` when available, with
a timeout fallback from `OCR_CONFIG.warmup`. This lets modern desktop browsers
prepare the engine opportunistically while preserving mobile responsiveness.

## Dependency pins

Lazy-loaded OCR dependencies are split across two places:

- `OCR_CONFIG.cdn` pins the OCR service and PDF.js worker/module URLs.
- `index.html` pins import-map peers for `onnxruntime-web` and `ppu-ocv`.

Update these together when upgrading OCR packages, then verify a camera image,
an image upload, a text-based PDF, and a scanned/image-only PDF.
