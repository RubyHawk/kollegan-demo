# Web Filtering Baseline

Owner: Engineering lead  
Review cadence: Quarterly and after material endpoint or network changes  
Status: Baseline identified

This baseline captures how Kollegan currently treats web filtering in the context of ERP administration and engineering work.

## Baseline Position

- Production services should not be used for general-purpose web browsing.
- Administrative and engineering access should use approved accounts, least privilege, and controlled network paths rather than relying on unrestricted browsing from operational systems.
- If endpoint or provider-level web filtering is used, its detailed configuration may remain outside the repository.

## Minimum Expectations

- Keep privileged operational services behind approved administrative access paths and hardened firewall/network posture.
- Avoid transferring restricted information into unapproved external web services.
- Review whether additional endpoint or provider web-filtering controls are needed when risk, supplier posture, or operating context changes.

## Related Evidence

- `docs/security/NETWORK_AND_SERVICE_SECURITY_STANDARD.md`
- `docs/security/REMOTE_WORKING_STANDARD.md`
- `docs/security/AI_USAGE_POLICY.md`
- `docs/vps-security-guide.html`
