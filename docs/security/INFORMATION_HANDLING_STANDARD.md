# Information Handling Standard

Owner: ISMS Manager  
Review cadence: Quarterly and after major process changes  
Status: Baseline identified

This standard defines acceptable use, classification, and labelling expectations for information handled by Kollegan engineering, support, and administrative workflows.

## Acceptable Use Rules

- Use production customer and business data only in approved business workflows, approved support tasks, or controlled recovery/testing activities.
- Use least privilege for repository, VPS, database, admin, and CI/CD access.
- Use redacted or synthetic examples in docs, tickets, pull requests, tests, prompts, and AI-assisted development unless real data is strictly required and approved outside the repository.
- Never commit secrets, tokens, credentials, backups, customer exports, or raw sensitive logs to the repository.
- Do not paste production data, signatures, or private business data into external AI tools.

## Classification Levels

| Level | Description | Typical examples | Minimum handling |
| --- | --- | --- | --- |
| `Restricted` | Information that could materially harm customers, users, or the business if disclosed or altered | Production database contents, auth/session data, signatures, backup references, deployment credentials, private incident details | Need-to-know access only; never commit to repo; redact in tickets/docs; transfer only by approved channels |
| `Internal` | Operational or engineering information intended for authorized team members only | Architecture docs, supplier reviews, audit logs without secrets, deployment runbooks, risk register | Keep within approved work systems; avoid public sharing; redact if copied into broader collaboration spaces |
| `Public` | Information approved for public or customer-visible use | Public marketing text, sanitized demo material, intentionally public offer pages | May be shared publicly if reviewed and approved for that purpose |

## Labelling Rules

- Treat production business data and security-sensitive operational details as `Restricted` by default unless a stricter external requirement applies.
- Treat repo-backed security docs, playbooks, and evidence logs as `Internal` unless they would expose restricted details; redact or externalize those details instead of lowering the classification.
- Label exported evidence, spreadsheets, or ad hoc working documents outside the repository with `Restricted`, `Internal`, or `Public`.
- When a repository document is intentionally redacted, say so explicitly in the file instead of embedding restricted content.

## Minimum Handling Expectations

- `Restricted` data must not be copied into repository docs, PR comments, AI prompts, or test fixtures.
- `Internal` information may be stored in the repository when it does not include secrets or restricted raw data.
- `Public` information must still be reviewed to ensure it does not accidentally include internal or restricted content.

## Related Evidence

- `docs/PRODUCTION_DATA_SAFETY.md`
- `docs/AI_ENGINEERING.md`
- `docs/security/AI_USAGE_POLICY.md`
- `docs/security/ACCESS_CONTROL.md`
