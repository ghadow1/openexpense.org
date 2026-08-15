# OCR performance and source tags

OpenExpense keeps receipt reading local to the browser. The OCR stack is lazy-loaded, platform-aware, and tagged in source so performance-sensitive code is easy to find during reviews.

## Human-readable code tags

Search these tags when changing receipt scanning, mobile behavior, or desktop-only capabilities:

- `@ocr-deps` - CDN and import-map pins for OCR, PDF, ONNX, and OpenCV packages.
- `@ocr-engine` - OCR service initialization, model warmup, and recognition options.
- `@ocr-pdf` - PDF text extraction, worker setup, preview rendering, and native-text short circuiting.
- `@ocr-pipeline` - image decoding, canvas resizing, OCR normalization, and scan orchestration.
- `@ocr-parse` - merchant, date, amount, tax, and line-item parsing heuristics.
- `@platform` - browser capability checks for mobile, desktop, save picker, share sheet, memory, and connection hints.
- `@perf` - work that intentionally avoids jank, excess memory, stale assets, or unnecessary downloads.

## Dependency pins

The authoritative runtime pins live in `src/config.js` under `OCR_CONFIG.dependencies`. The matching browser import map lives in `index.html` because `ppu-paddle-ocr` resolves peer dependencies by bare specifier at runtime.

Current pins:

- `ppu-paddle-ocr@6.4.0`
- `pdfjs-dist@6.2.108`
- `onnxruntime-web@1.27.0`
- `ppu-ocv@4.0.0`

When updating one of these packages, update both `OCR_CONFIG.dependencies` and the import map, then rebuild `app.js` and emitted `chunk-*.js` assets.

## Cross-platform strategy

- **Desktop and high-end mobile:** idle warmup initializes OCR after the app is interactive so the first manual scan feels faster.
- **Data saver, 2G-class, and low-memory devices:** warmup is skipped. Scanning still works, but the OCR engine downloads only after the user chooses a file.
- **Photos and screenshots:** the scanner prefers `createImageBitmap()` for modern browser decoding, with an `Image` fallback for older browsers.
- **Large images:** canvases are resized into the configured OCR range before recognition to balance accuracy and memory pressure.
- **PDF receipts:** native PDF text is extracted first. If enough text is available, OCR is skipped; otherwise the first page is rendered to canvas and scanned.
- **Previews:** generated PDF previews use blob-backed object URLs when supported to avoid large base64 strings in memory.

## Build hygiene

Root-level `app.js` and `chunk-*.js` files are deployed assets for GitHub Pages. `npm run build` runs a cleanup step first so stale chunks do not remain tracked after dependency or bundling changes.
