# Receipt OCR platform guide

OpenExpense reads receipts entirely in the browser. Photos, PDFs, extracted text,
and parsed expense fields stay on the device; there is no server-side OCR path.

## Code tags

The receipt scanner uses human-readable tags in `OCR_CONFIG.codeTags` and section
headers in `src/features/receipt.js` so the pipeline can be skimmed quickly:

| Tag | Where to look | Purpose |
| --- | --- | --- |
| `receipt-ocr-engine` | OCR engine lifecycle | Lazy-load PP-OCRv5, initialize ONNX Runtime Web, and warm the model. |
| `receipt-pdf-text-layer` | PDF handling | Prefer embedded PDF text before rendering page one for OCR fallback. |
| `receipt-image-canvas` | Image canvas prep | Resize photos to a bounded canvas for OCR quality and memory control. |
| `receipt-parser` | Heuristic parsing | Extract merchant, amount, tax, date, line items, and confidence hints. |
| `receipt-review` | Review UI | Let the user edit fields before saving to the encrypted ledger. |

## Runtime dependencies

`src/config.js` owns the OCR runtime pins:

- `ppu-paddle-ocr@5.8.0` for PP-OCRv5 recognition.
- `pdfjs-dist@4.10.38` for PDF text extraction and preview rendering.
- `onnxruntime-web@1.23.2` and `ppu-ocv@3.2.2` as peer imports.

The peer imports also appear in the static import map in `index.html` because
browser import maps must be present before the app module runs. Keep those URLs
in sync with `OCR_CONFIG.peerImportMap` when changing OCR versions.

## Cross-platform requirements

- Serve the app through `http://localhost`, HTTPS, or another secure context.
  File-system launches (`file://`) are not supported for the encrypted storage
  and modern browser APIs OpenExpense uses.
- Current Chromium, Safari, Firefox, and mobile equivalents are the intended
  targets. The OCR path relies on ES modules, dynamic import, Canvas, WebAssembly,
  and IndexedDB.
- Mobile and tablet browsers get `capture="environment"` when opening the scan
  input, so compatible devices can jump directly to the rear camera.
- Desktop browsers keep upload-first behavior and can use higher-quality scans
  or saved PDF invoices.
- HEIC/HEIF files are accepted by the picker, but decoding depends on browser
  support. If a browser cannot decode the image, use a JPEG/PNG export or a
  screenshot.

## Performance shape

The first scan loads the OCR bundle and model assets from the CDN. The app also
warms the OCR engine during idle time after startup, so many users see the cost
before they actively scan.

Images and rendered PDFs are normalized through the bounds in
`OCR_CONFIG.canvas`:

- The longest side is raised to at least `1000px` for tiny images.
- The longest side is capped at `2400px` to control mobile memory pressure.
- PDF previews render at up to `2.5x`, capped by `2400px` on the longest side.

These values balance receipt text clarity with predictable memory use on phones,
tablets, laptops, and desktops. If the OCR engine changes, update the constants
in config first, then validate both phone camera captures and desktop PDFs.

## Scan pipeline

1. `Receipt.pickImage()` chooses camera capture on touch/mobile layouts and file
   upload on desktop layouts.
2. `Receipt.recognizeText()` routes PDFs through PDF.js text extraction first.
3. PDFs with enough embedded text skip OCR and go straight to parsing.
4. Photos, screenshots, and image-only PDFs are normalized to a canvas and sent
   through PP-OCRv5.
5. `Receipt.parse()` scores likely totals, merchant names, dates, taxes, and
   note lines.
6. `Receipt.showPreview()` displays editable fields; the ledger is updated only
   after the user confirms.

## Manual validation checklist

After OCR-related changes:

1. Run `npm run build` and commit the regenerated `app.js` and `chunk-*.js`.
2. Start `npm run serve` and open `http://localhost:8765`.
3. Scan a phone-camera receipt photo.
4. Upload a desktop screenshot or JPEG receipt.
5. Upload a PDF invoice with selectable text and confirm it avoids unnecessary
   OCR fallback.
6. Upload or screenshot an image-only PDF and confirm OCR fallback still opens
   the review sheet.
7. Verify the review sheet fields remain editable and nothing saves until
   `Save expense` is selected.
