# Audit Evidence Index

Owner: ISMS Manager  
Review cadence: Monthly during refactor, quarterly after stabilization  
Status: Baseline in progress

Use this file as an index to evidence. Do not commit secrets, backups, customer exports, or sensitive logs.

## Change Evidence

| Date | Change | PR/commit | Evidence | Owner |
|---|---|---|---|---|
| 2026-04-19 | AI-native refactor and ISO readiness foundation | PR #432 / `1cbcc31` | Baseline docs, AI rules, production-data safety guidance, refactor playbook, and initial quality-gate scripts added as engineering evidence | Engineering lead |
| 2026-04-19 | Feature flag foundation | PR #437 / `3a1b5c0` | `ff_feature_flag_audit_events`, `aud_audit_logs`, `/api/v1/feature-flags` handlers, rollout evaluation, and API contract coverage | Engineering lead |
| 2026-04-21 | Auth route boundary cleanup | PR #489 / `3ced973` | Profile/change-password handlers moved behind auth module; route files remain thin wrappers; no schema/data changes | Engineering lead |
| 2026-04-21 | Staff API route boundary cleanup | PR #490 / `920f905` | Staff handlers moved behind auth module; legacy and v1 route files are thin wrappers; no schema/data changes | Engineering lead |
| 2026-04-21 | Dev-login route boundary cleanup | PR #491 / `3b7425d` | Dev-only login handler moved behind auth module; route files remain thin wrappers; no schema/data changes | Engineering lead |
| 2026-04-21 | Hotel demo seed route boundary cleanup | PR #492 / `febb34e` | Demo seed handler moved behind hotel demo module; route file remains a thin wrapper; no schema/data changes | Engineering lead |
| 2026-04-21 | Health route boundary cleanup | PR #493 / `d339fca` | Health readiness checks moved behind platform health layer; route file remains a thin wrapper; no schema/data changes | Engineering lead |
| 2026-04-23 | Quality gate hardening and browser API boundary enforcement | PRs #542-#544 / `78f4531`, `9b25ad5`, `dea51f3` | Added text-encoding guard, enforced dependency-boundary validation in PR CI, moved offer template preview onto the shared templates API client, and added BOM regression coverage | Engineering lead |
| 2026-04-23 | Reports boundary cleanup | PR #546 / `db30c64` | Reports page now loads customers, leads, offers, projects, meetings, and announcements through shared feature API loaders instead of inline endpoint descriptors | Engineering lead |
| 2026-04-23 | Branding and theme precedence convergence | PRs #547-#549 / `aa943c7`, `d91c55c`, `cc8fbe8` | Shared branding resolver introduced, organization theme fallbacks added, theme-settings handlers kept behind thin routes, and precedence covered by branding/theme bootstrap tests | Engineering lead |
| 2026-04-23 | Offer browser API boundary cleanup | PRs #550-#551 / `1309c31`, `124fc23` | Offer wizard lifecycle/lookups/submit flows and dashboard PDF actions now use shared `/api/v1` clients/helpers instead of direct browser fetches or legacy inline paths | Engineering lead |

## Feature Flag Rollout Evidence

| Date | Flag | Environment | Rollout evidence | Rollback evidence | Owner |
|---|---|---|---|---|---|
| TBD | Public offer rewrite | production | Implementation exists behind the feature-flag foundation; no production rollout evidence recorded yet | Roll back by disabling the renderer flag and falling back to `legacy` in the public offer renderer | Engineering lead |

## Migration Evidence

| Date | Migration | Backup ref | Validation | Owner |
|---|---|---|---|---|
| 2026-04-23 | `20260423225200_add_org_theme_defaults` | Deployment backup evidence is external to the repo and still needs to be recorded in the operations log before future production replay | PR #548 / `d91c55c`; additive nullable columns only; `npm run check:migrations`; `tests/unit/theme-bootstrap.test.ts`; `prisma generate`; typecheck with a dummy `DATABASE_URL` | Engineering lead |

## Access Reviews

| Date | Scope | Result | Owner |
|---|---|---|---|
| TBD | TBD | TBD | TBD |

## Backup Restore Tests

| Date | Backup ref | Restore target | Result | Owner |
|---|---|---|---|---|
| TBD | TBD | TBD | TBD | TBD |

## Internal Audit And Management Review

| Date | Activity | Findings | Corrective actions | Owner |
|---|---|---|---|---|
| TBD | Internal audit | TBD | TBD | TBD |
| TBD | Management review | TBD | TBD | TBD |
