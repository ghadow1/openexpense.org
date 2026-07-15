# Receipt OCR performance notes

OpenExpense runs receipt OCR in the browser so expense images never leave the device. The code favors predictable memory use on mobile while preserving OCR detail on desktops.

## Platform sizing

Canvas sizing lives in `OCR_CONFIG.canvas` (`src/config.js`):

- `minSide`: small receipts are upscaled enough for OCR to see text.
- `maxSide.mobile`: used for phones, coarse pointers, and camera-first flows.
- `maxSide.tablet`: used for mid-size screens.
- `maxSide.desktop`: used for pointer/keyboard desktop browsers.
- `pdfRenderMaxScale`: caps PDF preview/OCR rendering.

`Receipt.ocrMaxSide()` applies those caps in both image and PDF paths. If OCR gets slower or memory-heavy on phones, lower the mobile cap first. If desktop accuracy drops on dense invoices, raise only the desktop cap and validate bundle/runtime size.

## Warmup policy

`Utils.shouldWarmOcr()` skips idle OCR warmup for data-saver, very slow network, or low-memory devices. Manual receipt scanning still loads OCR on demand. This keeps page startup lighter for mobile users and avoids consuming memory before the user asks to scan.

## Dependency pins

OCR dependency versions are declared in `OCR_CONFIG.dependencies`:

- `paddleOcr` feeds the dynamic import in `src/features/receipt.js`.
- `pdfjs` feeds the PDF.js module and worker URLs.
- `peerImportMap` documents the bare-specifier versions in `index.html`.

When changing OCR or PDF packages:

1. Update `OCR_CONFIG.dependencies`.
2. Update the matching `index.html` import map entries for peer dependencies.
3. Run `npm run validate`.
4. Commit generated `app.js` and `chunk-*.js` files together.

## Parser changes

Receipt text parsing is intentionally separate from DOM and OCR engine code in `src/features/receipt-parser.js`. Add tests under `tests/` for merchant, date, amount, and confidence changes before adjusting heuristics.

Use `npm test` for fast parser checks and `npm run validate` before publishing.
