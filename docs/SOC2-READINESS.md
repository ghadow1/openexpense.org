# SOC 2 readiness assessment

Status as of 2026-08-17: **not SOC 2 certified and not yet audit-ready as an organizational control environment**.

SOC 2 is an independent CPA attestation over a defined system and period. Source code can support controls, but cannot establish management oversight, access reviews, incident exercises, vendor contracts, or months of operating evidence.

## Scope assumptions

OpenExpense is a static, client-only financial ledger with no application account or ledger backend. Security Common Criteria apply. Confidentiality is applicable because the product handles financial records. Availability applies if the operator makes uptime commitments. Privacy may be excluded if the operator never controls ledger content, but hosting metadata and support/security reports still require a documented privacy determination.

## Control readiness

| Area / criteria | Implemented evidence | Remaining gap | Readiness |
| --- | --- | --- | --- |
| Logical access (CC6) | No account backend; Git history; CODEOWNERS | Enforce MFA, least privilege, branch approvals, and quarterly access reviews for GitHub/domain/DNS | Partial |
| Encryption/confidentiality (CC6.1, CC6.7, C1) | AES-256-GCM, non-extractable autosave key, fresh export keys, fail-closed storage, bounded imports | Enable HTTPS/HSTS; approve key lifecycle and compromise procedures; retain restore evidence | Partial |
| Change management (CC8) | PR guidance; CI audit/tests/build/CodeQL; generated-bundle check; Dependabot | Require protected-branch approvals and passing checks; document emergency changes and rollback evidence | Partial |
| Risk assessment (CC3, CC9) | Threat model and this audit | Assign risk owners, review cadence, acceptance workflow, and management approval | Partial |
| Monitoring/response (CC4, CC7) | Private vulnerability reporting; CI security checks | Uptime/security monitoring, alert ownership, severity SLAs, incident exercises, retained postmortems | Initial |
| Availability/recovery (A1) | Git history and user-controlled encrypted exports | Define SLO/RTO/RPO, Pages/DNS recovery runbook, and recurring restore tests | Initial |
| Vendor management (CC9.2) | Locked dependencies; self-hosted runtime assets; automated advisories | Approved vendor inventory, owners, reviews, contracts/terms, assurance reports, and remediation SLA | Initial |
| Privacy (P1–P8, if scoped) | Data minimization; no ledger backend or analytics | Privacy notice, metadata inventory, subprocessors, retention, rights process, and legal scope decision | Initial |

## Required organizational evidence

The following cannot be supplied by repository code:

- Board/management control ownership and review.
- Workforce ethics, training, confidentiality, onboarding, and offboarding.
- GitHub, domain, DNS, and hosting access lists; MFA/SSO configuration; periodic review records.
- Actual PR approvals, emergency-change records, deployment approvals, and rollback tests.
- Risk-register approvals and documented risk acceptance.
- Incident alerts, exercises, notification decisions, evidence preservation, and postmortems.
- Vendor due diligence, contracts/DPAs, SOC reports, and periodic reassessment.
- Uptime history, SLO results, recovery objectives, and restore-test records.
- Privacy legal basis, retention execution, rights requests, and regulatory determinations.

## Readiness plan

1. Enable GitHub Pages HTTPS enforcement and deploy the response headers in `docs/SECURITY-HEADERS.md`.
2. Protect `main`: require pull requests, CODEOWNER review, passing security workflow, conversation resolution, and no force pushes.
3. Assign named owners for security, incident response, GitHub administration, domain/DNS, and vendor management.
4. Adopt a risk register with likelihood, impact, treatment, owner, due state, review date, and approval.
5. Run and retain quarterly access reviews and encrypted-backup restore tests.
6. Establish vulnerability and incident severity/response targets; perform and record a tabletop.
7. Inventory GitHub, npm, DNS/domain, hosting, and any support channels as vendors; retain review evidence.
8. Define the SOC 2 system boundary and whether Availability, Confidentiality, and Privacy categories are in scope.
9. Retain control evidence for the intended audit period before engaging an independent auditor.

## Suggested evidence index

- Pull requests, approvals, CI runs, release/deployment records
- Dependabot/CodeQL alerts and remediation records
- Quarterly access-review exports and sign-off
- Risk register and accepted-risk approvals
- Incident exercise report and any incident postmortems
- Vendor inventory and annual reviews
- HTTPS/header monitoring results
- Backup restore-test records
- Policy approvals and annual review history

This assessment is a gap analysis, not legal advice, certification, or an auditor’s opinion.
