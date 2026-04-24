# Hosting Resilience Standard

Owner: Engineering lead  
Review cadence: Quarterly and after material hosting or deployment changes  
Status: Baseline identified

This standard defines the minimum baseline for hosting resilience and redundancy of information processing facilities used by Kollegan ERP.

## Baseline Position

- Kollegan currently relies on hosting/provider resilience, backup/restore capability, controlled deploy/rollback, and incident response rather than fully redundant self-managed infrastructure inside the repository boundary.
- Redundancy and resilience assumptions must be reviewed whenever hosting, database, deploy, or operational recovery assumptions materially change.

## Minimum Resilience Expectations

- Keep the deploy path reproducible from Git-tracked workflow and deploy script changes.
- Keep backup and restore capability available and exercised through restore-test workflows.
- Treat hosting and supplier resilience characteristics as part of supplier assurance and continuity review.
- Use incident, restore-test, and deploy healthcheck outcomes to reassess resilience assumptions.

## Related Evidence

- `docs/security/BUSINESS_CONTINUITY_STANDARD.md`
- `docs/security/BACKUP_AND_RESTORE.md`
- `docs/security/RESTORE_TEST_PLAYBOOK.md`
- `docs/security/SUPPLIER_ASSURANCE_STANDARD.md`
- `.github/workflows/deploy.yml`
