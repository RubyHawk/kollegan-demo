# Operational Record Entry Standard

Owner: ISMS Manager  
Review cadence: Quarterly and after major process changes  
Status: Structured baseline complete

Use this standard whenever you add a completed row to an operational evidence log under `docs/security/*_LOG.md`.

## Entry Rules

- Only add rows for completed activities, decisions, drills, reviews, rollouts, or lifecycle events.
- Do not add speculative placeholders or fake evidence just to close a dashboard gap.
- Keep secrets, customer exports, raw backups, forensic artifacts, destruction certificates, and sensitive HR details outside the repository.
- Use a safe summary plus a ticket, note, or external reference when the detailed evidence cannot be committed.

## First Completed Row

When a log moves from empty to populated:

1. add the first completed record row to the table under the `Records` section,
2. change the status line from `Empty register as of YYYY-MM-DD` to `Active register; last updated YYYY-MM-DD`,
3. remove the matching `Open gap as of ...` row from `docs/security/AUDIT_EVIDENCE_INDEX.md`,
4. regenerate `docs/security/READINESS_STATUS.md`, `docs/security/OPERATIONAL_CLOSEOUT_STATUS.md`, and `docs/PLAN_STATUS.md`.

## Safe Evidence Pattern

- Prefer dates, scopes, outcomes, owners, and follow-up references.
- Prefer ticket IDs, PR links, meeting-note references, or safe external evidence references over sensitive raw material.
- If an activity had no findings or no follow-up work, say so explicitly instead of leaving the cell ambiguous.
- If a due date is not applicable, use `N/A`.

## Row Writing Checklist

- Confirm the activity is complete.
- Use the log-specific workflow/playbook before writing the row.
- Fill every column with a safe summary value.
- Make follow-up owners and due dates explicit when actions remain.
- Update the matching open-gap row and dashboards only after the record row is committed.
