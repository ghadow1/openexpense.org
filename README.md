# [https://www.openexpense.org](https://www.openexpense.org)

**A privacy-first, offline-only financial management tool.**

![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)
![Status: Active](https://img.shields.io/badge/Status-Active-brightgreen)
![Version](https://img.shields.io/badge/Version-2.0.0-blue)

## Overview
**OpenExpense** is a lightweight, local-first expense tracker designed for those who value data sovereignty. Unlike standard platforms that rely on cloud synchronization and data mining, OpenExpense runs entirely on your local machine. Your financial history never leaves your browser.

![Alt Text](https://i.ibb.co/35rj0v7b/Screenshot-2026-06-03-at-4-46-03-PM.png)

## Features
* **Zero-Server Architecture:** No backend, no databases, and no API calls to third-party servers.
* **Privacy by Design:** Your data resides strictly in your browser. It is immune to data breaches or corporate profiling.
* **Open Source:** Full transparency. Audit the code and modify it to suit your needs.
* **Local Persistence:** Ledger data auto-saves to IndexedDB; export/import JSON for backups and device transfer.
* **Receipt Scanning:** Client-side OCR (PP-OCRv5) runs entirely in the browser — images never leave your device.

## Architecture (v2.0.0)

OpenExpense v2.0.0 uses ES modules under `src/`. The site loads a single bundled `app.js` (no runtime build step on GitHub Pages).

```
src/                    # Source modules (edit these)
├── config.js           # CONFIG, DAYS, STORAGE_KEYS, THEMES
├── main.js             # Bootstrap, event delegation, store subscription
├── core/
│   ├── store.js        # Central state: getState(), patch(), subscribe(), getColors()
│   ├── persist.js      # IndexedDB auto-save/load (openexpense v1)
│   └── utils.js        # Shared helpers
├── ui/
│   ├── components.js   # UI element factory
│   ├── theme.js        # Theme application
│   └── toast.js        # Toast notifications
├── features/
│   ├── calendar.js     # Calendar grid and month navigation
│   ├── ledger.js       # Import/export
│   ├── modal.js        # Expense editor modal
│   ├── receipt.js      # OCR receipt scanning
│   └── sidebar.js      # Monthly summary sidebar
└── app/
    ├── render.js       # Top-level render orchestration
    └── views.js        # App/docs view switching
app.js                  # Bundled entry loaded by index.html
```

After changing files in `src/`, rebuild the bundle:

```bash
npm run build
```

**State flow:** UI actions call `patch()` on the central store. A subscriber in `main.js` re-renders the UI. `initPersist()` hooks the store to debounced IndexedDB saves (400 ms) whenever state changes.

**Entry point:** `index.html` loads `app.js` as `type="module"`. User interactions use `data-action`, `data-view`, and `data-tab` attributes with delegated click handling.

## Data Architecture
OpenExpense uses a dictionary-based structure to map calendar dates to expense records.

```json
{
  "name": "GBA Expenses",
  "events": {
    "2026-06-03": [
      {
        "title": "API Hosting",
        "price": 49.99,
        "recurring": true
      }
    ]
  }
}
```

IndexedDB stores `{ name, events, savedAt }` under database `openexpense` (v1), object store `ledger`, key `current`.
