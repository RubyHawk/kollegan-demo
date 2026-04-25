# Quarterly Evidence Packet

Owner: ISMS Manager  
Review cadence: Before each quarterly ISMS review cycle  
Status: Structured baseline complete

Use this packet to run the quarterly minimum operating cycle for Kollegan ERP. The goal is to complete the recurring reviews that matter for stage 2 without turning quarterly work into a heavyweight project.

## Quarterly Scope

Complete or explicitly assess these areas:

- access review,
- non-production restore test,
- supplier review,
- awareness or training touchpoint,
- asset lifecycle review,
- release-flag rollouts since the previous quarter.

## Preparation

1. Pick the review window and owners.
2. Open:
   - `docs/security/ACCESS_REVIEW_CHECKLIST.md`
   - `docs/security/RESTORE_TEST_PLAYBOOK.md`
   - `docs/security/SUPPLIER_REVIEW_PLAYBOOK.md`
   - `docs/security/SECURITY_AWARENESS_PLAYBOOK.md`
   - `docs/security/OFFBOARDING_AND_ASSET_RETURN_STANDARD.md`
   - `docs/security/FEATURE_FLAG_ROLLOUT_LOG.md`
3. Decide which quarter label and date range you will use across the entries.

## Execution Order

1. Complete the access review and write the resulting row to `ACCESS_REVIEW_LOG.md`.
2. Run the restore test and write the resulting row to `RESTORE_TEST_LOG.md`.
3. Review in-scope suppliers and write the resulting row to `SUPPLIER_REVIEW_LOG.md`.
4. Run one awareness or training touchpoint and write the resulting row to `SECURITY_AWARENESS_LOG.md`.
5. Check whether any asset return, disposal, reuse, or exception events happened:
   - if yes, add a row to `ASSET_LIFECYCLE_LOG.md`,
   - if no, keep the gap open and note the absence outside the repo if needed.
6. Check whether any production release-flag events happened during the quarter:
   - if yes, make sure they are recorded in `FEATURE_FLAG_ROLLOUT_LOG.md`,
   - if no, keep the gap open.

## Quarterly Outputs

- Updated quarterly records in the applicable logs.
- Removed `Open gap as of ...` rows only for activities that now have real committed records.
- Regenerated:
  - `docs/security/READINESS_STATUS.md`
  - `docs/security/OPERATIONAL_CLOSEOUT_STATUS.md`
  - `docs/PLAN_STATUS.md`

## Small-Company Rule

If time is tight, do not skip the cycle entirely. Do the smallest honest version that still produces a real record:

- one real access review,
- one real restore test,
- one real supplier review,
- one real awareness action,
- one honest asset-lifecycle assessment.
