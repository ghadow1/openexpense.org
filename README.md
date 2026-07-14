# [openexpense.org](https://www.openexpense.org)

**A privacy-first, offline-only expense tracker. Your data never leaves your browser.**

![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)
![Version](https://img.shields.io/badge/Version-2.1.0-blue)

## Quick start

```bash
# Install dependencies once
npm ci

# Start the local dev server (http://localhost:8765)
npm run serve

# Kill the dev server when you're done
pkill -f "http.server 8765"

# Rebuild app.js after editing anything in src/
npm run build

# Run the repository check (currently the production build)
npm run check
```

Then open http://localhost:8765 in your browser. (Open it through the server, not by double-clicking `index.html` — encryption needs a secure context.)

## Features

- **Zero app servers** — no backend, no database, and no account API; optional OCR/PDF runtime assets load from a CDN on first use.
- **Encrypted local autosave** — every change is automatically saved to your browser's storage, encrypted with AES-256-GCM. The key is generated on-device and never leaves the browser. Autosave can be paused from the header for an ephemeral, nothing-written session.
- **Encrypted export** — Export is the manual save: it produces a `.zip` containing your encrypted ledger plus the key to decrypt it. Import reads the zip (or the two files separately).
- **Receipt scanning** — client-side OCR (PP-OCRv5 / ONNX Runtime Web); receipt contents never leave your device.
- **Cross-platform** — responsive layout with desktop save-picker and mobile share fallbacks.

## How it works

OpenExpense is ES modules under `src/`, bundled into `app.js` plus hashed
`chunk-*.js` files that `index.html` loads. There's no build step on GitHub
Pages — commit the rebuilt generated assets after source changes. The
`prebuild` script removes stale generated bundles before esbuild runs.

```
src/
├── config.js          # CONFIG, OCR_CONFIG, DAYS, STORAGE_KEYS, THEMES
├── main.js            # Bootstrap + store subscription
├── core/
│   ├── store.js       # Central state: getState(), patch(), subscribe()
│   ├── persist.js     # Encrypted IndexedDB auto-save/load
│   ├── crypto.js      # AES-256-GCM device key (at rest)
│   ├── bundle.js      # Encrypted .zip export/import
│   └── utils.js       # Platform/profile helpers + shared formatting
├── ui/                # components, theme, toast
├── features/          # calendar, ledger (autosave + export/import), modal, receipt, sidebar
└── app/               # render orchestration, view switching
app.js, chunk-*.js     # Generated deployment bundle (rebuild with `npm run build`)
docs/ocr-platform.md   # OCR dependencies, code tags, and platform policy
```

UI actions call `patch()` on the store; a subscriber re-renders and `persist.js` saves (encrypted, debounced) to IndexedDB.

## Receipt OCR platform

Receipt scanning lives in `src/features/receipt.js` and is configured from
`OCR_CONFIG` in `src/config.js`. The scanner lazy-loads `ppu-paddle-ocr`
6.1.0, `onnxruntime-web` 1.27.0, `ppu-ocv` 4.0.0, and PDF.js 6.1.200 only
when a scan needs them. `Utils.deviceProfile()` chooses mobile/default/desktop
canvas budgets so phones avoid memory spikes while capable desktop browsers can
use sharper OCR inputs.

Generated OCR UI uses readable debugging tags such as
`data-code-tag="oe-ocr:review"` and `data-ocr-action="save-scan"`. See
[`docs/ocr-platform.md`](docs/ocr-platform.md) for the dependency table,
import-map sync notes, and privacy boundaries.

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
