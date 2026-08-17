# Changelog

User-facing notes for [openexpense.org](https://www.openexpense.org). Newest first.

The app stays offline-only. Your ledger still never leaves this browser.

Full source history: [compare `main`…this branch](https://github.com/ghadow1/openexpense.org/compare/main...cursor/modern-design-system-25ec). Pull request: [#83](https://github.com/ghadow1/openexpense.org/pull/83).

## 2026-08-17 — Design, receipts, and public docs

Shipped on branch `cursor/modern-design-system-25ec` (PR [#83](https://github.com/ghadow1/openexpense.org/pull/83)).

### For people using the app

- **Look and feel** — Shared light/dark tokens, glass-lite surfaces, and larger tap targets on phones. Same two screens: Expenses and Privacy & Help.
- **Recurring payments** — Same-title charges group on a day (`Coffee ×2`). Recurring rows show a series badge. When you delete one, you can check **Remove all recurring copies of this payment**.
- **Receipts** — Paper photos, screenshots, and PDF invoices. The reader cleans contrast, runs more than one OCR pass, and prefers a labeled total (not the largest number on the page). You still confirm before anything is saved.
- **Header mark** — Graphic card icon only. The “OpenExpense.org” wordmark is gone; the header still has an accessible name.
- **Status pills** next to the ledger name:
  - **You own your data** — green when this browser can encrypt and autosave is on.
  - **File loaded** (green) or **Not loaded** (red) — whether a named ledger or any expenses are present.
- **Privacy & Help → Updates** — this same list, inside the app.

### For people reading the repo

- Map of the source tree: [`src/README.md`](src/README.md)
- How boot, state, and encryption fit: [`docs/ARCHITECTURE.md`](docs/ARCHITECTURE.md)
- Ledger JSON and backup zip: [`docs/DATA-FORMAT.md`](docs/DATA-FORMAT.md)
- CDN vs bundled libraries: [`docs/DEPENDENCIES.md`](docs/DEPENDENCIES.md)
- How to contribute: [`CONTRIBUTING.md`](CONTRIBUTING.md)
- Vulnerability reports: [`SECURITY.md`](SECURITY.md)
- Sample import (fictional): [`docs/examples/sample-ledger.json`](docs/examples/sample-ledger.json)

Unused sample files (`ledger.json`, `avatar.jpeg`, `test-receipt.png`) were removed so a real ledger is not sitting in the public tree.

### Commit references

| Commit | What it did |
| --- | --- |
| [`01322af`](https://github.com/ghadow1/openexpense.org/commit/01322af) | 2027 glass-lite design system (tokens, buttons, motion) |
| [`f45f9ee`](https://github.com/ghadow1/openexpense.org/commit/f45f9ee) | Recurring series grouping and remove-all |
| [`9fc3b2b`](https://github.com/ghadow1/openexpense.org/commit/9fc3b2b) | Receipt parser, card mark, mobile chrome |
| [`3f05369`](https://github.com/ghadow1/openexpense.org/commit/3f05369) | Privacy pill: “You own your data” |
| [`e298f67`](https://github.com/ghadow1/openexpense.org/commit/e298f67) | File loaded / Not loaded pill |
| [`4b467e4`](https://github.com/ghadow1/openexpense.org/commit/4b467e4) | Module labels, OSS docs, dead-code sweep |

## 2.1.0

Baseline on `main` before this work: encrypted IndexedDB autosave, encrypted zip export, calendar ledger, monthly summary PDF, and client-side receipt scan.
