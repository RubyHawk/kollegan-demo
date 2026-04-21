# Audit Evidence Index

Owner: ISMS Manager  
Review cadence: Monthly during refactor, quarterly after stabilization  
Status: Draft baseline

Use this file as an index to evidence. Do not commit secrets, backups, customer exports, or sensitive logs.

## Change Evidence

| Date | Change | PR/commit | Evidence | Owner |
|---|---|---|---|---|
| 2026-04-19 | AI-native refactor and ISO readiness foundation | TBD | Docs, scripts, CI checks | Engineering lead |
| 2026-04-19 | Feature flag foundation | TBD | `ff_feature_flag_audit_events`, `aud_audit_logs`, `/api/v1/feature-flags` handlers | Engineering lead |
| 2026-04-21 | Auth route boundary cleanup | TBD | Profile/change-password handlers moved behind auth module; route files remain thin wrappers; no schema/data changes | Engineering lead |
| 2026-04-21 | Staff API route boundary cleanup | TBD | Staff handlers moved behind auth module; legacy and v1 route files are thin wrappers; no schema/data changes | Engineering lead |
| 2026-04-21 | Dev-login route boundary cleanup | TBD | Dev-only login handler moved behind auth module; route files remain thin wrappers; no schema/data changes | Engineering lead |
| 2026-04-21 | Hotel demo seed route boundary cleanup | TBD | Demo seed handler moved behind hotel demo module; route file remains a thin wrapper; no schema/data changes | Engineering lead |

## Feature Flag Rollout Evidence

| Date | Flag | Environment | Rollout evidence | Rollback evidence | Owner |
|---|---|---|---|---|---|
| TBD | Public offer rewrite | production | TBD | TBD | Engineering lead |

## Migration Evidence

| Date | Migration | Backup ref | Validation | Owner |
|---|---|---|---|---|
| TBD | TBD | TBD | TBD | TBD |

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
