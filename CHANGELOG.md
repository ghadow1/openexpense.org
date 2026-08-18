# Changelog

User-facing notes for [openexpense.org](https://www.openexpense.org). Newest first.

The app stays offline-only. Your ledger still never leaves this browser.

These notes describe what is on `main` (the site at [openexpense.org](https://www.openexpense.org)). Earlier design and grouping work landed in pull requests [#67](https://github.com/ghadow1/openexpense.org/pull/67) and [#83](https://github.com/ghadow1/openexpense.org/pull/83). The follow-up commits below (receipts, status pills, public docs) are the rest of that same update.

## 2026-08-18 — Four-tab shell

The app is now Overview, Tracker, Planner, and Privacy on a bottom bar. Overview is the cash snapshot. Tracker is the calendar and month register, with All / Expenses / Income. Planner holds safe-to-spend, tax withhold, savings holds, and 50/30/20. Privacy keeps help plus backup, import, and clear. The calendar is no longer stacked under a second row of tabs.

## 2026-08-18 — Calendar back under the snapshot tabs

The Overview / Income / Expenses / Planner strip no longer stretches to the tallest tab. Hidden slides collapse, and Planner settings fold the same way More figures does, so the calendar sits directly under the strip again.

## 2026-08-18 — One scroll on the phone

On a phone or tablet the monthly spending card sits under the calendar and no longer has its own 72vh scroller. Swiping the page moves the calendar and the statement together.

## 2026-08-18 — Status badges match the action squares

**You own your data** and **File loaded** (and Undo, when it appears) are the same 40px height as Add, Scan, Search, and Export.

## 2026-08-18 — Invoice-style statement PDF

The sidebar PDF is a one-column spending or income statement: letterhead, period and reference, paid vs unpaid (or deposited vs expected), a line-item register, and a totals box. Thin settlement bars and empty months no longer crash the export. The file is still built on this device.

## 2026-08-18 — Calendar week hints

Sunday–Saturday squares get a light wash only — red when the week spends past its leftover share, green when gross income beats the weekly income goal. Pills, amounts, and text stay as they are. The check runs when the calendar loads and when an expense, income, or planner rule changes.

## 2026-08-18 — Planner math

A fourth snapshot tab, **Planner**, sits after Expenses. Left-to-spend is a documented waterfall: counted income, minus a tax withhold, minus a savings hold (weekly month-equivalent + monthly dollars + percent of after-tax), minus counted spend. Defaults stay the original cash line. The tab also scores the CFPB 50/30/20 split, daily safe spend (leftover ÷ remaining days), days of cash (cash ÷ daily burn), unpaid recurring bills, and this month’s week-by-week pace. Category caps are unchanged. The plan is saved with the ledger.

## 2026-08-18 — Budgeting settings

A fourth snapshot tab, **Budget**, sits after Expenses. Set a weekly savings amount and the rules Overview uses: whether unpaid bills count, whether undeposited income counts, and whether the month’s share of that weekly target is held out of left-to-spend. Defaults stay the original cash line. The plan is saved with the ledger, the same way category caps already are.

## 2026-08-18 — Month figures back on screen, wider dash

The sidebar had folded every total away, so a month that added up looked like one that had not. Totals, paid vs pending, and the stat grid are visible again, and the exact total sits beside the rounded ring; only the long lists fold. The dash card fills its column, and a wide screen also shows the split as bars beside the dial. Year charts label the month you are viewing, so the headline figure is a point on the line. Calendar rows are shorter so a whole month fits.

## 2026-08-18 — Confirm this item vs the group or series

Grouping now asks before joining or naming a set. Editing a grouped entry’s group asks whether to move only that row or rename/ungroup every member. Scheduling copies, and shifting a series date or cadence, ask first. Bulk Ungroup confirms; a single unlink and a one-off delete stay instant (delete still has Undo).

## 2026-08-18 — Day list spacer

The empty multi-select bar no longer sits under **This day**, so the heading and first entry share one line instead of two.

## 2026-08-18 — Full-width day net card

The day sheet’s net dial now spans the sheet. Previous / next sit in their own squares and leave a reserved slot for Close, so they no longer crowd the X.

## 2026-08-18 — Compact banking dials

Snapshot, sidebar, and the day sheet now lead with one small blue ring for the period total. The year plot keeps only the start, one peak or valley, and the end, with short `$5k` / `$10k` axis labels. Extra figures and form fields sit in a fold so a single card never fills the screen. Professional income chips use the same blue as the rest of the palette. Future-dated copies still count in the month math.

## 2026-08-18 — Docs for search, tags, and groups

README, architecture, data format, the source map, embed notes, and Privacy & Help now describe Change All, category tags, day-sheet groups, and the search keys (`group:`, `tag:`, `cat:`).

## 2026-08-18 — Search keys for groups and category tags

`group:` now keeps the name after a space (`group: Rome trip`) instead of dropping it. `tag:` and `category:` mean the same as `cat:`. Typing a key alone offers matching groups or tags rather than “No matches.” Search hits show the group badge, and a sidebar group or category opens that search.

## 2026-08-18 — Change All, category tags, and ungroup

Editing a name or amount no longer rewrites every look-alike on its own. A **Change all** dialog appears only when another entry shares both the same text and the same dollar amount; otherwise the edit stays on that row. Blank titles and leftover form placeholders never match as a pack. Category is a type-to-tag field: suggestions come from what you have used, and Enter creates a new tag. On the day sheet, select several rows or drop one onto another to group them, and **Ungroup** removes a row from a group without touching its price, date, or label.

## 2026-08-17 — Product brochure

A six-page A4 landscape marketing brochure lives in `docs/brochure/`. Print `openexpense-brochure.html` or open `openexpense-brochure.pdf`. Navy tokens, Inter, and live product copy. No change to the app UI.

## 2026-08-17 — Embeddable host engine

Banking hosts can map prefetched transactions through `/engine.js` or `window.OpenExpense` and optionally iframe `/embed.html`. The current theme and pages stay the same. OpenExpense still does not call bank APIs.

## 2026-08-17 — Snapshot math and three dashboard views

The top snapshot now slides between Overview, Income, and Expenses. Unpaid paychecks appear on Income as Still expected; Overview’s Unpaid bills stays expense-only. Totals add in cents, monthly average uses each month’s net, and estimated month totals no longer double-count future calendar copies.

## 2026-08-17 — Security hardening and audit

Encrypted autosave now fails closed, serializes writes, atomically creates its device key, and preserves unreadable ciphertext. Clear durably removes ciphertext and its key. Linked-folder saves verify existing files and stage a recovery pair before overwrite. Imports and receipt/PDF processing have strict resource limits. OCR/PDF runtimes, models, fonts, and icons are now self-hosted. The repository adds security CI, dependency monitoring, a threat model, incident guidance, a security audit, and a SOC 2 readiness gap assessment.

## 2026-08-17 — User-friendly dashboard groups

The top blocks are now grouped as **Account overview** and **Upcoming & savings**, with a one-line explanation for each group. Labels use plain language: Available funds, Scheduled income, Month net, Due next 7 days, Unpaid this month, and Income left. The sidebar follows the same pattern with “This month at a glance,” “Where your money went,” and “Year at a glance.”

## 2026-08-17 — Sidebar chart and mobile chrome

The year overview is a labeled 12-month column chart. Paid vs pending is a two-block track. Insight cards match the green snapshot blocks. Calendar toolbar icons share one square style (clear only turns red on hover). On a phone, Saved spans the full second row.

## 2026-08-17 — Snapshot bar uses one family of blocks

Due soon, left to pay, and saved now use the same green-block cards as current funds and cashflow — equal width on the second row, not skinny red pills. Amounts still due stay navy; only a negative net uses the red figure.

## 2026-08-17 — Smart day entries, drag-reorder, and move

The day sheet now lists entries in the order you stored them. Drag the handle (or use the arrow keys on it) to reorder. On the month grid, drag a chip onto another day to move that copy — a recurring series stays put except for the day you moved. Recent titles appear as chips and fill the last amount. Each row can mark paid, duplicate as a one-off, edit, or delete. Previous / next day arrows sit on the sheet title. Delete still offers Undo next to File loaded.

## 2026-08-17 — Undo a delete for a few seconds

After you remove an entry, a weekday of copies, a whole series, or clear the calendar, **Undo** appears next to **File loaded** for about ten seconds. It also shows on the open day sheet. One level only; the snapshot stays in memory and is never written to this browser.

## 2026-08-17 — Delete this weekday or the whole series

Removing a recurring entry now asks whether to delete only this day, every copy on that weekday (all Saturdays), or the entire series. “Every Saturday” no longer wipes Monday or Friday copies.

## 2.2.0 — 2026-08-17 — Navy social cards and SEO

Search titles, Open Graph / Twitter cards, the PWA manifest, and the home-screen icon now use the live navy `#002244` and accent `#1170cf`. The preview image shows current funds, projected income, and cashflow on a white canvas — not the old purple lock art. The in-app theme is unchanged.

## 2026-08-17 — Current funds and projected income

The snapshot row now leads with **Current funds** — paid income minus paid spend through today. The old year-net Balance chip is **Projected income** for the month on screen. Cashflow and monthly avg stay. Due soon, left to pay, and saved sit under the chips as compact tracking points.

## 2026-08-17 — Edit one recurring copy, update all

Changing the title, date, amount, or cadence on one recurring entry now updates every copy in that series. Paid / received stays on each day. A date change shifts every copy by the same number of days.

## 2026-08-17 — Icon-only action buttons

Add, Scan, and Export under the snapshot chips are the same 40px squares as the header and calendar toolbar. Word labels are gone; hover and assistive names stay. Icon-only factory buttons no longer keep a hidden text span that can overflow the square.

## 2026-08-17 — GitHub icon only

The header GitHub control is the Octocat icon only. The “Source” label is gone so the square matches the disk and theme buttons.

## 2026-08-17 — Tablet and iPad sizing

iPad and tablet widths stack the monthly card under the calendar so chips, actions, and status badges stay on one row. Snapshot amounts compact when they would clip. Calendar cells keep the net up/down mark and drop cramped extra pills.

## 2026-08-17 — Dashboard layout fix

Desktop no longer keeps an empty left column from the old three-column grid. Mini and desktop both use calendar + monthly card, with Add / Scan / Export and the status badges on one toolbar row that wraps cleanly.

## 2026-08-17 — Calendar net up and down

Each day’s corner amount is the **net** for that day (income minus spend). Green up when the day is ahead, red down when it is behind. A day with both kinds no longer shows only the larger side.

## 2026-08-17 — Status on the action row

The ledger name block is gone. **You own your data** and **File loaded** sit on the same row as Add, Scan, and Export, snapped to the right under Monthly avg.

## 2026-08-17 — Save to a linked folder

After you link an OpenExpense folder, Export becomes **Save**. Each tap overwrites the current encrypted JSON and its sibling key in that folder instead of writing a new dated pair. Long-press still picks another folder. One-off downloads keep dated names. Missing URLs show a branded 404. Export, import, clear, and scan ignore a second tap while the first is running.

## 2026-08-17 — Sticky app chrome

The navy header stays put while you scroll. Expenses and Privacy & Help sit in that bar and wrap onto a second row on phones, so the old bottom tab bar is gone. Gutters scale with the viewport. No 100vw full-bleed overflow.

## 2026-08-17 — Crisp navy and white

The expense screen is a flat navy-and-white canvas: 2px corners, 1px borders, no drop shadows, and a tight calendar grid. Add / Scan / Export are square buttons, not pills.

## 2026-08-17 — Quick actions

Add, Scan, and Export sit under the snapshot chips as labeled buttons with the same icons as the rest of the app. The navy header, blue accent, and white cards are the live look.

## 2026-08-17 — Dashboard layout

Wide screens use a two-column wallet: calendar and monthly card. Snapshot chips show year balance, month cashflow, and monthly average from the ledger you already have. Same two screens, same encrypted files.

## 2026-08-17 — Navy and white theme

Light mode is a blue-and-white canvas: navy header, blue actions, white cards, charcoal type. Dark mode is a matching charcoal-navy palette. Same screens and the same ledger — only the look changed.

## 2026-08-17 — Mobile day sheet

The day pop-out is a bottom sheet on phones: it snaps in place, swipe-down closes it, and the page behind it no longer rubber-bands. Opening a field no longer zooms Safari (16px inputs, no autofocus on phones). The sheet shows that day’s spent vs income with the same up/down money graph as the calendar, plus OpenExpense.org on the header.

## 2026-08-17 — Brochure monthly PDF

The sidebar PDF is a letter-size OpenExpense.org report for the month on screen: branded cover with the same KPIs and insights, a daily calendar and merchant-share breakdown, then the pending/paid register. Spending and income faces each export their own report. Month labels stay in Latin text so they no longer render as garbled characters.

## 2026-08-17 — Daily totals on the calendar

Days with items show that day’s net in the top-right: red with a down spark when the day is behind, green with an up spark when it is ahead.

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
