# Access Review Checklist

Owner: ISMS Manager  
Review cadence: Before each quarterly review  
Status: Baseline workflow

Use this checklist to prepare and complete quarterly access reviews for in-scope Kollegan ERP systems. Do not commit passwords, tokens, SSH private keys, or raw access exports.

## Review Scope

Review at least:

- Application admin/staff access.
- Repository write/admin access.
- VPS/server shell and deploy access.
- Database/admin-console access.
- CI/CD secret management access.
- Third-party SaaS admin access.

## Checklist

1. Define the review window and reviewer.
2. Gather the current access lists or screenshots from each in-scope system.
3. For each access set, confirm:
   - active user still needs access,
   - role/permission level is least privilege,
   - shared or exceptional access has documented justification.
4. Record removals, downgrades, or compensating controls needed.
5. Open follow-up PRs or tickets for access changes where needed.
6. Record the completed cycle in `ACCESS_REVIEW_LOG.md`.

## Outputs

- Reviewed scope.
- Findings and actions.
- Due dates for access changes.
- Entry in `ACCESS_REVIEW_LOG.md`.

