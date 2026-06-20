# Receipt OCR and cross-platform behavior

OpenExpense reads receipts entirely in the browser. Images, PDFs, OCR output,
and parsed expense suggestions stay on the user's device until the user confirms
an expense into the encrypted ledger.

## Pipeline

```text
Scan button / file input
  -> image, camera capture, HEIC-compatible upload, or PDF
  -> PDF text extraction first when possible
  -> canvas render and resize for OCR when text is not available
  -> PP-OCRv5 recognition through onnxruntime-web
  -> deterministic receipt parser
  -> review sheet
  -> encrypted ledger save after user confirmation
```

PDFs use a text-first path so invoices with selectable text avoid OCR work. Image
receipts and scanned PDFs are normalized to a white-backed canvas before
recognition.

## Runtime resources

The scanner lazy-loads OCR and PDF libraries from jsDelivr. Keep these pins in
sync across `src/config.js`, `index.html`, and this document.

| Resource | Version | Where it is used |
| --- | --- | --- |
| `ppu-paddle-ocr` | `5.8.0` | PP-OCRv5 browser OCR engine |
| `onnxruntime-web` | `1.23.2` | Import-map peer dependency for ONNX execution |
| `ppu-ocv` | `3.2.2` | Import-map peer dependency for canvas/OpenCV helpers |
| `pdfjs-dist` | `4.10.38` | PDF text extraction and page raster fallback |

The first OCR scan downloads model/runtime assets and then relies on the browser
HTTP cache. `src/main.js` requests an idle warm-up after app boot; the warm-up is
skipped when the browser reports data-saver mode.

## Platform matrix

| Capability | Desktop browsers | Mobile browsers / PWA |
| --- | --- | --- |
| Receipt input | File picker for images and PDFs | Rear-camera capture hint plus file picker |
| OCR execution | Browser JS/WASM/ONNX runtime | Same runtime, with smaller canvas bounds |
| PDF handling | Selectable text first, rendered first page preview | Same path, tuned for lower memory |
| Export | File System Access API when available | Web Share API for files when available |
| Fallback | `<a download>` blob download | `<a download>` blob download |
| Install | Browser PWA support | Standalone PWA metadata and safe-area CSS |

There is no server OCR fallback and no native shell. The app is a static PWA, so
all performance tuning must work in ordinary secure browser contexts.

## Performance notes

- `Receipt.prepareForOcr()` applies canvas bounds from `OCR_RESOURCES`:
  - desktop: 1000-2400 px longest side
  - mobile: 900-1800 px longest side
- Mobile bounds reduce memory pressure and inference time on constrained devices
  while preserving enough detail for common receipt text.
- PDF receipts avoid model loading when selectable text is present.
- The scanner reports progress for long-running steps and keeps every OCR result
  behind the review sheet so lower-confidence reads are visible to the user.
- Future larger optimizations, such as a service worker model cache or WebGPU
  backend selection, should include a cache/version strategy before shipping.

## Human-readable code tags

Source comments use short tags to make platform and OCR responsibilities easy to
find:

- `@tag ocr-resources` - CDN pins and OCR canvas limits.
- `@tag ocr-engine` - library loading, PDF reading, canvas recognition.
- `@tag ocr-performance` - warm-up and scaling choices.
- `@tag receipt-parser` - deterministic text-to-field heuristics.
- `@tag receipt-review-ui` - user confirmation boundary.
- `@tag platform-*` - browser capability or platform-specific behavior.

Prefer adding one of these tags when a change affects receipt processing,
cross-platform capabilities, or performance-sensitive code.
