# OCR performance and code tags

OpenExpense keeps receipt scanning local to the browser. Photos, PDFs, OCR text,
and parsed expense fields stay on the device; the app only downloads static OCR
and PDF reader assets from the configured CDN.

## Human-readable source tags

Search for these tags when changing OCR, platform, or performance behavior:

- `@ocr-deps` - CDN and import-map pins for OCR/PDF dependencies.
- `@ocr-engine` - OCR engine initialization, warmup, and model loading.
- `@ocr-pdf` - PDF text extraction and first-page raster preview handling.
- `@ocr-pipeline` - file type routing into PDF text extraction or canvas OCR.
- `@ocr-parse` - conversion from OCR text into reviewable expense fields.
- `@platform` - browser/device capability detection and cross-platform fallbacks.
- `@perf` - memory, canvas sizing, warmup, and responsiveness choices.

## Dependency map

`src/config.js` owns the OCR dependency pins in `OCR_CONFIG.dependencies`.
`index.html` has the matching import map required by the lazy-loaded browser OCR
module. Update both places together.

Current browser stack:

- `ppu-paddle-ocr@6.4.0` via the `/web` entry.
- `onnxruntime-web@1.27.0` for WebGPU/WASM inference.
- `ppu-ocv@4.0.0` for browser canvas/OpenCV support.
- `pdfjs-dist@6.2.108` for local PDF text extraction and rendering.

The OCR package automatically prefers WebGPU on capable desktop and mobile
browsers, then falls back to WASM. Cross-origin isolation can improve WASM
threading when the host supports the required headers; GitHub Pages deployments
should assume single-thread fallback unless those headers are added elsewhere.

## Cross-platform behavior

- Mobile and coarse-pointer devices get camera capture hints for receipt input.
- `createImageBitmap()` is used when available so modern browsers can decode
  photos efficiently; `Image` fallback keeps older Safari/browser contexts
  working.
- Large phone photos are capped before OCR to keep memory predictable. Small
  screenshots are scaled up to improve text recognition.
- PDF invoices first use embedded text. Raster OCR only runs when native text is
  too sparse.
- PDF previews use blob-backed object URLs when possible instead of large base64
  strings.
- Desktop browsers use the File System Access save picker when available;
  mobile browsers can use file sharing for exports before falling back to a
  download link.

## Warmup policy

OCR is lazy-loaded on the first scan. Startup may warm the engine during idle
time only when browser hints suggest the session can afford it:

- data saver disabled,
- effective network type better than 2G,
- device memory above the lowest tier when the hint is available.

Manual scanning always works on demand even when warmup is skipped.

## Tuning checklist

When updating the OCR stack or thresholds:

1. Update `OCR_CONFIG` and the `index.html` import map together.
2. Keep `recognition.strategy` at `cross-line` unless receipt accuracy regresses.
3. Revisit `mainThreadYieldMs` if UI responsiveness or scan latency changes.
4. Test at least one camera photo, one screenshot, one text PDF, and one scanned
   PDF.
5. Run `npm run build` and commit the regenerated root bundle assets.
