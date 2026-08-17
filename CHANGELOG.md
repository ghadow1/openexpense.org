# Changelog

User-facing notes for [openexpense.org](https://www.openexpense.org). Newest first.

The app stays offline-only. Your ledger still never leaves this browser.

These notes describe what is on `main` (the site at [openexpense.org](https://www.openexpense.org)). Earlier design and grouping work landed in pull requests [#67](https://github.com/ghadow1/openexpense.org/pull/67) and [#83](https://github.com/ghadow1/openexpense.org/pull/83). The follow-up commits below (receipts, status pills, public docs) are the rest of that same update.

## 2026-08-17 — Crisp navy and white

The expense screen is a flat navy-and-white canvas: 2px corners, 1px borders, no drop shadows, and a tight calendar grid. Add / Scan / Export are square buttons, not pills.

## 2026-08-17 — Quick actions

Add, Scan, and Export sit under the snapshot chips as labeled buttons with the same icons as the rest of the app. The navy header, blue accent, and white cards are the live look.

## 2026-08-17 — Dashboard layout

Wide screens use a three-column wallet: quick tools, calendar, monthly card. Snapshot chips show year balance, month cashflow, and monthly average from the ledger you already have. Same two screens, same encrypted files.

## 2026-08-17 — Navy and white theme

Light mode is a blue-and-white canvas: navy header, blue actions, white cards, charcoal type. Dark mode is a matching charcoal-navy palette. Same screens and the same ledger — only the look changed.

## 2026-08-17 — Mobile day sheet

The day pop-out is a bottom sheet on phones: it snaps in place, swipe-down closes it, and the page behind it no longer rubber-bands. Opening a field no longer zooms Safari (16px inputs, no autofocus on phones). The sheet shows that day’s spent vs income with the same up/down money graph as the calendar, plus OpenExpense.org on the header.

## 2026-08-17 — Brochure monthly PDF

The sidebar PDF is a letter-size OpenExpense.org report for the month on screen: branded cover with the same KPIs and insights, a daily calendar and merchant-share breakdown, then the pending/paid register. Spending and income faces each export their own report. Month labels stay in Latin text so they no longer render as garbled characters.

## 2026-08-17 — Daily totals on the calendar

Days with items show that day’s total in the top-right: red with a down spark for spending, green with an up spark for income.

## 2026-08-17 — Weekly recurring

Recurring expenses and income can now be **weekly**, as well as monthly, every 2 months, or quarterly. Weekly copies land on the same weekday for about a year.

## 2026-08-17 — OpenExpense folder storage

Export defaults to an **OpenExpense** folder. Chromium can create and remember that folder (Documents). iPhone and Android share both files in one sheet so you can Save to Files → OpenExpense. Long-press Export to pick a different folder. Import accepts the ledger and key.json together. The portable key is still only in key.json — the remembered folder handle is not a decryption key.

## 2026-08-17 — Square controls

The header mark, GitHub / autosave / theme buttons, calendar arrows, toolbar actions, close buttons, and other icon chrome now share one 40×40 square. Labeled form buttons keep their width and use the same height.

## 2026-08-17 — SEO, branding, and trust

Search and social cards describe OpenExpense as an open-source expense ledger and mobile-friendly wallet. The header lockup, welcome trust row, and ledger status line make local-only security easier to see. Layout containers are unchanged. GitHub Pages now ships `robots.txt`, `sitemap.xml`, and a complete Open Graph / JSON-LD head.

## 2026-08-17 — Encrypted ledger.json + key.json

Export saves one encrypted JSON (expenses and income together) and a sibling `key.json`. Opening the ledger asks for that key. The portable key is never stored in the browser — only in the download. Autosave still encrypts a local copy with a separate, non-extractable device key. The same quality-control path sanitizes imports, IndexedDB load, and autosave.

## 2026-08-17 — Income tracking

The calendar still shows every day. Income and expenses both appear, with income in green. A switch on the right-hand card flips it like a coin between **Monthly spending** and **Monthly income**. New entries can be saved as either type from the day editor.

## 2026-08-17 — Recurring cadence

Recurring payments can be **weekly**, **monthly**, **every 2 months**, or **quarterly**. Checking Recurring opens a How often? prompt. Weekly copies keep the weekday; the others keep the calendar day. Ledgers that never stored a cadence keep the old monthly behavior.

## 2026-08-17 — Design, receipts, and public docs

On `main`. Related PRs: [#67](https://github.com/ghadow1/openexpense.org/pull/67), [#83](https://github.com/ghadow1/openexpense.org/pull/83).

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
| [`802696c`](https://github.com/ghadow1/openexpense.org/commit/802696c) | CHANGELOG.md and Privacy & Help → Updates |

## 2.1.0

Baseline on `main` before this work: encrypted IndexedDB autosave, encrypted zip export, calendar ledger, monthly summary PDF, and client-side receipt scan.
