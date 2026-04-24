# Supplier Assurance Standard

Owner: ISMS Manager  
Review cadence: Quarterly and after onboarding or materially changing a supplier  
Status: Baseline identified

This standard defines minimum assurance expectations for in-scope suppliers, upstream ICT dependencies, and outsourced development or AI-assisted development relationships.

## Minimum Supplier Assurance Rules

- Identify what data or process each supplier can access or affect.
- Review supplier security posture, reliability, and incident-response expectations according to risk.
- Track contractual, compliance, or security obligations outside the repository when they contain sensitive commercial details.
- Record review outcomes and follow-up actions in `SUPPLIER_REVIEW_LOG.md`.

## ICT Supply Chain Expectations

- Treat hosting, database, email, repository/CI, and AI-development providers as part of the ERP ICT supply chain.
- Consider upstream dependencies and concentration risk during supplier reviews rather than reviewing each provider in isolation.
- Review changes in critical supplier paths after major architecture, deployment, or workflow changes.

## Outsourced And AI-Assisted Development

- External contributors and AI-assisted development outputs must follow the same architecture, secure-development, and data-handling rules as internal engineering work.
- AI systems are allowed for drafting and review support but must not receive restricted production data or secrets.
- AI-generated changes must be reviewed and merged through the normal PR and quality-gate path.

## Related Evidence

- `docs/security/SUPPLIER_MANAGEMENT.md`
- `docs/security/SUPPLIER_REVIEW_PLAYBOOK.md`
- `docs/security/AI_USAGE_POLICY.md`
- `docs/security/SECURE_DEVELOPMENT.md`
