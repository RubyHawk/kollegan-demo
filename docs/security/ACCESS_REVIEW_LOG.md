# Access Review Log

Owner: ISMS Manager  
Review cadence: Quarterly  
Status: Empty register as of 2026-04-24

Use this register for completed access reviews only. Do not commit passwords, tokens, SSH private keys, or other secrets.

## Record Rules

- Add one row per completed review.
- Cover application admin access, repository access, VPS/server access, database access, CI/CD secret access, and third-party SaaS admin access.
- Record removals, downgrades, and compensating controls when access is retained.
- Link the follow-up PR or ticket if the review results in a permission change.
- Use `ACCESS_REVIEW_CHECKLIST.md` to prepare the review scope and evidence set.

## Entry Workflow

- Follow `OPERATIONAL_RECORD_ENTRY_STANDARD.md` before editing this log.
- Use `ACCESS_REVIEW_CHECKLIST.md` to prepare the evidence set and scope.
- Add a row only after the review is complete and the findings/actions are known.
- If this is the first committed row, change the status line to `Active register; last updated YYYY-MM-DD`.
- After committing the row, remove the matching `Open gap as of ...` row from `AUDIT_EVIDENCE_INDEX.md` and regenerate `READINESS_STATUS.md`, `OPERATIONAL_CLOSEOUT_STATUS.md`, and `PLAN_STATUS.md`.

## Entry Template

Use this row shape for the next completed record:

| YYYY-MM-DD | reviewer name | reviewed access scope | access lists + checklist ref | findings summary | actions + owners | YYYY-MM-DD or N/A | PR / ticket / note |

## Review Records

No review records are committed yet as of 2026-04-24.

| Date | Reviewer | Scope | Evidence reviewed | Findings | Actions | Due date | Evidence link |
| ---- | -------- | ----- | ----------------- | -------- | ------- | -------- | ------------- |
