# Incident response

## Report and triage

Use a private GitHub Security Advisory as described in `SECURITY.md`. Do not place working exploits or user ledger data in public issues.

Severity:

- **Critical:** active ledger/key exfiltration, compromised production release/domain, or plaintext persistence affecting users
- **High:** reliable unauthorized read/write, cryptographic bypass, or destructive import/export flaw
- **Medium:** user-assisted denial of service, significant defense bypass, or vulnerable reachable dependency
- **Low:** hardening gap with limited practical impact

## Response workflow

1. Acknowledge privately and record reporter, time, affected versions, and evidence location.
2. Assign an incident owner and severity; restrict evidence to responders.
3. Preserve relevant commits, release hashes, hosting/domain audit logs, and alerts. Never collect a user ledger unless explicitly required and securely authorized.
4. Contain: disable a compromised feature/dependency, revert a release, or move traffic to a known-good build.
5. Determine scope, entry point, affected assets, exposure window, and whether notification obligations apply.
6. Remediate on a private branch/advisory fork; add a regression test.
7. Validate clean dependencies, tests, production build, and deployment integrity.
8. Release, communicate precise user action, and rotate/revoke affected credentials or vendor access.
9. Complete a blameless post-incident review with cause, control failure, timeline, actions, owners, and evidence.

## Product-specific containment

- Suspected web supply-chain compromise: remove the affected asset, deploy a known-good self-hosted bundle, review domain/Pages history, and advise users not to open the site until cleared.
- Suspected autosave-key flaw: preserve ciphertext, prevent autosave overwrite, publish recovery guidance, and do not promise recovery without verification.
- Export-pair mismatch: preserve both destination and `.openexpense-recovery-*` files; identify matching `kid` values before decrypting.
- Malicious import/OCR file: retain only a cryptographic hash and minimal reproduction where possible; do not redistribute sensitive source documents.

## Evidence to retain

- Private advisory and response timeline
- Commit/build/deployment identifiers and hashes
- Access and configuration audit records
- Tests and validation output
- User/vendor communications and notification decision
- Post-incident review and tracked corrective actions

Named responders, external counsel/notification contacts, response targets, and exercise records must be maintained by the project owner outside this public repository.
