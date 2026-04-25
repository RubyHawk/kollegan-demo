# Feature Flag Rollout Log

Owner: Engineering lead  
Review cadence: Per rollout and quarterly review  
Status: Empty register as of 2026-04-24

Use this register for completed release-flag rollouts and rollbacks only. Do not commit secrets, customer-specific payloads, or sensitive internal notes.

## Record Rules

- Add one row per completed rollout, rollback, or expiry cleanup for a production-impacting release flag.
- Record the flag owner, scope, environment, rollout decision, and rollback path.
- Link the implementing PR, follow-up cleanup PR, or issue when relevant.
- If a rollout is paused or reversed, record the reason and the exact rollback action taken.

## Entry Workflow

- Follow `OPERATIONAL_RECORD_ENTRY_STANDARD.md` before editing this log.
- Use this log together with `CHANGE_MANAGEMENT.md` to capture the rollout decision and rollback path.
- Add a row only after the rollout, rollback, or expiry cleanup is complete.
- If this is the first committed row, change the status line to `Active register; last updated YYYY-MM-DD`.
- After committing the row, remove the matching `Open gap as of ...` row from `AUDIT_EVIDENCE_INDEX.md` and regenerate `READINESS_STATUS.md`, `OPERATIONAL_CLOSEOUT_STATUS.md`, and `PLAN_STATUS.md`.

## Entry Template

Use this row shape for the next completed record:

| YYYY-MM-DD | flag-name | production | owner name or role | rolled out / rolled back / expired | exact rollback path | PR / ticket / follow-up | safe summary evidence link |

## Rollout Records

No rollout or rollback records are committed yet as of 2026-04-24.

| Date | Flag | Environment | Owner | Rollout decision | Rollback path | Cleanup evidence | Notes/evidence link |
| ---- | ---- | ----------- | ----- | ---------------- | ------------- | ---------------- | ------------------- |
