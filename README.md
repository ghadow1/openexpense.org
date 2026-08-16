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

# Rebuild app.js and remove stale generated chunks
npm run build

# Same build command, named for automation/CI-style checks
npm run validate
```

Then open http://localhost:8765 in your browser. (Open it through the server, not by double-clicking `index.html` — encryption needs a secure context.)

## Features

- **Zero servers** — no backend, no database, no third-party calls.
- **Encrypted local autosave** — every change is automatically saved to your browser's storage, encrypted with AES-256-GCM. The key is generated on-device and never leaves the browser. Autosave can be paused from the header for an ephemeral, nothing-written session.
- **Encrypted export** — Export is the manual save: it produces a `.zip` containing your encrypted ledger plus the key to decrypt it. Import reads the zip (or the two files separately).
- **Receipt scanning** — client-side OCR (PP-OCRv5); images and PDFs never leave your device.
- **Cross-platform** — responsive layout with desktop save-picker, mobile camera/share fallbacks, and resource-aware OCR warmup.

## How it works

OpenExpense is ES modules under `src/`, bundled into `app.js` plus hashed chunks that `index.html` loads. There's no build step on GitHub Pages — commit the rebuilt generated assets.

```
src/
├── config.js          # CONFIG, OCR_CONFIG, DAYS, STORAGE_KEYS, THEMES
├── main.js            # Bootstrap, OCR idle warmup, store subscription
├── core/
│   ├── store.js       # Central state: getState(), patch(), subscribe()
│   ├── persist.js     # Encrypted IndexedDB auto-save/load
│   ├── crypto.js      # AES-256-GCM device key (at rest)
│   ├── bundle.js      # Encrypted .zip export/import
│   └── utils.js       # Platform helpers, preview URLs, formatting
├── ui/                # components, theme, toast
├── features/          # calendar, ledger (autosave + export/import), modal, receipt, sidebar
└── app/               # render orchestration, view switching
docs/OCR-PERFORMANCE.md # OCR dependency, tag, and platform guidance
app.js                 # Bundled entry (rebuild with `npm run build`)
chunk-*.js             # Generated split chunks
```

UI actions call `patch()` on the store; a subscriber re-renders and `persist.js` saves (encrypted, debounced) to IndexedDB.

## OCR development notes

OCR dependency URLs and performance thresholds are centralized in `OCR_CONFIG`.
Keep the `index.html` import map in sync with `OCR_CONFIG.dependencies.peerImports`
when upgrading OCR packages. The source uses readable tags such as `@ocr-deps`,
`@ocr-engine`, `@ocr-pipeline`, `@ocr-parse`, `@platform`, and `@perf`; see
[`docs/OCR-PERFORMANCE.md`](docs/OCR-PERFORMANCE.md) for the full tag list and
cross-platform validation checklist.

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
