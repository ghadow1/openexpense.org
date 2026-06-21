# [openexpense.org](https://www.openexpense.org)

**A privacy-first, offline-only expense tracker. Your data never leaves your browser.**

![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)
![Version](https://img.shields.io/badge/Version-2.1.0-blue)

## Quick start

```bash
# Start the local dev server (http://localhost:8765)
npm run serve

# Kill the dev server when you're done
pkill -f "http.server 8765"

# Rebuild app.js and chunk-*.js after editing anything in src/
npm run build
```

Then open http://localhost:8765 in your browser. (Open it through the server, not by double-clicking `index.html` — encryption needs a secure context.)

## Features

- **Zero servers** — no backend, no database, no third-party calls.
- **Encrypted local autosave** — every change is automatically saved to your browser's storage, encrypted with AES-256-GCM. The key is generated on-device and never leaves the browser. Autosave can be paused from the header for an ephemeral, nothing-written session.
- **Encrypted export** — Export is the manual save: it produces a `.zip` containing your encrypted ledger plus the key to decrypt it. Import reads the zip (or the two files separately).
- **Receipt scanning** — client-side OCR (PP-OCRv5); images never leave your device.
- **Cross-platform** — responsive layout with desktop save-picker and mobile share fallbacks.

## How it works

OpenExpense is ES modules under `src/`, bundled into `app.js` and `chunk-*.js` that `index.html` loads. There's no build step on GitHub Pages — commit the rebuilt generated assets after editing `src/`.

```
src/
├── config.js          # CONFIG, DAYS, STORAGE_KEYS, THEMES
├── main.js            # Bootstrap + store subscription
├── core/
│   ├── store.js       # Central state: getState(), patch(), subscribe()
│   ├── persist.js     # Encrypted IndexedDB auto-save/load
│   ├── crypto.js      # AES-256-GCM device key (at rest)
│   ├── bundle.js      # Encrypted .zip export/import
│   └── utils.js
├── ui/                # components, theme, toast
├── features/          # calendar, ledger (autosave + export/import), modal, receipt, sidebar
└── app/               # render orchestration, view switching
app.js                 # Bundled entry (rebuild with `npm run build`)
```

UI actions call `patch()` on the store; a subscriber re-renders and `persist.js` saves (encrypted, debounced) to IndexedDB.

## Receipt OCR architecture

Receipt scanning lives in `src/features/receipt.js` and is tagged by pipeline section (`OCR_RESOURCE`, `OCR_ENGINE`, `OCR_PDF`, `OCR_IMAGE`, `OCR_PARSE`, and `OCR_REVIEW`) so maintainers can follow the flow from upload to reviewed expense.

- **Latest browser resources without bundling model weight:** `ppu-paddle-ocr@5.8.0` is lazy-loaded from jsDelivr on first scan. Its peer runtime pins are kept in the `index.html` import map (`onnxruntime-web@1.23.2` and `ppu-ocv@3.2.2`), while PDF extraction uses `pdfjs-dist@4.10.38` only for PDF uploads.
- **Cross-platform performance:** the app preconnects to the CDN, idles the OCR warmup on capable connections, and respects Data Saver / `prefers-reduced-data` by waiting for an explicit scan before downloading OCR resources. Image uploads use `createImageBitmap` when available for off-main-thread decoding, with an `Image` fallback for older mobile and desktop browsers.
- **PDF text-first path:** text PDFs and invoices are parsed without OCR when enough embedded text is available. Image-only PDFs render the first page to a bounded canvas and then use the same OCR path as photos.
- **Memory-aware canvas sizing:** camera photos, screenshots, and scans are normalized to a 1000-2400px longest side range to balance OCR accuracy with mobile GPU/canvas memory.
- **Human review:** OCR never writes directly to the ledger. The review sheet shows the source preview, suggested merchant, amount, date, notes, confidence, and raw recognized text before saving.

HEIC/HEIF selection is accepted so supported browsers can decode native mobile photos, but support depends on the browser's image decoder. For the most reliable cross-device OCR, use JPEG, PNG, or a text PDF.

## Data format

Calendar dates map to expense records. This is the shape used in exports and inside the encrypted record.

```json
{
  "name": "GBA Expenses",
  "events": {
    "2026-06-03": [
      { "title": "API Hosting", "price": 49.99, "recurring": true }
    ]
  }
}
```

## Encryption & storage

- **Autosave = encrypted local storage.** Changes are debounced and written to the `openexpense` IndexedDB (v2), encrypted with AES-256-GCM. No files are involved — autosave never touches the disk as plaintext. It's on by default; the header disk button pauses it (changes then stay in memory only until re-enabled).
- The AES-GCM key is stored **non-extractable**, so its raw bytes can't be read back — even from devtools.
- Only non-sensitive UI prefs (theme, autosave on/off, first-visit) use `localStorage`. The ledger name and entries never do.
- **Export** is an encrypted `.zip` (via [`fflate`](https://github.com/101arrowz/fflate)) with `ledger.enc.json` (ciphertext) + `ledger.key.json` (the key) + `README.txt`. Anyone with both files can decrypt — for sensitive backups, store or send them separately.
- **Import** auto-detects: a full zip, a key and encrypted file loaded separately (in any order), or a legacy plaintext `.json`.
