# Statement Of Applicability

Owner: ISMS Manager  
Review cadence: Quarterly and after risk methodology changes  
Status: Structured baseline

This is a working SoA index for ISO/IEC 27001:2022 readiness. The detailed per-control tracker lives in `docs/security/ANNEX_A_CONTROL_TRACKER.md`, and it must be completed with all Annex A controls before certification readiness is claimed.

| Control area | Applicability | Rationale | Owner | Evidence |
|---|---|---|---|---|
| Information security policies | Included | ERP handles customer and business data. | Management | `docs/security/ISMS_SCOPE.md` |
| Information security roles and responsibilities | Included | Access and release approvals need named owners. | Management | `docs/security/ACCESS_CONTROL.md` |
| Supplier relationships | Included | GitHub, hosting, database, email, AI providers are in scope. | ISMS Manager | `docs/security/SUPPLIER_MANAGEMENT.md` |
| Access control | Included | Admin, repo, production, and app access must be controlled. | Engineering lead | `docs/security/ACCESS_CONTROL.md`, `docs/security/ACCESS_REVIEW_LOG.md` |
| Backup | Included | Business data must be recoverable. | Engineering lead | `docs/security/BACKUP_AND_RESTORE.md`, `docs/security/RESTORE_TEST_LOG.md` |
| Logging and monitoring | Included | Feature flags, deployments, security events, and admin changes need evidence. | Engineering lead | `docs/security/AUDIT_EVIDENCE_INDEX.md`, `docs/security/FEATURE_FLAG_ROLLOUT_LOG.md`, `docs/security/INCIDENT_POSTMORTEM_LOG.md`, `.github/workflows/deploy.yml` |
| Secure development lifecycle | Included | App is actively developed with AI-assisted workflows. | Engineering lead | `docs/security/SECURE_DEVELOPMENT.md`, `.github/workflows/quality-gates.yml` |
| Change management | Included | Refactor and releases need auditable controls. | Engineering lead | `docs/security/CHANGE_MANAGEMENT.md`, `.github/workflows/deploy.yml` |
| Vulnerability management | Included | Dependencies and app vulnerabilities require triage. | Engineering lead | `docs/security/VULNERABILITY_MANAGEMENT.md`, `docs/security/VULNERABILITY_REVIEW_LOG.md` |

## Clause-Level Operating Records

The following clause-level operating evidence is tracked alongside this SoA and must contain real entries before certification readiness is claimed:

- `docs/security/ACCESS_REVIEW_LOG.md`
- `docs/security/ACCESS_REVIEW_CHECKLIST.md`
- `docs/security/RESTORE_TEST_LOG.md`
- `docs/security/RESTORE_TEST_PLAYBOOK.md`
- `docs/security/INTERNAL_AUDIT_LOG.md`
- `docs/security/MANAGEMENT_REVIEW_LOG.md`
- `docs/security/INTERNAL_AUDIT_PLAYBOOK.md`
- `docs/security/MANAGEMENT_REVIEW_AGENDA.md`
- `docs/security/FEATURE_FLAG_ROLLOUT_LOG.md`
- `docs/security/INCIDENT_POSTMORTEM_LOG.md`
- `docs/security/INCIDENT_RESPONSE_DRILL_PLAYBOOK.md`
- `docs/security/VULNERABILITY_REVIEW_LOG.md`
- `docs/security/VULNERABILITY_REVIEW_PLAYBOOK.md`

## Detailed Annex A Tracking

Use `docs/security/ANNEX_A_CONTROL_TRACKER.md` as the canonical detailed matrix for all 93 Annex A controls, including applicability decisions, owners, and evidence links.

## Completion Rule

Certification readiness must not be claimed until all Annex A controls are listed with inclusion/exclusion justification and evidence links.

