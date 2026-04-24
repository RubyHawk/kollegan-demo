# Backup And Restore

Owner: Engineering lead  
Review cadence: Quarterly  
Status: Draft baseline

## Backup Requirements

- Production database backup before schema deploys.
- Scheduled database backups.
- Backup timestamp and commit SHA recorded for migration-related backups.
- Backup storage location documented outside this repository if sensitive.

## Restore Test

At least quarterly:

1. Restore backup into non-production environment.
2. Run migration deploy if relevant.
3. Run smoke tests.
4. Record result and evidence link.

Never commit backup files to the repository.

## Evidence

- Record completed restore tests in `RESTORE_TEST_LOG.md`.
- Keep `AUDIT_EVIDENCE_INDEX.md` as the high-level index for restore-test cycles tied to migrations or release changes.

