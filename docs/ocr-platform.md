# OCR platform notes

OpenExpense keeps receipt reading private by running OCR in the browser. Images,
PDFs, and extracted text stay on the current device; the only network requests
are lazy downloads for the OCR/PDF runtime from the configured CDN.

## Dependency pins

`src/config.js` is the source of truth for receipt OCR dependencies:

| Config key | Purpose |
| --- | --- |
| `OCR_CONFIG.dependencies.paddleOcr` | PP-OCRv5 browser runtime loaded on first scan or idle warmup. |
| `OCR_CONFIG.dependencies.pdfJs` | PDF.js module used to inspect uploaded PDF invoices. |
| `OCR_CONFIG.dependencies.pdfWorker` | PDF.js worker used while rendering PDF previews. |
| `OCR_CONFIG.dependencies.peerImportMap` | Peer dependency URLs mirrored by the `index.html` import map. |

When changing peer dependency versions, update both `OCR_CONFIG.dependencies.peerImportMap`
and the import map in `index.html`. Browser import maps are parsed before app
code runs, so those URLs cannot be generated from JavaScript at runtime.

## Cross-platform performance

Receipt images are drawn to canvas before OCR. The app chooses an OCR canvas
profile from browser capability signals:

| Profile | Typical devices | Goal |
| --- | --- | --- |
| `mobile` | Phones, camera-first tablets, low-memory browsers | Reduce memory pressure and battery use while preserving readable receipt text. |
| `default` | Most laptops and tablets | Balance recognition accuracy with predictable runtime. |
| `desktop` | Wide screens with more memory or CPU cores | Use larger canvases for sharper OCR on dense receipts and invoices. |

`Utils.ocrCanvasProfile()` returns the selected profile. `Receipt.prepareForOcr()`
uses it to clamp the longest canvas side before OCR, and PDF rendering uses the
same profile to avoid oversized page previews.

`Utils.shouldWarmOcr()` skips idle model warmup when the browser reports data
saver mode or very constrained mobile hardware. Users on those devices still get
OCR; the model loads only after they tap Scan.

## Receipt reading flow

1. `Receipt.pickImage()` opens the hidden `#receipt-scan-input`. On camera-first
   devices it requests `capture="environment"`, so mobile browsers can open the
   rear camera directly.
2. PDF files go through `Receipt.pdfToCanvasAndText()`. Text embedded in the PDF
   is parsed first; OCR is only used when the extracted text is too sparse.
3. Image files go through `Receipt.fileToCanvas()` and `Receipt.prepareForOcr()`
   before `PaddleOcrService.recognize()`.
4. `Receipt.parse()` converts raw text into merchant, amount, date, tax, and
   notes. Confidence below `OCR_CONFIG.parsing.lowConfidenceThreshold` is flagged
   in the review sheet.
5. The review sheet always requires confirmation before `saveExpense()` writes to
   the encrypted ledger.

## Human-readable UI tags

The app uses readable `data-*` tags for event delegation instead of anonymous
button indexes:

| Tag | Handler | Meaning |
| --- | --- | --- |
| `data-action="scan-receipt"` | `handleDelegatedClick()` in `src/main.js` | Open the receipt scanner from toolbar or floating button. |
| `data-action="quick-add-today"` | `handleDelegatedClick()` | Open today in the manual expense editor. |
| `data-action="close-modal"` | `handleDelegatedClick()` | Close the expense editor. |
| `data-view="app"` / `data-view="docs"` | `handleDelegatedClick()` | Switch between calendar and documentation views. |
| `data-tab="manual"` / `guide` / `schema` | `switchDocTab()` | Switch in-app documentation chapters. |
| `data-act="save"` / `save-scan` / `cancel` | `Receipt.showPreview()` | Handle receipt review actions. |

When adding controls, prefer clear action names that describe user intent and
pair icon-only controls with `aria-label` and `title` text. That keeps mobile
and desktop code paths readable while preserving accessible labels when the CSS
collapses visible text.

## Rebuilding generated assets

The app is deployed as committed static assets. After editing `src/`, run:

```bash
npm run build
```

The `prebuild` script removes stale `app.js` and `chunk-*.js` files before esbuild
emits the current bundle.
