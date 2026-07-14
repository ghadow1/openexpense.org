# OCR platform notes

OpenExpense reads receipts entirely in the browser. The ledger never leaves the
device; receipt photos and PDFs are decoded in memory, converted to canvas, and
only suggested fields are shown to the user for review.

## Runtime stack

The OCR stack is lazy-loaded from jsDelivr so the main app stays fast:

| Layer | Package | Version | When it loads |
| --- | --- | --- | --- |
| OCR engine | `ppu-paddle-ocr` | `6.1.0` | First image scan or OCR fallback for PDFs |
| ONNX Web runtime | `onnxruntime-web` | `1.27.0` | Peer dependency from the import map |
| Canvas OpenCV helpers | `ppu-ocv` | `4.0.0` | Peer dependency from the import map |
| PDF text/rendering | `pdfjs-dist` | `6.1.200` | First PDF scan |

The canonical dependency URLs live in `src/config.js` under `OCR_CONFIG`.
The `index.html` import map must stay in sync with
`OCR_CONFIG.dependencies.peerImportMap`.

## Mobile and desktop performance policy

`src/core/utils.js` exposes `Utils.deviceProfile()` so OCR can tune work by
capability rather than user-agent strings:

- `mobile`: small viewports, coarse pointers, or constrained memory. OCR keeps
  canvas sides between 900 and 1800 px to reduce memory pressure on phones.
- `default`: regular laptops/tablets. OCR keeps canvas sides between 1000 and
  2400 px.
- `desktop`: wide screens with stronger memory or CPU hints. OCR can use up to
  2800 px for sharper invoice and desktop screenshot reads.

`Utils.shouldWarmOcr()` skips idle model warmup on mobile and when the browser
reports data-saver mode. Desktop browsers still warm the OCR engine during idle
time so the first scan is quicker.

## Human-readable code tags

Generated OCR UI and intermediate canvases include readable tags for debugging:

- Progress overlay: `data-code-tag="oe-ocr:progress"`
- Review sheet: `data-code-tag="oe-ocr:review"`
- OCR canvases: `data-code-tag="oe-ocr:<stage>:<profile>"`
- Review buttons: `data-ocr-action="save"`, `save-scan`, or `cancel`

These tags make DevTools inspection and delegated event binding easier without
adding user-visible text.

## Privacy notes

OCR dependencies and models are fetched on first use, then cached by the
browser. Receipt contents are processed locally; no receipt image, extracted
text, or ledger data is posted to a server by OpenExpense. Users must review and
confirm scanner suggestions before anything is saved.
