# Restore Test Playbook

Owner: Engineering lead  
Review cadence: Before each quarterly restore test and before high-risk schema changes  
Status: Baseline workflow

Use this playbook to run non-production backup restore tests for Kollegan ERP. Do not commit backup files, dumps, credentials, or sensitive production data.

## Minimum Inputs

- Backup reference or restore point identifier.
- Target non-production environment.
- Relevant migration or release context, if the test supports a schema change.
- Smoke-test list for critical ERP flows.

## Restore Test Steps

1. Confirm the restore target is non-production.
2. Restore the selected backup into the target environment.
3. If the test supports a migration or release, run the relevant deploy or migration step.
4. Validate at least:
   - application starts,
   - database is reachable,
   - core offer/project/company/product flows smoke-check cleanly,
   - counts or other sanity checks do not show obvious drift.
5. Record any failures, drift, or follow-up work.
6. Enter the completed result in `RESTORE_TEST_LOG.md`.

## Outputs

- Backup reference used.
- Target environment.
- Validation summary and outcome.
- Follow-up actions if needed.
- Entry in `RESTORE_TEST_LOG.md`.

