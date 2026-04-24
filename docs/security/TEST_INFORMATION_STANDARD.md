# Test Information Standard

Owner: Engineering lead  
Review cadence: Quarterly and after major testing-process changes  
Status: Baseline identified

This standard defines how test information and test data should be handled in Kollegan ERP engineering and recovery-validation workflows.

## Test Information Rules

- Prefer synthetic, anonymized, or redacted test data in automated tests, fixtures, screenshots, docs, prompts, and pull requests.
- Do not commit production exports, raw customer data, signatures, secrets, session tokens, or backup files as test assets.
- When production-like validation is required, use controlled non-production restore or snapshot workflows described in `RESTORE_TEST_PLAYBOOK.md` and record only redacted evidence in the repository.
- Tests and fixtures must not overwrite or replace production data.
- Demo data and demo routes are allowed for demo validation, but they are not substitutes for production ERP evidence.

## Approved Test Information Sources

| Source | Allowed use | Restrictions |
| --- | --- | --- |
| Synthetic fixtures and mocks | Unit, integration, UI, and handler tests | Prefer by default; keep free of secrets and customer identifiers |
| Redacted examples | Docs, PR explanations, playbooks, and AI-assisted development | Remove customer-identifying or security-sensitive details |
| Controlled restore-test target | Recovery validation and smoke testing after restore | Must stay non-production and be recorded through restore-test evidence, not committed as raw data |
| Demo data | Demo route and isolated demo validation | Must remain isolated from ERP production workflows |

## Related Evidence

- `docs/PRODUCTION_DATA_SAFETY.md`
- `docs/security/RESTORE_TEST_PLAYBOOK.md`
- `docs/security/SECURE_DEVELOPMENT.md`
- `docs/security/INFORMATION_HANDLING_STANDARD.md`
