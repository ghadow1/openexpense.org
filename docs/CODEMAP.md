# Code map for editors

This is the contract for changing OpenExpense without breaking the live site. The product is a static GitHub Pages app. There is no backend.

**Do not change the on-screen layout, tab order, or class names to “clean them up.”** The HTML/CSS class prefixes below are the public UI vocabulary. Rename JavaScript internals if a name is wrong; leave DOM ids, `data-*` hooks, and CSS classes alone unless the change is the feature.

Documentation routes: [`README.md`](README.md). Newcomer lessons:
[`LEARNING-PATH.md`](LEARNING-PATH.md). How data moves:
[`ARCHITECTURE.md`](ARCHITECTURE.md). File-by-file source list:
[`../src/README.md`](../src/README.md). Ledger JSON:
[`DATA-FORMAT.md`](DATA-FORMAT.md).

## What you may rename

| Kind | Rename? | Why |
| --- | --- | --- |
| File-private functions and locals | Yes | They are not a public API |
| JSDoc, comments, `docs/` | Yes | That is this pass |
| Exported JS names used by other `src/` files | Only with a matching import update | Keep the tree compiling |
| `window.OpenExpense` / `engine.js` exports | No without a docs + embed note | Hosts depend on them |
| CSS class names (`ov-hero`, `cal-day`, `tracker-filter`) | **No** | Styles and tests pin them |
| Element ids (`#view-app`, `#sidebar`, `#cal-col`) | **No** | Render and QC pin them |
| `data-action`, `data-view`, `data-shell`, `data-tracker-filter` | **No** | Click delegation in `src/main.js` |
| `localStorage` keys in `STORAGE_KEYS` | **No** | Existing browsers would forget prefs |
| `THEMES.dark` hex values | **No** | `scripts/qc-theme.mjs` requires greyscale |

## Layers

```
index.html                 frozen shell: two mains, four tabs, one board
openexpense.css            tokens + class prefixes (do not invent a fifth prefix)
src/main.js                boot + document click delegation
src/app/                   tab shell + “what to repaint”
src/core/                  math, crypto, files, search — no DOM
src/features/              product surfaces (calendar, day sheet, files, OCR)
src/ui/                    reusable chrome (buttons, theme, frame snap)
src/engine/                headless + embed API (separate bundle: engine.js)
scripts/qc-*.mjs           Node tests over source and committed bundles
app.js + chunk-*.js        esbuild output — never edit by hand
```

## Four tabs × three frames

`html` carries `data-shell` (`overview` \| `tracker` \| `planner` \| `privacy`) and `data-frame` (`phone` \| `tablet` \| `desktop`).

| Tab | Every frame |
| --- | --- |
| **Overview** | Potential Savings (or growth potential when current bank savings is set; desktop uses the compact strip) + month calendar. Hide `.tracker-toolbar` and `#sidebar`. |
| **Tracker** | Filter + add/scan/search/export + Monthly spending. Hide `#cal-col`. |
| **Planner** | Planner form only (`.ledger-stage` is `display: none`) |
| **Privacy** | `#view-docs` (help, backup, import, clear) |

`.ledger-stage` is **not** a `[data-shell]` pane. `applyShell` only toggles `[data-shell]` sections and the two mains. **Tab** CSS (`html[data-shell]`) shows or hides `#cal-col`, `#sidebar`, and `.tracker-toolbar`. Do not scope those hides to `data-frame` — a wrong frame stamp is how the two pages leak back together.

## DOM contract (do not invent new roots)

| Id / hook | Owner | Purpose |
| --- | --- | --- |
| `#view-app` | `app/views.js` | Overview, Tracker, Planner |
| `#view-docs` | `app/views.js` | Privacy & Help |
| `#overview-hero-root` | `features/dash-strip.js` | Potential Savings / compact strip |
| `#overview-more-root` | `features/dash-strip.js` | Off-track goal warning on phone/tablet; empty otherwise |
| `#planner-root` | `features/dash-strip.js` | Planner workspace |
| `[data-plan-pane]` | `features/dash-strip.js` | Quality settings / Banking info |
| `.planner-goal-add` | `features/goals.js` | Only Planner add-goal control; matches the month chip height |
| `[data-goal-id]` | `features/goals.js` | Ordered goal card and drag-priority identity |
| `#tracker-head-root` | `features/dash-strip.js` | Tracker page title on phone/tablet |
| `#cal-col` | `features/calendar.js` | Month grid |
| `.cal-week-net` | `features/calendar.js` | Rotated week net on the left rail |
| `#sidebar` | `features/sidebar.js` | Monthly spending / income register |
| `#modal` | `features/modal.js` | Day editor |
| `.dock-tab[data-view]` | `app/views.js` | Bottom tabs |
| `[data-action]` | `src/main.js` | Export, import, add, scan, search, undo |
| `[data-tracker-filter]` | `src/main.js` | All / Expenses / Income; also sets `ledgerFace` |

## CSS class prefixes (frozen)

| Prefix | Surface | File that paints it |
| --- | --- | --- |
| `ov-` | Overview snapshot (Potential Savings, kickers) | `dash-strip.js` |
| `planner-` | Planner workspace and goals | `dash-strip.js`, `goals.js` |
| `tracker-` | Tracker toolbar and page head | `index.html`, `dash-strip.js` |
| `dash-` | Compact desktop strip, chips, plan fields | `dash-strip.js` |
| `cal-` | Month grid and day cells | `calendar.js` |
| `sidebar-` / `summary-` | Monthly register | `sidebar.js` |
| `oe-` | Shared widgets (card, dial, spark, bars) | `ui/dial-chart.js`, panes |
| `dock-` | Bottom tab bar | `index.html` |
| `docs-` | Privacy chapters | `index.html` |
| `event-` / `form-` / `smart-` | Day editor | `modal.js` |
| `search-` | Search sheet | `search-panel.js` |
| `cat-` / `group-` | Tags and groups | pickers + sidebar |
| `is-` | State only (`is-active`, `is-over-day`) | many |

`html[data-frame]` and `html[data-shell]` are the layout switches. Add new frame rules next to the existing ones in `openexpense.css`; do not introduce a fourth frame without updating `src/ui/frame.js` and the inline stamp in `index.html`.

## Store fields

`src/core/store.js` is the only in-memory source of truth. `patch(partial)` merges and notifies. Persistence writes `{ name, events, budgets, plan, goals }` only.

| Field | Type | Meaning |
| --- | --- | --- |
| `events` | `{ [YYYY-MM-DD]: Entry[] }` | Ledger |
| `budgets` | `{ [category]: number }` | Monthly caps |
| `plan` | Plan object | Withhold / hold / 50-30-20 / weekly pace |
| `goals` | Goal[] | Savings targets ordered by allocation priority |
| `ledgerName` | string | Display and export name |
| `currentDate` | `Date` | Visible month |
| `isDark` | boolean | `true` = Black Card |
| `autosaveEnabled` | boolean | Whether IndexedDB writes |
| `storageEncrypted` | boolean | Web Crypto available |
| `selectedKey` | `YYYY-MM-DD` \| `null` | Open day sheet |
| `editingIndex` | number \| `null` | Row in that day |
| `ledgerFace` | `'expense'` \| `'income'` | Which register face is showing |
| `trackerFilter` | `'all'` \| `'expense'` \| `'income'` | Calendar + toolbar filter |
| `shellTab` | `'overview'` \| `'tracker'` \| `'planner'` \| `'privacy'` | Bottom tab |

`ledgerFace` and `trackerFilter` stay two fields: the calendar can show **all** kinds while the sidebar still shows one face.

## Paint names that look historical

| Name in source | What it actually does |
| --- | --- |
| `renderDashStrip()` | Paints Overview, Tracker page head, Planner, and the filter active state |
| `RENDER_DEPS.dash` | Those same panes (not a fifth tab) |
| `dash-strip.js` | Overview + Planner module (filename kept so imports and QC stay stable) |
| `ledgerFace` | Expense vs income **register**, not the bottom tab |
| `dashView` storage key | Legacy pill; read only to migrate into `shellTab` |

## Render loop

1. `patch()` in `store.js`
2. `main.js` coalesces keys into one animation frame
3. `app/render.js` `shouldRender(surface, keys)` skips surfaces that did not change
4. Surfaces: theme, header toggles, privacy chip, file chip, calendar, dash-strip, sidebar

Adding a store field? Add it to every `RENDER_DEPS` surface that reads it, or that surface will go stale.

## Math you must not invent

Potential Savings (`leftToSpend`) is `deposited − month spending`, plus planner withhold/hold **only when the user set them**. Defaults keep the original cash line. `currentSavings` is optional bank input for the Overview growth meter and never enters leftover. Change `src/core/plan.js` and `computeNetSnapshot` together, and add a case in `scripts/qc-plan.mjs` / `qc-expense-income.mjs`.

Goal feasibility is a separate allocation view over that cash line. Current
savings and monthly surplus flow through `goals` once in array order. Do not
assess every goal against the full pool independently; that double-counts cash.

Week rails count in-month days where spend > 0 **and** spend > `dailySafe`. Two over days = half red. Three or more = full red. No green income rails.

## Tests to run

```bash
npm test          # all scripts/qc-*.mjs
npm run build     # after any src/ edit; commit app.js + chunk-*.js
```

| Script | Guards |
| --- | --- |
| `qc-theme.mjs` | Dark theme stays greyscale |
| `qc-frame.mjs` | Phone / tablet / desktop snaps |
| `qc-build-output.mjs` | Overview hides `#sidebar` on phone; Tracker hides `#cal-col` |
| `qc-plan.mjs` / `qc-expense-income.mjs` | Leftover and cash math |
| `qc-goals.mjs` | Goal normalization, length presets, pace math, priority allocation, feasibility |
| `qc-ledger-file.mjs` | Encrypt, sanitize, key wipe |
| `qc-render-deps.mjs` | Filter / face / plan keys repaint the right surfaces |

## Suggested edit recipe

1. Read this file and the module header in the `src/` file you will touch.
2. Change the smallest set of files.
3. Do not add a route, a fifth tab, or a server.
4. `npm run build && npm test`
5. Commit source and bundles together.
