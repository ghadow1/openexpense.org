# OCR performance and source tags

OpenExpense receipt reading is local-first: images, PDF text, OCR output, and
ledger data stay in the browser. The OCR path should make good use of current
mobile and desktop browser capabilities without turning receipt scanning into a
startup cost.

## Human-readable source tags

Short tags mark code that carries OCR, platform, or performance risk. Keep the
tag near the decision it explains.

| Tag | Meaning | Typical files |
| --- | --- | --- |
| `@ocr-deps` | Same-origin OCR/PDF/WASM assets and dependency boundaries | `src/config.js`, `src/features/receipt.js`, `docs/DEPENDENCIES.md` |
| `@ocr-engine` | OCR service setup, model loading, and runtime selection | `src/features/receipt.js` |
| `@ocr-pdf` | PDF text extraction and first-page raster preview | `src/features/receipt.js` |
| `@ocr-pipeline` | Decode, normalize, enhance, recognize, and retry flow | `src/features/receipt.js` |
| `@ocr-parse` | Heuristics that suggest merchant, date, total, tax, and items | `src/features/receipt-parse.js` |
| `@platform` | Browser capability choices for phones, tablets, and desktops | `src/config.js`, `src/core/utils.js`, `src/features/receipt-picker.js` |
| `@perf` | Limits, lazy loading, canvas sizing, and CPU/memory tradeoffs | `src/config.js`, `src/features/receipt.js` |

These tags are for readers and reviewers. They are not build directives.

## Cross-platform contract

- The native camera/file picker opens synchronously from the user gesture in
  `features/receipt-picker.js`. This keeps iOS, Android, and desktop browser
  chooser behavior reliable.
- `features/receipt.js` lazy-loads `onnxruntime-web`, `ppu-paddle-ocr`, and
  PDF.js only after a user picks a receipt or PDF.
- `OCR_CONFIG` in `src/config.js` is the source of truth for OCR asset paths,
  file/PDF/text ceilings, WASM thread count, PDF preview sizing, canvas sizing,
  enhancement pixel budgets, and recognition score thresholds.
- Images prefer `createImageBitmap()` with EXIF orientation support when the
  browser provides it, then fall back to `Image` for compatibility.
- OCR runs through same-origin PP-OCRv6 Tiny models and ONNX Runtime Web WASM.
  The configured one-thread runtime favors predictable memory on phones while
  still using the same reviewed path on desktop.
- Text-based PDFs are parsed before OCR. Raster OCR is used when PDF text is
  missing or weaker than the OCR pass.
- Every OCR result remains advisory. A review sheet is required before anything
  is saved to the encrypted ledger.

## Update checklist

When changing OCR dependencies, models, canvas sizing, or parser heuristics:

1. Update `OCR_CONFIG` rather than scattering numeric limits in feature code.
2. Keep executable code and runtime/model assets same-origin under `vendor/`.
3. Update `docs/DEPENDENCIES.md` when package or vendored asset versions change.
4. Run `npm run build` so the lazy OCR chunks are regenerated.
5. Run `npm test` and include the OCR performance QC.
6. Smoke test at least one phone-sized image path and one desktop/PDF path when
   behavior changes, because browser file APIs differ by platform.
