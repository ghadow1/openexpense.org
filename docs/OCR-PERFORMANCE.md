# OCR receipt performance guide

OpenExpense reads receipts entirely in the browser. The goal is fast local OCR
on current mobile and desktop browsers while keeping the code easy to scan for
future maintainers.

## Source tags

Use these tags in comments when changing performance-sensitive or user-facing
receipt code:

- `OE-OCR` — OCR dependency loading, model/runtime config, and import-map pins.
- `OE-PDF` — PDF text extraction, rendering, and OCR fallback.
- `OE-PERF` — image decoding, canvas sizing, idle work, and render batching.
- `OE-PLATFORM` — mobile/tablet/desktop breakpoints and browser capability flows.
- `OE-PARSE` — receipt text normalization and field heuristics.
- `OE-REVIEW` — the human confirmation step before a scan becomes an expense.

The main code paths are:

- `src/config.js` — `OCR_CONFIG` and `BREAKPOINTS`.
- `src/core/utils.js` — platform/capability helpers such as data saver, device
  memory, image-bitmap support, and OCR canvas budgets.
- `src/features/receipt.js` — OCR/PDF loading, image preparation, parsing, and
  review UI.
- `src/main.js` — gated idle warmup for the OCR engine.
- `index.html` — import map for OCR peer dependencies and in-app receipt help.

## Receipt pipeline

1. User taps **Scan**.
2. Mobile/coarse-pointer browsers get a camera capture hint; desktop browsers
   keep the normal file picker for screenshots, image files, and PDFs.
3. PDFs are parsed with `pdfjs-dist` first. If text is present, the app skips
   OCR and uses the embedded text. Scanned PDFs render the first page and fall
   back to OCR.
4. Images use `createImageBitmap` when available so modern browsers can decode
   efficiently, then fall back to `Image` for compatibility.
5. Canvas size is capped by device class:
   - mobile: smaller max side to reduce memory pressure,
   - tablet: balanced max side,
   - desktop: highest max side for small receipt text.
6. OCR returns suggested merchant, date, amount, tax, and notes.
7. The review sheet requires the user to confirm or edit fields before saving.

## Warmup policy

The OCR engine is lazy-loaded on demand for every platform. Idle warmup is only
an optimization and is skipped when browser signals suggest constrained
resources:

- `navigator.connection.saveData` is enabled,
- effective connection type is `slow-2g` or `2g`,
- `navigator.deviceMemory` is below the configured threshold.

Manual receipt scanning still works in these cases; the user simply sees the
first-scan load when they choose to scan.

## Privacy and network behavior

Ledger data, receipt images, and parsed text never leave the browser. The app
does download runtime assets from jsDelivr:

- `ppu-paddle-ocr`,
- `pdfjs-dist`,
- `onnxruntime-web`,
- `ppu-ocv/canvas-web`,
- Tabler icon CSS.

Browsers cache these assets after first use. Keep URLs in `src/config.js` and
the `index.html` import map synchronized.

## Change checklist

- Keep OCR dependency URLs in one config change and mirror peer import-map URLs.
- Preserve the text-first PDF path before adding image OCR work.
- Recheck mobile canvas budgets before raising OCR input size.
- Do not auto-save OCR output; route changes through the review sheet.
- Run `npm run build` after source changes and commit the rebuilt `app.js` and
  current chunk files.
