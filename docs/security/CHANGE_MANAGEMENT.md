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

## Emergency Change

Emergency changes must be documented after the fact with:

- incident or reason,
- approver,
- commands/actions performed,
- validation,
- follow-up corrective actions.

