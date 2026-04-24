# Legal, Records, And Privacy Standard

Owner: ISMS Manager  
Review cadence: Quarterly and after material product, supplier, or jurisdiction changes  
Status: Baseline identified

This standard defines the minimum repo-backed baseline for legal/compliance obligations, intellectual property handling, records protection, and privacy/PII protection.

## Legal And Contractual Obligations

- Maintain the authoritative legal or contractual obligation register outside the repository when legal detail or signed agreements are sensitive.
- Keep the repository as the baseline location for engineering-facing controls, ownership, and evidence links related to those obligations.
- Review obligations after changes to suppliers, customer-facing workflows, public offers, signing, or production-data handling.

## Intellectual Property

- Respect license and ownership constraints for dependencies, supplier tools, generated content, and contributed code.
- Do not copy third-party proprietary content, code, or customer-owned material into the repository without authorization.
- Record supplier and licensing considerations as part of supplier review and engineering review where relevant.

## Protection Of Records

- Keep security logs, review records, and evidence entries versioned in the repository when they do not contain secrets or restricted raw data.
- Keep backups, credentials, customer exports, signed contracts, and raw sensitive artifacts outside the repository.
- Use redacted summaries or references in the repository when the primary record must remain external.

## Privacy And PII

- Treat customer data, user data, signatures, contact details, and production business records as restricted unless intentionally public.
- Do not use production PII in tests, prompts, screenshots, or examples.
- Use the production-data safety, information-handling, and information-transfer baselines as the minimum privacy-handling controls inside engineering workflows.

## Related Evidence

- `docs/PRODUCTION_DATA_SAFETY.md`
- `docs/security/ASSET_INVENTORY.md`
- `docs/security/INFORMATION_HANDLING_STANDARD.md`
- `docs/security/INFORMATION_TRANSFER_STANDARD.md`
- `docs/security/SUPPLIER_MANAGEMENT.md`
