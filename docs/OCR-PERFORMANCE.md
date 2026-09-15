# OCR performance and source tags

Receipt reading is local-first: images, PDFs, OCR output, and parsed expense data
stay in the browser. The receipt stack uses current browser primitives when they
are available, then falls back to safe baseline behavior for older or lower-power
devices.

## Human-readable tags

Search these tags when changing OCR or cross-platform behavior:

| Tag | Meaning |
| --- | --- |
| `@ocr-deps` | Same-origin OCR/PDF runtime, model, worker, and dictionary paths |
| `@ocr-engine` | Paddle OCR service setup and OCR recognition calls |
| `@ocr-pdf` | PDF.js text extraction and first-page raster preview |
| `@ocr-pipeline` | File-to-canvas, enhancement, recognition, parse, and review flow |
| `@ocr-parse` | Conversion from OCR regions/text into receipt fields |
| `@platform` | Browser, device, and input-mode decisions |
| `@perf` | Pixel, worker, thread, and scoring budgets |

The canonical tag list lives in `OCR_CONFIG.tags` in `src/config.js`.

## Runtime path

1. `src/features/receipt-picker.js` opens the native camera/file picker
   synchronously so mobile browsers preserve user activation.
2. `src/features/receipt.js` lazy-loads `onnxruntime-web`,
   `ppu-paddle-ocr/web`, and `pdfjs-dist` only after a scan starts.
3. PDF files are read with PDF.js text extraction first. If the embedded text is
   good enough to produce a merchant and total, OCR is skipped.
4. Images and scanned PDFs are normalized to a bounded canvas, then recognized
   with PP-OCRv6 Tiny from `vendor/ocr-models/`.
5. Low-scoring scans retry with contrast and high-contrast passes before the
   review sheet opens.

## Platform profile

`ocrRuntimeProfile()` sizes work for the current browser:

- Phones, coarse-pointer devices, narrow layouts, and low-memory devices use
  smaller image and enhancement canvases to avoid Safari/Chrome memory spikes.
- Desktop-class browsers keep the larger canvas budget for receipt totals and
  dense line items.
- WASM stays single-threaded on the public GitHub Pages site because threaded
  WASM requires cross-origin isolation. If a desktop host serves the app with
  the required isolation headers, the profile can use up to the configured
  desktop thread cap.
- `createImageBitmap()` is preferred for modern EXIF-aware image decoding, with
  an `Image` element fallback for browsers that do not expose it.

## Change checklist

- Keep executable code, model files, dictionaries, PDF workers, fonts, and icons
  bundled or served from this origin.
- Do not add remote OCR APIs, analytics, or receipt upload endpoints.
- Update `OCR_CONFIG` before hard-coding a new OCR asset path, canvas limit,
  score threshold, or runtime choice.
- If OCR/PDF package versions change, update reviewed `vendor/` assets and
  `vendor/SHA256SUMS` in the same pull request.
- Run `npm run build` and `npm test`; `scripts/qc-ocr-performance.mjs` checks
  that the tags, docs, and centralized OCR config stay in sync.
