# OCR performance and platform notes

OpenExpense reads receipts entirely in the browser. Photos, PDFs, OCR text, and
parsed expense suggestions stay on the device; the app only downloads static
JavaScript and model assets from the configured CDN.

## Runtime pipeline

1. The user chooses a receipt image, camera capture, HEIC/HEIF file, or PDF.
2. PDF receipts try embedded text extraction first with PDF.js. OCR only runs
   when the PDF does not contain enough selectable text.
3. Image receipts are normalized onto a canvas profile selected for the current
   device class.
4. `ppu-paddle-ocr` runs locally and returns recognized text plus line groups.
5. The parser suggests merchant, date, amount, tax, and notes.
6. The review sheet requires a human confirmation before anything is saved.

## Dependency pins

The OCR and PDF runtime URLs live in `OCR_CONFIG.dependencies` in
`src/config.js`.

| Asset | Purpose |
| --- | --- |
| `ppu-paddle-ocr` | Client-side PP-OCRv5 engine loaded on first scan |
| `pdfjs-dist` | PDF text extraction and first-page preview rendering |
| `onnxruntime-web` | OCR peer dependency resolved by the import map |
| `ppu-ocv/canvas-web` | OCR image processing peer dependency |

When changing OCR dependency versions, update both:

- `OCR_CONFIG.dependencies.peerImportMap` in `src/config.js`
- the `<script type="importmap">` block in `index.html`

Keeping them paired makes CDN peer resolution explicit and easy to audit.

## Cross-platform canvas profiles

Canvas sizing controls OCR accuracy, memory pressure, and battery usage. The
active profile comes from `Utils.platformProfile()` and
`Utils.ocrCanvasProfile()`.

| Profile | Target | Min side | Max side | Preview JPEG |
| --- | --- | ---: | ---: | ---: |
| `mobile` | phones and coarse-pointer camera use | 900 px | 1800 px | 0.86 |
| `tablet` | tablets, narrow layouts, lower-memory devices | 1000 px | 2200 px | 0.88 |
| `desktop` | desktop browsers and large screens | 1100 px | 2600 px | 0.90 |

Use the profile values instead of hard-coded dimensions when adding new OCR or
preview paths.

## Warmup policy

The OCR engine is still loaded on demand for every manual scan. Idle warmup is a
performance optimization and is skipped when it would be unfriendly to the
platform:

- browser data saver is enabled
- the connection reports `slow-2g` or `2g`
- device memory is below the configured minimum

Warmup timing and skip thresholds live under `OCR_CONFIG.warmup`.

## Human-readable code tags

Long receipt paths use short section tags in comments:

- `[receipt-ocr:engine]` for lazy loading and model reuse
- `[receipt-ocr:pdf]` for PDF text extraction and preview rendering
- `[receipt-ocr:pipeline]` for OCR result normalization
- `[receipt-parser:*]` for merchant, amount, and item parsing
- `[receipt-ui:review]` for the human confirmation sheet

Prefer these tags when extending the receipt flow so future readers can search
for the relevant part without reverse-engineering the full module.

## Build and deployment assets

`npm run build` emits the deployable `app.js` and hashed `chunk-*.js` files at
the repository root. The `prebuild` script removes old chunks first so stale
hashes do not remain committed.

After changing files under `src/`, run:

```bash
npm run validate
git diff --check
```

Then commit the updated source files and the regenerated deployment bundle.
