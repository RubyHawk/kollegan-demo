# Statement Of Applicability

Owner: ISMS Manager  
Review cadence: Quarterly and after risk methodology changes  
Status: Structured baseline

This is a working SoA index for ISO/IEC 27001:2022 readiness. The detailed per-control tracker lives in `docs/security/ANNEX_A_CONTROL_TRACKER.md`, and it must be completed with all Annex A controls before certification readiness is claimed.

| Control area                                      | Applicability | Rationale                                                                                                                                                                                     | Owner            | Evidence                                                                                                                                                                                     |
| ------------------------------------------------- | ------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Information security policies                     | Included      | ERP handles customer and business data.                                                                                                                                                       | Management       | `docs/security/ISMS_SCOPE.md`                                                                                                                                                                |
| Information security roles and responsibilities   | Included      | Access and release approvals need named owners.                                                                                                                                               | Management       | `docs/security/ACCESS_CONTROL.md`                                                                                                                                                            |
| Supplier relationships                            | Included      | GitHub, hosting, database, email, AI providers are in scope.                                                                                                                                  | ISMS Manager     | `docs/security/SUPPLIER_MANAGEMENT.md`, `docs/security/SUPPLIER_REVIEW_LOG.md`                                                                                                               |
| Governance contacts and supplier assurance        | Included      | External authorities, supplier expectations, and outsourced or AI-assisted development need named baseline controls even when detailed contacts or contracts stay outside the repo.           | ISMS Manager     | `docs/security/GOVERNANCE_CONTACTS_AND_THREAT_INTELLIGENCE.md`, `docs/security/SUPPLIER_ASSURANCE_STANDARD.md`                                                                               |
| Asset inventory and information handling          | Included      | The ERP handles production business data and security evidence that must be inventoried, classified, labelled, transferred, returned, and retired through controlled paths.                   | ISMS Manager     | `docs/security/ASSET_INVENTORY.md`, `docs/security/INFORMATION_HANDLING_STANDARD.md`, `docs/security/INFORMATION_TRANSFER_STANDARD.md`, `docs/security/ASSET_DISPOSAL_AND_REUSE_STANDARD.md` |
| People, employment, and remote working            | Included      | Access-bearing contributors and administrators need onboarding, confidentiality, offboarding, asset-return, and remote-working baselines even when personnel records remain outside the repo. | ISMS Manager     | `docs/security/PEOPLE_AND_EMPLOYMENT_SECURITY_STANDARD.md`, `docs/security/OFFBOARDING_AND_ASSET_RETURN_STANDARD.md`, `docs/security/REMOTE_WORKING_STANDARD.md`                             |
| Physical and hosting security                     | Included      | Physical and environmental protections are largely inherited from hosting and workplace controls, but they still need explicit baseline ownership, safe equipment handling, and review.       | ISMS Manager     | `docs/security/PHYSICAL_AND_HOSTING_SECURITY_STANDARD.md`, `docs/security/ASSET_DISPOSAL_AND_REUSE_STANDARD.md`, `docs/security/SUPPLIER_MANAGEMENT.md`                                      |
| Business continuity, records, and privacy         | Included      | Continuity, legal obligations, records protection, and privacy controls are required because the ERP handles customer-facing workflows and restricted business data.                          | ISMS Manager     | `docs/security/BUSINESS_CONTINUITY_STANDARD.md`, `docs/security/LEGAL_RECORDS_AND_PRIVACY_STANDARD.md`                                                                                       |
| Access control                                    | Included      | Admin, repo, production, and app access must be controlled.                                                                                                                                   | Engineering lead | `docs/security/ACCESS_CONTROL.md`, `docs/security/ACCESS_REVIEW_LOG.md`                                                                                                                      |
| Backup                                            | Included      | Business data must be recoverable.                                                                                                                                                            | Engineering lead | `docs/security/BACKUP_AND_RESTORE.md`, `docs/security/RESTORE_TEST_LOG.md`                                                                                                                   |
| Logging and monitoring                            | Included      | Feature flags, deployments, security events, and admin changes need evidence.                                                                                                                 | Engineering lead | `docs/security/AUDIT_EVIDENCE_INDEX.md`, `docs/security/FEATURE_FLAG_ROLLOUT_LOG.md`, `docs/security/INCIDENT_POSTMORTEM_LOG.md`, `.github/workflows/deploy.yml`                             |
| Secure development lifecycle                      | Included      | App is actively developed with AI-assisted workflows.                                                                                                                                         | Engineering lead | `docs/security/SECURE_DEVELOPMENT.md`, `.github/workflows/quality-gates.yml`                                                                                                                 |
| Remote working, authentication, and configuration | Included      | Remote administration, authentication, configuration changes, and software installation on operational systems need explicit baseline controls.                                               | Engineering lead | `docs/security/REMOTE_WORKING_STANDARD.md`, `docs/security/AUTHENTICATION_AND_CRYPTOGRAPHY_STANDARD.md`, `docs/security/CONFIGURATION_AND_APPLICATION_SECURITY_STANDARD.md`                  |
| Environment separation and test information       | Included      | Release validation, restore testing, and production safety require clear boundaries between production and non-production data handling.                                                      | Engineering lead | `docs/security/ENVIRONMENT_SEPARATION_STANDARD.md`, `docs/security/TEST_INFORMATION_STANDARD.md`, `docs/security/RESTORE_TEST_PLAYBOOK.md`                                                   |
| Hosting resilience and web filtering posture      | Included      | Hosting resilience and browsing posture are managed through continuity, supplier assurance, network hardening, and endpoint/admin baselines rather than ad hoc operational assumptions.       | Engineering lead | `docs/security/HOSTING_RESILIENCE_STANDARD.md`, `docs/security/WEB_FILTERING_BASELINE.md`                                                                                                    |
| Change management                                 | Included      | Refactor and releases need auditable controls.                                                                                                                                                | Engineering lead | `docs/security/CHANGE_MANAGEMENT.md`, `.github/workflows/deploy.yml`                                                                                                                         |
| Endpoint, data-lifecycle, and network operations  | Included      | Endpoint/admin devices, data-protection lifecycle, and network service posture need explicit baselines because they affect production access and restricted information handling.             | Engineering lead | `docs/security/ENDPOINT_AND_OPERATIONS_SECURITY_STANDARD.md`, `docs/security/DATA_PROTECTION_LIFECYCLE_STANDARD.md`, `docs/security/NETWORK_AND_SERVICE_SECURITY_STANDARD.md`                |
| Vulnerability management                          | Included      | Dependencies and app vulnerabilities require triage.                                                                                                                                          | Engineering lead | `docs/security/VULNERABILITY_MANAGEMENT.md`, `docs/security/VULNERABILITY_REVIEW_LOG.md`                                                                                                     |

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
- `docs/security/SECURITY_AWARENESS_LOG.md`
- `docs/security/SECURITY_AWARENESS_PLAYBOOK.md`
- `docs/security/SUPPLIER_REVIEW_LOG.md`
- `docs/security/SUPPLIER_REVIEW_PLAYBOOK.md`
- `docs/security/VULNERABILITY_REVIEW_LOG.md`
- `docs/security/VULNERABILITY_REVIEW_PLAYBOOK.md`

Use these coordinating runbooks to execute the recurring cycles in practical batches:

- `docs/security/ISMS_OPERATING_RHYTHM.md`
- `docs/security/RELEASE_EVIDENCE_CHECKLIST.md`
- `docs/security/QUARTERLY_EVIDENCE_PACKET.md`
- `docs/security/ANNUAL_GOVERNANCE_PACKET.md`

## Detailed Annex A Tracking

Use `docs/security/ANNEX_A_CONTROL_TRACKER.md` as the canonical detailed matrix for all 93 Annex A controls, including applicability decisions, owners, and evidence links. Use `docs/security/READINESS_STATUS.md` as the generated summary of tracker completion and still-empty operating records.

## Completion Rule

Certification readiness must not be claimed until all Annex A controls are listed with inclusion/exclusion justification and evidence links.
