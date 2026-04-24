# Remote Working Standard

Owner: ISMS Manager  
Review cadence: Quarterly and after material infrastructure or access-model changes  
Status: Baseline identified

This standard defines minimum expectations for remote working in Kollegan engineering, support, and administrative access.

## Remote Working Rules

- Use approved accounts and least-privilege access for repository, VPS, database, and SaaS administration.
- Do not store or transfer restricted production data through personal messaging channels or unapproved sharing tools.
- Lock devices and sessions when unattended, and keep access credentials outside the repository.
- Use approved network and administrative access paths for production systems rather than ad hoc public exposure.

## Remote Access Baseline

- Production releases use the tracked GitHub deployment workflow and tracked VPS deploy script.
- Access to production administration paths is reviewed through the access-review scope in `ACCESS_REVIEW_CHECKLIST.md`.
- VPS/network hardening guidance lives in `docs/vps-security-guide.html`.

## Related Evidence

- `docs/security/ACCESS_CONTROL.md`
- `docs/security/ACCESS_REVIEW_CHECKLIST.md`
- `docs/security/AI_USAGE_POLICY.md`
- `docs/vps-security-guide.html`
