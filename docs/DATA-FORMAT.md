# Data format

This is the shape stored inside encrypted IndexedDB and inside a decrypted export.

## Ledger object

```json
{
  "name": "Home ledger",
  "events": {
    "2026-06-03": [
      {
        "title": "Transit pass",
        "price": 49.99,
        "recurring": true,
        "repeat": "monthly",
        "paid": true,
        "category": "Transit",
        "group": "Commute",
        "note": "90-day reload"
      }
    ]
  },
  "budgets": {
    "Groceries": 400
  },
  "plan": {
    "weeklySavings": 50,
    "weeklyIncome": 0,
    "reserveSavings": true,
    "spendBasis": "logged",
    "incomeBasis": "deposited",
    "taxWithholdPct": 0,
    "savingsPct": 0,
    "savingsFixed": 0,
    "currentSavings": 0,
    "ratioNeeds": 50,
    "ratioWants": 30,
    "ratioSave": 20
  },
  "goals": [
    {
      "id": "11111111111111111111111111111111",
      "title": "Emergency fund",
      "targetDate": "2027-01-15",
      "targetAmount": 2500,
      "createdAt": 1780000000000,
      "horizon": "custom",
      "note": "Keep this in the high-yield account",
      "alreadySaved": 400
    }
  ],
  "savedAt": 1780000000000
}
```

| Field | Required | Notes |
| --- | --- | --- |
| `name` | no | Sanitized file-safe string, max 80 characters. Shown in the header and used as the export filename. |
| `events` | yes | Object keyed by `YYYY-MM-DD`. Missing days are omitted, not stored as empty arrays. The array order on a date is the order shown on that day after a drag-reorder. |
| `budgets` | no | Monthly cap per category label, e.g. `{ "Groceries": 400 }`. Positive numbers only, max 60 entries. Omitted entirely when no caps are set. Kept in the ledger rather than in browser storage so restoring a backup on another device brings the caps back with the history. |
| `plan` | no | Planner rules Overview uses for leftover (shown as Potential Savings). Omitted when every field is the default cash line. Same travel rule as `budgets`. |
| `goals` | no | Ordered savings goals. Array order is allocation priority. Maximum 50; omitted when empty. Goals travel with encrypted backups and never require a server. |
| `savedAt` | export only | Unix ms, written by `Ledger.exportPayload()`. Ignored on import. |

### Plan object

Potential Savings (stored as leftover / `leftToSpend`) is a waterfall on whole cents:

1. **Counted income** — deposited, or all scheduled if `incomeBasis` is `scheduled`.
2. **− tax withhold** — `taxWithholdPct` of counted income.
3. **− savings hold** — weekly month-equivalent (when `reserveSavings` is on) + `savingsFixed` + `savingsPct` of after-tax income.
4. **− counted spend** — all logged bills, or paid only if `spendBasis` is `paid`.

The 50/30/20 (or custom) ratios score after-tax income. They do not withhold a second time.

| Field | Default | Notes |
| --- | --- | --- |
| `weeklySavings` | `0` | Dollars per week. `0` turns the target off. The month’s reserve is `weeklySavings × (days in the viewed month / 7)`, rounded to cents. |
| `weeklyIncome` | `0` | Weekly gross-income goal. `0` uses this month’s own income pace. Used for planner figures and week income targets, not the calendar rail. |
| `reserveSavings` | `true` | When a weekly target is set, include that month reserve in the savings hold. The Sun–Sat leftover still subtracts the weekly target either way. |
| `spendBasis` | `"logged"` | `"logged"` counts paid plus unpaid bills (the original month spending). `"paid"` counts only bills marked paid. |
| `incomeBasis` | `"deposited"` | `"deposited"` is income ticked as landed (the original cash line). `"scheduled"` counts every income entry already on the month. |
| `taxWithholdPct` | `0` | 0–50, one decimal. `15.3` is the IRS self-employment tax rate (12.4% Social Security + 2.9% Medicare; Topic 554 / Pub 334). `25` and `30` are common quarterly-estimate placeholders used with Pub 505, not a filing. |
| `savingsPct` | `0` | 0–100 percent of **after-tax** counted income, added to the savings hold. |
| `savingsFixed` | `0` | Extra monthly dollar goal added to the savings hold (the user’s own emergency-reserve floor; CFPB discusses a 3–6 month fund as the longer target). |
| `currentSavings` | `0` | Optional current bank amount. User input only. `0` or omitted leaves Overview on the leftover money dial. A positive amount does **not** change leftover; Overview then shows growth potential as leftover ÷ current savings × 100, one decimal. |
| `ratioNeeds` | `50` | Percent of after-tax income treated as needs. Default is Warren & Tyagi, *All Your Worth* (2005), as taught by the CFPB 50/30/20 rule. Needs labels: Housing, Utilities, Health, Transit, Groceries. |
| `ratioWants` | `30` | Wants labels: Dining, Coffee, Entertainment, Shopping, Travel, Subscriptions. |
| `ratioSave` | `20` | Save cap is the scoreboard for the savings hold, not a second deduction. Ratios that do not add to 100 are scaled; leftover points go to save. |
| `goalIncome` | `"horizon"` | `"horizon"` counts upcoming calendar pay that leftover has not already included (unpaid deposits, plus pay after this month) through each goal date. Tax and savings percent still apply. `"surplus"` is leftover + hold only. The Tracker expense/income filter never hides these checks. |

Derived figures (not stored):

| Figure | Formula |
| --- | --- |
| Daily safe spend | `leftToSpend ÷ remaining days` (remaining days include today) |
| Growth potential | `leftToSpend ÷ currentSavings × 100` when `currentSavings > 0`; otherwise omitted. One decimal. |
| Weekly safe spend | daily safe × min(7, remaining days) |
| Daily burn | counted spend ÷ days elapsed in the viewed month |
| Days of cash (runway) | `(savings funds + max(0, left to spend)) ÷ daily burn`, one decimal. Investopedia / CFI cash runway = cash ÷ burn rate. |
| Week buckets | Calendar days 1–7, 8–14, 15–21, 22–28, 29–end. Each target is spendable × (days in the week ÷ days in the month); leftover cents sit on the last week. |
| Calendar week hints | Sunday–Saturday row of the viewed month. A day is over budget when its counted spend is above that day’s safe amount (left to spend ÷ remaining days). No rail when fewer than two days are over. Two over days: half red / half gray. Three or more: full red. Day squares stay the surface colour. |

### Goals array

| Field | Required | Notes |
| --- | --- | --- |
| `id` | yes | Random 128-bit hexadecimal local identity. |
| `title` | yes | Collapsed text, maximum 80 characters. |
| `targetDate` | yes | Real `YYYY-MM-DD` calendar date. |
| `targetAmount` | no | Positive amount rounded to cents. Missing means “No amount set” and disables feasibility scoring. |
| `createdAt` | yes | Local Unix timestamp used for stable metadata; priority remains the array order. |
| `horizon` | no | `weekly`, `monthly`, `yearly`, or `custom`. Length presets fill `targetDate`; older ledgers without this field are treated as custom. |
| `note` | no | Optional planning note, maximum 200 characters. |
| `alreadySaved` | no | Dollars already reserved for this goal. Counted before the shared bank amount and never taken from another goal. |
| `includeBankSavings` | no | Default true. `false` skips the shared `currentSavings` pool so only this goal’s `alreadySaved` and new surplus fund it. |

Current savings, leftover surplus, and upcoming pay (when `goalIncome` is
`horizon`) flow through goals once from top to bottom. For each priced goal:

`remaining = max(0, target − already saved − allocated bank savings)`

Days remaining count today through the target date (the same inclusive clock
as leftover “days left”). A past date is 0.

`required daily = remaining ÷ max(1, days remaining)`

`required this week = remaining × min(1, 7 ÷ days remaining)`

`required this month = remaining × min(1, days in this month ÷ days remaining)`

`required this year = remaining × min(1, days in this year ÷ days remaining)`

A period hold never exceeds the amount still needed. Upcoming pay that lands
on or before the goal date is subtracted first, so two $480.50 checks before
month-end cover a $250 goal and the hold is $0. Without incoming pay, a $250
goal due at month-end on August 20 needs $250 this month ($20.83 / day over
12 days), not $691.77 / month.

The projected amount is current allocation plus incoming pay through the
deadline plus this month’s allocated surplus (or that surplus continued at
the same calendar-month rate when the deadline is later). This follows the
CFPB savings-plan method of dividing the amount still needed by the time
remaining and comparing that pace with leftover and scheduled pay. Reordering
goals changes priority; it does not move money at a bank. States are no
amount, complete, ahead, on track (`achievable`), behind (still time, surplus
and incoming pay are short), and unachievable (the date has passed and the
target is still open).

Research basis:

- [CFPB — Savings Plan Tool](https://files.consumerfinance.gov/f/documents/cfpb_your-money-your-goals_savings_plan_tool_2018-11_ADA.pdf)
- [CFPB — Set a goal, make a plan, and save automatically](https://www.consumerfinance.gov/archive/blog/set-a-goal-make-a-plan-and-save-automatically/)

## Expense

| Field | Type | Default | Notes |
| --- | --- | --- | --- |
| `title` | string | — | Required to save. Compared case-insensitively when grouping a series. Blank and leftover placeholder titles never match as a series or as Change All twins. |
| `price` | number or string | `0` | Non-negative amount rounded to whole cents. Direction is represented by `kind`, not a negative sign. Legacy notes may still contain `$12.00`; `Utils.getPrice` reads that fallback. |
| `recurring` | boolean | `false` | Marks a re-accruing payment. New schedules use `seriesId`; legacy schedules without one fall back to title + kind + `repeat` until edited. |
| `repeat` | string | `"monthly"` | How often a recurring payment or income copies forward: `weekly`, `monthly`, `bimonthly` (every 2 months), or `quarterly`. Omitted on one-time entries. Missing on older ledgers means monthly. |
| `seriesId` | string | omitted | Random 128-bit hexadecimal identity shared by one recurring schedule. Prevents unrelated equal-title schedules from being merged, changed, or deleted together. |
| `kind` | string | `"expense"` | `expense` (default, omitted) or `income`. Calendar colors and the sidebar face use this. |
| `paid` | boolean | `false` | Used by the summary paid / pending split. Receipts save as paid. On income the UI label is Deposited, and only income with this flag counts as cash in the account overview — one flag rather than two, because "received but not deposited" is a state with no answer. |
| `note` | string | `""` | Free text. HTML is escaped before render. |
| `category` | string | omitted | One tag (max 40), e.g. `Groceries`. Typed in the find-or-create field; Enter assigns a new name. Also guessed from the title by `src/core/categories.js`, or supplied by a host import. Stored as the human label rather than an id. Search with `cat:`, `tag:`, or `category:` (a space after the colon is part of the name). `cat:food` matches every built-in tag in that family. |
| `group` | string | omitted | A bucket of the user's own naming (max 40), e.g. `Bella`, `Rome trip`, `Rental`. Where `category` answers what a thing was, `group` answers what it belonged to and has no canonical list. Assigned from the day sheet (select rows or drop one onto another) or the find-or-add field. Matched case-insensitively with whitespace collapsed, so `bella` joins `Bella`. **Ungroup** removes only this field. Search with `group:` or `grp:`. |
| `source` | string | omitted | Optional origin, e.g. `bank` or `ocr` (max 24). |
| `sourceId` | string | omitted | Optional bank transaction id for idempotent host imports (max 80). |

Unknown fields are dropped on load and import. Quality control keeps only the fields above.

## Encrypted files (export)

**Export** writes two JSON files with the same stem into an **OpenExpense** folder by default. A one-off download uses a dated pair such as `Home ledger-2026-08-17.json` and `Home ledger-2026-08-17.key.json`. After a folder is linked, **Save** overwrites the existing pair in that folder (`Home ledger.json` when none exists yet, or the latest dated pair already there). There is no separate income file — both kinds live in one encrypted ledger. Long-press Export to pick another folder. On iPhone and Android the share sheet is the save path — choose OpenExpense in Files.

| File | Format | Purpose |
| --- | --- | --- |
| `{name}-{date}.json` | `{ format: "openexpense-encrypted", version: 2, alg, kdf, kid, salt, iv, commit, ct, createdAt }` | AES-256-GCM envelope. No plaintext expenses or income. |
| `{name}-{date}.key.json` | `{ format: "openexpense-key", version: 2, kid, alg, kdf, secret }` or `{ …, wrap }` | The master secret for that envelope only |

The two files share a `kid`. Import refuses a key that does not match. The portable key is **never** written to IndexedDB or `localStorage`. It exists only in the downloaded `key.json` (and briefly in memory while you unlock a file).

### Envelope v2

`key.json` does not hold the AES key. It holds a 32-byte **master secret**, and HKDF-SHA-256 splits that into two independent values using the envelope's `salt`:

| Info string | Output | Where it goes |
| --- | --- | --- |
| `openexpense/v2/enc` | AES-256-GCM key | Never leaves memory |
| `openexpense/v2/commit` | 32-byte commitment | Published as `commit` in the envelope |

The commitment is checked before any decryption is attempted. AES-GCM is not key-committing on its own — a ciphertext can be constructed to authenticate under more than one key, which is the property partitioning-oracle attacks exploit. Publishing a commitment makes "wrong key" a definite answer.

Every header field is passed to AES-GCM as additional authenticated data, using a canonical JSON encoding with sorted keys. That covers fields this version does not know about, so no part of the envelope — `kid`, `createdAt`, `salt`, `commit`, or anything added later — can be edited without breaking decryption. The tag length is pinned to 128 bits.

### Passphrase (optional)

If the user sets one, `key.json` carries `wrap` instead of `secret`:

```json
{ "kdf": "PBKDF2-HMAC-SHA-256", "iterations": 600000, "salt": "…", "iv": "…", "ct": "…" }
```

The master secret is encrypted under a key derived from the passphrase, so a copied pair of files is no longer enough to read the ledger. The iteration count is itself authenticated in the wrap's AAD and accepted only from 210,000 through 1,200,000 on read: the floor prevents cheap guessing and the ceiling prevents an imported key from monopolizing the browser CPU. Passphrases are NFKC-normalized before use so the same typed word matches regardless of how the platform composes it.

PBKDF2 is used because it is the strongest passphrase KDF the Web Crypto API offers natively. It is not memory-hard the way Argon2id is; choosing it keeps the crypto free of third-party code and WASM, which matters for an offline-first app served as static files. 600,000 iterations follows OWASP's 2023 guidance for PBKDF2-HMAC-SHA-256.

Export asks about a passphrase once and remembers a deliberate "Not now" in `localStorage` (only the choice, never the passphrase), so export stays one click for anyone who does not want one. Dismissing that dialog with Escape is not treated as an answer. **Long-press Export to reopen the question** — that is the way to turn a passphrase on after declining, or off after enabling.

### Older files

v1 envelopes — a raw AES-256-GCM JWK in `key.json`, no salt, no commitment, no AAD — still import. Older `.zip` backups (ciphertext + key + README) still import too. Exports are always written as v2.

### Import order

1. Encrypted `{name}.json` — the app asks you to choose the matching `key.json`.
2. The two JSON files in either order (the second completes the pair).
3. A legacy `.zip` with both members.
4. A plaintext `.json` (legacy sample or old export) — only after you confirm. It is then stored encrypted in autosave.

## Quality control

The same QC path (`src/core/ledger-file.js`) runs on encrypted import, plaintext import, IndexedDB boot, and autosave:

- JSON file size cap (32 MiB) before parse; legacy ZIP input is capped at 8 MiB compressed
- Format / version / algorithm / `kid` checks
- v2: `kdf` is HKDF-SHA-256, `salt` is 32 bytes, `commit` is 32 bytes, `iv` is 12 bytes
- v2 key file: a 32-byte `secret`, or a `wrap` whose iteration count is within the accepted range
- v1 key file: key type `oct` (AES-256-GCM JWK)
- Matching `kid` between ledger and key.json
- Key commitment match, then a successful AES-GCM decrypt over the authenticated header
- Sanitized `events` map: real calendar dates, known entry fields, `kind` expense or income, entry/day caps
- Sanitized `budgets` map: non-empty labels, positive finite amounts, prototype keys refused, count capped
- Sanitized `plan`: weekly savings rounded to cents, `spendBasis` `logged` or `paid`, `incomeBasis` `deposited` or `scheduled`, `goalIncome` `horizon` or `surplus`; omitted when it matches the default cash line
- Sanitized `goals`: valid ids/dates, bounded titles and amounts, unique ids, count capped at 50
- Prototype-pollution keys (`__proto__`, `constructor`, `prototype`) are dropped

OpenExpense drops its portable-key references after unlock, on timeout, and when the page unloads. JavaScript cannot guarantee physical memory erasure. The portable key is never intentionally written to IndexedDB or `localStorage`. Exporting again creates a **new** key pair; the previous `key.json` still unlocks the earlier file.

## IndexedDB

| Database | Store | Key | Value |
| --- | --- | --- | --- |
| `openexpense` (v2) | `ledger` | `current` | Encrypted envelope of `{ name, events, budgets, plan, goals }`, with its own header bound in as AAD |
| `openexpense` (v2) | `meta` | `ledger-key-v1` | Non-extractable `CryptoKey` for **autosave only** — not the portable `key.json` |

Do not check a real database dump or `*.key.json` into git. The sample under `examples/` is fictional plaintext for humans to read; it is not a user export.

## Sample file

[`examples/sample-ledger.json`](examples/sample-ledger.json) is fictional data you can import to see the calendar and summary. It is not used by the app at runtime.
