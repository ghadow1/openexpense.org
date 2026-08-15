# OCR receipt reading performance notes

OpenExpense keeps receipt reading private by running OCR in the browser. These notes document the human-readable source tags and the cross-platform choices that keep the scanner usable on current mobile and desktop browsers.

## Source tags

Use these tags in focused comments when a code path needs to be easy to find:

- `@ocr-deps` - OCR, PDF, WASM, and import-map dependency pins.
- `@ocr-engine` - OCR engine lifecycle, warmup, and model loading.
- `@ocr-pdf` - PDF text extraction, preview rendering, and OCR fallback.
- `@ocr-pipeline` - image/PDF normalization before parsing.
- `@ocr-parse` - merchant, amount, tax, date, and line-item heuristics.
- `@ocr-ui` - scan progress, review sheet, and human confirmation flows.
- `@platform` - browser/device capability branches.
- `@perf` - memory, network, bundle, and render-performance decisions.
- `@privacy` - local-only storage, encryption, and no-upload guarantees.

The canonical list lives in `src/config.js` as `CODE_TAGS`; OCR dependency and sizing knobs live beside it in `OCR_CONFIG`.

## Runtime policy

- The OCR engine (`ppu-paddle-ocr`) and PDF reader (`pdfjs-dist`) are lazy-loaded from jsDelivr on first scan.
- Capable desktop/tablet sessions may warm the OCR engine during idle time. Data-saver, 2G-class, and low-memory sessions skip idle warmup and load only when the user shows scan intent or chooses a file.
- Images are decoded with `createImageBitmap()` when available, then fall back to `HTMLImageElement`.
- OCR canvases are clamped between `OCR_CONFIG.canvas.minSide` and `OCR_CONFIG.canvas.maxSide` so small receipts keep readable text while large mobile photos do not exhaust memory.
- PDFs try native text extraction across all pages before OCR. Scanned PDFs render page 1 as the preview/OCR fallback.

## Platform notes

- Mobile camera capture is hinted with `capture="environment"` on touch-first and narrow devices.
- Export uses the File System Access save picker when available, the Web Share API on touch-first devices that can share files, and a download link fallback everywhere else.
- HEIC/HEIF support depends on browser image decoding. If decoding fails, the UI asks the user to resave/share as JPEG or PNG before scanning.
- First OCR scan downloads roughly 5 MB of model/runtime assets and caches them in the browser cache; first PDF scan downloads the PDF reader on demand.

## Build artifact hygiene

GitHub Pages serves the committed root `app.js` and `chunk-*.js` files. Run:

```bash
npm run build
```

The build removes old generated assets, emits readable chunk names (`chunk-<name>-<hash>.js`), and fails if any generated chunk is missing or orphaned. Commit the regenerated `app.js` and referenced chunks with source changes.
