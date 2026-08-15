# OCR performance and source tags

OpenExpense reads receipts entirely in the browser. The OCR pipeline is tuned for
current mobile and desktop browsers without adding a server or native wrapper.

## Pipeline

1. **User intent** (`src/main.js`, `src/features/receipt.js`)
   - Mobile and coarse-pointer devices get `capture="environment"` so the scan
     control opens the rear camera when the browser supports it.
   - OCR warm-up runs during idle time only when the network and device-memory
     signals indicate the device can absorb the model load.
2. **Decode** (`src/features/receipt.js`)
   - Images prefer `createImageBitmap()` for off-main-thread decoding and mobile
     camera orientation support, with an `Image` fallback for older browsers.
   - PDF files use pdf.js text extraction first; OCR is skipped when the PDF
     already has enough selectable text.
3. **Canvas preparation** (`src/config.js`, `src/features/receipt.js`)
   - Receipt images are bounded between `OCR_CONFIG.image.minOcrSide` and
     `OCR_CONFIG.image.maxOcrSide`.
   - The lower bound keeps small print readable for PP-OCR.
   - The upper bound protects memory and battery on phones and tablets.
4. **Recognition and review**
   - PP-OCR is loaded lazily from the CDN. Its peer dependencies are resolved by
     the import map in `index.html`.
   - OCR proposes merchant, amount, date, tax, and notes. The review sheet is the
     only path to saving, so guessed values are never written automatically.

## Cross-platform guardrails

- Keep OCR dependency pins in `OCR_CONFIG.dependencies` synchronized with
  `index.html` import-map entries.
- Keep scan input behavior feature-detected. Avoid user-agent checks; the app
  uses media queries, pointer capabilities, Web Share, and File System Access
  support to choose mobile or desktop flows.
- Use blob-backed preview URLs when possible, and revoke them in
  `Receipt.closePreview()` or scan error handling.
- Manual scan must always work even when idle warm-up is skipped for data-saver,
  2G-class, or low-memory sessions.
- After editing files in `src/`, run `npm run build` or `npm run validate` and
  commit the regenerated `app.js` and `chunk-*.js` deployment assets.

## Human-readable source tags

Use these tags in nearby comments when adding or moving OCR/platform code:

| Tag | Meaning |
| --- | --- |
| `@ocr-deps` | CDN, import-map, model, worker, or peer dependency pins. |
| `@ocr-engine` | OCR service initialization and model warm-up. |
| `@ocr-pdf` | PDF text extraction, PDF rendering, and PDF OCR fallback. |
| `@ocr-pipeline` | Image preparation, canvas sizing, and OCR pass ordering. |
| `@ocr-parse` | Deterministic parsing heuristics for merchant, totals, dates, and notes. |
| `@ocr-ui` | Progress, preview, and review sheet behavior. |
| `@platform` | Mobile/desktop capability detection and browser API fallbacks. |
| `@perf` | Resource, memory, network, battery, or startup-cost decisions. |
| `@privacy` | Local-only processing and review-before-save safeguards. |

Keep tags sparse. They should mark code a maintainer is likely to search for,
not replace clear function names or focused documentation.
