# Release Evidence Checklist

Owner: Engineering lead  
Review cadence: Before each production-impacting release or release-flag change  
Status: Structured baseline complete

Use this checklist for production-impacting releases where you need a safe repo-backed record of what changed, what the rollback path was, and whether a release flag changed state. Do not commit secrets, customer payloads, or sensitive deployment internals.

## When To Use This

Use this workflow when at least one of the following is true:

- a release flag is rolled out, rolled back, or expired,
- a production-impacting change needs an explicit rollback note,
- a significant deploy should be tied to a safe summary record.

## Pre-Release Checks

1. Confirm the change owner and release window.
2. Confirm the relevant PRs, deploy workflow run, or issue/ticket references.
3. Confirm the rollback path in plain language.
4. If a release flag is involved, confirm the exact flag name and target environment.

## Completion Criteria

Only record a row when the release or rollback is complete.

- If a release was paused but not completed, record it only when the final outcome is known.
- If no feature flag changed state, keep the release note outside the feature-flag log unless a separate operational log needs it.

## Outputs

- Completed row in `docs/security/FEATURE_FLAG_ROLLOUT_LOG.md` when a release flag changed state.
- Safe release summary in the relevant PR, ticket, or external note when needed.
- Matching gap removal from `docs/security/AUDIT_EVIDENCE_INDEX.md` after the first real rollout record is committed.

## Safe Summary Pattern

Capture:

- date,
- flag or release scope,
- environment,
- owner,
- final outcome,
- exact rollback path,
- linked PRs or tickets,
- safe evidence reference.

Do not capture:

- secrets,
- raw environment variable values,
- customer identifiers,
- sensitive incident detail,
- shell transcripts with privileged access.
