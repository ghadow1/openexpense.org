# OCR performance and source tags

OpenExpense reads receipts entirely in the browser. The OCR path should keep
mobile data, battery, memory, and desktop responsiveness in mind because there
is no server-side worker to absorb expensive work.

## Human-readable code tags

Use these tags in comments or `data-code-tag` attributes when touching related
areas:

- `@ocr-deps` - CDN pins, import-map peers, and lazy-loaded OCR/PDF packages.
- `@ocr-engine` - Paddle OCR service initialization and model warmup.
- `@ocr-pdf` - PDF text extraction, preview rendering, and worker setup.
- `@ocr-pipeline` - image decode, canvas scaling, text normalization, and parse flow.
- `@ocr-parse` - merchant, date, item, tax, and total inference.
- `@platform` - mobile/desktop capability checks and browser APIs.
- `@perf` - resource budgets, idle work, memory-sensitive paths, and build cleanup.

## Runtime policy

- OCR is lazy-loaded from the CDN and cached by the browser after first use.
- App startup may warm OCR during idle time on capable sessions. Data-saver,
  2G-class connections, and very low-memory devices skip background warmup and
  still load OCR on demand when the user scans.
- Images use `createImageBitmap()` when available so modern mobile and desktop
  browsers can decode off the main thread. The `Image` fallback keeps older
  browsers working.
- Input images are clamped to OCR-friendly canvas sizes before recognition:
  small images are upscaled for legibility and very large images are downscaled
  to protect memory.
- PDFs are checked for native text before OCR. Text-based invoices skip the OCR
  model path; scanned PDFs render the first page at a bounded size before OCR.
- PDF previews prefer blob URLs instead of base64 data URLs to reduce memory
  pressure in the review sheet.

## Keeping dependencies current

OCR-related browser pins live in `src/config.js` under `OCR_CONFIG`. The import
map in `index.html` must match `OCR_CONFIG.dependencies.peerImports`.

Useful registry checks:

```bash
npm view ppu-paddle-ocr version
npm view pdfjs-dist version
npm view onnxruntime-web version
npm view ppu-ocv version
npm view @tabler/icons-webfont version
```

After changing any source file or dependency pin, run `npm run validate` and
commit the rebuilt `app.js` plus any emitted `chunk-*.js` files.
