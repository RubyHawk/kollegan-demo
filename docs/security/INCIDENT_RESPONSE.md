# Incident Response

Owner: ISMS Manager  
Review cadence: Quarterly and after incidents  
Status: Draft baseline

## Severity

- SEV1: customer data exposure, signing outage, destructive data loss, auth compromise.
- SEV2: major ERP workflow outage or public offer degradation.
- SEV3: limited internal workflow degradation.
- SEV4: minor issue with no customer impact.

## Process

1. Detect and record.
2. Triage severity.
3. Assign incident owner.
4. Contain.
5. Eradicate or fix.
6. Recover.
7. Communicate as required.
8. Write postmortem.
9. Track corrective actions.

## Evidence

- Record completed incident drills and real incidents in `INCIDENT_POSTMORTEM_LOG.md`.
- Use `INCIDENT_RESPONSE_DRILL_PLAYBOOK.md` for planned drills so scenarios, participants, findings, and corrective actions are captured consistently.
- Link major incidents or drills in `AUDIT_EVIDENCE_INDEX.md` when they materially affect change management, risk treatment, or audit readiness.
