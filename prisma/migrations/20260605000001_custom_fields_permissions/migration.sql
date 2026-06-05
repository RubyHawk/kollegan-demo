-- Migration: 20260605000001_custom_fields_permissions
--
-- Adds the RBAC permissions for the Custom Fields module (Milestone 1).
--
-- Additive and idempotent: all inserts use ON CONFLICT DO NOTHING, and the
-- migration contains no destructive or schema-altering statements. Safe to
-- deploy with zero downtime and safe to re-apply.
--
-- Permissions seeded: custom_fields.read, custom_fields.write
-- Grants:
--   custom_fields.read  -> admin, user, viewer
--   custom_fields.write -> admin
-- super_admin is a wildcard enforced in the RBAC service code — no DB rows needed.
--
-- No schema changes — data-only migration.

-- ─── 1. Permissions ───────────────────────────────────────────────────────────
-- Format: resource.action

INSERT INTO "usr_permissions" ("id", "resource", "action", "createdAt")
VALUES
  (gen_random_uuid()::TEXT, 'custom_fields', 'read',  CURRENT_TIMESTAMP),
  (gen_random_uuid()::TEXT, 'custom_fields', 'write', CURRENT_TIMESTAMP)
ON CONFLICT ("resource", "action") DO NOTHING;

-- ─── 2. Role → Permission mappings ───────────────────────────────────────────
-- super_admin: wildcard enforced in RBAC service code — no DB rows needed.

-- admin: full custom-field management
INSERT INTO "usr_role_permissions" ("roleId", "permissionId")
SELECT r."id", p."id"
FROM "usr_roles" r
JOIN "usr_permissions" p ON (p."resource", p."action") IN (
  ('custom_fields', 'read'),
  ('custom_fields', 'write')
)
WHERE r."name" = 'admin'
ON CONFLICT DO NOTHING;

-- user: read-only custom-field definitions
INSERT INTO "usr_role_permissions" ("roleId", "permissionId")
SELECT r."id", p."id"
FROM "usr_roles" r
JOIN "usr_permissions" p ON (p."resource", p."action") IN (
  ('custom_fields', 'read')
)
WHERE r."name" = 'user'
ON CONFLICT DO NOTHING;

-- viewer: read-only custom-field definitions
INSERT INTO "usr_role_permissions" ("roleId", "permissionId")
SELECT r."id", p."id"
FROM "usr_roles" r
JOIN "usr_permissions" p ON (p."resource", p."action") IN (
  ('custom_fields', 'read')
)
WHERE r."name" = 'viewer'
ON CONFLICT DO NOTHING;
