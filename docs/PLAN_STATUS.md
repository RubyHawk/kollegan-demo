# Refactor Plan Status

This document is generated from the current checkout. Run:

```txt
npm run check:plan-status:write
```

It summarizes what the repository can currently prove about the ERP refactor and ISO readiness plan. It only reports repo-backed completion for structural work and does not invent completed operational evidence.

## Repo-Backed Completion

| Area | Status | Repo-backed completion | Evidence |
| --- | --- | ---: | --- |
| Engineering / refactor structure | Open | 0% | All 18 implementation-order items are structurally covered in the repo; inventory shows 1 legacy wrappers, 0 files above 1000 lines, 14 files above 500 lines, and 9 dead-candidate rows. |
| Governance / evidence structure | Complete | 100% | 93 Annex A controls are tracked, 93 have baseline evidence linked, 0 are missing applicability, 0 have structural open gaps, 0 are missing implementation status, and ISMS scope has no pending-decision language. |
| Total repo-backed plan structure | Open | 0% | Some repo-side structural plan requirements are still missing or inconsistent. |

## Snapshot Summary

| Metric | Value |
|---|---:|
| Implementation-order items in plan | 18 |
| Tracked files scanned | 1017 |
| Source files scanned | 812 |
| API route files | 118 |
| API v1 route files | 81 |
| Feature API clients | 23 |
| Legacy API compatibility wrappers | 1 |
| Files above 1000 lines | 0 |
| Files above 500 lines | 14 |
| Dead-candidate review rows | 9 |
| Literal legacy `/api/*` references outside route files | 40 |
| Annex A controls tracked | 93 |
| Controls with baseline evidence linked | 93 |
| Empty operational evidence registers | 10 |
| Open gap rows in audit evidence index | 10 |

## Evidence-Backed Milestones

| Milestone | Status | Evidence |
| --- | --- | --- |
| Read-first baseline docs | Complete | All listed read-first docs are present in `docs/`. |
| Render and API contract baseline | Complete | Key contract and client verification files exist: `api-client.test.ts`, `feature-flags-api-contract.test.ts`, `public-offer-api-contract.test.ts`, and `theme-bootstrap.test.ts`. |
| API v1 migration and wrappers | Open | Inventory shows 81 `/api/v1` route files, 23 feature API clients, and 1 legacy compatibility wrappers. |
| Cleanup and file-size enforcement | Open | Inventory shows 0 files above 1000 lines, 14 files above 500 lines, and 9 dead-candidate review rows. |
| ISO readiness structure | Complete structurally | 93 Annex A controls are tracked, 0 are missing applicability, 0 have open-gap implementation status, and 0 are missing implementation status. |
| Operational evidence execution | Operational work remaining | 10 operational registers are tracked, 10 are still empty, and the audit evidence index still has 10 open-gap rows. |
| ISMS scope decisions | Complete structurally | ISMS scope status is "Structured baseline" and the current out-of-scope list has 3 explicit items. |

## Structural Readiness Notes

- The cleanup inventory currently reports `1` legacy API compatibility wrappers and `9` dead-candidate review rows.
- The inventory still reports `40` literal legacy `/api/*` references outside route files; the generated inventory distinguishes expected demo, public-document, OpenAPI, proxy, and integration rows from migration blockers.
- The readiness dashboard currently reports `10` empty operational registers and `10` open evidence-index rows, which means the remaining plan work is mostly operating the ISMS and recording real events.
- ISMS scope is currently marked as `Structured baseline` and no `Pending Decision` scope language is present in the tracked scope document.

## Remaining Repo-Side Work

- No major repo-structure gaps are currently detected; the remaining plan work is primarily operational evidence.

## Operational Readiness Snapshot

- Repo-backed structural completion is currently `0%`, but practical readiness is still limited by real operating evidence.
- Operational evidence progress is currently `0/10` completed registers and `10` still-empty registers.
- The audit evidence index currently reports `10` open-gap rows that must only close when real records are added.
- Use `docs/security/OPERATIONAL_CLOSEOUT_STATUS.md` as the operator-facing checklist for closing the remaining evidence gaps.
- Use `docs/security/ISMS_OPERATING_RHYTHM.md`, `docs/security/RELEASE_EVIDENCE_CHECKLIST.md`, `docs/security/QUARTERLY_EVIDENCE_PACKET.md`, and `docs/security/ANNUAL_GOVERNANCE_PACKET.md` to run the remaining stage-2 work in practical batches instead of disconnected one-off tasks.

## Remaining Operational Work

| Section | Owner | Summary |
| --- | --- | --- |
| Feature Flag Rollout Evidence | Engineering lead | production \| Repo-backed rollout log now exists in `FEATURE_FLAG_ROLLOUT_LOG.md`, but no completed production rollout record is committed yet \| Roll back by disabling the renderer flag and falling back to `legacy` in the public offer renderer |
| Access Reviews | ISMS Manager | Repo-backed log and checklist now exist in `ACCESS_REVIEW_LOG.md` and `ACCESS_REVIEW_CHECKLIST.md`, but no completed quarterly review record is committed yet |
| Backup Restore Tests | Engineering lead | Repo-backed log and playbook now exist in `RESTORE_TEST_LOG.md` and `RESTORE_TEST_PLAYBOOK.md`, but no completed quarterly restore-test record is committed yet \| Pending |
| Internal Audit And Management Review | ISMS Manager | Repo-backed log and audit workflow now exist in `INTERNAL_AUDIT_LOG.md` and `INTERNAL_AUDIT_PLAYBOOK.md`, but no completed internal audit record is committed yet \| Schedule independent review and record findings/corrective actions |
| Internal Audit And Management Review | Management | Repo-backed log and agenda now exist in `MANAGEMENT_REVIEW_LOG.md` and `MANAGEMENT_REVIEW_AGENDA.md`, but no completed management review record is committed yet \| Record management review decisions, owners, and follow-up actions |
| Incident And Vulnerability Operations | ISMS Manager | Repo-backed log and drill workflow now exist in `INCIDENT_POSTMORTEM_LOG.md` and `INCIDENT_RESPONSE_DRILL_PLAYBOOK.md`, but no record is committed yet |
| Incident And Vulnerability Operations | Engineering lead | Repo-backed log and review workflow now exist in `VULNERABILITY_REVIEW_LOG.md` and `VULNERABILITY_REVIEW_PLAYBOOK.md`, but no review record is committed yet |
| Supplier Reviews | ISMS Manager | Repo-backed log and review workflow now exist in `SUPPLIER_REVIEW_LOG.md` and `SUPPLIER_REVIEW_PLAYBOOK.md`, but no completed supplier review record is committed yet |
| Awareness And Training | ISMS Manager | Repo-backed log and workflow now exist in `SECURITY_AWARENESS_LOG.md` and `SECURITY_AWARENESS_PLAYBOOK.md`, but no completed awareness or training record is committed yet |
| Asset Lifecycle | ISMS Manager | Repo-backed lifecycle log and baselines now exist in `ASSET_LIFECYCLE_LOG.md`, `OFFBOARDING_AND_ASSET_RETURN_STANDARD.md`, and `ASSET_DISPOSAL_AND_REUSE_STANDARD.md`, but no completed lifecycle record is committed yet |

## Next Highest-Value Actions

- Record the first completed production rollout or rollback in `docs/security/FEATURE_FLAG_ROLLOUT_LOG.md` when the public-offer rewrite or another production-impacting release flag changes state.
- Complete the first quarterly access review and record the outcome in `docs/security/ACCESS_REVIEW_LOG.md` using `docs/security/ACCESS_REVIEW_CHECKLIST.md`.
- Run the first non-production restore test and record the outcome in `docs/security/RESTORE_TEST_LOG.md` using `docs/security/RESTORE_TEST_PLAYBOOK.md`.
- Schedule and record the first internal audit and management review cycles in their respective logs using the linked playbooks and agenda.
- Run the first incident drill and vulnerability review cycle, then record both outcomes in the corresponding logs.
- Complete the first supplier review cycle for in-scope suppliers and record it in `docs/security/SUPPLIER_REVIEW_LOG.md`.
- Run the first awareness or training cycle and record the completed activity in `docs/security/SECURITY_AWARENESS_LOG.md`.
- Record the first repo-safe asset return, secure disposal, reuse, or exception outcome in `docs/security/ASSET_LIFECYCLE_LOG.md` when such an event occurs.
