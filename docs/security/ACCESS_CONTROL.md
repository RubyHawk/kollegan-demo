# Access Control

Owner: ISMS Manager  
Review cadence: Quarterly  
Status: Draft baseline

## Access Types

- Application user access.
- Staff/admin access.
- Repository access.
- Production server access.
- Database access.
- CI/CD secret access.
- Third-party SaaS access.

## Rules

- Access should be least privilege.
- Admin/production access requires named approval.
- Offboarding removes app, repo, server, database, and vendor access.
- Access reviews are recorded quarterly.
- Shared accounts should be avoided or documented with compensating controls.

## Quarterly Review Scope

- Application admin/staff roles and elevated permissions.
- Repository write/admin access.
- VPS/server shell and deploy access.
- Database/admin-console access.
- CI/CD secret management access.
- Third-party SaaS admin access.

## Evidence

- Record completed quarterly reviews in `ACCESS_REVIEW_LOG.md`.
- Keep `AUDIT_EVIDENCE_INDEX.md` as the high-level index for completed review cycles and related follow-up changes.
- Auth profile and theme-default resolution changes should stay behind the auth account service and the identity module, so repository-layer auth changes do not silently broaden cross-module access paths.
