-- Migration: 20260515000001_add_pending_totp_helpdesk_recovery
--
-- Adds pending TOTP enrollment state and the org-scoped helpdesk MFA recovery role.
-- Safe to re-apply: additive schema only plus idempotent RBAC inserts.

ALTER TABLE "usr_users"
  ADD COLUMN IF NOT EXISTS "pendingTotpSecret" TEXT;

INSERT INTO "usr_permissions" ("id", "resource", "action", "createdAt")
SELECT gen_random_uuid()::TEXT, 'users', 'mfa_reset', CURRENT_TIMESTAMP
WHERE NOT EXISTS (
  SELECT 1
  FROM "usr_permissions"
  WHERE "resource" = 'users' AND "action" = 'mfa_reset'
);

INSERT INTO "usr_roles" ("id", "name", "displayName", "description", "isSystem", "createdAt")
SELECT gen_random_uuid()::TEXT, 'helpdesk', 'Helpdesk', 'Organization-scoped MFA recovery operator', TRUE, CURRENT_TIMESTAMP
WHERE NOT EXISTS (
  SELECT 1
  FROM "usr_roles"
  WHERE "name" = 'helpdesk'
);

INSERT INTO "usr_role_permissions" ("roleId", "permissionId")
SELECT role_rows."id", permission_rows."id"
FROM "usr_roles" AS role_rows
JOIN "usr_permissions" AS permission_rows
  ON permission_rows."resource" = 'users'
 AND permission_rows."action" = 'mfa_reset'
WHERE role_rows."name" IN ('admin', 'helpdesk')
ON CONFLICT DO NOTHING;

UPDATE "usr_users" AS users
SET "mfaEnabled" = (
  users."totpSecret" IS NOT NULL
  OR EXISTS (
    SELECT 1
    FROM "usr_webauthn_credentials" AS credentials
    WHERE credentials."userId" = users."id"
  )
);
