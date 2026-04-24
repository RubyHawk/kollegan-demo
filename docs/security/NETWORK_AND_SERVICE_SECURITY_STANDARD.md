# Network And Service Security Standard

Owner: Engineering lead  
Review cadence: Quarterly and after material hosting or network changes  
Status: Baseline identified

This standard defines the minimum baseline for network security, network service protection, administrative network separation, and related hosting controls.

## Network Security Baseline

- Do not expose databases, Redis, or other sensitive operational services to the public internet when controlled administrative access paths exist.
- Prefer approved administrative access paths, hardened firewall rules, and tracked deployment paths over ad hoc public exposure.
- Review hosting and network assumptions after major infrastructure or supplier changes.

## Network Service Expectations

- Treat public HTTP/HTTPS application traffic separately from privileged operational services.
- Keep operational services behind approved administrative paths and supplier/hosting controls where possible.
- Use the VPS/network hardening guidance as the baseline for firewall and administrative-access posture.

## Segregation And Filtering Notes

- Maintain a distinction between public-facing application routes and restricted operational services.
- Web filtering decisions may depend on endpoint-management or provider capabilities outside the repository and should be reviewed before readiness is claimed.

## Related Evidence

- `docs/vps-security-guide.html`
- `docs/security/REMOTE_WORKING_STANDARD.md`
- `docs/security/SUPPLIER_MANAGEMENT.md`
- `.github/workflows/deploy.yml`
