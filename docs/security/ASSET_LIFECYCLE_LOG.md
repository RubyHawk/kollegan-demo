# Asset Lifecycle Log

Owner: ISMS Manager  
Review cadence: Quarterly  
Status: Empty register as of 2026-04-24

Use this register for completed asset-return, secure-disposal, or reuse events only. Do not commit serial numbers, home addresses, destruction certificates, shipping labels, or sensitive personnel notes.

## Record Rules

- Add one row per completed asset-return, disposal, destruction, or reuse cycle that needs repo-backed evidence.
- Record the asset class, lifecycle event, high-level result, and follow-up actions without exposing sensitive identifiers.
- Keep detailed HR, supplier, or destruction evidence outside the repository when it contains sensitive operational detail; use a safe summary or external reference instead.
- Use `OFFBOARDING_AND_ASSET_RETURN_STANDARD.md` and `ASSET_DISPOSAL_AND_REUSE_STANDARD.md` as the baseline workflows for what should be recorded here.

## Entry Workflow

- Follow `OPERATIONAL_RECORD_ENTRY_STANDARD.md` before editing this log.
- Use `OFFBOARDING_AND_ASSET_RETURN_STANDARD.md` and `ASSET_DISPOSAL_AND_REUSE_STANDARD.md` to determine the safe summary to record.
- Add a row only after the lifecycle event is complete enough to record the result and any follow-up or exception handling.
- If this is the first committed row, change the status line to `Active register; last updated YYYY-MM-DD`.
- After committing the row, remove the matching `Open gap as of ...` row from `AUDIT_EVIDENCE_INDEX.md` and regenerate `READINESS_STATUS.md`, `OPERATIONAL_CLOSEOUT_STATUS.md`, and `PLAN_STATUS.md`.

## Entry Template

Use this row shape for the next completed record:

| YYYY-MM-DD | return / disposal / reuse / exception | asset class | trigger or scope | result summary | follow-up actions | external note / ticket |

## Lifecycle Records

No asset-lifecycle records are committed yet as of 2026-04-24.

| Date | Lifecycle event | Asset class | Scope or trigger | Result | Follow-up actions | Evidence link |
| ---- | --------------- | ----------- | ---------------- | ------ | ----------------- | ------------- |
