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

# Rebuild app.js after editing anything in src/
npm run build

# Clean generated bundles, rebuild, and verify the app still bundles
npm run validate
```

Then open http://localhost:8765 in your browser. (Open it through the server, not by double-clicking `index.html` — encryption needs a secure context.)

## Features

- **Zero servers** — no backend, no database, no third-party calls.
- **Encrypted local autosave** — every change is automatically saved to your browser's storage, encrypted with AES-256-GCM. The key is generated on-device and never leaves the browser. Autosave can be paused from the header for an ephemeral, nothing-written session.
- **Encrypted export** — Export is the manual save: it produces a `.zip` containing your encrypted ledger plus the key to decrypt it. Import reads the zip (or the two files separately).
- **Receipt scanning** — client-side OCR (PP-OCRv5); images never leave your device.
- **Cross-platform** — responsive layout with desktop save-picker and mobile share fallbacks.

## How it works

OpenExpense is ES modules under `src/`, bundled into `app.js` plus hashed `chunk-*.js` files that `index.html` loads. There's no build step on GitHub Pages — commit the rebuilt generated assets. `npm run build` first removes the previous generated `app.js` and `chunk-*.js` files so stale split chunks do not accumulate.

```
src/
├── config.js          # CONFIG, OCR_CONFIG, PLATFORM_CONFIG, UI_TAGS, DAYS, STORAGE_KEYS, THEMES
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

## Receipt OCR runtime

Receipt scanning lives in `src/features/receipt.js` and is configured from `OCR_CONFIG` in `src/config.js`.

- **OCR engine:** `ppu-paddle-ocr@5.8.0` (PP-OCRv5), loaded lazily from jsDelivr on the first scan or during idle warmup.
- **Peer runtimes:** `onnxruntime-web@1.23.2` and `ppu-ocv@3.2.2` are declared in the `index.html` import map. Keep those URLs mirrored with `OCR_CONFIG.dependencies.peerImportMap`.
- **PDF support:** `pdfjs-dist@4.10.38` is loaded only when the scanned file is a PDF.
- **Cross-platform tuning:** `Utils.ocrCanvasProfile()` picks smaller canvases for mobile, coarse-pointer, data-saver, or very slow connections, and a larger profile for capable desktops.
- **Warmup behavior:** OCR preloads in `requestIdleCallback` when available, but skips warmup when the browser reports data-saver or `slow-2g`. Manual scanning still loads OCR on demand.
- **Readable DOM tags:** global app actions use `data-action` values from `UI_TAGS.actions`; receipt review buttons use `data-ocr-action` values from `UI_TAGS.ocrPreviewActions`.

Images and PDFs are processed locally in the browser. No receipt image, extracted text, or parsed expense leaves the device.

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
