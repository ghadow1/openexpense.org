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

- **Zero servers** — no backend and no database. Static assets and OCR dependencies load from CDNs, but ledger data and receipt images are never uploaded.
- **Encrypted local autosave** — every change is automatically saved to your browser's storage, encrypted with AES-256-GCM. The key is generated on-device and never leaves the browser. Autosave can be paused from the header for an ephemeral, nothing-written session.
- **Encrypted export** — Export is the manual save: it produces a `.zip` containing your encrypted ledger plus the key to decrypt it. Import reads the zip (or the two files separately).
- **Receipt scanning** — client-side OCR (PP-OCRv5); images never leave your device.
- **Cross-platform** — responsive layout with desktop save-picker and mobile share fallbacks.

## Receipt OCR and platform performance

Receipt scanning lives in `src/features/receipt.js` and is lazy-loaded only when
the user scans a receipt or the browser has idle time to warm the engine. OCR
settings live in `OCR_CONFIG` and `PLATFORM_CONFIG` inside `src/config.js`:

- PP-OCRv5 (`ppu-paddle-ocr`) and PDF.js are loaded from jsDelivr on demand.
- The import map in `index.html` pins OCR peer dependencies; keep those URLs in
  sync with `OCR_CONFIG.dependencies.peerImportMap`.
- `Utils.getOcrCanvasSettings()` selects compact, balanced, or desktop canvas
  caps based on save-data, connection speed, device memory, screen size, and
  pointer type.
- `Utils.shouldWarmOcr()` skips idle warm-up for save-data or very slow
  connections; scanning still loads OCR manually when requested.

The receipt module is tagged for readability with `@tag ocr-engine`,
`@tag ocr-preprocess`, `@tag receipt-parse`, and `@tag ocr-review`. See
[`docs/OCR-PERFORMANCE.md`](docs/OCR-PERFORMANCE.md) before changing OCR
dependencies, canvas profiles, or parser heuristics.

## How it works

OpenExpense is ES modules under `src/`, bundled into root `app.js` plus hashed
`chunk-*.js` files that `index.html` loads. There's no build step on GitHub Pages
— commit the rebuilt generated assets after editing `src/`.

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

`npm run build` removes stale generated root assets before bundling so deploys do
not accumulate obsolete `chunk-*.js` files. `npm run validate` currently runs the
same cleaned production build.

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
