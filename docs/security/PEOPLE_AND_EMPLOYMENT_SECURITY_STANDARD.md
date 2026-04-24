# People And Employment Security Standard

Owner: ISMS Manager  
Review cadence: Quarterly and after material staffing or role changes  
Status: Baseline identified

This standard defines the minimum people-security baseline for Kollegan. Detailed employment, HR, or legal records may remain outside the repository when they contain sensitive personnel information.

## Baseline Rules

- Role changes, onboarding, and offboarding must be reflected in access and responsibility reviews.
- Employment, contractor, confidentiality, and disciplinary records should be maintained outside the repository when they contain personal or legally sensitive details.
- The repository should keep the engineering-facing baseline, ownership, and evidence links for people-security controls.

## Onboarding And Employment Expectations

- Screening or equivalent pre-access checks should be completed before granting elevated access where required by role or risk.
- Terms, confidentiality expectations, and information-security obligations should be communicated before privileged or sensitive access is granted.
- Disciplinary or corrective processes for policy breaches should follow the applicable management, HR, or legal path outside the repository when personnel-sensitive detail is involved.
- AI-assisted development users must follow the same data-handling and review rules as any other contributor.

## Offboarding And Change Of Role

- Remove or reduce repository, VPS, database, CI/CD, and SaaS access when roles change or end.
- Review assigned organization-owned devices, removable media, tokens, badges, and other controlled assets as part of offboarding.
- Use the offboarding and asset-return baseline to make asset recovery or approved exceptions explicit.
- Use the access-review process to verify that changes in responsibilities are reflected in actual access rights.

## Related Evidence

- `docs/security/ACCESS_CONTROL.md`
- `docs/security/ACCESS_REVIEW_CHECKLIST.md`
- `docs/security/OFFBOARDING_AND_ASSET_RETURN_STANDARD.md`
- `docs/security/ASSET_LIFECYCLE_LOG.md`
- `docs/security/SECURITY_AWARENESS_PLAYBOOK.md`
- `docs/security/AI_USAGE_POLICY.md`
