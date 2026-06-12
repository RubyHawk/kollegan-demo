-- Add explicit reservation management permissions for restaurant portal users.

INSERT INTO "usr_permissions" ("id", "resource", "action", "createdAt")
VALUES
  (gen_random_uuid()::TEXT, 'reservations', 'read', CURRENT_TIMESTAMP),
  (gen_random_uuid()::TEXT, 'reservations', 'write', CURRENT_TIMESTAMP)
ON CONFLICT ("resource", "action") DO NOTHING;

INSERT INTO "usr_role_permissions" ("roleId", "permissionId")
SELECT r."id", p."id"
FROM "usr_roles" r
JOIN "usr_permissions" p ON (p."resource", p."action") IN (
  ('reservations', 'read'),
  ('reservations', 'write')
)
WHERE r."name" IN ('restaurant_owner', 'restaurant_manager')
ON CONFLICT DO NOTHING;

INSERT INTO "usr_role_permissions" ("roleId", "permissionId")
SELECT r."id", p."id"
FROM "usr_roles" r
JOIN "usr_permissions" p ON (p."resource", p."action") IN (
  ('reservations', 'read')
)
WHERE r."name" = 'restaurant_accountant'
ON CONFLICT DO NOTHING;
