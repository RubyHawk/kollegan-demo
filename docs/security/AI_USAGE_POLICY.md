# AI Usage Policy

Owner: Engineering lead  
Review cadence: Quarterly  
Status: Draft baseline

## Allowed Use

- Code generation and refactoring.
- Test generation.
- Documentation drafting.
- Architecture review.
- PR review assistance.

## Forbidden Data

Do not paste into AI tools:

- secrets,
- `.env` values,
- production customer data,
- public signing tokens,
- signatures,
- credentials,
- private customer notes,
- production database dumps.

## Review Rules

- AI output must be reviewed.
- AI-generated migrations require manual review.
- AI-generated security docs must be verified by an owner.
- AI agents must follow `docs/AI_ENGINEERING.md`.

## Awareness Link

- Include AI data-handling and review rules in the relevant security awareness cycle tracked in `SECURITY_AWARENESS_LOG.md`.
