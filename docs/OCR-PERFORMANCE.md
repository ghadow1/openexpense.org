# Receipt OCR performance notes

OpenExpense reads receipts entirely in the browser. This keeps financial images private, but it also means the OCR path must be careful with network, CPU, memory, and human review.

## Source tags

Use these tags when touching OCR or platform-sensitive code:

| Tag | Meaning |
| --- | --- |
| `@ocr-deps` | CDN/import-map dependency pins and peer dependency notes. |
| `@ocr-engine` | PP-OCRv5 / ONNX initialization and warmup. |
| `@ocr-pdf` | PDF text extraction and scanned-PDF rendering. |
| `@ocr-pipeline` | Image decode, canvas preparation, and OCR recognition. |
| `@ocr-parse` | Heuristics that turn recognized lines into merchant, total, date, tax, and notes. |
| `@ocr-ui` | Required human review before anything is saved. |
| `@platform` | Mobile, desktop, or fallback browser behavior. |
| `@perf` | Latency, memory, network, or bundle-size decisions. |
| `@privacy` | Guarantees that data stays local. |

## Current browser stack

| Layer | Package / API | Why it is used |
| --- | --- | --- |
| OCR | `ppu-paddle-ocr@5.8.0` (PP-OCRv5) | Browser OCR with cross-line recognition for receipts and invoices. |
| Inference | `onnxruntime-web@1.23.2` | WebAssembly/WebGPU-capable ONNX runtime used by the OCR package. |
| Image helpers | `ppu-ocv@3.2.2` | Canvas OpenCV helpers required by the OCR package. |
| PDF | `pdfjs-dist@4.10.38` | Extracts embedded PDF text before falling back to OCR on a rendered page. |
| Image decode | `createImageBitmap()` with `Image` fallback | Uses modern browser decode paths when available while keeping broad compatibility. |

The executable OCR/PDF URLs live in `OCR_CONFIG.dependencies` in `src/config.js`. The import-map peer pins must also remain in `index.html` because import maps are parsed before `app.js` runs.

## Performance budget

- Initial app load should not include OCR or PDF code. Both are loaded lazily from the CDN.
- Idle warmup can hide first-scan latency on capable devices, but `Utils.shouldWarmOcr()` skips idle preload when the browser reports data-saver, 2G-class networking, or low-memory mobile hardware.
- Scan-intent warmup starts when the user hovers, focuses, or touches scan controls.
- OCR canvases are clamped between `OCR_CONFIG.performance.minCanvasSide` and `maxCanvasSide` so small receipts remain legible and large phone photos do not allocate excessive canvas memory.
- Text-native PDFs skip image OCR when extracted text is sufficient.

## Platform behavior

- Mobile or coarse-pointer browsers get `capture="environment"` on the receipt input so the rear camera is offered.
- Desktop browsers keep a normal file picker for saved images and PDF invoices.
- Encrypted export prefers the desktop File System Access API, then mobile Web Share, then an anchor download fallback.
- All paths require a secure context for encryption and the best browser APIs; local development should use `npm run serve`.

## Human review and privacy

OCR is a suggestion engine. The review sheet must stay in the flow so users can edit merchant, amount, date, and notes before saving. Do not add an automatic save path for scanned receipts unless it includes an equally clear opt-in and review story.

Receipt images, rendered PDF previews, recognized text, and parsed fields stay in the browser. No OCR path should upload source images or recognized text to a server.
