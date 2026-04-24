# Supplier Review Playbook

Owner: ISMS Manager  
Review cadence: Before each quarterly supplier review and after major supplier changes  
Status: Baseline workflow

Use this playbook to review suppliers that are in scope for the Kollegan ERP ISMS. Keep contracts, security questionnaires, and sensitive vendor communications outside the repo when necessary.

## Minimum Review Set

Review at least:

- GitHub
- VPS/self-managed hosting
- PostgreSQL/server-managed database
- Resend
- OpenAI/Codex
- Anthropic/Claude

## Review Steps

1. Confirm the supplier list and note any additions, removals, or major service changes.
2. For each supplier, review:
   - service and data/process scope,
   - current business/security dependency,
   - known incidents, outages, or major changes,
   - contractual/compliance expectations,
   - whether the supplier still fits the current risk profile.
3. Record any required actions, such as follow-up questions, mitigations, owner changes, or replacement discussions.
4. Update `SUPPLIER_REVIEW_LOG.md` with the completed review.

## Outputs

- Reviewed supplier set.
- Findings and decisions.
- Follow-up actions with owners and due dates.
- Entry in `SUPPLIER_REVIEW_LOG.md`.

