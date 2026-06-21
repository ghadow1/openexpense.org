# OCR receipt platform notes

OpenExpense reads receipts entirely in the browser. Images, PDFs, and extracted text stay on the device; the app only
downloads static OCR/PDF runtime assets from the CDN when scanning is needed.

## Runtime flow

1. The user chooses a receipt image or PDF from the Scan action.
2. PDFs are checked for embedded text first. If enough text is available, OCR is skipped.
3. Images and scanned PDFs are normalized onto a white canvas sized for the current device profile.
4. PP-OCRv5 runs locally through WebAssembly/browser APIs.
5. Parsed merchant, amount, date, and notes are shown in a review sheet.
6. Nothing is saved until the user confirms the expense.

## Configuration ownership

`src/config.js` exports `OCR_CONFIG`, which owns:

- CDN pins for PP-OCRv5, PDF.js, and the PDF worker.
- Progress labels shown during scan startup and document processing.
- Device canvas profiles for mobile, desktop, and low-power devices.
- Idle warmup policy for desktop browsers.
- Human-readable tags used by code and generated OCR canvases.

Keep platform constants in `OCR_CONFIG` instead of embedding them inside `src/features/receipt.js`.

## Platform profiles

| Tag | Used when | Goal |
| --- | --- | --- |
| `platform:mobile-camera` | Small/coarse-pointer devices such as phones and tablets | Reduce canvas memory and battery cost while keeping enough text detail. |
| `platform:desktop-workstation` | Desktop-class devices with enough CPU and memory | Preserve more pixels for OCR accuracy and allow idle engine warmup. |
| `platform:low-power` | Devices reporting limited memory or few CPU cores | Cap OCR work to avoid long pauses and memory pressure. |

The active profile controls image and PDF render dimensions before OCR. This keeps the same receipt feature usable
across recent mobile browsers, desktop browsers, and lower-powered devices without changing the user workflow.

## Readable tag glossary

These tags make important runtime choices searchable in source and inspectable in generated OCR canvases:

- `privacy:local-only` - receipt data is processed locally.
- `ocr:receipt-reading` - code belongs to the receipt reading pipeline.
- `ocr-engine:pp-ocrv5` - PP-OCRv5 is the OCR engine.
- `pdf-reader:pdfjs-4.10` - PDF.js handles PDF text extraction and rendering.
- `runtime:webassembly` - OCR runtime depends on browser WebAssembly support.
- `input:image-or-pdf` - scanner accepts photos, images, and PDF invoices.
- `review:human-confirmed` - parsed output requires user confirmation before saving.

## Performance guardrails

- Prefer `createImageBitmap` for modern browser image decode when available, then fall back to `Image`.
- Keep canvas resizing centralized through the active OCR profile.
- Avoid automatic mobile warmup; load OCR after user intent so cameras and batteries are not taxed on page open.
- Check PDF text before OCR so text-native invoices do not pay the OCR cost.
