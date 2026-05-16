# Change Management

Owner: Engineering lead  
Review cadence: Monthly during refactor, quarterly after stabilization  
Status: Structured baseline complete

## Standard Change

Standard PRs require:

- linked purpose,
- scope,
- tests/checks,
- rollback notes for risky changes,
- data safety statement if schema or repository code changed.

## High-Risk Change

High-risk changes include:

- migrations,
- public offer/signing changes,
- auth changes,
- production data backfills,
- feature flag infrastructure,
- API response shape changes.

High-risk changes require explicit review and evidence link.

## Current Enforced Controls

- Pull-request quality gates run lint, tests, typecheck, build, migration safety, AI proxy consistency, dependency boundaries, encoding, and file-size checks before merge.
- Pull-request quality gates also block new unapproved non-versioned `/api/*` literals outside route files, so the `/api/v1` migration cannot silently regress through inline fetches or stray helper constants.
- Pull-request quality gates also reject unregistered or expired duplicate legacy/V1 product route families; any temporary overlap must name its rollout flag, owner, reason, canonical replacement, and removal date in `scripts/api-route-overlaps.json`.
- Pull-request quality gates also require security-relevant changes to touch security/evidence docs, so release workflow, migration, auth, feature-flag, and public-offer/signing changes cannot merge without repo-backed governance context.
- Pull-request quality gates also keep operational evidence logs and `AUDIT_EVIDENCE_INDEX.md` open-gap rows aligned through a shared registry-backed check, so owners, review cadences, and empty-register gaps cannot silently drift away from the readiness dashboard and evidence index.
- Pull-request quality gates also keep `OPERATIONAL_CLOSEOUT_STATUS.md` in sync with the shared operational evidence registry, so operator-facing closeout steps do not drift away from the readiness dashboard, evidence index, and actual log owners.
- Completed operational evidence rows should follow `docs/security/OPERATIONAL_RECORD_ENTRY_STANDARD.md`, so first entries, safe evidence references, and dashboard-closeout steps are handled consistently across all 10 evidence logs.
- High-risk progressive-delivery changes should record rollout/rollback decisions in `docs/security/FEATURE_FLAG_ROLLOUT_LOG.md`.
- Feature flags are for risk-managed rollout and rollback, not indefinite parallel API surfaces; after a flagged migration is complete, superseded duplicate routes should be removed through the normal evidence-backed cleanup flow.
- Deploys to production are versioned from Git: the deploy workflow builds the release artifact in CI, ships the tracked deploy script with the release bundle, installs that script to the fixed VPS path, and then deploys the exact merged commit.
- Deploy-on-main classification is intentionally narrower than general process validation: only runtime-affecting changes and real release-path changes such as `deploy.yml` and `scripts/deploy-release.sh` should trigger a production deploy or CI rebuild on `main`.
- Release artifact promotion is best-effort only: if PR artifact lookup, download, or validation fails, deploy must fall back to a fresh CI rebuild instead of aborting the production release.
- Schema changes remain additive-first and must link migration evidence in `docs/security/AUDIT_EVIDENCE_INDEX.md`.
- Healthcheck failures after deploy must fail the release so rollback or follow-up correction can happen intentionally instead of silently.

## Emergency Change

Emergency changes must be documented after the fact with:

- incident or reason,
- approver,
- commands/actions performed,
- validation,
- follow-up corrective actions.
