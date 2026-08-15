# OCR performance and code tags

OpenExpense reads receipts entirely in the browser. Photos, PDFs, extracted text,
and parsed values stay on the device; the app only lazy-loads public OCR/PDF
libraries from the CDN when scanning is needed.

## Runtime pins

The source of truth for OCR versions and performance thresholds is
`OCR_CONFIG` in `src/config.js`. The import map in `index.html` mirrors the OCR
peer dependency URLs because browser import maps must be static HTML.

Current OCR/runtime pins:

- `ppu-paddle-ocr@6.4.0`
- `pdfjs-dist@6.2.108`
- `onnxruntime-web@1.27.0`
- `ppu-ocv@4.0.0`

When updating OCR dependencies, update both `OCR_CONFIG.dependencies` and the
`index.html` import map, then run `npm run validate`.

## Platform and performance choices

- OCR and PDF engines are lazy-loaded. Idle warmup only runs when the tab is
  visible and the browser does not report data-saver, 2G-class networking, or a
  low-memory device.
- Mobile camera capture is preferred on coarse-pointer/narrow-screen devices;
  desktop keeps the file picker behavior.
- Image decoding prefers `createImageBitmap()` so browsers can use optimized
  decode paths and release bitmap memory after drawing. The `Image` fallback
  keeps older mobile/desktop browsers working.
- Large images and PDF pages are bounded to the configured raster size before
  OCR to avoid unnecessary memory pressure.
- PDFs use native text extraction first. OCR is only run for scanned/image PDFs
  that do not already expose enough text.
- Preview images use blob-backed object URLs when available, with a data URL
  fallback for older canvases.

## Human-readable code tags

Use these short tags in comments when touching related code. They make audits
and future cleanup searches predictable:

- `@ocr-deps` - OCR, PDF, ONNX, or OpenCV dependency pins/import maps.
- `@ocr-engine` - Paddle OCR service initialization and warmup.
- `@ocr-pdf` - PDF loading, text extraction, or page rasterization.
- `@ocr-pipeline` - image normalization, OCR recognition, and text cleanup.
- `@ocr-parse` - merchant, date, total, tax, and line-item parsing heuristics.
- `@platform` - mobile/desktop browser capability detection and fallbacks.
- `@perf` - memory, network, bundle, or runtime performance choices.

Prefer tagging the smallest relevant block rather than entire files.
