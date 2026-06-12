-- Migration: 20260612000003_fluffys_go_live_staff_public_site
--
-- Fluffy's go-live foundation plus additive restaurant operations fields.
-- Guardrails:
--   * no destructive statements;
--   * the seeded restaurant slug is renamed only when the target slug is free;
--   * placeholder domains/content are only demoted/updated when they still match
--     the seeded restaurant tenant;
--   * canonical domains are not stolen from another organization.

-- Restaurant staff/kiosk fields on the unified user model.
ALTER TABLE "usr_users" ADD COLUMN IF NOT EXISTS "employeeCode" TEXT;
ALTER TABLE "usr_users" ADD COLUMN IF NOT EXISTS "clockPinHash" TEXT;
ALTER TABLE "usr_users" ADD COLUMN IF NOT EXISTS "clockPinUpdatedAt" TIMESTAMP(3);

CREATE UNIQUE INDEX IF NOT EXISTS "usr_users_organizationId_employeeCode_key"
ON "usr_users"("organizationId", "employeeCode");

-- Rename the seeded restaurant tenant to the canonical Fluffy's slug only when
-- doing so cannot collide with an existing production tenant.
UPDATE "org_organizations"
SET
  "slug" = 'fluffys',
  "name" = 'Fluffy''s',
  "updatedAt" = CURRENT_TIMESTAMP
WHERE "slug" = 'restaurant-demo'
  AND NOT EXISTS (
    SELECT 1
    FROM "org_organizations" existing
    WHERE existing."slug" = 'fluffys'
  );

-- Keep the display name canonical for the seeded Fluffy tenant, but avoid
-- overwriting a manually customized production name.
UPDATE "org_organizations"
SET
  "name" = 'Fluffy''s',
  "updatedAt" = CURRENT_TIMESTAMP
WHERE "slug" = 'fluffys'
  AND "name" IN ('Restaurant Demo', 'Fluffy''s Subs & Pizza', 'Fluffy''s');

-- Ensure required restaurant modules exist for the live slug.
INSERT INTO "org_modules" ("id", "organizationId", "moduleKey", "enabled", "config", "createdAt", "updatedAt")
SELECT gen_random_uuid()::TEXT, o."id", m."moduleKey", TRUE, '{}'::JSONB, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
FROM "org_organizations" o
JOIN (
  VALUES
    ('restaurant_public_site'),
    ('restaurant_menu'),
    ('clock_in'),
    ('staff_schedule'),
    ('tasks'),
    ('announcements'),
    ('documents')
) AS m("moduleKey") ON TRUE
WHERE o."slug" = 'fluffys'
ON CONFLICT ("organizationId", "moduleKey") DO UPDATE SET
  "enabled" = TRUE,
  "updatedAt" = CURRENT_TIMESTAMP;

-- Demote the seeded placeholder hostnames only for the live Fluffy org. The
-- rows remain as aliases/history; they are not deleted.
UPDATE "org_domains" d
SET
  "isPrimary" = FALSE,
  "updatedAt" = CURRENT_TIMESTAMP
FROM "org_organizations" o
WHERE d."organizationId" = o."id"
  AND o."slug" = 'fluffys'
  AND (
    (d."hostname" = 'restaurantdomain.se' AND d."kind" = 'public')
    OR (d."hostname" = 'portal.restaurantdomain.se' AND d."kind" = 'portal')
  )
  AND d."isPrimary" = TRUE;

-- Canonical public and portal hostnames. ON CONFLICT updates only when the
-- conflicting row already belongs to Fluffy's.
WITH restaurant AS (
  SELECT "id" AS "organizationId"
  FROM "org_organizations"
  WHERE "slug" = 'fluffys'
)
INSERT INTO "org_domains" ("id", "organizationId", "hostname", "kind", "isPrimary", "verifiedAt", "createdAt", "updatedAt")
SELECT gen_random_uuid()::TEXT, r."organizationId", d."hostname", d."kind", TRUE, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
FROM restaurant r
JOIN (
  VALUES
    ('fluffys.se', 'public'),
    ('portal.fluffys.se', 'portal')
) AS d("hostname", "kind") ON TRUE
ON CONFLICT ("hostname") DO UPDATE SET
  "kind" = EXCLUDED."kind",
  "isPrimary" = TRUE,
  "verifiedAt" = COALESCE("org_domains"."verifiedAt", EXCLUDED."verifiedAt"),
  "updatedAt" = CURRENT_TIMESTAMP
WHERE "org_domains"."organizationId" = EXCLUDED."organizationId";

-- Refresh placeholder public-site contact defaults to the live domain only when
-- the previous placeholder values are still present.
UPDATE "org_public_site_settings" s
SET
  "siteName" = CASE WHEN s."siteName" IN ('Restaurant Demo', 'Fluffy''s Subs & Pizza') THEN 'Fluffy''s' ELSE s."siteName" END,
  "heroTitle" = CASE WHEN s."heroTitle" IN ('Restaurant Demo', 'Fluffy''s Subs & Pizza') THEN 'Fluffy''s' ELSE s."heroTitle" END,
  "email" = CASE WHEN s."email" IN ('hello@restaurantdomain.se') THEN 'hej@fluffys.se' ELSE s."email" END,
  "reservationEmail" = CASE WHEN s."reservationEmail" IN ('booking@restaurantdomain.se') THEN 'bokning@fluffys.se' ELSE s."reservationEmail" END,
  "seoTitle" = CASE WHEN s."seoTitle" IN ('Restaurant Demo', 'Fluffy''s Subs & Pizza') THEN 'Fluffy''s' ELSE s."seoTitle" END,
  "updatedAt" = CURRENT_TIMESTAMP
FROM "org_organizations" o
WHERE s."organizationId" = o."id"
  AND o."slug" = 'fluffys';

-- Create/update a Fluffy's selling company without duplicating existing data.
WITH restaurant AS (
  SELECT "id" AS "organizationId"
  FROM "org_organizations"
  WHERE "slug" = 'fluffys'
), actor AS (
  SELECT
    r."organizationId",
    COALESCE((
      SELECT u."id"
      FROM "usr_users" u
      WHERE u."organizationId" = r."organizationId"
        AND u."deletedAt" IS NULL
      ORDER BY u."createdAt" ASC
      LIMIT 1
    ), 'system:migration') AS "createdBy"
  FROM restaurant r
)
INSERT INTO "off_companies" (
  "id", "organizationId", "name", "country", "currency", "defaultVatRate",
  "website", "senderEmail", "senderName", "createdBy", "createdAt", "updatedAt"
)
SELECT
  '11111111-8000-4000-8000-000000000001',
  a."organizationId",
  'Fluffy''s Laxå',
  'SE',
  'SEK',
  0.25,
  'https://fluffys.se',
  'hej@fluffys.se',
  'Fluffy''s',
  a."createdBy",
  CURRENT_TIMESTAMP,
  CURRENT_TIMESTAMP
FROM actor a
WHERE NOT EXISTS (
  SELECT 1
  FROM "off_companies" c
  WHERE c."organizationId" = a."organizationId"
    AND c."name" = 'Fluffy''s Laxå'
    AND c."deletedAt" IS NULL
)
ON CONFLICT ("id") DO UPDATE SET
  "name" = EXCLUDED."name",
  "website" = COALESCE("off_companies"."website", EXCLUDED."website"),
  "senderEmail" = COALESCE("off_companies"."senderEmail", EXCLUDED."senderEmail"),
  "senderName" = COALESCE("off_companies"."senderName", EXCLUDED."senderName"),
  "updatedAt" = CURRENT_TIMESTAMP
WHERE "off_companies"."organizationId" = EXCLUDED."organizationId";

UPDATE "off_companies" c
SET
  "name" = 'Fluffy''s Laxå',
  "website" = COALESCE(c."website", 'https://fluffys.se'),
  "senderEmail" = COALESCE(c."senderEmail", 'hej@fluffys.se'),
  "senderName" = COALESCE(c."senderName", 'Fluffy''s'),
  "updatedAt" = CURRENT_TIMESTAMP
FROM "org_organizations" o
WHERE c."organizationId" = o."id"
  AND o."slug" = 'fluffys'
  AND c."deletedAt" IS NULL
  AND c."name" IN ('Restaurant Demo', 'Fluffy''s Subs & Pizza', 'Fluffy''s')
  AND NOT EXISTS (
    SELECT 1
    FROM "off_companies" existing
    WHERE existing."organizationId" = o."id"
      AND existing."name" = 'Fluffy''s Laxå'
      AND existing."deletedAt" IS NULL
  );

-- Restaurant operations permissions.
INSERT INTO "usr_permissions" ("id", "resource", "action", "createdAt")
VALUES
  (gen_random_uuid()::TEXT, 'attendance', 'kiosk', CURRENT_TIMESTAMP),
  (gen_random_uuid()::TEXT, 'public_site', 'read', CURRENT_TIMESTAMP),
  (gen_random_uuid()::TEXT, 'public_site', 'write', CURRENT_TIMESTAMP)
ON CONFLICT ("resource", "action") DO NOTHING;

INSERT INTO "usr_role_permissions" ("roleId", "permissionId")
SELECT r."id", p."id"
FROM "usr_roles" r
JOIN "usr_permissions" p ON (p."resource", p."action") IN (
  ('attendance', 'kiosk'),
  ('public_site', 'read'),
  ('public_site', 'write')
)
WHERE r."name" IN ('restaurant_owner', 'restaurant_manager')
ON CONFLICT DO NOTHING;
