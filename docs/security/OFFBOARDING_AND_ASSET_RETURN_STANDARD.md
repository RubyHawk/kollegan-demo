# Offboarding And Asset Return Standard

Owner: ISMS Manager  
Review cadence: Quarterly and after material staffing or asset-handling changes  
Status: Baseline identified

This standard defines the minimum repo-backed baseline for offboarding and return of organization-owned or organization-controlled assets. Detailed HR records, serial numbers, home addresses, and other sensitive personnel details may remain outside the repository.

## Baseline Rules

- Treat access revocation and asset return as linked but separate offboarding checks.
- Before a role ends or materially changes, identify the organization-owned or organization-controlled assets assigned to that person.
- Do not treat an offboarding cycle as complete until access changes are handled and an asset-return or approved exception outcome is recorded.
- Keep sensitive device identifiers, shipping details, and personnel-sensitive notes outside the repository when they are not needed for engineering evidence.
- Record completed repo-safe return, exception, or recovery outcomes in `ASSET_LIFECYCLE_LOG.md`.

## Minimum Asset Scope

Review at least:

- laptops, phones, tablets, and other endpoint devices;
- hardware security keys, smart cards, badges, and removable media;
- printed material or local exports containing restricted information;
- supplier-owned equipment or tokens held by Kollegan personnel where return or revocation is required.

## Offboarding And Return Expectations

1. Confirm the role end date or responsibility change.
2. Review assigned access and assigned assets together.
3. Recover assets directly, confirm return through management or supplier process, or document the approved exception path outside the repository when sensitive detail is involved.
4. Verify that local administrator sessions, stored secrets, and restricted local copies are removed or transitioned appropriately.
5. Record the completed return/recovery outcome in `ASSET_LIFECYCLE_LOG.md` when a repo-safe summary is appropriate.

## Related Evidence

- `docs/security/ACCESS_CONTROL.md`
- `docs/security/ACCESS_REVIEW_CHECKLIST.md`
- `docs/security/ASSET_INVENTORY.md`
- `docs/security/ASSET_LIFECYCLE_LOG.md`
- `docs/security/PEOPLE_AND_EMPLOYMENT_SECURITY_STANDARD.md`
