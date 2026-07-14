# Receipt OCR performance and platform notes

OpenExpense scans receipts entirely in the browser. The OCR pipeline is optimized to use current mobile and desktop browser capabilities without sending receipt images or parsed text to a server.

## Runtime pipeline

1. The user chooses a camera photo, image file, HEIC/HEIF image, or PDF invoice.
2. `src/features/receipt.js` routes PDFs through PDF.js text extraction first.
3. If a PDF has enough embedded text, OpenExpense skips OCR and parses that text directly.
4. Images and image-only PDFs are normalized to an OCR canvas and read by PP-OCRv5 through `ppu-paddle-ocr`.
5. Parsed merchant, amount, date, tax, and notes are shown in a review sheet. Nothing is saved until the user confirms.

## Cross-platform tuning

Shared tuning lives in `src/config.js`:

- `OCR_CONFIG.dependencies` pins the OCR engine, PDF.js, worker, and import-map peer dependencies.
- `OCR_CONFIG.image.minCanvasSide` and `OCR_CONFIG.image.maxCanvasSide` keep photos large enough for OCR while limiting memory pressure on mobile browsers.
- `OCR_CONFIG.pdf.maxRenderScale` and `OCR_CONFIG.pdf.maxRenderSide` keep PDF previews readable without rendering very large canvases.
- `OCR_CONFIG.confidence.low` controls the "double-check fields" warning in the review sheet.
- `OCR_CONFIG.warmup` controls idle preload timing.
- `PLATFORM_CONFIG.breakpoints` keeps mobile, tablet, and desktop UI decisions consistent across modules.
- `PLATFORM_CONFIG.network` skips idle model warmup on data-saver or very slow connections.

The scanner still loads on demand even when idle warmup is skipped.

## Runtime dependencies

The browser downloads OCR dependencies from jsDelivr the first time scanning is used:

- `ppu-paddle-ocr` provides the PP-OCRv5 browser service.
- `onnxruntime-web` and `ppu-ocv/canvas-web` are peer dependencies exposed through the import map in `index.html`.
- `pdfjs-dist` is loaded only for PDFs.

Keep the import map in `index.html` synchronized with `OCR_CONFIG.dependencies.peerImportMap`. The app is offline-only for user data and OCR inference, but the first OCR or PDF scan needs network access to fetch these runtime assets unless the browser has already cached them.

## Mobile notes

- Coarse pointers or narrow screens request `capture="environment"` so phones can open the rear camera directly.
- Large photos are downscaled before recognition to reduce memory pressure.
- Very small screenshots are upscaled to give the recognizer enough pixels.
- HEIC/HEIF decode support varies by browser. When a browser cannot decode the file, the user sees the standard "try a clearer photo" error and can use a screenshot or JPEG/PNG export.
- Data saver and very slow connections skip idle OCR warmup to avoid surprising downloads, but manual scans still work.

## Desktop notes

- Wider layouts keep more calendar details visible and expose file picker flows rather than mobile share/camera affordances.
- Desktop browsers with stronger CPU/GPU resources benefit from idle warmup because the OCR model is ready before the first scan.
- PDF text-layer extraction is preferred over raster OCR when available because it is faster and more accurate for invoices.

## Human-readable code tags

The receipt module is intentionally tagged by responsibility:

- `[OCR:Runtime dependencies]`
- `[OCR:Input routing]`
- `[OCR:Engine lifecycle]`
- `[OCR:PDF extraction and preview rendering]`
- `[OCR:Image normalization and recognition]`
- `[OCR:Text cleanup and vendor normalization]`
- `[OCR:Progress dialog]`
- `[OCR:Receipt amount and date parsing]`
- `[OCR:Merchant and line item parsing]`
- `[OCR:Review sheet]`

When extending OCR behavior, add new code near the matching tag and update this guide when tuning values or dependency pins change.
