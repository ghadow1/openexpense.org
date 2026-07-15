# Receipt OCR performance notes

OpenExpense scans receipts entirely in the browser. Images, PDFs, recognized text, and parsed fields stay on the user's device.

## Pipeline tags

The receipt reader uses human-readable tags in code comments and generated OCR review markup:

- `ocr.engine.lazy-load` - lazy-loads PP-OCRv5 and warms the recognizer.
- `ocr.pdf.text-first` - extracts embedded PDF text before using OCR fallback.
- `ocr.image.canvas-normalize` - normalizes camera photos, screenshots, and PDF previews for OCR.
- `ocr.parser.receipt-fields` - finds merchant, total, tax, date, and note suggestions.
- `ocr.review.confirm-before-save` - shows the confirmation UI before writing an expense.

These tags make browser inspector traces and source searches easier when debugging mobile and desktop receipt flows.

## Platform tuning

OCR size and warmup settings live in `src/config.js` under `OCR_CONFIG`.

- Mobile devices use smaller canvas bounds to reduce memory pressure and battery use.
- Tablet/coarse-pointer devices get a middle profile for camera-first scanning.
- Desktop browsers can use larger canvases for sharper PDFs and uploaded images.
- Data-saver, 2G-class connections, and low-memory devices skip idle OCR warmup. Manual scanning still lazy-loads the engine on demand.

When changing OCR dependency pins, keep `OCR_CONFIG.dependencies.peerImportMap` synchronized with the import map in `index.html`.

## Build workflow

Edit source under `src/`, then run:

```bash
npm run validate
```

`prebuild` removes old generated `chunk-*.js` files before esbuild emits the current `app.js` and chunks. Commit the regenerated root assets because GitHub Pages serves this repository directly.
