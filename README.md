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

# Rebuild generated deployment assets after editing anything in src/
npm run build

# Run the available project checks
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

OpenExpense is ES modules under `src/`, bundled into root deployment assets that `index.html` loads. There is no build step on GitHub Pages, so source changes must be followed by `npm run build` and the rebuilt `app.js` plus current `chunk-*.js` files must be committed. The `prebuild` script removes old generated hashes before esbuild emits the fresh bundle.

```
src/
├── config.js          # App metadata, themes, OCR_CONFIG, PLATFORM_CONFIG
├── main.js            # Bootstrap, event delegation, render scheduling
├── core/
│   ├── store.js       # Central state: getState(), patch(), subscribe()
│   ├── persist.js     # Encrypted IndexedDB auto-save/load
│   ├── crypto.js      # AES-256-GCM device key (at rest)
│   ├── bundle.js      # Encrypted .zip export/import
│   ├── summary.js     # Monthly/yearly spending rollups
│   ├── summary-pdf.js # Spending report PDF export
│   ├── pdf-theme.js   # PDF palette/typography helpers
│   └── utils.js       # Shared formatting, platform, filename helpers
├── ui/                # components, confirm dialogs, theme, toast
├── features/          # calendar, ledger (autosave + export/import), modal, receipt, sidebar
└── app/               # render orchestration, view switching
app.js                 # Bundled entry (generated)
chunk-*.js             # Split vendor/feature chunks (generated)
scripts/clean-build-assets.mjs # Deletes stale generated JS before build
```

UI actions call `patch()` on the store; a subscriber re-renders and `persist.js` saves (encrypted, debounced) to IndexedDB.

## Receipt OCR architecture

Receipt scanning is local-first and centered in `src/features/receipt.js`.

- `OCR_CONFIG` in `src/config.js` is the source of truth for OCR CDN pins, PDF.js pins, recognition strategy, confidence thresholds, and canvas raster limits.
- `index.html` contains the import map for `ppu-paddle-ocr` peer dependencies. Keep it in sync with `OCR_CONFIG.dependencies.peerImportMap`.
- `Receipt.pickImage()` asks mobile/tablet browsers for the rear camera (`capture="environment"`) and lets desktop browsers use the standard file picker.
- PDFs are parsed for embedded text with PDF.js first. OCR only runs when a PDF has too little extracted text.
- Photos prefer `createImageBitmap()` for modern browser decoding and fall back to `Image` object URLs.
- Images are resized before OCR: mobile uses a smaller max longest side to reduce memory pressure, while desktop keeps a larger max side for detail. Both values live in `OCR_CONFIG.raster`.
- `Utils.shouldWarmOcr()` allows idle OCR warmup on capable devices but skips eager model downloads when the browser reports data-saver mode or very low memory.

## Cross-platform performance knobs

Shared responsive and OCR constants live in `src/config.js`:

- `PLATFORM_CONFIG.breakpoints` defines phone/tablet media-query cutoffs used by `Utils` and calendar density.
- `PLATFORM_CONFIG.calendarDensity` defines the calendar layout bands (`mobile`, `compact`, `narrow`, `tablet`, `desktop`).
- `OCR_CONFIG.raster` defines PDF render scale, preview quality, and mobile/desktop OCR canvas limits.
- `OCR_CONFIG.thresholds` defines when extracted PDF text is sufficient and when OCR confidence should be marked low.

Keep CSS breakpoints in `openexpense.css` aligned with `PLATFORM_CONFIG` when changing layout behavior.

## Human-readable code tags

The app uses small, readable DOM tags instead of a framework router:

- `data-action` is for global delegated actions handled in `src/main.js`.
- `data-view` switches between app/docs views.
- `data-tab` switches documentation tabs.
- `data-act` is reserved for controls inside generated local fragments, such as the OCR review sheet in `src/features/receipt.js`.
- Feature-scoped CSS prefixes (`ocr-*`, `cal-*`, `docs-*`, `summary-*`) make generated markup easy to trace back to its source module.

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
