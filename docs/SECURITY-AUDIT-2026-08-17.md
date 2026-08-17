# Security audit — 2026-08-17

Scope: the `main`-branch static application, encrypted IndexedDB autosave, import/export, linked-folder saves, receipt/PDF processing, dependencies, browser security controls, and repository change controls.

This is an engineering security review, not a penetration-test guarantee or a SOC 2 opinion.

## Outcome

No intentional ledger upload, embedded credential, account backend, analytics collector, or exploitable ledger-title/note XSS path was found. AES-GCM uses random 96-bit IVs and 256-bit keys. Imported ledger fields are allowlisted and bounded.

The review did find material failure modes. The changes accompanying this report address the highest-confidence code risks:

| Risk | Severity before | Remediation |
| --- | --- | --- |
| Remote OCR/PDF JavaScript executes with ledger-origin privileges | High | OCR, ONNX runtime, models, PDF.js worker, fonts, and icons are now bundled or served from `/vendor`; automatic OCR warming was removed |
| Device-key creation races between tabs | High | Atomic IndexedDB get-or-create transaction |
| Linked-folder pair can become mismatched on a partial overwrite | High | Complete recovery pair is staged and size-verified before destination overwrite; recovery pair remains on partial failure |
| Clear reports success without durable deletion | High | Ciphertext and device key are deleted in one committed transaction before success is shown |
| Autosaves can complete out of order | Medium | Encryption and writes are serialized through one save queue |
| Encryption failure falls back to plaintext persistence | High | Storage now fails closed; no new plaintext IndexedDB record is written |
| Corrupt local ciphertext silently becomes an empty ledger | Medium | Autosave pauses and the encrypted record is preserved with a recovery warning |
| ZIP decompression bomb | Medium | Compressed, per-entry, entry-count, and expanded-size limits |
| Weak portable AES key accepted | Low | Key material must decode to exactly 32 bytes |
| Oversized receipt/PDF resource use | Low | 15 MB file, 20-page, line, and text caps |
| Boot error DOM-XSS sink | Low | Error text is assigned through `textContent` |
| Known transitive dependency advisory | Moderate | Lockfile updated; `npm audit --omit=dev` reports zero vulnerabilities at audit time |
| No browser containment policy | Medium | Self-only meta CSP and no-referrer policy; executable runtime assets are same-origin |
| No automated security gate | High (process) | CI runs audit, tests, build reproducibility, and CodeQL; Dependabot and CODEOWNERS added |

## Linked-folder save safety

Browsers do not expose an atomic rename/replace transaction for two files. OpenExpense now:

1. Encrypts the current payload with a fresh portable key.
2. Writes and verifies a complete, uniquely named `.openexpense-recovery-*` pair.
3. Updates the requested ledger/key destinations.
4. Removes the recovery pair only after both destination writes verify.

If destination update fails, the recovery pair remains. Existing matching filenames are overwritten only when both parse as a valid, matching OpenExpense pair. This avoids silently replacing unrelated files.

The normal two-file download flow cannot be made atomic because each save/share is controlled by the browser or OS. The UI continues to warn when only one file is saved.

## Residual risks and required follow-up

1. **HTTPS is not enforced in GitHub Pages settings.** The API reported `https_enforced: false` and an `http://` Pages URL. New local persistence now fails closed without Web Crypto, but the repository owner must enable “Enforce HTTPS.” HSTS and top-level HTTP redirects cannot be guaranteed by HTML.
2. **Security headers require hosting configuration.** A meta CSP is defense in depth, but `frame-ancestors`, HSTS, `X-Content-Type-Options`, and Permissions Policy must be response headers. See `docs/SECURITY-HEADERS.md`.
3. **Browser-profile compromise remains out of scope.** A same-origin attacker or compromised browser profile can ask the non-extractable key to decrypt; non-extractable does not mean unusable by origin code.
4. **Portable export custody is user-controlled.** Anyone with both encrypted JSON and matching `key.json` can decrypt the ledger.
5. **Cross-tab edits are serialized at IndexedDB commit time but not merged.** Two independently edited open tabs can still produce last-writer-wins business conflicts. Users should edit in one tab.
6. **JavaScript memory cannot be securely erased.** Key-reference clearing is best effort; garbage collection and browser buffers are outside application control.
7. **OCR model files are reviewed data artifacts, not source code, but inference runtimes still parse complex binary formats.** Dependency and model updates require review.

## Verification performed

- `npm test` (including AES-256 key-length and ZIP expansion tests)
- `npm audit --omit=dev`
- production bundle build
- static search for dangerous DOM, dynamic execution, storage, network, and file APIs
- manual review of encryption, persistence, import/export, linked-folder, OCR/PDF, and boot paths

## Recommended cadence

- Dependency/security workflow: every pull request and weekly schedule
- Threat-model review: quarterly and before storage/export architecture changes
- Restore test: quarterly, using an exported JSON/key pair in a clean browser profile
- Access review: quarterly for GitHub, domain/DNS, and Pages administrators
- Incident-response tabletop: annually and after material architecture changes
