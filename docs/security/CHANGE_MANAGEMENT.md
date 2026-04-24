# Change Management

Owner: Engineering lead  
Review cadence: Monthly during refactor, quarterly after stabilization  
Status: Draft baseline

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
- Pull-request quality gates also require security-relevant changes to touch security/evidence docs, so release workflow, migration, auth, feature-flag, and public-offer/signing changes cannot merge without repo-backed governance context.
- Deploys to production are versioned from Git: the deploy workflow builds the release artifact in CI, ships the tracked deploy script with the release bundle, installs that script to the fixed VPS path, and then deploys the exact merged commit.
- Schema changes remain additive-first and must link migration evidence in `docs/security/AUDIT_EVIDENCE_INDEX.md`.
- Healthcheck failures after deploy must fail the release so rollback or follow-up correction can happen intentionally instead of silently.

## Emergency Change

Emergency changes must be documented after the fact with:

- incident or reason,
- approver,
- commands/actions performed,
- validation,
- follow-up corrective actions.
