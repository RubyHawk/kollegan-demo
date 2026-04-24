# Data Protection Lifecycle Standard

Owner: Engineering lead  
Review cadence: Quarterly and after material product or data-flow changes  
Status: Baseline identified

This standard defines the minimum baseline for information deletion, masking/redaction, and leakage prevention across Kollegan engineering workflows.

## Deletion Baseline

- Treat destructive deletion in production as exceptional and controlled, not routine.
- Prefer additive-first schema and data changes.
- Keep evidence for any exceptional destructive production-data action in the audit trail.

## Masking And Redaction Baseline

- Use synthetic, anonymized, or redacted data for tests, docs, prompts, screenshots, and examples.
- Do not commit raw production exports, customer data, signatures, or sensitive logs.

## Leakage Prevention Baseline

- Keep restricted information out of the repository, PR comments, tickets, AI prompts, and unapproved transfer channels.
- Prefer references, summaries, or redacted evidence over copying sensitive payloads.

## Related Evidence

- `docs/PRODUCTION_DATA_SAFETY.md`
- `docs/security/INFORMATION_HANDLING_STANDARD.md`
- `docs/security/INFORMATION_TRANSFER_STANDARD.md`
- `docs/security/TEST_INFORMATION_STANDARD.md`
- `docs/security/AI_USAGE_POLICY.md`
