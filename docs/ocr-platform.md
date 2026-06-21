# OCR platform guide

OpenExpense receipt scanning is a browser-only pipeline. The scanner should use
modern mobile and desktop browser capabilities when they are available, but it
must stay private, offline, and review-first.

## Pipeline tags

`src/features/receipt.js` uses human-readable comments to mark the hot paths:

- `[OCR:entry]` - file picker and camera-capture entry points.
- `[OCR:engine]` - lazy PP-OCR model loading and idle warm-up.
- `[OCR:pdf]` - PDF.js text extraction and PDF-to-canvas fallback.
- `[OCR:sizing]` - mobile/desktop canvas budget selection.
- `[OCR:recognition]` - structured OCR and flattened-text fallback.
- `[OCR:canvas]` - image decoding, scaling, and canvas preparation.
- `[OCR:pipeline]` - file-type dispatch and preview URL lifecycle.
- `[OCR:parse]` - receipt parsing heuristics.
- `[OCR:review]` - human confirmation before saving an expense.

Use these tags when adding comments around OCR behavior so future maintainers can
find performance-sensitive areas quickly.

## Runtime dependencies

The scanner intentionally keeps OCR libraries out of the main bundle:

- `Receipt.OCR_CDN` loads `ppu-paddle-ocr` on the first scan.
- `Receipt.PDF_CDN` and `Receipt.PDF_WORKER` load PDF.js on demand.
- `index.html` provides the import map for `onnxruntime-web` and
  `ppu-ocv/canvas-web`, which are peer dependencies of `ppu-paddle-ocr`.

When upgrading OCR, verify the CDN pin in `src/features/receipt.js` and the
import-map pins in `index.html` together. A version drift can break dynamic
imports only after the first scan, which makes it easy to miss in regular app
navigation.

## Cross-platform performance contract

The current scanner favors predictable browser behavior over native-only APIs:

1. **Image decoding** uses `createImageBitmap` on modern browsers and falls back
   to `HTMLImageElement`. This lets supported mobile and desktop browsers use
   optimized image decoders while keeping older browsers functional.
2. **Canvas sizing** upscales small images to a 1000 px longest side for OCR
   accuracy. Desktop/detail mode caps at 2400 px; camera-oriented or lower-memory
   devices cap at 2000 px to reduce memory spikes during OCR.
3. **PDF handling** reads embedded text before rendering a canvas. OCR is only
   used for image-only PDFs or PDFs whose text layer is too sparse.
4. **Model warm-up** runs during idle time after app initialization so the first
   intentional scan is less likely to pay the full model initialization cost.
5. **Review-first saving** always shows a preview sheet. OCR output is a
   suggestion, never an automatic ledger write.

Avoid raising canvas caps without testing lower-memory phones and tablets. Large
camera photos can allocate multiple canvases during decode, scale, OCR, and
preview creation.

## Manual smoke checklist

There is no automated browser test suite in this repository today. Before
shipping OCR changes, run `npm run build`, serve the site over `localhost`, and
check:

- Desktop Chrome or Edge: scan a JPEG/PNG receipt.
- Desktop Chrome or Edge: import a PDF with embedded text and confirm OCR is not
  needed.
- Desktop Chrome or Edge: import an image-only PDF and confirm OCR fallback.
- Mobile browser or device emulation: scan button opens a camera-oriented picker.
- Mobile browser or device emulation: review sheet fits the viewport and can save.
- Warm path: scan a second image after the first one and confirm model reuse.
- Error path: choose an unreadable file and confirm the app shows a friendly
  failure toast and logs with `[OpenExpense][OCR]`.

HEIC and HEIF files are accepted by the input, but support depends on the
browser's native image decoder. If a browser cannot decode that format, the
scanner should fail gracefully with the existing error toast.
