---
name: prisma-migration-review
description: Use when reviewing or creating Prisma schema or migration changes.
---

# Prisma Migration Review

Read `docs/PRODUCTION_DATA_SAFETY.md`.

Review points:

- Every table remains tenant-scoped where applicable.
- Queries must filter by `organizationId` and `deletedAt` where the model uses soft deletes.
- Migrations should be additive first.
- Historical data must not be rewritten unless the backfill is idempotent and reviewed.
- Run `npm run check:migrations` and inspect generated SQL manually.

