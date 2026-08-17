# [openexpense.org](https://www.openexpense.org)

**A privacy-first, offline-only expense tracker. Your data never leaves your browser.**

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)
[![Version](https://img.shields.io/badge/Version-2.1.0-blue)](src/config.js)

OpenExpense is a static web app. There is no backend, no account, and no analytics. The ledger lives encrypted in this browser’s IndexedDB. Export writes an encrypted zip you can keep or move yourself.

## What’s new

**17 August 2026** — Recurring series removal, better on-device receipt reading, “You own your data” / “File loaded” status pills, and a documented public repo.

- Read the notes: **[CHANGELOG.md](CHANGELOG.md)**
- In the app: **Privacy & Help → Updates**
- Related PRs: [#67](https://github.com/ghadow1/openexpense.org/pull/67), [#83](https://github.com/ghadow1/openexpense.org/pull/83)

## Quick start

```bash
npm install
npm run serve
```

Open [http://localhost:8765](http://localhost:8765). Use the local server — do not open `index.html` as a `file://` page. Encryption needs a [secure context](https://developer.mozilla.org/en-US/docs/Web/Security/Secure_Contexts) (`https:` or `localhost`).

After you edit anything under `src/`:

```bash
npm run build
```

GitHub Pages serves the committed `app.js` and `chunk-*.js` files. There is no CI build step, so rebuild and commit those bundles with your source change.

## Features

- **Zero servers** — no API, no database you do not control, no third-party ledger calls.
- **Encrypted local autosave** — AES-256-GCM in IndexedDB. The key is generated on this device and is non-extractable. Pause autosave from the header for an in-memory-only session.
- **Encrypted export** — a `.zip` with ciphertext plus the key file. Import accepts the zip, the two files separately, or a legacy plaintext `.json`.
- **Receipt scanning** — PP-OCRv5 and PDF text run in the browser. Images never leave the device.
- **Recurring series** — same-title payments group in the day editor; you can remove every copy at once.
- **Monthly summary PDF** — generated locally with jsPDF.

## Repository map

```
CHANGELOG.md           # User-facing update notes (also Privacy & Help → Updates)
src/                   # Application source (edit here)
  main.js              # Bootstrap
  config.js            # Version, preference keys, theme tokens
  app/                 # Render loop and the two top-level views
  core/                # Store, persist, crypto, export zip, summary, series
  features/            # Calendar, day editor, ledger files, receipts, sidebar
  ui/                  # Buttons, theme, toasts, confirm dialog
docs/                  # Architecture, data format, sample ledger
index.html             # Shell: header, two views, welcome, day modal
openexpense.css        # Design tokens and layout
app.js + chunk-*.js    # esbuild output for GitHub Pages — do not edit by hand
icons/                 # Graphic mark (no wordmark in the header)
```

A file-by-file guide lives in [`src/README.md`](src/README.md). How data moves through the app is in [`docs/ARCHITECTURE.md`](docs/ARCHITECTURE.md).

## Data format

Dates are `YYYY-MM-DD` keys. Each day is an array of expenses:

```json
{
  "name": "Home ledger",
  "events": {
    "2026-06-03": [
      { "title": "Transit pass", "price": 49.99, "recurring": true, "paid": true, "note": "" }
    ]
  }
}
```

Full field notes and the encrypted zip layout are in [`docs/DATA-FORMAT.md`](docs/DATA-FORMAT.md). A fictional import file is in [`docs/examples/sample-ledger.json`](docs/examples/sample-ledger.json).

## Encryption and storage

| What | Where | Encrypted |
| --- | --- | --- |
| Ledger name and expenses | IndexedDB `openexpense` | AES-256-GCM when Web Crypto is available |
| Device key | IndexedDB `meta` store | Non-extractable `CryptoKey` |
| Theme, autosave on/off, first-visit | `localStorage` | No — these are UI prefs only |
| Manual backup | `.zip` you download | Yes — `ledger.enc.json` + `ledger.key.json` |

Anyone who has **both** zip members can decrypt that backup. Store them separately if the ledger is sensitive.

OCR models and fonts load from jsDelivr on first use. That traffic is engine files, not your expenses. See [`docs/DEPENDENCIES.md`](docs/DEPENDENCIES.md).

## Contributing

Please read [`CONTRIBUTING.md`](CONTRIBUTING.md) before opening a pull request.

- Keep the app offline-only. Do not add a backend or phone-home.
- Do not change `#view-app` / `#view-docs` navigation or encryption behavior without discussion.
- Rebuild `app.js` after `src/` edits.

Security reports: [`SECURITY.md`](SECURITY.md). Conduct: [`CODE_OF_CONDUCT.md`](CODE_OF_CONDUCT.md).

## License

[MIT](LICENSE) © 2026 ghadow
