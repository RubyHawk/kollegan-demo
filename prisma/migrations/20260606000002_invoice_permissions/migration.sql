-- Migration: 20260606000002_invoice_permissions
--
-- Adds the RBAC permissions for the Invoicing module (Milestone 3).
--
-- Additive and idempotent: all inserts use ON CONFLICT DO NOTHING, and the
-- migration contains no destructive or schema-altering statements. Safe to
-- deploy with zero downtime and safe to re-apply.
--
-- Permissions seeded: invoices.read, invoices.write, invoices.send, invoices.delete
-- Grants:
--   invoices.read   -> admin, user, viewer
--   invoices.write  -> admin, user
--   invoices.send   -> admin, user
--   invoices.delete -> admin
-- super_admin is a wildcard enforced in the RBAC service code — no DB rows needed.
--
-- No schema changes — data-only migration.

-- ─── 1. Permissions ───────────────────────────────────────────────────────────
-- Format: resource.action

INSERT INTO "usr_permissions" ("id", "resource", "action", "createdAt")
VALUES
  (gen_random_uuid()::TEXT, 'invoices', 'read',   CURRENT_TIMESTAMP),
  (gen_random_uuid()::TEXT, 'invoices', 'write',  CURRENT_TIMESTAMP),
  (gen_random_uuid()::TEXT, 'invoices', 'send',   CURRENT_TIMESTAMP),
  (gen_random_uuid()::TEXT, 'invoices', 'delete', CURRENT_TIMESTAMP)
ON CONFLICT ("resource", "action") DO NOTHING;

-- ─── 2. Role → Permission mappings ───────────────────────────────────────────
-- super_admin: wildcard enforced in RBAC service code — no DB rows needed.

-- admin: full invoice management
INSERT INTO "usr_role_permissions" ("roleId", "permissionId")
SELECT r."id", p."id"
FROM "usr_roles" r
JOIN "usr_permissions" p ON (p."resource", p."action") IN (
  ('invoices', 'read'),
  ('invoices', 'write'),
  ('invoices', 'send'),
  ('invoices', 'delete')
)
WHERE r."name" = 'admin'
ON CONFLICT DO NOTHING;

-- user: create, edit, and send invoices (no delete)
INSERT INTO "usr_role_permissions" ("roleId", "permissionId")
SELECT r."id", p."id"
FROM "usr_roles" r
JOIN "usr_permissions" p ON (p."resource", p."action") IN (
  ('invoices', 'read'),
  ('invoices', 'write'),
  ('invoices', 'send')
)
WHERE r."name" = 'user'
ON CONFLICT DO NOTHING;

-- viewer: read-only invoices
INSERT INTO "usr_role_permissions" ("roleId", "permissionId")
SELECT r."id", p."id"
FROM "usr_roles" r
JOIN "usr_permissions" p ON (p."resource", p."action") IN (
  ('invoices', 'read')
)
WHERE r."name" = 'viewer'
ON CONFLICT DO NOTHING;
