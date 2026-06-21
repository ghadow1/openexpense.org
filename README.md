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
```

Then open http://localhost:8765 in your browser. (Open it through the server, not by double-clicking `index.html` — encryption needs a secure context.)

## Features

- **Zero backend** — no server, no database, and no ledger uploads. First-use CDN downloads provide UI icons and OCR/PDF browser assets; your expense data and receipt contents stay on-device.
- **Encrypted local autosave** — every change is automatically saved to your browser's storage, encrypted with AES-256-GCM. The key is generated on-device and never leaves the browser. Autosave can be paused from the header for an ephemeral, nothing-written session.
- **Encrypted export** — Export is the manual save: it produces a `.zip` containing your encrypted ledger plus the key to decrypt it. Import reads the zip (or the two files separately).
- **Receipt scanning** — client-side OCR (PP-OCRv5); images never leave your device.
- **Cross-platform** — responsive layout with desktop save-picker and mobile share fallbacks.

## How it works

OpenExpense is ES modules under `src/`, bundled into a single `app.js` that `index.html` loads. There's no build step on GitHub Pages — commit the rebuilt `app.js`.

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

## Receipt OCR stack

Receipt reading is lazy-loaded so the calendar starts quickly on phones and desktops:

- `src/config.js` owns OCR/PDF CDN pins and image-size limits in `OCR_CONFIG`.
- `src/features/receipt.js` imports PP-OCRv5 (`ppu-paddle-ocr`) only when a scan starts or when idle warmup is safe.
- `index.html` provides the import map for `onnxruntime-web` and `ppu-ocv/canvas-web`, the peer runtimes used by the OCR engine.
- PDFs are parsed for embedded text first through PDF.js; OCR is used only for scanned/image-only PDFs.
- Mobile and low-memory devices use smaller OCR canvases, while desktops keep larger canvases for sharper text recognition.

The OCR engine, PDF reader, and icon font are fetched from jsDelivr as static browser assets. No receipt image, parsed text, or ledger data is sent to OpenExpense servers.

## Development notes

### Bundles

GitHub Pages serves the root `app.js` and `chunk-*.js` files directly. After editing `src/`, run:

```bash
npm run build
```

The build script first removes old generated bundles, then emits a fresh `app.js` and active chunks. Commit the regenerated bundle files with the source change.

### Human-readable code tags

Important modules use lightweight tags in comments so privacy, performance, and platform-sensitive paths are searchable:

```js
/**
 * @module oe/receipt-ocr
 * @tag privacy:local-only
 * @tag perf:lazy-load
 * @tag platform:mobile-desktop
 */
// @section receipt-parse-heuristics
```

Use tags sparingly on module headers and high-value sections such as OCR engine loading, platform export behavior, storage encryption, and render scheduling.

### Verification

```bash
npm run build
npm run serve
```

Then open http://localhost:8765 and smoke-test:

- app boot (`window.__oeBoot.ok === true` in the console)
- receipt scan from a photo
- PDF invoice with embedded text
- scanned/image-only PDF fallback
- export on desktop (save picker) and mobile/narrow viewport (share or download fallback)

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
