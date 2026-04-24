# Environment Separation Standard

Owner: Engineering lead  
Review cadence: Quarterly and after infrastructure or release-process changes  
Status: Baseline identified

This standard defines the minimum separation expectations between development, test, and production environments for Kollegan ERP.

## Separation Rules

- Production customer and business data must stay in production or controlled recovery/testing flows explicitly approved outside normal development work.
- Pull-request validation, local development, and CI quality gates are non-production activities and must not require direct use of production credentials or destructive production access.
- Production deploys must use the tracked GitHub release workflow and the tracked VPS deploy script, not ad hoc local-only deployment steps.
- Restore tests must target non-production environments and follow `RESTORE_TEST_PLAYBOOK.md`.
- Demo routes and demo data are isolated from ERP production architecture and must not be used to replace or overwrite production records.

## Practical Environment Boundaries

| Environment or lane | Purpose | Data expectation | Baseline controls |
| --- | --- | --- | --- |
| Local development | Feature work, debugging, non-production validation | Synthetic, redacted, or otherwise non-production by default | `docs/AI_ENGINEERING.md`, `docs/PRODUCTION_DATA_SAFETY.md`, `docs/security/SECURE_DEVELOPMENT.md` |
| Pull-request CI | Merge gating and release validation | No committed secrets or production exports; generated Prisma client only | `.github/workflows/quality-gates.yml`, `docs/security/CHANGE_MANAGEMENT.md` |
| Non-production restore-test target | Backup recovery verification | Controlled restore target only; never committed to repo | `docs/security/RESTORE_TEST_PLAYBOOK.md`, `docs/security/BACKUP_AND_RESTORE.md` |
| Production runtime | Customer-facing ERP, public offers, signing, admin/support access | Restricted production data | `.github/workflows/deploy.yml`, `scripts/deploy-release.sh`, `docs/PRODUCTION_DATA_SAFETY.md` |

## Related Evidence

- `.github/workflows/quality-gates.yml`
- `.github/workflows/deploy.yml`
- `docs/security/CHANGE_MANAGEMENT.md`
- `docs/security/RESTORE_TEST_PLAYBOOK.md`
