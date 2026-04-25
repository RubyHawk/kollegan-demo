# Incident And Postmortem Log

Owner: ISMS Manager  
Review cadence: After incidents or incident-response drills  
Status: Empty register as of 2026-04-24

Use this register for real incidents and incident-response exercises. Do not commit sensitive forensic data, secrets, or customer exports.

## Record Rules

- Add one row per completed incident or drill.
- Record severity, impact, containment, recovery, and postmortem status.
- Link corrective actions or follow-up work where possible.
- Note when communication or notification obligations were triggered.
- Use `INCIDENT_RESPONSE_DRILL_PLAYBOOK.md` to prepare incident-response exercises and capture drill outcomes consistently.

## Entry Workflow

- Follow `OPERATIONAL_RECORD_ENTRY_STANDARD.md` before editing this log.
- Use `INCIDENT_RESPONSE_DRILL_PLAYBOOK.md` for drills and `INCIDENT_RESPONSE.md` for real-event expectations.
- Add a row only after the incident or drill is complete enough to summarize outcome and follow-up actions safely.
- If this is the first committed row, change the status line to `Active register; last updated YYYY-MM-DD`.
- After committing the row, remove the matching `Open gap as of ...` row from `AUDIT_EVIDENCE_INDEX.md` and regenerate `READINESS_STATUS.md`, `OPERATIONAL_CLOSEOUT_STATUS.md`, and `PLAN_STATUS.md`.

## Entry Template

Use this row shape for the next completed record:

| YYYY-MM-DD | incident / drill | sev-level | scope and impact summary | resolution summary | postmortem complete / pending | follow-up actions | note / ticket |

## Incident Records

No incident or drill records are committed yet as of 2026-04-24.

| Date | Type | Severity | Scope and impact | Resolution summary | Postmortem status | Follow-up actions | Evidence link |
| ---- | ---- | -------- | ---------------- | ------------------ | ----------------- | ----------------- | ------------- |
