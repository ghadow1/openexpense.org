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

# Rebuild generated browser assets after editing anything in src/
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

OpenExpense is ES modules under `src/`, bundled into `app.js` plus hashed `chunk-*.js` files that `index.html` loads. There's no build step on GitHub Pages — commit the rebuilt `app.js` and any generated chunk changes.

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
├── features/          # calendar, ledger (autosave + export/import), modal, receipt OCR, sidebar
└── app/               # render orchestration, view switching
app.js                 # Bundled entry (rebuild with `npm run build`)
chunk-*.js             # Generated split chunks for browser delivery
```

UI actions call `patch()` on the store; a subscriber re-renders and `persist.js` saves (encrypted, debounced) to IndexedDB.

## Receipt OCR and platform performance

Receipt scanning lives in `src/features/receipt.js` and is designed to stay local on both mobile and desktop browsers.

- **Engine loading** — PP-OCRv5 is lazy-loaded from `Receipt.OCR_CDN`, then warmed during idle time in `src/main.js` so later scans can reuse cached model and WASM resources.
- **Import-map peers** — `index.html` maps `onnxruntime-web` and `ppu-ocv/canvas-web`, which are peer dependencies of `ppu-paddle-ocr`. Keep those pins aligned with the OCR CDN pin when upgrading.
- **PDF fast path** — PDF.js reads embedded text before OCR. Image-only PDFs render page 1 to canvas and then use OCR.
- **Image decode path** — modern browsers use `createImageBitmap` when available, with an `HTMLImageElement` fallback for compatibility. HEIC/HEIF input depends on the browser's native decoder.
- **Canvas budgets** — OCR upscales very small images to preserve recognition accuracy, caps desktop/detail canvases at 2400 px on the longest side, and uses a 2000 px cap for camera-oriented or lower-memory devices to reduce mobile memory pressure.
- **Human-readable code tags** — OCR comments use tags such as `[OCR:engine]`, `[OCR:canvas]`, and `[OCR:parse]` so performance-sensitive sections are easy to scan.

See `docs/ocr-platform.md` for the OCR pipeline map, dependency pins, and a manual cross-platform smoke checklist.

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
