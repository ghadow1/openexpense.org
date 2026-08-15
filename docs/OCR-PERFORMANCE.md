# OCR receipt performance and code tags

OpenExpense scans receipts entirely in the browser. The app supports phone
camera capture, desktop file uploads, and PDF invoices without sending images or
ledger data to a server.

## Human-readable tags

Search these tags when changing receipt or platform behavior:

| Tag | Purpose |
| --- | --- |
| `@ocr-deps` | CDN and import-map dependency pins for OCR, PDF, and WASM peers. |
| `@ocr-engine` | OCR service initialization and recognition calls. |
| `@ocr-pdf` | PDF.js loading, embedded text extraction, and raster preview rendering. |
| `@ocr-pipeline` | Image sizing and canvas preparation before OCR. |
| `@ocr-parse` | Receipt text normalization and field extraction. |
| `@ocr-ui` | Human review UI before saving parsed receipt fields. |
| `@platform` | Mobile/desktop capability checks and responsive behavior. |
| `@perf` | Work that protects startup, resize, decode, or memory performance. |

## Current browser OCR stack

The runtime pins live in `src/config.js` under `OCR_CONFIG`. The static import
map in `index.html` must stay in sync with `OCR_CONFIG.dependencies.peerImports`.

- `ppu-paddle-ocr@6.4.0` for local PP-OCR receipt text recognition.
- `pdfjs-dist@6.2.108` for PDF text extraction and first-page preview rendering.
- `onnxruntime-web@1.27.0` and `ppu-ocv@4.0.0` as lazy OCR peer imports.
- `@fontsource-variable/inter@5.3.0` and `@tabler/icons-webfont@3.46.0` for UI assets.

## Performance model

- OCR and PDF libraries are lazy-loaded from the CDN. First scan downloads and
  browser-caches the models/tools; later scans reuse them.
- Idle warmup is only attempted when the browser does not report data saver,
  2G-class networking, or low device memory. Manual scanning still loads OCR on
  demand on those devices.
- Phone camera photos and desktop uploads prefer `createImageBitmap()` for image
  decoding when the browser supports it, with an `Image` fallback for formats or
  engines that need it.
- Inputs are resized into a predictable OCR range. Small screenshots are scaled
  up for recognition quality, while huge phone photos are capped to reduce
  memory pressure.
- PDFs use embedded text directly when enough text is present, avoiding raster
  OCR. A first-page preview is still rendered for human review.
- Calendar responsive-density redraws are batched to one animation frame during
  window resize and `ResizeObserver` bursts.

## Safe change checklist

Before changing OCR behavior:

1. Update `OCR_CONFIG` first, then keep any static import-map URLs in sync.
2. Preserve the local-only privacy contract: no receipt images, OCR text, or
   ledger data should leave the browser.
3. Keep manual scanning available even if preload/warmup is skipped.
4. Rebuild `app.js` and chunk assets with `npm run build`.
5. Verify with a production build and, when available, a phone camera image, a
   desktop image upload, and a PDF invoice with embedded text.
