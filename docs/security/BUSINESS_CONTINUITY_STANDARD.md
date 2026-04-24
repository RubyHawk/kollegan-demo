# Business Continuity Standard

Owner: ISMS Manager  
Review cadence: Quarterly and after material infrastructure or incident changes  
Status: Baseline identified

This standard defines the minimum continuity baseline for keeping Kollegan ERP available or recoverable during disruption.

## Priority Services

- Production ERP runtime and public-offer/signing paths
- Production database and backup/restore capability
- Deployment and rollback path from Git-tracked artifacts
- Incident response and recovery coordination

## Baseline Continuity Rules

- Production releases must fail loudly on healthcheck or deployment-path failures rather than silently continuing.
- Backup and restore capability must be exercised through non-production restore tests.
- Incident drills and postmortems must feed corrective actions back into engineering or governance evidence.
- Recovery procedures must prefer controlled rollback, restore, or safe degraded operation over untracked emergency changes.

## ICT Readiness Expectations

- Keep the deploy path reproducible from Git-tracked workflow and deploy script changes.
- Keep recovery evidence in restore-test and incident-response records.
- Review continuity assumptions after major hosting, database, deployment, or supplier changes.

## Related Evidence

- `.github/workflows/deploy.yml`
- `scripts/deploy-release.sh`
- `docs/security/BACKUP_AND_RESTORE.md`
- `docs/security/RESTORE_TEST_PLAYBOOK.md`
- `docs/security/INCIDENT_RESPONSE.md`
