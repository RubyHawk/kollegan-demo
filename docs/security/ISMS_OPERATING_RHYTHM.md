# ISMS Operating Rhythm

Owner: ISMS Manager  
Review cadence: Quarterly and after major ISMS changes  
Status: Structured baseline complete

Use this document as the practical operating rhythm for the in-scope Kollegan ERP ISMS. It is intentionally lightweight: run the recurring cycles, record safe summaries in the repo-backed logs, and avoid inventing evidence for work that has not happened.

## Working Rule

- This rhythm is a coordination aid, not a replacement for the log-specific playbooks.
- Detailed execution still lives in the linked workflows and logs under `docs/security/*`.
- If an activity did not happen, do not fabricate a row. Leave the open gap visible.

## Operating Windows

### Per release or production rollout

Run this when a production-impacting release flag changes state or a high-risk release needs explicit rollback evidence.

- Primary workflow: `docs/security/RELEASE_EVIDENCE_CHECKLIST.md`
- Primary evidence log: `docs/security/FEATURE_FLAG_ROLLOUT_LOG.md`
- Supporting policy: `docs/security/CHANGE_MANAGEMENT.md`

### Monthly

Run this for ongoing engineering hygiene.

- Primary workflow: `docs/security/VULNERABILITY_REVIEW_PLAYBOOK.md`
- Primary evidence log: `docs/security/VULNERABILITY_REVIEW_LOG.md`

### Quarterly

Run this as the default operational cycle for a small company.

- Primary workflow: `docs/security/QUARTERLY_EVIDENCE_PACKET.md`
- Primary evidence logs:
  - `docs/security/ACCESS_REVIEW_LOG.md`
  - `docs/security/RESTORE_TEST_LOG.md`
  - `docs/security/SUPPLIER_REVIEW_LOG.md`
  - `docs/security/SECURITY_AWARENESS_LOG.md`
  - `docs/security/ASSET_LIFECYCLE_LOG.md`

### Annual

Run this to close the yearly governance loop.

- Primary workflow: `docs/security/ANNUAL_GOVERNANCE_PACKET.md`
- Primary evidence logs:
  - `docs/security/INTERNAL_AUDIT_LOG.md`
  - `docs/security/MANAGEMENT_REVIEW_LOG.md`

### Event-driven

Run these only when the triggering event actually occurs.

- Incident or drill:
  - workflow: `docs/security/INCIDENT_RESPONSE_DRILL_PLAYBOOK.md`
  - log: `docs/security/INCIDENT_POSTMORTEM_LOG.md`
- Asset return, disposal, reuse, or exception:
  - workflow: `docs/security/OFFBOARDING_AND_ASSET_RETURN_STANDARD.md`
  - log: `docs/security/ASSET_LIFECYCLE_LOG.md`

## Minimum Quarterly Expectation

If the company does nothing else in a quarter, the minimum useful stage-2 cycle is:

1. complete one access review,
2. run one non-production restore test,
3. review in-scope suppliers,
4. run one awareness/training touchpoint,
5. record any asset-lifecycle events or explicitly note that none occurred,
6. regenerate the readiness/plan dashboards after committed records land.

## Minimum Annual Expectation

At least once per year:

1. run an internal audit,
2. run a management review,
3. review whether the ISMS scope, supplier set, and Annex A baseline still reflect reality,
4. record corrective actions and owners where needed.

## Linked Execution Docs

- `docs/security/RELEASE_EVIDENCE_CHECKLIST.md`
- `docs/security/QUARTERLY_EVIDENCE_PACKET.md`
- `docs/security/ANNUAL_GOVERNANCE_PACKET.md`
- `docs/security/OPERATIONAL_CLOSEOUT_STATUS.md`
- `docs/security/OPERATIONAL_RECORD_ENTRY_STANDARD.md`
