# [openexpense.org](https://www.openexpense.org)

**A privacy-first, offline-only expense tracker. Your data never leaves your browser.**

![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)
![Version](https://img.shields.io/badge/Version-2.1.0-blue)

## Quick start

```bash
# Install dev tooling for rebuilds
npm ci

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
- **Receipt scanning** — client-side OCR (PP-OCRv5 + ONNX Runtime); images never leave your device.
- **Cross-platform** — responsive layout with desktop save-picker, mobile camera capture, and share/download fallbacks.

## How it works

OpenExpense is ES modules under `src/`, bundled into `app.js` plus code-split `chunk-*.js` files that `index.html` loads. There's no build step on GitHub Pages — commit the rebuilt browser assets.

```
src/
├── config.js          # CONFIG, DAYS, OCR_CONFIG, PLATFORM_CONFIG, STORAGE_KEYS, THEMES
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
app.js, chunk-*.js     # Bundled browser assets (rebuild with `npm run build`)
```

UI actions call `patch()` on the store; a subscriber re-renders and `persist.js` saves (encrypted, debounced) to IndexedDB.

## Receipt OCR architecture

Receipt scanning lives in `src/features/receipt.js` and is tuned by `OCR_CONFIG` in `src/config.js`.

- **Lazy mobile-friendly runtime** — PP-OCRv5, ONNX Runtime, OpenCV canvas helpers, and PDF.js load from jsDelivr only when receipt scanning is used. `index.html` owns the import map for OCR peer dependencies; keep those pins in sync with `OCR_CONFIG.dependencies.peerImportMap`.
- **Fast PDF path** — PDFs are checked for embedded text before OCR. Image-only PDFs render their first page to a bounded canvas and then use OCR.
- **Canvas performance bounds** — receipt images are scaled up enough for OCR quality and capped at a maximum side length so phones, tablets, and desktops avoid runaway memory use.
- **Idle warmup with network respect** — `src/main.js` warms OCR during idle time when the browser is not in data-saver mode or on very slow connections. Manual scanning always loads the engine on demand.
- **Human review required** — OCR suggests merchant, amount, date, tax, and notes; nothing is saved until the user confirms the review sheet.

For deeper implementation notes, see [`docs/OCR-PERFORMANCE.md`](docs/OCR-PERFORMANCE.md).

## Cross-platform behavior and code tags

`PLATFORM_CONFIG` keeps breakpoints and OCR warmup timing in one place. `src/core/utils.js` exposes platform helpers such as `isMobile()`, `prefersCamera()`, `canUseSavePicker()`, and `shouldWarmOcr()`.

Interactive controls should use readable `data-action` tags when they are handled by the global click router in `src/main.js` (for example, `scan-receipt`, `receipt-preview-save`, and `receipt-preview-save-and-scan`). Local component-only events can still use direct listeners when that keeps the code clearer.

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
