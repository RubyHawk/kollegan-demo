---
name: production-data-safety
description: Use before changing Prisma schema, migrations, repositories, seed scripts, backfills, or code that can alter production business data.
---

# Production Data Safety

Read `docs/PRODUCTION_DATA_SAFETY.md` and `docs/security/AUDIT_EVIDENCE_INDEX.md`.

Checklist:

- Start with `git status`.
- Inspect migrations manually before editing schema.
- Prefer additive migrations.
- Do not add `DROP TABLE`, `DROP COLUMN`, `TRUNCATE`, raw `DELETE FROM`, or unscoped destructive operations without explicit approval.
- Confirm backfills are idempotent.
- Record backup, rollback, and validation expectations for schema changes.
- Run `npm run check:migrations`.

