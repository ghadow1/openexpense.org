# Receipt OCR performance and source tags

OpenExpense scans receipts entirely in the browser. Photos, screenshots, and PDF
invoices are decoded on the device, normalized on a canvas, and parsed into a
review sheet that the user confirms before anything is saved.

This document records the source tags and performance guardrails used by the OCR
code so future changes stay readable and cross-platform.

## Human-readable code tags

Search these tags when changing OCR behavior:

| Tag | Meaning | Primary files |
| --- | --- | --- |
| `@ocr-deps` | OCR, PDF, ONNX, and OpenCV dependency pins. | `src/config.js`, `src/features/receipt.js`, `index.html` |
| `@ocr-engine` | Paddle OCR loading, initialization, and warmup. | `src/features/receipt.js`, `src/main.js` |
| `@ocr-pdf` | PDF.js loading, text extraction, and PDF preview rendering. | `src/features/receipt.js` |
| `@ocr-pipeline` | Image/PDF normalization before OCR. | `src/features/receipt.js`, `src/core/utils.js` |
| `@ocr-parse` | Text cleanup and merchant/date/amount heuristics. | `src/features/receipt.js` |
| `@ocr-ui` | Progress, preview, and save flows. | `src/features/receipt.js` |
| `@platform` | Browser, camera, network, and device capability decisions. | `src/core/utils.js`, `src/main.js` |
| `@perf` | Memory, canvas size, idle warmup, and preview URL choices. | `src/config.js`, `src/core/utils.js`, `src/features/receipt.js` |

Tags are intentionally lightweight comments. They are not build directives; they
are navigation markers for humans and code search.

## Pipeline overview

1. User taps **Scan**.
2. `Receipt.pickImage()` chooses camera capture on touch-first devices and file
   upload on desktop-class contexts.
3. `Receipt.recognizeText()` routes PDFs through PDF.js and images through the
   image decoder.
4. PDFs are text-first: if embedded text is sufficient, OCR is skipped.
5. Images and scanned PDFs are drawn to a white-backed canvas, resized between
   `OCR_CONFIG.image.minOcrSide` and `OCR_CONFIG.image.maxOcrSide`, then passed
   to Paddle OCR.
6. `Receipt.parse()` extracts merchant, date, total, tax, and line-item notes.
7. The review sheet shows the source preview and recognized text for user
   confirmation.

## Dependency ownership

`src/config.js` is the source of truth for OCR-related URLs:

- `ppu-paddle-ocr`
- `pdfjs-dist`
- `onnxruntime-web`
- `ppu-ocv/canvas-web`

Keep `OCR_CONFIG.dependencies.peerImports` in sync with the import map in
`index.html`. The import map is required because `ppu-paddle-ocr` imports peer
dependencies by bare specifier when it is lazy-loaded from the CDN.

## Cross-platform performance guardrails

- Use `createImageBitmap()` when available so modern mobile and desktop browsers
  can decode off the main image element path. Keep the `Image` fallback for
  Safari and older browsers.
- Prefer blob-backed preview URLs from `canvas.toBlob()` instead of large
  base64 data URLs. Revoke blob URLs when the preview closes.
- Keep OCR canvas bounds centralized in `OCR_CONFIG.image`; large receipts need
  enough pixels for text, but very large canvases hurt memory on mobile.
- Keep PDF render bounds centralized in `OCR_CONFIG.pdf`; embedded PDF text
  should skip OCR when possible.
- Gate idle OCR warmup with `Utils.shouldWarmOcr(OCR_CONFIG)`. Data Saver,
  2G-class connections, very low-memory devices, and very narrow touch devices
  should load OCR on demand instead of during startup.
- Do not move receipt images or OCR text to a backend. Local-only processing is
  part of the product privacy model.

## Safe improvement checklist

Before changing the OCR stack:

1. Update dependency pins in `OCR_CONFIG` and `index.html` together.
2. Keep any new thresholds in `OCR_CONFIG`, not inline in the OCR pipeline.
3. Test at least one photo receipt and one PDF invoice manually when changing
   decode, render, or OCR initialization behavior.
4. Run `npm run validate` to regenerate the tracked GitHub Pages bundle.
5. Check that low-resource devices can still skip idle warmup and scan on demand.

