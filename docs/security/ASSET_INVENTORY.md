# Asset Inventory

Owner: ISMS Manager  
Review cadence: Quarterly and after material architecture or supplier changes  
Status: Baseline identified

This inventory is a repo-backed baseline for in-scope information assets and supporting systems referenced by the ERP refactor and ISO/IEC 27001:2022 readiness work.

Do not commit secrets, customer exports, backups, or infrastructure credentials here.

## Classification Baseline

- `Restricted`: production customer data, authentication data, signing material, backup references, and security-sensitive infrastructure details
- `Internal`: engineering docs, operational logs without secrets, architecture docs, and supplier review notes
- `Public`: intentionally public marketing/demo material and public offer pages that do not expose protected internal data

## In-Scope Assets

| Asset | Type | Primary data or function | Default classification | Owner | Evidence/source |
| --- | --- | --- | --- | --- | --- |
| Kollegan ERP application | Application service | Core ERP business workflows, public offers, admin/support operations | Internal | Engineering lead | `docs/security/ISMS_SCOPE.md`, `docs/ARCHITECTURE.md` |
| Production business data store | Database | Offers, signatures, customers, companies, products, projects, purchase orders, users, organization data | Restricted | Engineering lead | `docs/PRODUCTION_DATA_SAFETY.md`, `docs/security/BACKUP_AND_RESTORE.md` |
| Source repository and pull-request workflow | Repository / SDLC platform | Source code, PR reviews, CI metadata, release evidence | Internal | Engineering lead | `.github/workflows/quality-gates.yml`, `docs/security/SECURE_DEVELOPMENT.md` |
| Deployment workflow and VPS runtime | Hosting / deployment | Release artifacts, runtime configuration, service restart path, operational logs | Restricted | Engineering lead | `.github/workflows/deploy.yml`, `scripts/deploy-release.sh`, `docs/vps-security-guide.html` |
| Backup and restore process records | Operational record set | Backup references, restore-test evidence, migration backup checkpoints | Restricted | Engineering lead | `docs/security/BACKUP_AND_RESTORE.md`, `docs/security/RESTORE_TEST_LOG.md` |
| Security evidence and ISMS documentation | Documentation set | Policies, evidence index, SoA, review logs, playbooks | Internal | ISMS Manager | `docs/security/AUDIT_EVIDENCE_INDEX.md`, `docs/security/STATEMENT_OF_APPLICABILITY.md` |
| AI-assisted development workflow | Development process | Prompt context, code context, AI usage rules, agent instructions | Internal | Engineering lead | `docs/AI_ENGINEERING.md`, `docs/security/AI_USAGE_POLICY.md` |
| Transactional email and public offer delivery | Business communication flow | Offer emails, signing links, customer-facing delivery metadata | Restricted | Engineering lead | `docs/security/SUPPLIER_MANAGEMENT.md`, `docs/PRODUCTION_DATA_SAFETY.md` |
| Assigned endpoint devices and removable media | Operational asset class | Laptops, phones, hardware keys, removable media, and printed/exported material that can hold Kollegan information | Restricted | ISMS Manager | `docs/security/OFFBOARDING_AND_ASSET_RETURN_STANDARD.md`, `docs/security/ASSET_DISPOSAL_AND_REUSE_STANDARD.md` |

## Review Rule

- Add or update rows when a new in-scope supplier, environment, or data-bearing workflow is introduced.
- Record supplier-specific review outcomes in `SUPPLIER_REVIEW_LOG.md`; keep this file as the higher-level asset baseline.
- Keep serial-level asset inventories or sensitive custody records outside the repository when they contain personnel or operationally sensitive detail.
