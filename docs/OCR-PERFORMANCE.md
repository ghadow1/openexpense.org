# Receipt OCR performance notes

OpenExpense keeps receipt scanning private by running OCR in the browser. The
tradeoff is that mobile phones, tablets, and desktop browsers have different
CPU, memory, camera, and network constraints. This document explains the source
tags and platform choices used by the receipt scanner.

## Source tags

Use these tags in comments when touching receipt scanning code so related code
is easy to find without knowing the file layout.

- `@ocr-deps` - lazy-loaded OCR, PDF, and peer dependency pins.
- `@ocr-engine` - OCR service initialization, warmup, and recognition calls.
- `@ocr-pdf` - PDF.js loading, text extraction, and raster preview rendering.
- `@ocr-pipeline` - scan orchestration from file selection to parsed result.
- `@ocr-parse` - merchant, date, amount, tax, and item heuristics.
- `@ocr-ui` - progress and review UI shown before saving an expense.
- `@platform` - mobile, tablet, desktop, camera, and browser feature gates.
- `@perf` - memory, decode, canvas sizing, and startup performance choices.

## Cross-platform behavior

- Camera capture is offered on touch/coarse-pointer layouts while desktop keeps
  the regular file picker for images and PDFs.
- OCR is lazy-loaded from CDN only when needed. Capable devices warm the engine
  during idle time; data-saver, 2G-class, and low-memory sessions skip warmup
  and load on demand when the user scans.
- Image receipts prefer `createImageBitmap()` for efficient browser decoding
  with an `Image` fallback for older mobile WebViews and Safari builds.
- Large camera frames are scaled before OCR so modern phone photos do not keep
  unnecessary pixels in memory. Small images are upscaled enough for model
  readability.
- Digital PDFs are parsed through native embedded text first. Raster OCR only
  runs for scanned PDFs or PDFs with too little extractable text.
- PDF previews use blob-backed object URLs when supported, falling back to data
  URLs on older browsers.

## Configuration

Receipt OCR configuration lives in `src/config.js` as `OCR_CONFIG`.

- `dependencies` holds the pinned CDN URLs for `ppu-paddle-ocr`, `pdfjs-dist`,
  and peer import-map packages. Keep `index.html` import-map URLs in sync with
  `OCR_CONFIG.dependencies.peerImports`.
- `canvas` controls OCR sizing limits and the warmup canvas size.
- `pdf` controls when native PDF text is trusted enough to skip raster OCR.
- `warmup` controls idle preload policy by connection type and device memory.

## Manual smoke check

After changing OCR code:

1. Run `npm run validate`.
2. Run `npm run serve` and open `http://localhost:8765`.
3. Use **Scan** with `test-receipt.png`.
4. Confirm the review sheet opens, shows an image preview, and lets you edit
   merchant, amount, date, notes, and raw scanned text before saving.
5. Save the expense and verify it appears on the calendar without a page reload.
