# Internal Audit Playbook

Owner: ISMS Manager  
Review cadence: Before each internal audit  
Status: Baseline workflow

Use this playbook to prepare and run internal audits for the in-scope Kollegan ERP ISMS. Keep sensitive interview notes, raw screenshots, and credentials outside the repo.

## Minimum Scope

An internal audit should sample evidence for:

- ISMS scope and supplier list.
- Risk register updates and review cadence.
- Statement of Applicability maintenance.
- Access-control decisions and quarterly access reviews.
- Secure development, PR controls, and release workflow evidence.
- Backup/restore testing records.
- Incident/vulnerability handling records.

## Preparation Checklist

1. Confirm an auditor or reviewer who is independent from the audited change area where practical.
2. Define the audit window, scope, and evidence sources.
3. Review:
   - `docs/security/ISMS_SCOPE.md`
   - `docs/security/RISK_REGISTER.md`
   - `docs/security/STATEMENT_OF_APPLICABILITY.md`
   - `docs/security/AUDIT_EVIDENCE_INDEX.md`
   - operational logs under `docs/security/*_LOG.md`
4. Note which controls or records are sampled.
5. Record the completed audit in `INTERNAL_AUDIT_LOG.md`.

## Audit Questions

- Is the documented scope still accurate for the systems and vendors in use?
- Are high-risk engineering changes linked to repo-backed evidence?
- Are access review, restore test, incident, vulnerability, and rollout records present where expected?
- Are open gaps clearly visible rather than implied complete?
- Are corrective actions assigned owners and due dates?

## Outputs

- Findings summary.
- Nonconformities or improvement opportunities.
- Corrective actions with owners and due dates.
- Entry in `INTERNAL_AUDIT_LOG.md`.

