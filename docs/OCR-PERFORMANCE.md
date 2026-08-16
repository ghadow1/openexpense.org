# OCR performance and source tags

OpenExpense keeps receipt reading private by running OCR in the browser. The scanner should stay fast on modern phones, tablets, and desktops without wasting battery or bandwidth on constrained devices.

## Source tags

Use these tags in comments when changing the OCR path:

- `@ocr-deps` - CDN/import-map pins and peer dependencies.
- `@ocr-engine` - OCR service creation, model warmup, and recognition options.
- `@ocr-pdf` - PDF.js loading, text extraction, worker configuration, and page rendering.
- `@ocr-pipeline` - image/PDF canvas sizing, decoding, normalization, and preview generation.
- `@ocr-parse` - merchant, date, amount, tax, and item inference from recognized text.
- `@ocr-ui` - progress, preview, confidence messaging, and human confirmation before saving.
- `@platform` - browser capability checks and mobile/desktop differences.
- `@perf` - choices that protect memory, CPU, battery, or network.

## Current runtime pins

Keep `src/config.js` and `index.html` in sync.

| Purpose | Package | Version |
| --- | --- | --- |
| OCR engine | `ppu-paddle-ocr` | `6.4.0` |
| PDF reader | `pdfjs-dist` | `6.2.108` |
| ONNX runtime peer | `onnxruntime-web` | `1.27.0` |
| OpenCV peer | `ppu-ocv` | `4.0.0` |
| Font | `@fontsource-variable/inter` | `5.3.0` |
| Icons | `@tabler/icons-webfont` | `3.46.0` |

## Cross-platform performance rules

- Lazy-load OCR and PDF code. The first app render should not wait for OCR dependencies.
- Use `createImageBitmap()` when available for efficient image decode, with an `Image` fallback for older Safari/WebView builds.
- Normalize images to a bounded canvas before OCR: upscale small receipts for recognition, downscale large camera images to protect memory.
- Prefer native PDF text extraction. Only run OCR on a rendered PDF page when the embedded text is missing or too sparse.
- Use blob-backed object URLs for previews when possible. Data URLs are kept only as a fallback for browsers without `canvas.toBlob()`.
- Skip idle OCR warmup when Data Saver is enabled, the connection is 2G-class, or device memory/core counts are below the configured thresholds. Manual scans still load OCR on demand.
- Always show the review sheet before saving. OCR suggests fields; users confirm what enters the encrypted ledger.

## Verification

Run these checks after changing OCR code or dependency pins:

```bash
npm run validate
npm audit --audit-level=moderate
git diff --check HEAD
```

If the CDN pins change, scan `src/config.js`, `index.html`, and this document together so the dependency story stays readable.
