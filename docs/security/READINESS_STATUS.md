# Security Readiness Status

This document is generated from the current checkout. Run:

```txt
npm run check:security-readiness:write
```

It summarizes what the repository can currently prove about ISO/IEC 27001:2022 readiness structure and which operating records are still missing. It does not invent evidence that has not been recorded.

## Snapshot Summary

| Metric | Value |
|---|---:|
| Annex A controls tracked | 93 |
| Included controls | 93 |
| Excluded controls | 0 |
| Review required controls | 0 |
| Controls missing applicability decision | 0 |
| Controls with baseline evidence linked | 93 |
| Controls with open gaps | 0 |
| Controls missing implementation status | 0 |
| Operational evidence registers tracked | 10 |
| Empty operational evidence registers | 10 |
| Open gap rows in audit evidence index | 10 |

## Structural Readiness Observations

- All 93 Annex A controls currently have an applicability decision in `ANNEX_A_CONTROL_TRACKER.md`.
- All tracked Annex A controls currently have an implementation-status value.
- Remaining readiness gaps in the repository are primarily missing operating records, not missing baseline structure.
- Certification readiness still must not be claimed until the operating logs contain real completed entries.

## Operational Evidence Register Status

| Register | Status | Owner | Note |
| --- | --- | --- | --- |
| Access reviews | Empty register | ISMS Manager | No repo-backed records committed as of 2026-04-24. |
| Restore tests | Empty register | Engineering lead | No repo-backed records committed as of 2026-04-24. |
| Internal audits | Empty register | ISMS Manager | No repo-backed records committed as of 2026-04-24. |
| Management reviews | Empty register | Management | No repo-backed records committed as of 2026-04-24. |
| Feature-flag rollouts | Empty register | Engineering lead | No repo-backed records committed as of 2026-04-24. |
| Incidents and drills | Empty register | ISMS Manager | No repo-backed records committed as of 2026-04-24. |
| Vulnerability reviews | Empty register | Engineering lead | No repo-backed records committed as of 2026-04-24. |
| Supplier reviews | Empty register | ISMS Manager | No repo-backed records committed as of 2026-04-24. |
| Security awareness | Empty register | ISMS Manager | No repo-backed records committed as of 2026-04-24. |
| Asset lifecycle | Empty register | ISMS Manager | No repo-backed records committed as of 2026-04-24. |

## Open Gaps From Audit Evidence Index

| Section | Scope or activity | Owner | Summary |
| --- | --- | --- | --- |
| Feature Flag Rollout Evidence | Public offer rewrite | Engineering lead | production \| Repo-backed rollout log now exists in `FEATURE_FLAG_ROLLOUT_LOG.md`, but no completed production rollout record is committed yet \| Roll back by disabling the renderer flag and falling back to `legacy` in the public offer renderer |
| Access Reviews | Application admin, repository, VPS, database, and CI/CD secret access | ISMS Manager | Repo-backed log and checklist now exist in `ACCESS_REVIEW_LOG.md` and `ACCESS_REVIEW_CHECKLIST.md`, but no completed quarterly review record is committed yet |
| Backup Restore Tests | Production backup references are external to the repo | Engineering lead | Repo-backed log and playbook now exist in `RESTORE_TEST_LOG.md` and `RESTORE_TEST_PLAYBOOK.md`, but no completed quarterly restore-test record is committed yet \| Pending |
| Internal Audit And Management Review | Internal audit | ISMS Manager | Repo-backed log and audit workflow now exist in `INTERNAL_AUDIT_LOG.md` and `INTERNAL_AUDIT_PLAYBOOK.md`, but no completed internal audit record is committed yet \| Schedule independent review and record findings/corrective actions |
| Internal Audit And Management Review | Management review | Management | Repo-backed log and agenda now exist in `MANAGEMENT_REVIEW_LOG.md` and `MANAGEMENT_REVIEW_AGENDA.md`, but no completed management review record is committed yet \| Record management review decisions, owners, and follow-up actions |
| Incident And Vulnerability Operations | Incident drill/response | ISMS Manager | Repo-backed log and drill workflow now exist in `INCIDENT_POSTMORTEM_LOG.md` and `INCIDENT_RESPONSE_DRILL_PLAYBOOK.md`, but no record is committed yet |
| Incident And Vulnerability Operations | Vulnerability review | Engineering lead | Repo-backed log and review workflow now exist in `VULNERABILITY_REVIEW_LOG.md` and `VULNERABILITY_REVIEW_PLAYBOOK.md`, but no review record is committed yet |
| Supplier Reviews | In-scope SaaS, hosting, database, and AI suppliers | ISMS Manager | Repo-backed log and review workflow now exist in `SUPPLIER_REVIEW_LOG.md` and `SUPPLIER_REVIEW_PLAYBOOK.md`, but no completed supplier review record is committed yet |
| Awareness And Training | In-scope engineering and admin/support awareness | ISMS Manager | Repo-backed log and workflow now exist in `SECURITY_AWARENESS_LOG.md` and `SECURITY_AWARENESS_PLAYBOOK.md`, but no completed awareness or training record is committed yet |
| Asset Lifecycle | Offboarding asset return and secure disposal/reuse events | ISMS Manager | Repo-backed lifecycle log and baselines now exist in `ASSET_LIFECYCLE_LOG.md`, `OFFBOARDING_AND_ASSET_RETURN_STANDARD.md`, and `ASSET_DISPOSAL_AND_REUSE_STANDARD.md`, but no completed lifecycle record is committed yet |

## Next Highest-Value Actions

- Record the first completed production rollout or rollback in `docs/security/FEATURE_FLAG_ROLLOUT_LOG.md` when the public-offer rewrite or another production-impacting release flag changes state.
- Complete the first quarterly access review and record the outcome in `docs/security/ACCESS_REVIEW_LOG.md` using `docs/security/ACCESS_REVIEW_CHECKLIST.md`.
- Run the first non-production restore test and record the outcome in `docs/security/RESTORE_TEST_LOG.md` using `docs/security/RESTORE_TEST_PLAYBOOK.md`.
- Schedule and record the first internal audit and management review cycles in their respective logs using the linked playbooks and agenda.
- Run the first incident drill and vulnerability review cycle, then record both outcomes in the corresponding logs.
- Complete the first supplier review cycle for in-scope suppliers and record it in `docs/security/SUPPLIER_REVIEW_LOG.md`.
- Run the first awareness or training cycle and record the completed activity in `docs/security/SECURITY_AWARENESS_LOG.md`.
- Record the first repo-safe asset return, secure disposal, reuse, or exception outcome in `docs/security/ASSET_LIFECYCLE_LOG.md` when such an event occurs.
