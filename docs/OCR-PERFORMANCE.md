# OCR performance and source tags

OpenExpense keeps receipt reading local to the browser. Images, PDFs, OCR text,
and parsed expense fields stay on the device; the app only lazy-loads the OCR
runtime and PDF reader from the CDN when scanning is requested or when a capable
browser can warm the engine during idle time.

## Human-readable code tags

Use these tags in comments when changing OCR, platform, or performance-sensitive
paths. They make code search and review easier without adding a framework.

| Tag | Meaning |
| --- | --- |
| `@ocr-deps` | Lazy OCR/PDF dependency pins and import-map peer packages. |
| `@ocr-engine` | Engine loading, caching, and warmup behavior. |
| `@ocr-pdf` | PDF text extraction and preview rendering. |
| `@ocr-pipeline` | Image/PDF decode, canvas preparation, and OCR recognition flow. |
| `@ocr-parse` | Receipt text normalization and field extraction heuristics. |
| `@platform` | Desktop/mobile/browser capability branches. |
| `@perf` | Performance-sensitive limits and resource gates. |

The canonical tag glossary lives in `OCR_CONFIG.tags` (`src/config.js`).

## Dependency pins

OCR dependencies are intentionally pinned for deterministic browser behavior:

- `ppu-paddle-ocr@6.4.0`
- `pdfjs-dist@6.2.108`
- `onnxruntime-web@1.27.0`
- `ppu-ocv@4.0.0`

When updating them, keep these locations in sync:

1. `src/config.js` (`OCR_CONFIG.dependencies`)
2. `index.html` import map for `onnxruntime-web` and `ppu-ocv/canvas-web`
3. this document

## Cross-platform performance model

- **Desktop/laptop browsers**: warm OCR during idle time when resource hints look
  healthy, use native save dialogs when available, and keep PDF/image previews as
  object URLs to avoid large base64 strings.
- **Mobile and tablet browsers**: prefer camera capture when the browser exposes
  it, avoid desktop-only save pickers, and skip idle OCR warmup on data-saver,
  2G-class, or low-memory sessions.
- **All platforms**: scanning remains on-demand. If warmup is skipped, the Scan
  button still lazy-loads OCR and PDFs only after the user chooses a file.

## Canvas limits

`OCR_CONFIG.canvas` controls OCR input size:

- very small images are upscaled to `minSide` so text has enough pixels;
- very large images are downscaled to `maxSide` to protect memory and latency;
- PDF previews use a bounded first-page render scale before OCR fallback.

These limits trade raw accuracy against browser memory pressure. Raise them only
with testing on both mobile-class and desktop-class devices.

## PDF shortcut

PDFs are parsed for embedded text before OCR. If the extracted text passes the
configured length/line threshold, OpenExpense skips OCR and opens the review
sheet immediately. Scanned PDFs still render the first page to canvas and go
through the same OCR path as images.

## Verification checklist

Before shipping OCR/platform changes:

```bash
npm run validate
git diff --check HEAD
```

For dependency changes, also test one image receipt and one PDF invoice in a
browser served from `npm run serve`.
