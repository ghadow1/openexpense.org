# OCR performance and maintenance notes

OpenExpense reads receipts entirely in the browser. The OCR pipeline is tuned for
current mobile and desktop web runtimes without introducing a server-side
processing path.

## Pipeline

1. The user chooses a receipt image or PDF through the Scan action.
2. PDF.js extracts text from digital PDFs before image OCR is attempted.
3. Images and scanned PDFs are rendered to canvas.
4. PP-OCRv5 reads the canvas through ONNX Runtime Web.
5. Heuristics parse merchant, total, date, tax, and line items.
6. The user reviews the suggested fields before anything is written to the ledger.

## Dependency contract

OCR dependency pins live in `OCR_CONFIG.dependencies` in `src/config.js`.

The peer dependency import map in `index.html` must stay aligned with
`OCR_CONFIG.dependencies.peerImportMap`:

| Package | Purpose |
| --- | --- |
| `ppu-paddle-ocr` | PP-OCRv5 browser OCR service |
| `onnxruntime-web` | Web runtime for OCR model execution |
| `ppu-ocv/canvas-web` | Canvas image preprocessing used by the OCR package |
| `pdfjs-dist` | Text extraction and preview rendering for PDFs |

The first scan downloads these browser assets from jsDelivr and caches them in
the browser. Receipt pixels and parsed text remain in the browser app.

## Platform tuning

Canvas limits are intentionally centralized in `OCR_CONFIG.preprocessing`.

| Tier | Longest image side | PDF render side | Goal |
| --- | ---: | ---: | --- |
| Mobile | 1600 px | 1800 px | Lower memory, faster battery-friendly OCR |
| Tablet | 2000 px | 2200 px | Balanced accuracy and speed |
| Desktop | 2400 px | 2400 px | Maximum accuracy for larger screens and CPUs |

`Utils.platformTier()` chooses a tier from viewport width and coarse pointer
signals. `Utils.ocrCanvasSettings()` returns the active preset so receipt image
and PDF paths stay consistent.

Idle OCR warmup is controlled by `OCR_CONFIG.warmup` and `Utils.shouldWarmOcr()`.
Warmup is skipped when the browser reports data-saver, very slow network types,
or very low device memory. A manual scan always loads the OCR engine on demand.

## Human-readable code tags

`CODE_TAGS` in `src/config.js` gives stable names to important OCR surfaces.
The receipt progress modal, review sheet, raw text panel, and save actions use
`data-code-tag` attributes so maintainers and future tests can find them without
depending on presentation classes.

Use existing tags before adding new selectors:

- `receipt:progress`
- `receipt:review-sheet`
- `receipt:raw-text`
- `receipt:save-expense`
- `receipt:save-and-scan-another`

## Verification checklist

After OCR changes:

```bash
npm run validate
```

Then serve locally from a secure context:

```bash
npm run serve
```

Manual checks:

- Image receipt on mobile viewport opens the camera/file picker and reaches the
  review sheet.
- Digital PDF invoice extracts text without unnecessary OCR.
- Scanned PDF falls back to OCR.
- Data-saver or very slow network simulation skips idle warmup, but Scan still
  loads OCR.
- The review sheet keeps the user confirmation step before saving.
