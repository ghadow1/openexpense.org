# OpenExpense learning path

This is the shortest route into the project. It points to the detailed manuals
instead of repeating them. Use fictional data from
[`examples/sample-ledger.json`](examples/sample-ledger.json); never use a
student's real financial records in class, screenshots, tests, or issues.

## Choose a route

| Learner | Start here | Then read |
| --- | --- | --- |
| First-time contributor | Lesson 1, then Lesson 2 | [`CODEMAP.md`](CODEMAP.md) |
| Frontend learner | Lessons 1, 3, and 5 | [`FRONTEND-ARCHITECTURE-MANUAL.md`](FRONTEND-ARCHITECTURE-MANUAL.md) |
| Applied-math learner | Lessons 1 and 4 | [`TEACHERS-GUIDE.md`](TEACHERS-GUIDE.md), sections 3–4 |
| Security learner | Lessons 1, 2, and 5 | [`THREAT-MODEL.md`](THREAT-MODEL.md) |
| Instructor | All five lessons | [`TEACHERS-GUIDE.md`](TEACHERS-GUIDE.md) |

## Lesson 1 — Follow one change

Goal: explain the application's one-way data flow.

1. Open `src/main.js` and find the delegated click handler.
2. Follow one action into `src/features/`.
3. Find its pure calculation or sanitizer in `src/core/`.
4. Find the `patch(...)` call and the matching render dependency.
5. Run the closest `scripts/qc-*.mjs` specification through `npm test`.

Checkpoint: a learner can draw `gesture → validate → patch → render → encrypted
autosave` and explain why a feature should not write IndexedDB directly.

## Lesson 2 — Separate policy from machinery

Goal: distinguish a file format from code that processes it.

- `core/bundle-format.js` owns portable-backup markers and type guards.
- `core/bundle.js` owns current encryption and decryption.
- `core/legacy-zip.js` owns compatibility with older ZIP backups.
- `core/ledger-file.js` owns size checks and plaintext sanitation.

The split is intentional. Cheap validation is available at startup; encryption
loads only for import/export; the ZIP codec loads only for an old ZIP. Study
the lazy-boundary test in `scripts/qc-architecture.mjs`.

Exercise: name one security bug that could result from validating a decrypted
object only by its filename. Then locate the sanitizer that prevents it.

## Lesson 3 — Preserve a user gesture

Goal: understand browser capability timing and progressive loading.

`features/receipt-picker.js` is small and synchronous because browsers may
reject a camera/file chooser opened after the original click expires. After a
file is selected, `main.js` dynamically imports `features/receipt.js`; that
module then loads PDF and OCR engines only when needed.

Exercise: explain why moving the native picker itself behind `await import(...)`
could break phones even though it works in a fast desktop test.

## Lesson 4 — Verify financial mathematics

Goal: treat money formulas as executable specifications.

| Concept | Implementation | Specification |
| --- | --- | --- |
| Exact percentages and holds | `core/plan.js` | `qc-plan.mjs` |
| Monthly/yearly totals and runway | `core/summary.js` | `qc-expense-income.mjs` |
| Goal feasibility and priority | `core/goals.js` | `qc-goals.mjs` |
| Import normalization | `core/ledger-file.js` | `qc-ledger-file.mjs` |

Exercise: add a boundary case to a QC file before changing a formula. Use
integer cents where the result represents money.

## Lesson 5 — Make a safe contribution

1. Read the frozen contracts in [`CODEMAP.md`](CODEMAP.md).
2. Change authored files under `src/`, `openexpense.css`, or `index.html`.
3. Add or update an executable specification.
4. Run `npm run build`; never hand-edit `app.js`, `engine.js`, or chunks.
5. Run `npm test` and `npm audit --audit-level=high`.
6. Check keyboard use, light/dark themes, and phone/desktop frames when the UI
   changes.

Definition of done: the behavior is preserved or intentionally specified, the
build has no orphan chunks, public host exports are unchanged, documentation
points to the source of truth, and no real ledger data enters the repository.

## Workspace map

| Path | Keep because |
| --- | --- |
| `src/` | Authored application and headless engine |
| `scripts/` | Build pipeline and executable specifications |
| `docs/` | Reference manuals, lessons, audits, and fictional examples |
| `vendor/` | Same-origin fonts, PDF worker, and OCR runtime/models |
| `app.js`, `engine.js`, `chunk-*.js` | Reproducible GitHub Pages deployment |

Large OCR assets are not dead weight: they keep receipt contents on the device.
Large PDF code is lazy: it is fetched only when a statement or PDF receipt
needs it. The lite strategy is progressive loading, not removing offline or
privacy features.
