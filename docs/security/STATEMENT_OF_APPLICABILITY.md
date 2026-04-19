# Statement Of Applicability

Owner: ISMS Manager  
Review cadence: Quarterly and after risk methodology changes  
Status: Draft baseline

This is a working SoA index for ISO/IEC 27001:2022 readiness. It must be completed with all Annex A controls before certification readiness is claimed.

| Control area | Applicability | Rationale | Owner | Evidence |
|---|---|---|---|---|
| Information security policies | Included | ERP handles customer and business data. | Management | `docs/security/ISMS_SCOPE.md` |
| Information security roles and responsibilities | Included | Access and release approvals need named owners. | Management | `docs/security/ACCESS_CONTROL.md` |
| Supplier relationships | Included | GitHub, hosting, database, email, AI providers are in scope. | ISMS Manager | `docs/security/SUPPLIER_MANAGEMENT.md` |
| Access control | Included | Admin, repo, production, and app access must be controlled. | Engineering lead | `docs/security/ACCESS_CONTROL.md` |
| Backup | Included | Business data must be recoverable. | Engineering lead | `docs/security/BACKUP_AND_RESTORE.md` |
| Logging and monitoring | Included | Feature flags, deployments, security events, and admin changes need evidence. | Engineering lead | `docs/security/AUDIT_EVIDENCE_INDEX.md` |
| Secure development lifecycle | Included | App is actively developed with AI-assisted workflows. | Engineering lead | `docs/security/SECURE_DEVELOPMENT.md` |
| Change management | Included | Refactor and releases need auditable controls. | Engineering lead | `docs/security/CHANGE_MANAGEMENT.md` |
| Vulnerability management | Included | Dependencies and app vulnerabilities require triage. | Engineering lead | `docs/security/VULNERABILITY_MANAGEMENT.md` |

## Completion Rule

Certification readiness must not be claimed until all Annex A controls are listed with inclusion/exclusion justification and evidence links.

