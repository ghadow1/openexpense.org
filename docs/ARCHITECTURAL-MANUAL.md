# OpenExpense Architectural Manual

Audience: students, maintainers, reviewers, and instructors working on the
OpenExpense static web application.

This manual describes the authored repository and the GitHub Pages deployment
surface. It is intentionally paired with:

- [`CODEMAP.md`](CODEMAP.md) for frozen DOM, CSS, storage, and host contracts;
- [`ARCHITECTURE.md`](ARCHITECTURE.md) for runtime behavior;
- [`TEACHERS-GUIDE.md`](TEACHERS-GUIDE.md) for security and mathematics;
- [`../src/README.md`](../src/README.md) for the short source index.

## SECTION 1: ARCHITECTURAL DIRECTORY MAP

### 1.1 Why the root contains deployable files

OpenExpense is served directly from the repository root by GitHub Pages. Root
`index.html`, `openexpense.css`, `app.js`, `engine.js`, vendor resources, and
hashed chunks are therefore deployment artifacts, not evidence of an
unstructured application.

The source/deployment boundary is:

```text
AUTHORED AND REVIEWED                 GENERATED AND DEPLOYED
src/**/*.js                    ──┐
scripts/build.mjs               ├──> app.js + chunk-[hash].js
package.json                    ─┘
src/engine/**/*.js             ───> engine.js
index.html + openexpense.css   ───> served directly
vendor/**                      ───> served directly
```

Moving the site shell into an unserved example `public/` directory would
require a second copy or a hosting change. Both create more structural debt
than they remove. The project instead uses a standard layered `src/` tree while
keeping the required static deployment root explicit.

### 1.2 Full repository tree

Generated `chunk-[hash].js` files are represented once because their names
change with source content.

```text
openexpense.org/
├── .github/
│   ├── ISSUE_TEMPLATE/
│   │   ├── bug_report.md
│   │   ├── config.yml
│   │   └── feature_request.md
│   ├── workflows/
│   │   └── security-quality.yml
│   ├── dependabot.yml
│   └── PULL_REQUEST_TEMPLATE.md
├── docs/
│   ├── brochure/
│   │   ├── COPY.md
│   │   └── openexpense-brochure.html
│   ├── examples/
│   │   ├── README.md
│   │   └── sample-ledger.json
│   ├── ARCHITECTURAL-MANUAL.md
│   ├── ARCHITECTURE.md
│   ├── CODEMAP.md
│   ├── COMPETITIVE-FEATURE-REVIEW-2026.md
│   ├── DATA-FORMAT.md
│   ├── DEPENDENCIES.md
│   ├── EMBED.md
│   ├── FRONTEND-ARCHITECTURE-MANUAL.md
│   ├── INCIDENT-RESPONSE.md
│   ├── LEARNING-PATH.md
│   ├── README.md
│   ├── SECURITY-AUDIT-2026-08-17.md
│   ├── SECURITY-HEADERS.md
│   ├── SECURITY-MATHEMATICS-AUDIT-2026-08-19.md
│   ├── SEO-HEAD.html
│   ├── SOC2-READINESS.md
│   ├── TEACHERS-GUIDE.md
│   └── THREAT-MODEL.md
├── scripts/
│   ├── build.mjs
│   ├── clean-chunks.mjs
│   ├── qc-architecture.mjs
│   ├── qc-build-output.mjs
│   ├── qc-categories.mjs
│   ├── qc-codemap.mjs
│   ├── qc-csv.mjs
│   ├── qc-day-entries.mjs
│   ├── qc-engine.mjs
│   ├── qc-envelope.mjs
│   ├── qc-expense-income.mjs
│   ├── qc-frame.mjs
│   ├── qc-frontend.mjs
│   ├── qc-goals.mjs
│   ├── qc-groups.mjs
│   ├── qc-labeling.mjs
│   ├── qc-ledger-file.mjs
│   ├── qc-pdf.mjs
│   ├── qc-plan.mjs
│   ├── qc-render-deps.mjs
│   ├── qc-search.mjs
│   ├── qc-theme.mjs
│   ├── qc-undo-delete.mjs
│   └── write-sitemap.mjs
├── src/
│   ├── app/
│   │   ├── render.js
│   │   └── views.js
│   ├── core/
│   │   ├── bundle-format.js
│   │   ├── bundle.js
│   │   ├── categories.js
│   │   ├── crypto.js
│   │   ├── database.js
│   │   ├── day-entries.js
│   │   ├── envelope.js
│   │   ├── folder.js
│   │   ├── goals.js
│   │   ├── groups.js
│   │   ├── labeling.js
│   │   ├── ledger-file.js
│   │   ├── legacy-zip.js
│   │   ├── limits.js
│   │   ├── pdf-frame.js
│   │   ├── pdf-theme.js
│   │   ├── persist.js
│   │   ├── plan.js
│   │   ├── receipt-date.js
│   │   ├── routes.js
│   │   ├── search.js
│   │   ├── series.js
│   │   ├── store.js
│   │   ├── summary-pdf.js
│   │   ├── summary.js
│   │   └── utils.js
│   ├── engine/
│   │   ├── bridge.js
│   │   ├── categorize.js
│   │   ├── host.js
│   │   ├── index.js
│   │   ├── insights.js
│   │   ├── map.js
│   │   └── session.js
│   ├── features/
│   │   ├── calendar.js
│   │   ├── csv-export.js
│   │   ├── dash-strip.js
│   │   ├── export-buttons.js
│   │   ├── goals.js
│   │   ├── ledger.js
│   │   ├── modal.js
│   │   ├── receipt-parse.js
│   │   ├── receipt-picker.js
│   │   ├── receipt.js
│   │   ├── search-panel.js
│   │   ├── sidebar.js
│   │   └── undo-delete.js
│   ├── ui/
│   │   ├── action-lock.js
│   │   ├── category-picker.js
│   │   ├── components.js
│   │   ├── confirm.js
│   │   ├── dial-chart.js
│   │   ├── dialog-focus.js
│   │   ├── frame.js
│   │   ├── group-field.js
│   │   ├── pointer-drag.js
│   │   ├── scroll-lock.js
│   │   ├── theme.js
│   │   └── toast.js
│   ├── config.js
│   ├── main.js
│   └── README.md
├── vendor/
│   ├── inter/
│   │   └── wght.css
│   ├── ocr-models/
│   │   └── ppocrv6_tiny_dict.txt
│   ├── ort/
│   │   └── ort-wasm-simd-threaded.mjs
│   ├── pdfjs/
│   │   └── pdf.worker.min.mjs
│   ├── tabler/
│   │   └── tabler-icons.min.css
│   └── SHA256SUMS
├── 404.html
├── app.js                         # generated
├── apple-touch-icon.png
├── CHANGELOG.md
├── chunk-[hash].js                # generated set
├── CODE_OF_CONDUCT.md
├── CONTRIBUTING.md
├── embed.html
├── engine.js                      # generated
├── index.html
├── LICENSE
├── manifest.json
├── og-image.jpg
├── openexpense.css
├── package-lock.json
├── package.json
├── README.md
├── robots.txt
├── SECURITY.md
└── sitemap.xml                    # generated
```

### 1.3 Folder responsibilities

#### `.github/`

Repository governance and automation only. Runtime code must never import from
this directory.

- `security-quality.yml`: install, audit, vendor checksum, tests, reproducible
  build, clean-tree verification, and CodeQL.
- `dependabot.yml`: dependency update policy.
- `PULL_REQUEST_TEMPLATE.md`: review checklist.
- `ISSUE_TEMPLATE/*`: structured bug and feature reports.

#### `docs/`

Long-form specifications and curriculum. Documentation may describe contracts;
it must not become a second implementation.

- `ARCHITECTURAL-MANUAL.md`: hierarchy, dependencies, build, and onboarding.
- `ARCHITECTURE.md`: runtime boot/state/persistence flow.
- `CODEMAP.md`: frozen editor contract and ownership map.
- `DATA-FORMAT.md`: plaintext ledger and encrypted envelope schema.
- `DEPENDENCIES.md`: npm/vendor provenance and update rules.
- `EMBED.md`: host and iframe API.
- `THREAT-MODEL.md`: assets, actors, assumptions, and residual threats.
- `SECURITY-HEADERS.md`: hosting controls unavailable to HTML meta tags.
- `SECURITY-AUDIT-*`: dated security evidence.
- `SECURITY-MATHEMATICS-AUDIT-*`: dated security/math evidence.
- `INCIDENT-RESPONSE.md`: response procedure.
- `SOC2-READINESS.md`: control-readiness notes, not a certification.
- `TEACHERS-GUIDE.md`: course chapters and formula derivations.
- `SEO-HEAD.html`: canonical metadata reference.
- `examples/*`: fictional teaching/import data only.
- `brochure/*`: non-runtime product brochure source and copy.

#### `scripts/`

Build and executable specifications.

- `build.mjs`: one reviewable esbuild configuration for the app and headless
  engine.
- `clean-chunks.mjs`: removes only obsolete hashed code-split chunks.
- `write-sitemap.mjs`: regenerates the deployment sitemap date.
- `qc-architecture.mjs`: verifies relative imports, cycles, and layer direction.
- `qc-build-output.mjs`: verifies reachable generated chunks and shell behavior.
- `qc-categories.mjs`: category normalization, suggestion, and budgets.
- `qc-codemap.mjs`: source/docs contract synchronization.
- `qc-csv.mjs`: plaintext CSV shape and formula-injection defense.
- `qc-day-entries.mjs`: reorder, move, duplicate, grouping, and title memory.
- `qc-engine.mjs`: headless mapping/session/insight behavior.
- `qc-envelope.mjs`: cryptographic dimensions, AAD, key commitment, and KDF.
- `qc-expense-income.mjs`: monthly summaries, snapshots, recurrence, and cents.
- `qc-frame.mjs`: phone/tablet/desktop frame selection.
- `qc-frontend.mjs`: semantic DOM, focus, keyboard, and receipt UI contracts.
- `qc-goals.mjs`: goal sanitation, priority allocation, pace, and milestones.
- `qc-groups.mjs`: group normalization and bulk mutations.
- `qc-labeling.mjs`: Change All twin matching.
- `qc-ledger-file.mjs`: import classification, limits, and sanitation.
- `qc-pdf.mjs`: PDF geometry and text safety.
- `qc-plan.mjs`: planner waterfall, ratios, and weekly allocation.
- `qc-render-deps.mjs`: state-key-to-render-surface dependency coverage.
- `qc-search.mjs`: search query language.
- `qc-theme.mjs`: theme palette invariants.
- `qc-undo-delete.mjs`: in-memory undo snapshot behavior.

#### `src/app/`

Application-shell orchestration.

- `render.js`: decides which visual surfaces repaint for each changed state key.
- `views.js`: switches Overview, Tracker, Planner, and Privacy and owns welcome.

#### `src/core/`

Domain and infrastructure modules. This layer does not import browser feature,
UI, app-shell, or engine modules.

- `store.js`: in-memory source of truth; `getState`, `patch`, and `subscribe`.
- `limits.js`: canonical ledger resource policy shared by normalization code.
- `database.js`: IndexedDB topology and primitive transactions.
- `utils.js`: date keys, exact cents, escaping, filenames, and browser helpers.
- `plan.js`: planner waterfall, ratios, safe spend, runway, and week targets.
- `goals.js`: ordered target allocation and feasibility mathematics.
- `summary.js`: month/year aggregation and the shared account snapshot.
- `series.js`: stable recurring identity, cadence, seed/update/delete.
- `labeling.js`: title-and-price twins and confirmed Change All writes.
- `categories.js`: category vocabulary, inference, normalization, and rollups.
- `groups.js`: user-defined group normalization, lookup, and rollups.
- `search.js`: pure search tokenizer, parser, predicates, and result totals.
- `day-entries.js`: immutable day-list mutations.
- `receipt-date.js`: detected-versus-selected receipt date resolution.
- `routes.js`: static public-path classification.
- `crypto.js`: device-bound AES-GCM record encryption.
- `envelope.js`: portable v2 HKDF/AES-GCM envelope and passphrase wrap.
- `bundle-format.js`: portable-backup markers and dependency-free type guards.
- `bundle.js`: current encrypted ledger/key pair operations.
- `legacy-zip.js`: lazy compatibility codec for older ZIP backups.
- `ledger-file.js`: file classification, validation, and allowlist sanitation.
- `persist.js`: queued encrypted IndexedDB autosave and atomic purge.
- `folder.js`: linked export-folder handle and safe pair replacement.
- `pdf-frame.js`: defensive jsPDF drawing primitives.
- `pdf-theme.js`: PDF palette mapped from application themes.
- `summary-pdf.js`: monthly statement document composition.

`limits.js` exists separately so categories and groups can normalize lengths
without importing the parser. This removes a misleading dependency edge and
keeps policy ownership explicit.

#### `src/features/`

User-facing product surfaces. Features may consume `core/` and `ui/`; they do
not own canonical ledger mathematics.

- `calendar.js`: month grid, day net, week rails with a rotated week net, drag-to-day.
- `modal.js`: day editor, save/edit/delete, recurrence, groups, Change All.
- `sidebar.js`: expense/income monthly register and breakdowns.
- `dash-strip.js`: Overview, Tracker heading/filter, and Planner panes.
- `goals.js`: savings-goal editor, priority reorder, and planner-hold action.
- `search-panel.js`: search sheet and result interaction.
- `receipt-picker.js`: synchronous camera/file chooser entry point.
- `receipt.js`: lazy bounded image/PDF loading and local OCR review.
- `receipt-parse.js`: pure OCR text normalization and field suggestions.
- `ledger.js`: import/export/clear/autosave file workflows.
- `export-buttons.js`: Export versus linked-folder Save presentation.
- `csv-export.js`: search-result CSV generation.
- `undo-delete.js`: short-lived, memory-only delete recovery.

#### `src/ui/`

Reusable presentation mechanics without financial business rules.

- `components.js`: generic button and input construction.
- `action-lock.js`: one in-flight UI guard and busy-state presentation.
- `confirm.js`: accessible confirmation/choice dialogs.
- `dialog-focus.js`: focus containment, background isolation, and restoration.
- `toast.js`: temporary status messages.
- `theme.js`: design-token application.
- `frame.js`: responsive frame stamping.
- `dial-chart.js`: banking dials, sparks, and bars.
- `category-picker.js`: type-to-tag category control.
- `group-field.js`: find-or-create group control.
- `pointer-drag.js`: pointer threshold, ghost, and drop helpers.
- `scroll-lock.js`: reference-safe body scroll lock behind overlays.

#### `src/engine/`

Headless and embed API. Public names are compatibility contracts.

- `index.js`: package-style export surface compiled to `engine.js`.
- `host.js`: live-page `window.OpenExpense` facade.
- `bridge.js`: exact-origin iframe messaging.
- `categorize.js`: deterministic transaction categorization.
- `map.js`: host/bank-shaped row to canonical ledger entry.
- `insights.js`: snapshots, recurrence detection, anomaly and budget helpers.
- `session.js`: isolated in-memory headless ledger sessions.

#### `vendor/`

Reviewed same-origin runtime resources. `SHA256SUMS` pins artifacts. Do not edit
minified vendor code to fix application behavior; update the upstream package
and checksum through the dependency process.

### 1.4 Root-file responsibilities

- `index.html`: semantic shell, metadata, CSP, boot guards, frozen DOM hooks.
- `openexpense.css`: complete production design system and responsive layout.
- `app.js`, `chunk-[hash].js`: generated full-app ES modules; never hand-edit.
- `engine.js`: generated headless ES module; never hand-edit.
- `404.html`: static missing-path page.
- `embed.html`: embed entry/redirect shell.
- `manifest.json`: install metadata.
- `robots.txt`, `sitemap.xml`: crawler metadata.
- `og-image.jpg`, `apple-touch-icon.png`: brand/social assets.
- `package.json`: commands and dependency intent.
- `package-lock.json`: exact dependency graph.
- `.gitignore`: excludes dependencies, caches, and sensitive export/key files.
- `README.md`: project entry point.
- `CONTRIBUTING.md`: contribution policy and manual verification.
- `SECURITY.md`: private vulnerability-reporting policy.
- `CHANGELOG.md`: user-facing history.
- `CODE_OF_CONDUCT.md`: community behavior.
- `LICENSE`: MIT terms.

## SECTION 2: MODULE DEPENDENCY & DATA FLOW GRAPH

### 2.1 Allowed import direction

```text
                 ┌──────────────┐
                 │ src/main.js  │
                 └──────┬───────┘
                        │
             ┌──────────┴──────────┐
             ▼                     ▼
        ┌─────────┐           ┌──────────┐
        │  app/   │──────────▶│features/ │
        └────┬────┘           └────┬─────┘
             │                     │
             └──────────┬──────────┘
                        ▼
                    ┌───────┐
                    │  ui/  │
                    └───┬───┘
                        │
                        ▼
                    ┌───────┐
                    │ core/ │
                    └───────┘

engine/ ─────────────────────────▶ core/
```

This diagram shows permitted consumption, not a requirement that every higher
layer import every lower one. `core/` is the foundation and cannot import
`app/`, `features/`, `ui/`, or `engine/`. `engine/` cannot import browser UI
layers. `scripts/qc-architecture.mjs` enforces these rules and rejects cycles.

External packages enter at narrow adapters:

- `fflate` in lazy `core/legacy-zip.js`;
- `jspdf` in `core/summary-pdf.js`;
- OCR, ONNX, and PDF.js through lazy imports in `features/receipt.js`.

The receipt picker is kept in `features/receipt-picker.js` so the native chooser
opens synchronously from the user's click. Only after a file is selected does
`main.js` import the OCR/review feature. Architecture QC pins these boundaries
so optional codecs cannot drift back into startup unnoticed.

### 2.2 State lifecycle

```text
gesture / import / OCR confirmation
                │
                ▼
         feature validates
                │
                ▼
        core immutable helper
                │
                ▼
          store.patch(partial)
             │          │
             │          └──> debounced persistence subscriber
             │                    │
             │                    ▼
             │             sanitize canonical data
             │                    │
             │                    ▼
             │               AES-GCM seal
             │                    │
             │                    ▼
             │                 IndexedDB
             ▼
   requestAnimationFrame coalescing
             │
             ▼
      RENDER_DEPS selection
             │
             ▼
      affected DOM surfaces only
```

`store.js` is the only in-memory source of truth. Features replace changed
objects and call `patch`; they do not mutate state silently. Persistence stores
only ledger name, events, budgets, and plan. Theme, selection, frame, and active
tab are UI state.

### 2.3 Event routing

Stable shell actions are delegated from `document` by `main.js` through frozen
`data-action`, `data-view`, `data-tab`, and `data-tracker-filter` attributes.
Complex local interactions bind within their owning module:

- calendar chip/day dragging in `calendar.js`;
- row reorder/group dragging in `modal.js`;
- modal focus and keyboard behavior in UI helpers;
- responsive updates in `frame.js` and calendar `ResizeObserver`.

Pointer listeners are removed on up/cancel. Overlay scroll locks are balanced
through a shared helper. These ownership rules prevent feature modules from
leaking listeners into unrelated surfaces.

### 2.4 Build graph

```text
npm run build
  └─ scripts/build.mjs
      ├─ write-sitemap.mjs
      ├─ clean-chunks.mjs
      ├─ esbuild src/main.js
      │    └─ app.js + chunk-[hash].js
      └─ esbuild src/engine/index.js
           └─ engine.js
```

The app build uses ESM splitting so OCR/PDF dependencies remain lazy. The
headless engine is a fixed single bundle. Both target ES2020 and are minified.

## SECTION 3: STACK OPTIMIZATION & REFACTOR LOG

### 3.1 Stack decision

The application remains vanilla HTML, CSS, ES modules, Web Crypto, IndexedDB,
File System Access, Canvas, and standard browser events. No framework, router,
state library, CSS processor, test framework, or runtime telemetry was added.

This is an optimization for both production and education:

- no framework runtime or hydration cost;
- direct browser API visibility for students;
- fewer dependency and supply-chain boundaries;
- no server or account infrastructure;
- esbuild only at authoring/build time.

### 3.2 Structural changes

1. Centralized both esbuild entries in `scripts/build.mjs`.
   - Removes the long shell pipeline from `package.json`.
   - Uses the installed locked `esbuild` API rather than `npx` resolution.
   - Keeps app/engine options in one reviewable file.
2. Added `scripts/qc-architecture.mjs`.
   - Resolves every relative source import.
   - Rejects circular source dependencies.
   - Enforces foundational and headless layer direction.
3. Extracted ledger limits to `src/core/limits.js`.
   - Category/group normalization no longer imports the file parser merely to
     read constants.
   - `ledger-file.js` re-exports `FILE_LIMITS` for compatibility.
4. Retained root deployment names and frozen DOM/CSS hooks.
   - Avoids path churn, duplicate public trees, and behavior changes.
5. Split IndexedDB primitives into `src/core/database.js`.
   - Removes the former `persist.js` ↔ `crypto.js` circular dependency.
   - Keeps database topology separate from encryption and autosave policy.
6. Moved the DOM-painting operation lock from `core/` to `ui/`.
   - Its busy classes, disabled controls, and toast are presentation concerns.
   - The foundational core layer no longer imports a browser UI module.

### 3.3 Refactoring mistakes checked or corrected

| Trap | Control |
| --- | --- |
| Relative import broken after a move | Architecture QC resolves every relative specifier |
| Circular dependency introduced | DFS cycle check over authored modules |
| Core starts depending on UI | Layer-direction test |
| Generated bundle no longer matches source | Build then clean-tree check in CI |
| Old hashed chunks accumulate | `clean-chunks.mjs` before every app build |
| `npx` downloads an unexpected builder | Build imports lockfile-installed `esbuild` |
| Public host export renamed | CODEMAP and engine QC |
| DOM/CSS hook renamed cosmetically | Frozen contract and codemap QC |
| Runtime behavior changed during hierarchy work | Full QC suite and bundle rebuild |
| Parser constants create needless coupling | `core/limits.js` policy extraction |
| Manual edits made to minified output | Source-only contribution rule |

### 3.4 Performance conclusions

No runtime feature or rendering algorithm was changed by this hierarchy pass.
That restraint is deliberate: directory names do not justify behavior risk.
Existing performance controls remain:

- render notifications coalesced to one animation frame;
- dependency-keyed surface repainting;
- 400 ms autosave debounce plus ordered save queue;
- lazy OCR/PDF imports;
- bounded file, ZIP, OCR, and ledger workloads;
- cached category history keyed by immutable events-object identity;
- responsive calendar rerender only when density changes.

The build process is more deterministic and avoids a package-runner startup.

## SECTION 4: EDUCATIONAL MAINTAINER & CONTRIBUTOR GUIDE

### 4.1 Requirements

- Node.js with npm;
- Python 3 only for the simple local static server command;
- a modern browser with Web Crypto and IndexedDB;
- `localhost` or HTTPS, because encryption requires a secure context.

### 4.2 Setup and execution

```bash
npm ci
npm run build
npm test
npm run serve
```

Open `http://localhost:8765`. Do not open `index.html` through `file://`.

Useful verification:

```bash
npm audit --omit=dev
git status --short
```

After a correct build, generated bundles are expected to change only when their
source changes. Commit source and generated deployment files together.

### 4.3 First-day onboarding

1. Read `README.md` for product intent.
2. Read `docs/CODEMAP.md` before renaming any DOM hook or public identifier.
3. Read `src/README.md` and locate the module that owns the behavior.
4. Follow one state change:
   - action in `src/main.js`;
   - mutation in `src/features/`;
   - pure helper in `src/core/`;
   - `patch` in `src/core/store.js`;
   - repaint dependency in `src/app/render.js`;
   - encrypted write in `src/core/persist.js`.
5. Run one focused `scripts/qc-*.mjs` file with `node --test`.
6. Run the complete build and suite before handing off.

### 4.4 Where new code belongs

| New responsibility | Location |
| --- | --- |
| Pure ledger rule, math, validation, storage | `src/core/` |
| Shared resource policy | `src/core/limits.js` or `src/config.js` |
| User-facing calendar/editor/search/file surface | `src/features/` |
| Reusable control or presentation mechanic | `src/ui/` |
| View selection or render orchestration | `src/app/` |
| Public headless/embed behavior | `src/engine/` |
| Build or executable specification | `scripts/` |
| Architecture/data/security explanation | `docs/` |

Do not create a generic `helpers.js` dumping ground. Name a module for the
domain responsibility it owns.

### 4.5 Safe extension recipe

Example: adding a new derived planner figure without changing navigation.

1. Define and test the formula in `src/core/plan.js`.
2. Return a domain-named field from `computePlanner`.
3. Pass it through `computeNetSnapshot` if multiple surfaces consume it.
4. Add the source state keys to the correct `RENDER_DEPS` surface.
5. Render it in the existing owning feature.
6. Reuse existing CSS prefixes and design tokens.
7. Add an equation and edge cases to the Teacher's Guide.
8. Run:

```bash
npm run build
npm test
```

### 4.6 Rules students should be able to explain

- Why `core/` cannot import `features/`.
- Why integer cents are used for financial addition.
- Why authentication does not replace input sanitation.
- Why root deployable files coexist with modular source.
- Why `ledgerFace` and `trackerFilter` are separate.
- Why generated bundles must not be hand-edited.
- Why a stable public contract can be more important than a prettier rename.
- Why event listeners belong to a specific surface owner.

### 4.7 Pull-request checklist

- [ ] Change is in the owning module.
- [ ] No new backend, analytics, account, or upload path.
- [ ] Frozen DOM/CSS/storage/host names remain compatible.
- [ ] Relative imports resolve and architecture tests pass.
- [ ] No new dependency cycle.
- [ ] Money remains in cents across additive paths.
- [ ] Imported or rendered data is bounded and encoded.
- [ ] `npm run build` completed.
- [ ] Generated bundles are committed.
- [ ] `npm test` passes.
- [ ] Manual flows relevant to the change were checked.
- [ ] Documentation reflects changed contracts.

## SECTION 5: FULL REFACTORED PROJECT FILES

### 5.1 Canonical-file policy

The complete refactored files are the files in this repository. Duplicating all
source into this manual would create a stale second codebase and violate the
single-source-of-truth architecture this manual teaches.

The requested specimen categories map as follows:

| Category | Complete canonical files |
| --- | --- |
| HTML | [`../index.html`](../index.html), [`../404.html`](../404.html), [`../embed.html`](../embed.html) |
| CSS | [`../openexpense.css`](../openexpense.css), reviewed vendor CSS under `vendor/` |
| JavaScript source | Every module under [`../src/`](../src/) |
| Build and QC | Every `.mjs` file under [`../scripts/`](../scripts/) |
| Metadata | [`../package.json`](../package.json), [`../package-lock.json`](../package-lock.json), [`../.gitignore`](../.gitignore), [`../README.md`](../README.md), [`../CONTRIBUTING.md`](../CONTRIBUTING.md) |
| Generated deployment JS | `app.js`, `engine.js`, and the current `chunk-[hash].js` set |

### 5.2 File labels and annotation standard

Every authored JavaScript module starts with a responsibility header. When
teaching or reviewing a specimen, label it by canonical path:

```js
// File: src/core/limits.js
export const FILE_LIMITS = Object.freeze({
    maxBytes: 32 * 1024 * 1024,
    maxEntries: 25000
    // ...
});
```

Do not cite minified `app.js` as authored code. Its correct label is:

```text
Generated file: app.js
Source entry: src/main.js
Builder: scripts/build.mjs
```

### 5.3 Metadata specimen

The canonical commands are intentionally small:

```json
{
  "scripts": {
    "build": "node scripts/build.mjs",
    "serve": "python3 -m http.server 8765",
    "test": "node --test scripts/qc-architecture.mjs ..."
  }
}
```

This keeps build policy in code, runtime serving transparent, and tests based
on the platform's standard runner.

### 5.4 Completeness verification

Use these commands instead of comparing copied textbook listings:

```bash
npm ci
npm run build
npm test
git status --short
```

The repository itself is the executable textbook: source paths, tests, docs,
and generated deployment artifacts remain linked by the build and architecture
checks.

