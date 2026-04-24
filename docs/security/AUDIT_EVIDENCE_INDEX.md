# Audit Evidence Index

Owner: ISMS Manager  
Review cadence: Monthly during refactor, quarterly after stabilization  
Status: Baseline in progress

Use this file as an index to evidence. Do not commit secrets, backups, customer exports, or sensitive logs.

## Operational Record Locations

- Access reviews: `docs/security/ACCESS_REVIEW_LOG.md`
- Restore tests: `docs/security/RESTORE_TEST_LOG.md`
- Internal audits: `docs/security/INTERNAL_AUDIT_LOG.md`
- Management reviews: `docs/security/MANAGEMENT_REVIEW_LOG.md`
- Feature-flag rollouts: `docs/security/FEATURE_FLAG_ROLLOUT_LOG.md`
- Incidents and drills: `docs/security/INCIDENT_POSTMORTEM_LOG.md`
- Vulnerability reviews: `docs/security/VULNERABILITY_REVIEW_LOG.md`
- Supplier reviews: `docs/security/SUPPLIER_REVIEW_LOG.md`
- Access review workflow: `docs/security/ACCESS_REVIEW_CHECKLIST.md`
- Restore-test workflow: `docs/security/RESTORE_TEST_PLAYBOOK.md`
- Incident drill workflow: `docs/security/INCIDENT_RESPONSE_DRILL_PLAYBOOK.md`
- Vulnerability review workflow: `docs/security/VULNERABILITY_REVIEW_PLAYBOOK.md`
- Internal audit workflow: `docs/security/INTERNAL_AUDIT_PLAYBOOK.md`
- Management review workflow: `docs/security/MANAGEMENT_REVIEW_AGENDA.md`
- Detailed Annex A tracker: `docs/security/ANNEX_A_CONTROL_TRACKER.md`
- Supplier review workflow: `docs/security/SUPPLIER_REVIEW_PLAYBOOK.md`

## Change Evidence

| Date       | Change                                                      | PR/commit                                                  | Evidence                                                                                                                                                                                                                                        | Owner            |
| ---------- | ----------------------------------------------------------- | ---------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------- |
| 2026-04-19 | AI-native refactor and ISO readiness foundation             | PR #432 / `1cbcc31`                                        | Baseline docs, AI rules, production-data safety guidance, refactor playbook, and initial quality-gate scripts added as engineering evidence                                                                                                     | Engineering lead |
| 2026-04-19 | Feature flag foundation                                     | PR #437 / `3a1b5c0`                                        | `ff_feature_flag_audit_events`, `aud_audit_logs`, `/api/v1/feature-flags` handlers, rollout evaluation, and API contract coverage                                                                                                               | Engineering lead |
| 2026-04-21 | Auth route boundary cleanup                                 | PR #489 / `3ced973`                                        | Profile/change-password handlers moved behind auth module; route files remain thin wrappers; no schema/data changes                                                                                                                             | Engineering lead |
| 2026-04-21 | Staff API route boundary cleanup                            | PR #490 / `920f905`                                        | Staff handlers moved behind auth module; legacy and v1 route files are thin wrappers; no schema/data changes                                                                                                                                    | Engineering lead |
| 2026-04-21 | Dev-login route boundary cleanup                            | PR #491 / `3b7425d`                                        | Dev-only login handler moved behind auth module; route files remain thin wrappers; no schema/data changes                                                                                                                                       | Engineering lead |
| 2026-04-21 | Hotel demo seed route boundary cleanup                      | PR #492 / `febb34e`                                        | Demo seed handler moved behind hotel demo module; route file remains a thin wrapper; no schema/data changes                                                                                                                                     | Engineering lead |
| 2026-04-21 | Health route boundary cleanup                               | PR #493 / `d339fca`                                        | Health readiness checks moved behind platform health layer; route file remains a thin wrapper; no schema/data changes                                                                                                                           | Engineering lead |
| 2026-04-23 | Quality gate hardening and browser API boundary enforcement | PRs #542-#544 / `78f4531`, `9b25ad5`, `dea51f3`            | Added text-encoding guard, enforced dependency-boundary validation in PR CI, moved offer template preview onto the shared templates API client, and added BOM regression coverage                                                               | Engineering lead |
| 2026-04-23 | Reports boundary cleanup                                    | PR #546 / `db30c64`                                        | Reports page now loads customers, leads, offers, projects, meetings, and announcements through shared feature API loaders instead of inline endpoint descriptors                                                                                | Engineering lead |
| 2026-04-23 | Branding and theme precedence convergence                   | PRs #547-#549 / `aa943c7`, `d91c55c`, `cc8fbe8`            | Shared branding resolver introduced, organization theme fallbacks added, theme-settings handlers kept behind thin routes, and precedence covered by branding/theme bootstrap tests                                                              | Engineering lead |
| 2026-04-23 | Offer browser API boundary cleanup                          | PRs #550-#551 / `1309c31`, `124fc23`                       | Offer wizard lifecycle/lookups/submit flows and dashboard PDF actions now use shared `/api/v1` clients/helpers instead of direct browser fetches or legacy inline paths                                                                         | Engineering lead |
| 2026-04-23 | Governance evidence baseline refresh                        | PR #552 / `e15c560`                                        | Audit evidence, supplier register, and risk register updated so already-completed refactor work has traceable repo-backed references instead of placeholder-only `TBD` rows                                                                     | Engineering lead |
| 2026-04-23 | Branding API client and cleanup inventory refresh           | PR #553 / `0365c7c`                                        | Dedicated `branding.api.ts` client added for theme sync, appearance flows use the shared client surface, and the generated cleanup inventory reflects the active feature API client set                                                         | Engineering lead |
| 2026-04-23 | PR quality gate expansion                                   | PRs #554-#555 / `2c9f5d6`, `b8171b7`                       | Pull-request CI now enforces lint, tests, typecheck, build, migration safety, AI proxy consistency, dependency boundaries, encoding, and file-size checks with explicit Prisma client generation in CI                                          | Engineering lead |
| 2026-04-23 | Legacy API inventory refinement                             | PRs #556-#557 / `8a86836`, `cbcd10e`                       | Cleanup inventory distinguishes compatibility wrappers from retained non-versioned routes, tracks literal legacy `/api/*` references, and reuses cache state more effectively in CI                                                             | Engineering lead |
| 2026-04-24 | Reproducible VPS deploy workflow                            | PRs #558-#561 / `0397b5f`, `9614340`, `c61224b`, `90e6a12` | Deploys build release artifacts in GitHub, sync the tracked deploy script onto the VPS, use the fixed deploy path under `/var/www/offert`, keep build artifacts in `.deploy-state`, and stop rerunning the full PR quality pipeline after merge | Engineering lead |
| 2026-04-24 | Security evidence merge gate                                | PR #564 / `6ff3e61`                                        | Pull-request CI now fails security-relevant workflow, migration, auth, feature-flag, and public-offer/signing changes unless the PR also updates repo-backed security/evidence docs                                                             | Engineering lead |
| 2026-04-24 | Deploy artifact promotion fallback hardening                | PR #565 / `8376328`                                        | Deploy promotion now treats GitHub CLI, artifact lookup, download, unzip, tar, and metadata parsing failures as safe fallback conditions, so production deploys rebuild in CI instead of aborting before the VPS release path runs              | Engineering lead |
| 2026-04-24 | Shared client migration continuation and wrapper retirement | PRs #566-#569 / `8c26388`, `900d6bb`, `05b7d1b`, `2f8120d` | Hotel setup and calendar UI flows use shared `/api/v1` clients, and the legacy calendar, announcements, and staff wrappers were retired after repo usage verification and cleanup inventory regeneration; no schema or production-data changes | Engineering lead |
| 2026-04-24 | Feature-flag wrapper retirement                             | PR #579 / `d34e7df`                                        | Legacy `/api/feature-flags` compatibility wrappers retired after repo usage verification; `/api/v1/feature-flags` remains the active contract surface and browser client target; no schema or production-data changes                           | Engineering lead |
| 2026-04-24 | Admin compliance wrapper retirement                         | PR #581 / `bf6266b`                                        | Added the missing `/api/v1/admin/compliance/controls/[id]/evidence` route, retired legacy `/api/admin/compliance` and `/api/admin/access-review` wrappers after repo usage verification, and refreshed the cleanup inventory; no schema or production-data changes | Engineering lead |
| 2026-04-24 | Auth wrapper retirement                                     | PR #582 / `4ec6b8b`                                        | Added the missing `/api/v1/auth` MFA backup-code and WebAuthn registration routes, made `v1` auth routes self-contained, and retired legacy `/api/auth` compatibility wrappers after repo usage verification; no schema or production-data changes | Engineering lead |
| 2026-04-24 | Security operations evidence logs                           | PR #585 / `6cc847f`                                        | Added repo-backed operational log templates for access reviews, restore tests, internal audits, management reviews, incidents, and vulnerability triage; linked those logs from the security policies, audit evidence index, and SoA without creating fake records | Engineering lead |
| 2026-04-24 | Feature-flag rollout evidence log                           | PR #586 / `75d17e1`                                        | Added a repo-backed rollout log for production-impacting release flags and linked it from change management, the audit evidence index, and the SoA so rollout/rollback evidence can be recorded without inventing fake entries | Engineering lead |
| 2026-04-24 | Internal audit and management review playbooks              | PR #587 / `1e2d343`                                        | Added repo-backed internal audit and management review workflows, linked them from the corresponding logs, and tightened the evidence index so those two remaining operating gaps are executable without inventing records | Engineering lead |
| 2026-04-24 | Access review and restore test workflows                    | PR #589 / `0163ea5`                                        | Added repo-backed workflows for quarterly access reviews and non-production restore tests, linked them from the corresponding logs, and tightened the evidence index and SoA so those operating gaps are executable without inventing records | Engineering lead |
| 2026-04-24 | Incident and vulnerability workflows                        | PR #590 / `1b54dd3`                                        | Added repo-backed workflows for incident-response drills and vulnerability reviews, linked them from the corresponding logs and policies, and corrected the evidence index so the merged access/restore work points at PR #589 | Engineering lead |
| 2026-04-24 | Supplier review workflows                                   | PR TBD / pending                                           | Added repo-backed supplier review log and playbook, linked them from supplier management and the evidence index, and made the supplier-relationship controls more actionable without inventing review records | Engineering lead |
| 2026-04-24 | Annex A control tracker                                     | PR #591 / `b4ee8f2`                                        | Added a repo-backed tracker for all 93 ISO/IEC 27001:2022 Annex A controls, upgraded the SoA to a structured baseline that points at that tracker, linked the tracker from the evidence index, and fixed the mojibake risk-score formula | Engineering lead |

## Feature Flag Rollout Evidence

| Date | Flag                 | Environment | Rollout evidence                                                                                      | Rollback evidence                                                                                  | Owner            |
| ---- | -------------------- | ----------- | ----------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------- | ---------------- |
| Open gap as of 2026-04-24 | Public offer rewrite | production  | Repo-backed rollout log now exists in `FEATURE_FLAG_ROLLOUT_LOG.md`, but no completed production rollout record is committed yet | Roll back by disabling the renderer flag and falling back to `legacy` in the public offer renderer | Engineering lead |

## Migration Evidence

| Date       | Migration                               | Backup ref                                                                                                                              | Validation                                                                                                                                                                      | Owner            |
| ---------- | --------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------- |
| 2026-04-23 | `20260423225200_add_org_theme_defaults` | Deployment backup evidence is external to the repo and still needs to be recorded in the operations log before future production replay | PR #548 / `d91c55c`; additive nullable columns only; `npm run check:migrations`; `tests/unit/theme-bootstrap.test.ts`; `prisma generate`; typecheck with a dummy `DATABASE_URL` | Engineering lead |

## Access Reviews

| Date                      | Scope                                                                 | Result                                                      | Owner        |
| ------------------------- | --------------------------------------------------------------------- | ----------------------------------------------------------- | ------------ |
| Open gap as of 2026-04-24 | Application admin, repository, VPS, database, and CI/CD secret access | Repo-backed log and checklist now exist in `ACCESS_REVIEW_LOG.md` and `ACCESS_REVIEW_CHECKLIST.md`, but no completed quarterly review record is committed yet | ISMS Manager |

## Backup Restore Tests

| Date                      | Backup ref                                            | Restore target                                             | Result  | Owner            |
| ------------------------- | ----------------------------------------------------- | ---------------------------------------------------------- | ------- | ---------------- |
| Open gap as of 2026-04-24 | Production backup references are external to the repo | Repo-backed log and playbook now exist in `RESTORE_TEST_LOG.md` and `RESTORE_TEST_PLAYBOOK.md`, but no completed quarterly restore-test record is committed yet | Pending | Engineering lead |

## Internal Audit And Management Review

| Date                      | Activity          | Findings                                                | Corrective actions                                                 | Owner        |
| ------------------------- | ----------------- | ------------------------------------------------------- | ------------------------------------------------------------------ | ------------ |
| Open gap as of 2026-04-24 | Internal audit    | Repo-backed log and audit workflow now exist in `INTERNAL_AUDIT_LOG.md` and `INTERNAL_AUDIT_PLAYBOOK.md`, but no completed internal audit record is committed yet | Schedule independent review and record findings/corrective actions | ISMS Manager |
| Open gap as of 2026-04-24 | Management review | Repo-backed log and agenda now exist in `MANAGEMENT_REVIEW_LOG.md` and `MANAGEMENT_REVIEW_AGENDA.md`, but no completed management review record is committed yet | Record management review decisions, owners, and follow-up actions  | Management   |

## Incident And Vulnerability Operations

| Date                      | Activity                | Result                                                                                 | Owner            |
| ------------------------- | ----------------------- | -------------------------------------------------------------------------------------- | ---------------- |
| Open gap as of 2026-04-24 | Incident drill/response | Repo-backed log and drill workflow now exist in `INCIDENT_POSTMORTEM_LOG.md` and `INCIDENT_RESPONSE_DRILL_PLAYBOOK.md`, but no record is committed yet | ISMS Manager     |
| Open gap as of 2026-04-24 | Vulnerability review    | Repo-backed log and review workflow now exist in `VULNERABILITY_REVIEW_LOG.md` and `VULNERABILITY_REVIEW_PLAYBOOK.md`, but no review record is committed yet | Engineering lead |

## Supplier Reviews

| Date                      | Scope          | Result                                                                                         | Owner        |
| ------------------------- | -------------- | ---------------------------------------------------------------------------------------------- | ------------ |
| Open gap as of 2026-04-24 | In-scope SaaS, hosting, database, and AI suppliers | Repo-backed log and review workflow now exist in `SUPPLIER_REVIEW_LOG.md` and `SUPPLIER_REVIEW_PLAYBOOK.md`, but no completed supplier review record is committed yet | ISMS Manager |
