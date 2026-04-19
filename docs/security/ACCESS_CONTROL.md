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

## Evidence

Record access reviews in `AUDIT_EVIDENCE_INDEX.md`.

