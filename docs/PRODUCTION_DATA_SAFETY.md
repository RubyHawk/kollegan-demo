# Production Data Safety

Existing business data is production data even while the product is still evolving.

Protected data includes offers, accepted offers, public offer tokens, signatures, customers, leads, companies, products, product categories, projects, project line items, purchase orders, users, roles, sessions, and organization data.

## Forbidden By Default

- `DROP TABLE`
- `DROP COLUMN`
- `TRUNCATE`
- raw `DELETE FROM`
- destructive `deleteMany` without scoped `where`
- non-idempotent backfills
- replacing production data with seed or demo data

Any exception requires explicit approval, backup evidence, rollback plan, and a link in `docs/security/AUDIT_EVIDENCE_INDEX.md`.

## Safe Schema Order

Prefer additive migrations:

- new nullable columns,
- new tables,
- new indexes,
- safe defaults,
- idempotent backfills,
- read-path compatibility,
- later cleanup only after evidence.

## Production Migration Gate

Before production schema deploys:

1. Take `pg_dump`.
2. Record timestamp and commit SHA.
3. Run migration against staging or a prod-like snapshot.
4. Run smoke tests for offers, projects, companies, products, auth, and signing.
5. Compare business-data counts before and after.
6. Record evidence in `docs/security/AUDIT_EVIDENCE_INDEX.md`.

## Checks

Run:

```bash
npm run check:migrations
npm run check:migrations:all
```

The default check scans changed files. The `--all` variant scans the repository and uses `scripts/migration-safety-allowlist.json` for historical findings.

