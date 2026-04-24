# Physical And Hosting Security Standard

Owner: ISMS Manager  
Review cadence: Quarterly and after material hosting or facility changes  
Status: Baseline identified

This standard defines the baseline for physical and environmental security where Kollegan relies on hosting providers, office/home-working arrangements, and external facilities rather than repo-managed infrastructure alone.

## Baseline Rules

- Treat VPS/datacenter physical controls as primarily inherited from the hosting provider and review them through supplier management.
- Treat local office or remote-working physical practices as an operational responsibility that must not expose restricted production information or unattended privileged sessions.
- Keep sensitive physical addresses, facility details, and provider-specific security artifacts outside the repository when they are not needed for engineering evidence.

## Hosting And Facility Expectations

- Hosting providers should provide baseline physical and environmental protections for in-scope runtime and database systems.
- Work devices and administrator sessions should not be left unattended without lock controls.
- Physical media, local exports, and printed sensitive material should be minimized and protected according to the information-handling baseline.
- Equipment that held Kollegan information should follow a defined sanitization, reuse, return, or disposal path before reassignment or end-of-life handling.

## Related Evidence

- `docs/security/SUPPLIER_MANAGEMENT.md`
- `docs/security/SUPPLIER_ASSURANCE_STANDARD.md`
- `docs/security/ASSET_DISPOSAL_AND_REUSE_STANDARD.md`
- `docs/security/ASSET_LIFECYCLE_LOG.md`
- `docs/security/REMOTE_WORKING_STANDARD.md`
- `docs/vps-security-guide.html`
