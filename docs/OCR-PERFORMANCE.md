# OCR performance and code tags

OpenExpense reads receipts, invoices, bills, screenshots, and text-based PDFs
inside the browser. The feature is intentionally local-first: receipt pixels,
PDF text, OCR output, and ledger entries stay on the device.

## Human-readable tags

Search these tags when changing receipt scanning. They are plain comments, not
a tool-specific syntax.

| Tag | Meaning |
| --- | --- |
| `@ocr-deps` | Same-origin OCR, ONNX, PDF.js, WASM, and model assets |
| `@ocr-engine` | Lazy OCR runtime initialization, WASM settings, and warmup |
| `@ocr-pdf` | PDF text extraction, first-page preview, and OCR fallback |
| `@ocr-pipeline` | Image preparation, recognition, parsing, and review flow |
| `@ocr-parse` | Merchant, date, total, tax, and item heuristics |
| `@ocr-ui` | Native picker, progress dialog, review sheet, and confirmation |
| `@platform` | Mobile, tablet, desktop, and browser capability branches |
| `@perf` | Bounded startup, CPU, canvas, memory, and battery cost |

The canonical tag list lives in `OCR_CONFIG.codeTags` in `src/config.js`.

## Cross-platform performance contract

- Startup stays light. `src/main.js` imports `features/receipt.js` only after a
  user chooses a receipt file, so OCR dependencies never enter the initial app
  bundle.
- The native picker remains synchronous. `features/receipt-picker.js` clicks the
  hidden file input before the heavy scanner module loads, preserving mobile
  browser user activation for camera capture.
- Runtime sizing is adaptive. `Utils.ocrRuntimeProfile(OCR_CONFIG)` reads
  advisory browser hints such as coarse pointer, hardware concurrency, device
  memory, Save-Data, effective connection type, and threaded-WASM support.
  Phones and constrained sessions stay on one ONNX/WASM thread. Isolated desktop
  browsers can use a small thread budget when the platform exposes safe
  threaded WASM.
- Canvas work is bounded. `OCR_CONFIG.image` caps OCR input dimensions and the
  high-contrast retry canvas so large mobile photos do not create unbounded
  memory pressure.
- PDF work is bounded. `OCR_CONFIG.limits` caps file size, page count, extracted
  lines, and extracted characters before any OCR fallback. Text-based PDFs skip
  OCR when the extracted text already contains usable merchant and total fields.
- PDF previews use object URLs where available. That avoids duplicating invoice
  previews as base64 strings in JavaScript memory while the review sheet is open.
- Every OCR result is advisory. The review sheet must remain the save boundary;
  no scan result should write to the ledger without the user confirming it.

## Dependency and asset policy

Production OCR and PDF code must stay bundled or same-origin:

- `ppu-paddle-ocr` provides the browser OCR service.
- `onnxruntime-web` provides the WASM inference runtime.
- `pdfjs-dist` provides text extraction and first-page rasterization.
- WASM, PDF worker, and PP-OCRv6 Tiny model files live under `vendor/`.

If a dependency or model changes, update `docs/DEPENDENCIES.md`, regenerate
`vendor/SHA256SUMS` if assets changed, rebuild the app, and run the full QC
suite. Do not add a network OCR API, analytics call, crash reporter, or model
download host that can receive ledger text, receipt pixels, or key material.

## Review checklist

- Does the change keep OCR/PDF imports lazy?
- Does the change preserve same-origin model and worker paths?
- Are file, page, text, canvas, and thread limits still enforced?
- Can a phone still open the camera/file picker from the original tap?
- Does desktop acceleration degrade safely to single-threaded WASM?
- Is every parsed field still shown for review before saving?
