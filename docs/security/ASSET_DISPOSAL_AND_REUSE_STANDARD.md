# Asset Disposal And Reuse Standard

Owner: ISMS Manager  
Review cadence: Quarterly and after material hosting, endpoint, or media-handling changes  
Status: Baseline identified

This standard defines the minimum repo-backed baseline for secure disposal, sanitization, and reuse of equipment or storage media that may hold Kollegan information. Detailed destruction certificates, serial numbers, or supplier-specific physical handling records may remain outside the repository when sensitive.

## Baseline Rules

- Do not dispose of, transfer, or reuse equipment or storage media that may contain Kollegan information without a sanitization or destruction decision.
- Remove secrets, credentials, cached session material, and restricted local copies before equipment is reassigned, returned, or disposed of.
- Reused equipment must be reimaged, reset, or otherwise sanitized before reassignment to a new owner.
- Storage media that cannot be safely sanitized must be physically destroyed or handled through an approved supplier process.
- Hosting-provider and supplier-owned equipment may rely on inherited provider processes, but the baseline expectation and review path must still be defined.
- Record completed repo-safe disposal, destruction, sanitization, or reassignment outcomes in `ASSET_LIFECYCLE_LOG.md`.

## Disposal And Reuse Expectations

1. Identify the asset class and whether it held restricted, internal, or public information.
2. Choose the handling path: sanitized for reuse, returned to supplier, or securely destroyed.
3. Verify that secrets, local exports, and privileged tooling access have been removed before reassignment or disposal.
4. Keep destruction certificates, serial-level proof, or supplier-specific handling detail outside the repository when sensitive; record a repo-safe summary or reference instead.
5. Log the completed outcome in `ASSET_LIFECYCLE_LOG.md` when the event is appropriate for repo-backed evidence.

## Related Evidence

- `docs/security/ASSET_INVENTORY.md`
- `docs/security/ASSET_LIFECYCLE_LOG.md`
- `docs/security/LEGAL_RECORDS_AND_PRIVACY_STANDARD.md`
- `docs/security/PHYSICAL_AND_HOSTING_SECURITY_STANDARD.md`
- `docs/security/SUPPLIER_ASSURANCE_STANDARD.md`
