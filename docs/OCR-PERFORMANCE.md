# OCR receipt performance guide

OpenExpense reads receipts entirely in the browser. The OCR path is designed for
current mobile and desktop browsers without sending images, PDFs, or recognized
text to a server.

## Human-readable source tags

Search these tags when changing receipt scanning code:

| Tag | Meaning |
| --- | --- |
| `@ocr-deps` | CDN imports, peer import-map pins, and OCR/PDF dependency notes. |
| `@ocr-engine` | Paddle OCR service initialization, warmup, and runtime options. |
| `@ocr-pdf` | PDF.js loading, PDF text extraction, preview rendering, and PDF OCR fallback. |
| `@ocr-pipeline` | Image/PDF normalization before recognition and OCR result assembly. |
| `@ocr-parse` | Merchant, date, amount, tax, line item, and confidence heuristics. |
| `@ocr-ui` | Scan progress, review sheet, raw text display, and save actions. |
| `@platform` | Mobile/desktop capability checks and browser feature selection. |
| `@perf` | Memory, network, idle warmup, and canvas-size performance choices. |

## Dependency pins

The current browser OCR stack is configured in `src/config.js` under
`OCR_CONFIG` and mirrored in the `index.html` import map:

| Package | Purpose | Current pin |
| --- | --- | --- |
| `ppu-paddle-ocr` | Browser OCR engine | `6.4.0` |
| `pdfjs-dist` | PDF parsing/rendering | `6.2.108` |
| `onnxruntime-web` | OCR model runtime peer dependency | `1.27.0` |
| `ppu-ocv` | Canvas/OpenCV peer dependency | `4.0.0` |
| `@fontsource-variable/inter` | UI font | `5.3.0` |
| `@tabler/icons-webfont` | UI icons | `3.46.0` |

When updating OCR dependencies:

1. Check latest package versions with `npm view <package> version`.
2. Update `OCR_CONFIG.dependencies`.
3. Keep the `index.html` import map in sync with `OCR_CONFIG.dependencies.peerImports`.
4. Rebuild with `npm run build` so tracked GitHub Pages assets are refreshed.
5. Validate with `npm run validate`, `npm audit --audit-level=moderate`, and
   `git diff --check HEAD`.

## Cross-platform behavior

- Mobile/tablet browsers receive `capture="environment"` for the scan picker
  when the viewport or pointer suggests camera use.
- Desktop browsers use the regular file picker and can idle-preload OCR when
  device/network signals indicate enough headroom.
- Save-data, 2G-class, low-memory, and low-core sessions skip idle OCR warmup.
  Manual scans still load OCR on demand.
- Image files use `createImageBitmap()` when available for asynchronous decode
  and orientation-aware camera images, then fall back to `HTMLImageElement`.
- Large camera images are bounded before OCR so high-megapixel photos do not
  allocate unbounded canvases.
- PDFs first use embedded text when enough text is available. Only image-only or
  sparse PDFs fall back to OCR.
- PDF previews are blob-backed when `canvas.toBlob()` is available, avoiding the
  larger in-memory strings created by data URLs.

## Source map for contributors

- `src/config.js` - OCR dependency pins and performance thresholds.
- `src/core/utils.js` - platform feature detection, idle warmup gating, and image decode helpers.
- `src/features/receipt.js` - OCR engine loading, PDF/image prep, parsing heuristics, and review UI.
- `src/main.js` - startup bootstrapping and constrained-device warmup gating.
- `index.html` - import map peers, mobile metadata, scan input accept/capture surface, and in-app docs.

Keep receipt scanning explicit and review-first: OCR may suggest values, but the
user confirms every expense before it is saved.
