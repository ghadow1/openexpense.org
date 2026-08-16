# OCR performance and code tags

OpenExpense runs receipt OCR entirely in the browser. This page documents the
human-readable tags used around the codebase and the platform choices that keep
receipt reading fast on current mobile and desktop browsers.

## Human-readable tags

Use these tags in short comments near OCR or platform-sensitive code:

- `@ocr-deps` - CDN, import-map, and version pins for OCR/PDF dependencies.
- `@ocr-engine` - lazy initialization, warmup, and model lifecycle behavior.
- `@ocr-pdf` - PDF text extraction, page rendering, and OCR fallback logic.
- `@ocr-pipeline` - image normalization, OCR input sizing, and text cleanup.
- `@ocr-parse` - merchant, amount, date, and line-item parsing heuristics.
- `@ocr-ui` - scan progress, review sheet, and user confirmation flows.
- `@platform` - mobile/desktop capability checks and browser fallbacks.
- `@perf` - memory, network, startup, and rendering performance decisions.

Tags are meant to be searchable signposts, not a replacement for clear names or
small functions. Keep comments brief and tied to behavior that future changes
could accidentally break.

## Dependency pins

OCR and PDF versions live in `src/config.js` under `OCR_CONFIG`. The peer import
map in `index.html` must match those values because `ppu-paddle-ocr` imports
`onnxruntime-web` and `ppu-ocv/canvas-web` as bare specifiers.

Current browser-runtime pins:

- `ppu-paddle-ocr@6.4.0`
- `pdfjs-dist@6.2.108`
- `onnxruntime-web@1.27.0`
- `ppu-ocv@4.0.0`
- `@fontsource-variable/inter@5.3.0`
- `@tabler/icons-webfont@3.46.0`

## Platform performance rules

- OCR is lazy-loaded on the first scan. Idle warmup is allowed only when the
  browser is not in data-saver mode, is not on a 2G-class connection, and does
  not advertise low memory or very low CPU concurrency.
- PDF invoices with embedded text skip image OCR when enough text is available.
  Scanned PDFs still render the first page to canvas and pass that canvas to OCR.
- Image uploads prefer `createImageBitmap()` for modern off-main-thread decode
  paths, then fall back to an `Image` element for older Safari/WebKit builds.
- Input canvases are normalized between `OCR_CONFIG.canvas.minSide` and
  `OCR_CONFIG.canvas.maxSide`. This keeps small receipt photos readable while
  avoiding oversized WASM inputs on mobile devices.
- Receipt/PDF previews use blob-backed object URLs when possible instead of
  base64 data URLs, lowering transient string memory for large receipts.

## Maintenance checklist

When updating OCR dependencies or thresholds:

1. Check the latest versions with `npm view`.
2. Update `OCR_CONFIG` in `src/config.js`.
3. Keep the `index.html` import map and CSS CDN links in sync.
4. Rebuild tracked deploy assets with `npm run build`.
5. Verify with `npm run validate`.
