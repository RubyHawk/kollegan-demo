# Segregation Of Duties

Owner: ISMS Manager  
Review cadence: Quarterly and after material release-process changes  
Status: Baseline identified

Kollegan is a small engineering-led environment, so full organizational separation is not always practical. This baseline defines the minimum separation and compensating controls required before certification readiness is claimed.

## Baseline Rules

- High-risk changes must go through pull requests with reviewable scope, checks, and evidence context.
- No destructive production-data changes are allowed without explicit approval, rollback planning, and evidence.
- Release automation must deploy the exact Git-tracked version rather than ad hoc server-only commands.
- Operational reviews such as access reviews, supplier reviews, internal audits, and management reviews must be recorded separately from the engineering implementation work they assess.

## Compensating Controls

- Pull-request quality gates in `.github/workflows/quality-gates.yml`
- Git-tracked production release path in `.github/workflows/deploy.yml` and `scripts/deploy-release.sh`
- Evidence and review logs in `docs/security/*.md`
- Additive-first migration rules in `docs/PRODUCTION_DATA_SAFETY.md`

## Readiness Note

If the same individual must both implement and approve a high-risk change, record the circumstance and compensating review in the relevant PR or operational log rather than treating that overlap as invisible.
