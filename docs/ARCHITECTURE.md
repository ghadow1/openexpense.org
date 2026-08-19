# Architecture

OpenExpense is a single-page static app. The browser is the runtime. There is no API.

Editor contract (what not to rename, tab × frame matrix, class prefixes): [`CODEMAP.md`](CODEMAP.md).

```
index.html          two mains + four tabs + shared ledger board + day modal
        │
        ▼
src/main.js         boot, event delegation, render subscription
        │
        ├─► core/store.js      getState / patch / subscribe
        ├─► core/persist.js    encrypted IndexedDB (debounced)
        ├─► ui/frame.js        phone / tablet / desktop snap (data-frame)
        ├─► app/render.js      theme, calendar, overview/planner, sidebar
        ├─► app/views.js       Overview / Tracker / Planner / Privacy (data-shell)
        └─► features/*         calendar, modal, ledger, receipt, sidebar
```

## Boot

1. `index.html` loads design CSS, icon/font CDNs, and the bundled `app.js`.
2. `main.js` reads theme and autosave prefs from `localStorage`.
3. `loadLedger()` decrypts the IndexedDB record (if any) into `{ name, events, budgets, plan }`.
4. `patch()` fills the store; `initPersist()` starts watching for later writes.
5. Clicks on `[data-action]`, `[data-view]`, and `[data-tab]` are delegated from `document`.

## State

`src/core/store.js` holds:

| Field | Role |
| --- | --- |
| `events` | `{ "YYYY-MM-DD": Expense[] }` |
| `budgets` | Monthly category caps |
| `plan` | Weekly savings and left-to-spend rules |
| `ledgerName` | Display / export name |
| `currentDate` | Visible month |
| `isDark` | Theme |
| `autosaveEnabled` | Whether persist writes |
| `storageEncrypted` | Web Crypto available |
| `selectedKey` | Open day (`YYYY-MM-DD`) or `null` |
| `editingIndex` | Row being edited in that day |
| `ledgerFace` | Expense or income register face |
| `trackerFilter` | Calendar + toolbar filter: `all`, `expense`, or `income` |
| `shellTab` | Active bottom tab: `overview`, `tracker`, `planner`, or `privacy` |

`patch(partial)` merges fields and notifies subscribers. The render loop in `main.js` coalesces those notifications into one animation frame.

## Persistence

- **Autosave** (`persist.js` + `crypto.js`): sanitize then encrypt `{ name, events, budgets, plan }` (expenses and income together) with a **non-extractable** device AES-GCM key in IndexedDB. That key is not `key.json` and cannot be exported as JWK.
- **Export** (`bundle.js` + `ledger.js` + `ledger-file.js` + `folder.js`): new portable key per save. A linked-folder save verifies the existing pair, stages and verifies a complete recovery pair, updates both destinations, then removes recovery files. Otherwise one share sheet (iPhone / Android) or dated downloads. The folder handle may be remembered in IndexedDB `meta` — that is not `key.json`. The JWK is not cached. Mutating actions share one in-flight lock (`action-lock.js`). Unknown URLs serve `404.html`.
- **Import / QC**: encrypted JSON (then a key picker), the two files in either order, legacy zip, or confirmed plaintext. `ledger-file.js` validates, decrypts, sanitizes, and is reused on boot.

`localStorage` never holds expenses or keys. It only stores `oe-theme`, `oe-autosave`, `hasVisited`, the expense/income sidebar face, `oe-shell-tab`, `oe-tracker-filter`, the export-passphrase choice, and a leftover `oe-dash-view` used only to migrate an old Planner/Overview pill.

## UI layers

| Layer | Job |
| --- | --- |
| `ui/` | Theme tokens on `:root`, buttons/inputs, toasts, confirm dialog |
| `features/calendar.js` | Month grid; same-title pills collapse (`Coffee ×2`); gray/red week rails from over-daily-safe days |
| `features/modal.js` | Day editor; Change All; group / ungroup; recurring delete |
| `features/search-panel.js` | Ledger search (`group:`, `tag:` / `cat:`, amounts, `is:`) |
| `features/sidebar.js` | Month math + statement PDF; click a group or category to search |
| `features/receipt.js` | On-device OCR / PDF, then `receipt-parse.js` |
| `app/render.js` | When to repaint, plus the “You own your data” / “File loaded” chips |

## Recurring series

`src/core/series.js` treats two entries as the same series when both are `recurring`, they share `kind` (expense vs income), their titles match after trim + lower-case, and they share the same `repeat` cadence (`weekly`, `monthly`, `bimonthly`, or `quarterly`; missing means monthly). Blank or leftover placeholder titles never join a series. The day editor copies about a year of future dates at that step (52 weeks, or 12 months at the monthly step) and can remove every occurrence across the ledger. Date and cadence can still shift the series; name and amount stay on the edited row unless **Change all** confirms other rows that share both.

The right-hand card flips between an expense face and an income face when the Tracker filter is Expenses or Income. The calendar stays one grid. Professional paints income in the same blue as the accent; Black Card keeps income white.

Snapshot and sidebar charts plot one period total on a small ring and a year spark with three points: the start, the month being viewed, and the end. Anchoring on the viewed month is what keeps the headline figure and the line talking about the same period. Future-dated recurring copies still count in month totals.

The bottom bar has four tabs. `#view-app` holds Overview, Tracker, and Planner. Privacy is `#view-docs`. The calendar and monthly spending register live in a shared `.ledger-stage` (not a `[data-shell]` pane). **Tab** CSS (`html[data-shell]`) decides what that board shows, on every frame:

- **Overview** — Left to spend (desktop: compact strip) + calendar. No filter bar, no monthly spending card.
- **Tracker** — Filter + Monthly spending. No calendar.
- **Planner** — planner form only; the shared board is hidden.

Defaults keep the original cash line: deposited income minus every logged bill, with nothing withheld. Planner leftover ÷ remaining days lives in `src/core/plan.js` (`computePlanner`). The sidebar keeps its totals, paid vs pending, and stat grid on screen — only the long lists (categories, groups, budgets, merchants, entries) fold.

## Labels, groups, and Change All

`src/core/labeling.js` finds **twins**: other entries that share both the same folded title and the same dollar amount. Editing a name or price asks **Change all** only when twins exist. Cancel aborts the save. Blank titles, `Untitled`, and leftover form placeholders never match.

`src/core/categories.js` stores one category string per entry (max 40). The form is a type-to-tag field: suggestions come from used labels and the built-in set; Enter creates a new tag. `tag:` and `category:` are the same search key as `cat:`. `cat:food` also matches every built-in tag in that family (Groceries, Dining, Coffee).

`src/core/groups.js` and `day-entries.js` own user groups. Select several day-sheet rows or drop one row onto another to assign a group; a dialog names a new group or confirms joining one that already exists. Editing the group on one member asks whether to move only that entry or rename/ungroup every member (Finder / Photos style). Bulk Ungroup confirms; a single unlink does not. Price, date, title, category, paid, and recurring stay put.

Adding or turning on recurring asks before copies are seeded. Changing a series date or cadence asks before every copy moves. A one-off delete stays instant with Undo, matching Gmail / Linear. Name+amount twins still use **Change all**.

## Search

`src/core/search.js` is a small filter language over the whole ledger. `/` or Ctrl/Cmd+K opens `features/search-panel.js`.

| Token | Meaning |
| --- | --- |
| `coffee` | Free text over title, note, category, and group |
| `group:bella` / `grp:` | User group. A space after the colon is part of the name (`group: Rome trip`) |
| `cat:groceries` / `tag:` / `category:` | Category tag |
| `is:unpaid` | `paid`, `unpaid`, `income`, `expense`, `recurring`, `once` |
| `>50` `<100` | Amount bounds |
| `2026-08` | Year, month, or exact day |

Typing a key alone (`group:`, `tag:`) offers matching names instead of “No matches.” Click a sidebar group or category row to open that search. Hits show both the category tag and the group badge.

## Receipts

`receipt.js` lazy-loads PP-OCRv5 (and pdf.js for PDFs) from jsDelivr. Images are oriented and contrast-enhanced in a canvas, recognized locally, then parsed. `saveExpense()` writes the result like a manual add.

## Build

```
npx esbuild src/main.js --bundle --format=esm --minify --splitting --outdir=.
```

Output names: `app.js`, `chunk-[hash].js`. Pages has no build job — commit the new files and delete stale chunks that `app.js` no longer imports.

`npm run build` also writes `sitemap.xml` (static, GitHub Pages). Crawlers read `index.html` directly: Privacy & Help copy is in the first HTML response, so no SSR is required.

SEO metadata (Open Graph, Twitter, JSON-LD) lives in `index.html` and is documented in [`SEO-HEAD.html`](SEO-HEAD.html).

## What not to add

- A server, database, or auth provider
- A router or extra primary tabs beyond Overview / Tracker / Planner / Privacy
- Analytics or error-reporting that uploads ledger text
- Hand-edited bundles
