# Security and mathematics audit — 2026-08-19

Scope: the authored application in `index.html`, `openexpense.css`, `src/`,
the headless engine, import/export paths, and quality-control tests. Generated
`app.js`, `engine.js`, and `chunk-*.js` were checked through a clean rebuild;
they are not independent source files.

This is a source review and mathematical verification, not a penetration-test
or financial-planning certification.

## Executive result

No credential, analytics upload, remote ledger API, dynamic code execution, or
unescaped user-controlled HTML path was found. The app's security model is
substantially stronger than a typical static finance demo: imported values are
allowlisted and bounded, financial totals are accumulated as integer cents,
autosaves are serialized, and AES-GCM headers are authenticated.

This review found and corrected the following concrete boundary defects:

| Finding | Before | Correction |
| --- | --- | --- |
| Imported PBKDF2 work factor had no upper bound | A crafted `key.json` could request an impractically large iteration count and monopolize CPU before authentication | Reject values above `ENVELOPE.MAX_WRAP_ITERATIONS` in both validation and direct unwrap APIs |
| Direct envelope APIs trusted binary dimensions | Internal/public callers could pass malformed salts, IVs, commitments, wraps, or oversized ciphertext directly to Web Crypto | Check every decoded byte length before derivation or decryption |
| Receipt dates allowed calendar rollover | OCR text such as `2026-02-31` passed a simple day ≤ 31 check and could be suggested as a nonexistent date | UTC round-trip validation now rejects impossible dates while accepting leap day |
| Averages left the integer-cent domain | Division could produce repeating binary fractions such as `333.333…` | Round average money once to the nearest cent; malformed year-month indexes are also ignored |
| Half-cent conversion used binary multiplication | Values such as `1.005` could round to 100 cents | Parse decimal digits and exponents, then round discarded digits in integer arithmetic |
| Recurring identity was descriptive | Independent schedules with the same title, kind, and cadence could merge or delete together | New schedules carry a random 128-bit `seriesId`; legacy matching remains only for old rows until edit |
| Negative planner pools produced negative row targets | Final-row-only clamping broke the target-sum invariant | Clamp the allocatable pool once before weekly distribution |
| “Next 7 days” included eight dates | Both endpoints of today through +7 were counted | Use the inclusive interval today through +6 |
| Negative imported prices survived but vanished from summaries | Direction and amount semantics contradicted one another | Reject negative prices; `kind` exclusively represents direction |

Each correction has regression coverage.

## Security inspection

### Trust boundaries

1. User typing enters the day editor, planner, search, ledger name, category,
   and group fields.
2. Files enter through encrypted JSON, `key.json`, legacy ZIP, confirmed
   plaintext JSON, receipt images, or PDFs.
3. IndexedDB contains ciphertext, a non-extractable device key, folder handles,
   and non-sensitive metadata.
4. `localStorage` contains UI preferences only.
5. Browser file and share APIs are outbound boundaries for encrypted backups
   and locally generated reports.
6. Same-origin bundled OCR/PDF/WASM code executes with application privileges.

There is no application backend and no ledger-fetch API.

### DOM XSS review

The source contains `innerHTML` because much of the interface is templated.
That is not automatically an XSS defect; exploitability depends on provenance.
The reviewed sinks fall into three classes:

- Static templates and fixed icon names, such as dialogs and button chrome.
- Numeric and enum-derived output, such as percentages, dates, chart geometry,
  and fixed copy.
- User labels inserted only after `Utils.escapeHtml`, including titles,
  categories, groups, search tokens, and calendar pills.

The boot error card is a static template. Its dynamic error message is assigned
with `textContent`. Notes are assigned to text-bearing properties and tooltips,
not interpreted as markup. Imported object keys `__proto__`, `constructor`, and
`prototype` are rejected.

Residual concern: `src/features/sidebar.js` has a generic helper accepting an
HTML string. Its current callers pass fixed copy, escaped labels, or numeric
formatters, but this helper is an attractive future sink. New callers must use
DOM construction or explicitly escape untrusted text.

### Input and resource boundaries

- JSON files: 32 MiB before parse.
- Ledger: 4,000 days, 250 entries/day, 25,000 entries total.
- Fields: title 200, note 2,000, category/group 40 characters.
- Prices and budgets: finite and bounded at 1 billion.
- ZIP: 8 entries, 8 MiB compressed, 16 MiB expanded, 8 MiB/entry.
- Receipt/PDF processing has file, page, line, and text caps in the receipt
  feature.
- Date keys are format checked and UTC round-tripped.
- Portable AES/HKDF secret material must be exactly 32 bytes.
- AES-GCM IVs are exactly 12 bytes and tags are 128 bits.
- PBKDF2-HMAC-SHA-256 accepts 210,000 through 1,200,000 iterations; exports
  currently write 600,000.

### Cryptography

Device autosave uses a non-extractable AES-256-GCM key. Portable v2 exports use
a random 256-bit master secret, HKDF-SHA-256 domain separation for encryption
and commitment material, a random 256-bit salt, and a random 96-bit IV.
Canonicalized header data is AES-GCM additional authenticated data. Optional
passphrases wrap the master secret with PBKDF2-HMAC-SHA-256 and AES-256-GCM.

The public commitment distinguishes a wrong key before payload decryption.
Portable secret buffers are overwritten on a best-effort basis. JavaScript
garbage collection means this is not guaranteed secure erasure.

### State and concurrency

- Save encryption and IndexedDB writes share a promise queue, preventing an old
  encryption from committing after a newer one.
- Device-key initialization is an atomic read-or-create transaction.
- Purge deletes ciphertext and the device key in one transaction and notifies
  other tabs.
- Export/import mutations share an action lock.

Residual concern: independently edited tabs remain last-writer-wins. Writes are
ordered, but business changes are not merged. `getState()` also intentionally
returns a live object; same-origin modules must call `patch()` rather than
mutate it directly so rendering and persistence are notified.

### Browser controls

The HTML sets a self-oriented CSP, disables objects and frames, restricts form
actions, upgrades insecure requests, and uses `no-referrer`. The policy still
contains `'unsafe-inline'` because frame stamping, route protection, boot error
handling, and JSON-LD are inline. Moving executable inline scripts to a hashed
or external bootstrap would improve containment.

Meta CSP cannot provide HSTS, `frame-ancestors`, or
`X-Content-Type-Options`; those require hosting response headers. HTTPS
enforcement and browser-profile compromise remain deployment risks.

## Mathematical verification

### Monetary representation

For an input amount \(a\), the application uses

\[
C(a)=\operatorname{round}(100a), \qquad M(c)=\frac{c}{100}.
\]

All additive financial paths sum \(C(a)\), not binary floating-point dollars.
Thus `0.1 + 0.2` is computed as \(10+20=30\) cents. Division is rounded once at
the output cent boundary:

\[
\operatorname{avgMoney}(A,n)=M\!\left(
  \operatorname{round}\left(\frac{C(A)}{n}\right)
\right), \quad n>0.
\]

The representation is safe under current ledger limits: 25,000 entries at
1 billion dollars total \(2.5\times10^{15}\) cents, below JavaScript's exact
integer limit \(2^{53}-1\approx9.0\times10^{15}\).

### Planner waterfall

Let \(I\) be counted income and \(S\) counted spend:

\[
\begin{aligned}
T &= \operatorname{roundCent}(I p_t/100),\\
A &= I-T,\\
R_w &= \operatorname{roundCent}\left(W\frac{D_m}{7}\right),\\
H &= [r]R_w + H_f + \operatorname{roundCent}(A p_s/100),\\
P &= A-H,\\
L &= P-S.
\end{aligned}
\]

Here \(T\) is tax withheld, \(A\) after-tax income, \(W\) the weekly savings
target, \(D_m\) days in the month, \(H\) total savings hold, \(P\) spendable
income, and \(L\) Potential Savings. `[r]` is 1 only when weekly reserve is
enabled. Default rules reduce exactly to deposited income minus logged spend.

Tax percentage is clamped to 0–50%; savings percentage to 0–100%. The
50/30/20 ratios are normalized to total 100 and are display caps, not duplicate
deductions.

### Time and runway

\[
\begin{aligned}
D_{\text{left}} &=
  \begin{cases}
  D_m & \text{future month}\\
  D_m-d_{\text{today}}+1 & \text{current month}\\
  0 & \text{past month},
  \end{cases}\\
\text{dailySafe} &= 
  \begin{cases}
  \operatorname{roundCent}(L/D_{\text{left}}) & D_{\text{left}}>0\\
  0 & \text{otherwise},
  \end{cases}\\
\text{dailyBurn} &=
  \begin{cases}
  \operatorname{roundCent}(S_{\le t}/D_{\text{observed}}) &
      D_{\text{observed}}>0\\
  0 & \text{otherwise},
  \end{cases}\\
\text{runwayDays} &=
  \begin{cases}
  \operatorname{round}_{0.1}(C/B) & B>0\\
  \text{null} & B\le0.
  \end{cases}
\end{aligned}
\]

Including today in remaining days is deliberate. \(S_{\le t}\) includes only
counted spend dated through the observation day, so future scheduled bills
reduce leftover without being misrepresented as historical burn. A future
viewed month has zero observed days. Division-by-zero paths return zero or
`null` according to whether zero is meaningful.

### Snapshot and summary

\[
\begin{aligned}
\text{monthNet} &= \text{scheduledIncome}-\text{loggedSpend},\\
\text{currentFunds} &= \text{settledIncome}_{\le t}
                       -\text{settledSpend}_{\le t},\\
\text{savingsFunds} &= \text{settled net before viewed month},\\
\text{savingsAfterMonth} &= \text{savingsFunds}+L,\\
\text{growthPotentialPct} &= 100L/\text{currentSavings},\\
\text{savingsRate} &= 100\,\text{monthNet}/\text{monthIncome}.
\end{aligned}
\]

Growth potential is `null` when current savings is non-positive. Savings rate
is `null` when month income is zero. Paid/pending percentages are zero for an
empty month. Previous-month percentage change is undefined (`null`) when the
previous total is zero and the current total is positive.

### Weekly allocation

Calendar rows are real Sunday–Saturday rows. A row with \(d_r\) in-month days
receives

\[
\operatorname{round}\left(P\frac{d_r}{D_m}\right)
\]

cents. The final row receives the remainder, so row targets sum exactly to
spendable income despite rounding. A warning rail requires exactly two days
with positive spend above daily safe; three or more produces the full alert.

### Recurrence and dates

- Weekly: \(t_i=t_0+7i\) UTC days.
- Monthly family: advance 1, 2, or 3 months and use
  \(\min(d_0,\text{daysInDestinationMonth})\).
- Seed horizon: 52 weekly copies or \(\lfloor12/s\rfloor\) monthly-step copies.
- Date shifts use integer UTC-day differences, avoiding daylight-saving
  23/25-hour days.

The clamping policy means a January 31 monthly series becomes February 28/29;
later occurrences are calculated from the original start day when seeded.
New schedules share a random 128-bit `seriesId`, which is the authoritative
identity for update and deletion. Legacy schedules without an ID retain the
title/kind/cadence heuristic until their next edit migrates all occurrences.

### Charts and classifiers

- Dial circumference: \(2\pi r\); fill is clamped to \([0,1]\).
- Spark normalization:
  \(y=p_t+h-(v-v_{\min})h/\max(v_{\max}-v_{\min},1)\).
- Category share: \(100c_i/\sum c\), guarded for an empty total.
- Budget use: \(100S/B\), evaluated only for positive caps.
- OCR amount scores are heuristic, not probabilities; all OCR output requires
  user confirmation.

## Residual recommendations

1. Remove executable inline scripts and then remove `'unsafe-inline'` from
   `script-src`.
2. Replace the generic sidebar HTML helper with typed DOM builders as that code
   is next changed.
3. Add optimistic revision checking if multi-tab editing becomes a supported
   workflow.
4. Keep all new money aggregation in integer cents and all date arithmetic in
   calendar/UTC units.
5. Treat OCR totals, dates, and categories as suggestions, never autonomous
   ledger writes.

