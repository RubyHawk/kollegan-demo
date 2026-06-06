-- Migration: 20260605000002_time_entry_permissions
--
-- Adds the RBAC permissions for the Time Tracking module (Milestone 2).
--
-- Additive and idempotent: all inserts use ON CONFLICT DO NOTHING, and the
-- migration contains no destructive or schema-altering statements. Safe to
-- deploy with zero downtime and safe to re-apply.
--
-- Permissions seeded: time_entries.read, time_entries.write
-- Grants:
--   time_entries.read  -> admin, user, viewer
--   time_entries.write -> admin, user   (viewer is read-only)
-- super_admin is a wildcard enforced in the RBAC service code — no DB rows needed.
--
-- No schema changes — data-only migration.

-- ─── 1. Permissions ───────────────────────────────────────────────────────────
-- Format: resource.action

INSERT INTO "usr_permissions" ("id", "resource", "action", "createdAt")
VALUES
  (gen_random_uuid()::TEXT, 'time_entries', 'read',  CURRENT_TIMESTAMP),
  (gen_random_uuid()::TEXT, 'time_entries', 'write', CURRENT_TIMESTAMP)
ON CONFLICT ("resource", "action") DO NOTHING;

-- ─── 2. Role → Permission mappings ───────────────────────────────────────────
-- super_admin: wildcard enforced in RBAC service code — no DB rows needed.

-- admin: full time-tracking management
INSERT INTO "usr_role_permissions" ("roleId", "permissionId")
SELECT r."id", p."id"
FROM "usr_roles" r
JOIN "usr_permissions" p ON (p."resource", p."action") IN (
  ('time_entries', 'read'),
  ('time_entries', 'write')
)
WHERE r."name" = 'admin'
ON CONFLICT DO NOTHING;

-- user: log and read own time entries
INSERT INTO "usr_role_permissions" ("roleId", "permissionId")
SELECT r."id", p."id"
FROM "usr_roles" r
JOIN "usr_permissions" p ON (p."resource", p."action") IN (
  ('time_entries', 'read'),
  ('time_entries', 'write')
)
WHERE r."name" = 'user'
ON CONFLICT DO NOTHING;

-- viewer: read-only time entries
INSERT INTO "usr_role_permissions" ("roleId", "permissionId")
SELECT r."id", p."id"
FROM "usr_roles" r
JOIN "usr_permissions" p ON (p."resource", p."action") IN (
  ('time_entries', 'read')
)
WHERE r."name" = 'viewer'
ON CONFLICT DO NOTHING;
