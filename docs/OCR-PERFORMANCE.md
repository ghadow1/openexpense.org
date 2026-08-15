# OCR performance and source tags

OpenExpense reads receipts fully in the browser. The OCR path must stay private,
responsive on current phones and tablets, and fast on desktop browsers without
adding a backend or background sync.

## Human-readable code tags

Use these tags in comments when touching OCR or cross-platform behavior. They are
short search handles for humans; they are not build directives.

| Tag | Use |
| --- | --- |
| `@ocr-deps` | CDN, import map, model, worker, and peer dependency pins. |
| `@ocr-engine` | OCR service initialization, warmup, and model lifecycle. |
| `@ocr-pdf` | PDF.js loading, native PDF text extraction, and PDF preview rendering. |
| `@ocr-pipeline` | Image decode, canvas resizing, normalization, and OCR calls. |
| `@ocr-parse` | Merchant, total, tax, date, and line-item parsing heuristics. |
| `@ocr-ui` | Progress, review sheet, low-confidence messaging, and raw text display. |
| `@platform` | Browser capability checks and mobile/desktop fallbacks. |
| `@perf` | Resource limits, lazy loading, idle work, and memory-sensitive choices. |
| `@privacy` | Local-only processing and data handling boundaries. |

Primary locations:

- `src/config.js` centralizes OCR dependency pins and tuning values.
- `src/features/receipt.js` owns OCR loading, PDF/image handling, parsing, and the
  review UI.
- `src/core/utils.js` owns reusable platform checks and browser API helpers.
- `src/main.js` decides when OCR should warm in the background.
- `index.html` owns the import map for lazy OCR peer dependencies.

## Cross-platform OCR strategy

- **Lazy by default:** OCR and PDF.js are imported only when needed. The initial
  calendar stays light for both mobile and desktop.
- **Desktop idle warmup:** capable desktop sessions may warm OCR during idle time
  so the first scan opens faster.
- **Mobile/resource gate:** data-saver, 2G-class, and low-memory sessions skip
  idle OCR warmup. Tapping, touching, focusing, or hovering a scan control still
  starts warmup before or during the scan.
- **Modern image decode:** `createImageBitmap()` is preferred when available for
  efficient image decoding and orientation handling. A regular `Image` fallback
  keeps older browsers working.
- **Bounded canvas work:** image and PDF previews are scaled before OCR so large
  mobile camera photos and desktop PDFs do not create excessive canvas memory.
- **PDF text first:** native PDF text is used when it is sufficient. OCR runs on
  rendered PDF pages only when the PDF does not expose enough text.
- **Blob previews:** generated PDF previews prefer blob-backed object URLs, with
  data URLs only as a browser fallback.

## Dependency pins

The lazy-loaded OCR stack is pinned in `src/config.js`:

- `ppu-paddle-ocr`
- `pdfjs-dist`
- `onnxruntime-web`
- `ppu-ocv/canvas-web`

`index.html` must keep its import map in sync with
`OCR_CONFIG.dependencies.peerImports`. If a CDN version changes, update both
places in the same commit and run `npm run validate`.

## Build and validation

GitHub Pages serves the generated root assets directly:

- `app.js`
- `chunk-*.js`

Run:

```bash
npm run validate
```

`prebuild` removes stale generated bundles before esbuild emits the current app
and chunks. Commit the regenerated assets with the source changes.
