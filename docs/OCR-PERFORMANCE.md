# OCR performance and source tags

OpenExpense keeps receipt reading local to the browser. Images and PDFs are decoded on the device, OCR runs from lazy-loaded browser packages, and the user reviews every parsed expense before anything is saved.

## Source tag glossary

Use these tags in comments when changing OCR or platform-sensitive code:

- `@ocr-deps` - OCR, PDF, import-map, model, and CDN pins.
- `@ocr-engine` - Paddle OCR service startup, model initialization, and warmup.
- `@ocr-pdf` - PDF.js loading, native PDF text extraction, PDF preview rendering, and OCR fallback.
- `@ocr-pipeline` - Image decode, canvas sizing, OCR recognition, and text normalization.
- `@ocr-parse` - Merchant, amount, date, tax, and line-item inference.
- `@ocr-ui` - Progress UI, receipt preview, user confirmation, and retry affordances.
- `@platform` - Browser, mobile, desktop, connection, and device capability checks.
- `@perf` - Memory, network, CPU, canvas, and build-performance decisions.

## Current browser OCR stack

Keep `src/config.js`, `index.html`, and this table in sync when upgrading:

| Area | Package / URL | Current pin |
| --- | --- | --- |
| OCR engine | `ppu-paddle-ocr` | `6.4.0` |
| OCR runtime peer | `onnxruntime-web` | `1.27.0` |
| OCR OpenCV peer | `ppu-ocv` | `4.0.0` |
| PDF text/rendering | `pdfjs-dist` | `6.2.108` |
| Font CSS | `@fontsource-variable/inter` | `5.3.0` |
| Icon CSS | `@tabler/icons-webfont` | `3.46.0` |

## Platform policy

- OCR and PDF readers are lazy-loaded. Normal expense tracking should not download OCR code or models.
- Desktop-class sessions may warm the OCR engine during idle time to hide the first-scan delay.
- Data-saver, 2G-class, low-core, and low-memory sessions skip idle warmup. Manual receipt scanning still loads OCR on demand.
- Camera capture is offered for coarse-pointer/mobile layouts, while desktop users get a normal file picker.
- `createImageBitmap()` is preferred for image decode when available, with an `Image` element fallback for older browsers and file types that the bitmap decoder rejects.
- Canvas input is bounded to a readable OCR range: small images are upscaled, large images are capped before recognition to protect memory.
- PDF files try native text extraction first. OCR is only used for scanned/image-only PDFs or when extracted text is too sparse.
- PDF preview images use object URLs from canvas blobs where possible instead of large data URLs.

## Upgrade checklist

1. Check the latest npm versions for the OCR/PDF/import-map packages.
2. Update `OCR_CONFIG.dependencies` in `src/config.js`.
3. Update the import map and style links in `index.html`.
4. Update the table above.
5. Run `npm run validate` to clean and rebuild generated assets.
6. Smoke test one image receipt and one PDF invoice in a browser when possible.

## Build assets

The deployed GitHub Pages bundle is generated at the repository root as `app.js` plus hashed `chunk-*.js` files. `npm run build` runs `scripts/clean-build-assets.mjs` first so old chunks are removed before esbuild emits the current bundle.
