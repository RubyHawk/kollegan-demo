-- Migration: 20260618000001_restaurant_orders_pos_foundation
--
-- Adds the Fluffy's internal POS order foundation. Additive only:
--   * creates new rst_* order tables;
--   * seeds new order permissions idempotently;
--   * enables the restaurant_orders module only for restaurant tenants.
-- No existing Soleria/offers/public-offer data is deleted or rewritten.

CREATE TABLE IF NOT EXISTS "rst_business_days" (
  "id" TEXT NOT NULL DEFAULT gen_random_uuid()::TEXT,
  "organizationId" TEXT NOT NULL,
  "businessDate" TIMESTAMP(3) NOT NULL,
  "status" TEXT NOT NULL DEFAULT 'open',
  "openedBy" TEXT,
  "openedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "closedBy" TEXT,
  "closedAt" TIMESTAMP(3),
  "openingNote" TEXT,
  "closingNote" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "deletedAt" TIMESTAMP(3),
  CONSTRAINT "rst_business_days_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "rst_business_days_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "org_organizations"("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

CREATE INDEX IF NOT EXISTS "rst_business_days_organizationId_businessDate_idx" ON "rst_business_days"("organizationId", "businessDate");
CREATE INDEX IF NOT EXISTS "rst_business_days_organizationId_status_idx" ON "rst_business_days"("organizationId", "status");
CREATE INDEX IF NOT EXISTS "rst_business_days_deletedAt_idx" ON "rst_business_days"("deletedAt");
CREATE UNIQUE INDEX IF NOT EXISTS "rst_business_days_one_open_per_org_key"
ON "rst_business_days"("organizationId")
WHERE "status" = 'open' AND "closedAt" IS NULL AND "deletedAt" IS NULL;

CREATE TABLE IF NOT EXISTS "rst_orders" (
  "id" TEXT NOT NULL DEFAULT gen_random_uuid()::TEXT,
  "organizationId" TEXT NOT NULL,
  "businessDayId" TEXT,
  "orderNumber" INTEGER NOT NULL,
  "source" TEXT NOT NULL DEFAULT 'portal',
  "status" TEXT NOT NULL DEFAULT 'new',
  "paymentStatus" TEXT NOT NULL DEFAULT 'unpaid',
  "paymentMethod" TEXT,
  "fulfillmentType" TEXT NOT NULL DEFAULT 'takeaway',
  "customerName" TEXT,
  "note" TEXT,
  "subtotalCents" INTEGER NOT NULL DEFAULT 0,
  "totalCents" INTEGER NOT NULL DEFAULT 0,
  "currency" TEXT NOT NULL DEFAULT 'SEK',
  "paidAt" TIMESTAMP(3),
  "completedAt" TIMESTAMP(3),
  "cancelledAt" TIMESTAMP(3),
  "createdBy" TEXT,
  "updatedBy" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "deletedAt" TIMESTAMP(3),
  CONSTRAINT "rst_orders_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "rst_orders_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "org_organizations"("id") ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT "rst_orders_businessDayId_fkey" FOREIGN KEY ("businessDayId") REFERENCES "rst_business_days"("id") ON DELETE SET NULL ON UPDATE CASCADE
);

CREATE UNIQUE INDEX IF NOT EXISTS "rst_orders_businessDayId_orderNumber_key" ON "rst_orders"("businessDayId", "orderNumber");
CREATE INDEX IF NOT EXISTS "rst_orders_organizationId_businessDayId_idx" ON "rst_orders"("organizationId", "businessDayId");
CREATE INDEX IF NOT EXISTS "rst_orders_organizationId_status_idx" ON "rst_orders"("organizationId", "status");
CREATE INDEX IF NOT EXISTS "rst_orders_organizationId_paymentStatus_idx" ON "rst_orders"("organizationId", "paymentStatus");
CREATE INDEX IF NOT EXISTS "rst_orders_organizationId_createdAt_idx" ON "rst_orders"("organizationId", "createdAt");
CREATE INDEX IF NOT EXISTS "rst_orders_deletedAt_idx" ON "rst_orders"("deletedAt");

CREATE TABLE IF NOT EXISTS "rst_order_items" (
  "id" TEXT NOT NULL DEFAULT gen_random_uuid()::TEXT,
  "organizationId" TEXT NOT NULL,
  "orderId" TEXT NOT NULL,
  "menuItemId" TEXT,
  "name" TEXT NOT NULL,
  "quantity" INTEGER NOT NULL DEFAULT 1,
  "unitPriceCents" INTEGER NOT NULL DEFAULT 0,
  "lineTotalCents" INTEGER NOT NULL DEFAULT 0,
  "note" TEXT,
  "sortOrder" INTEGER NOT NULL DEFAULT 0,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "rst_order_items_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "rst_order_items_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "org_organizations"("id") ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT "rst_order_items_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "rst_orders"("id") ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE INDEX IF NOT EXISTS "rst_order_items_organizationId_orderId_idx" ON "rst_order_items"("organizationId", "orderId");
CREATE INDEX IF NOT EXISTS "rst_order_items_menuItemId_idx" ON "rst_order_items"("menuItemId");

INSERT INTO "usr_permissions" ("id", "resource", "action", "createdAt")
VALUES
  (gen_random_uuid()::TEXT, 'orders', 'read', CURRENT_TIMESTAMP),
  (gen_random_uuid()::TEXT, 'orders', 'write', CURRENT_TIMESTAMP),
  (gen_random_uuid()::TEXT, 'orders', 'payment', CURRENT_TIMESTAMP),
  (gen_random_uuid()::TEXT, 'orders', 'admin', CURRENT_TIMESTAMP)
ON CONFLICT ("resource", "action") DO NOTHING;

INSERT INTO "usr_role_permissions" ("roleId", "permissionId")
SELECT r."id", p."id"
FROM "usr_roles" r
JOIN "usr_permissions" p ON (p."resource", p."action") IN (
  ('orders', 'read'), ('orders', 'write'), ('orders', 'payment'), ('orders', 'admin'),
  ('restaurant_reports', 'read')
)
WHERE r."name" IN ('restaurant_owner', 'restaurant_manager')
ON CONFLICT DO NOTHING;

INSERT INTO "usr_role_permissions" ("roleId", "permissionId")
SELECT r."id", p."id"
FROM "usr_roles" r
JOIN "usr_permissions" p ON (p."resource", p."action") IN (
  ('orders', 'read'), ('orders', 'write'), ('orders', 'payment')
)
WHERE r."name" = 'restaurant_staff'
ON CONFLICT DO NOTHING;

INSERT INTO "usr_role_permissions" ("roleId", "permissionId")
SELECT r."id", p."id"
FROM "usr_roles" r
JOIN "usr_permissions" p ON (p."resource", p."action") IN (
  ('orders', 'read'), ('orders', 'write')
)
WHERE r."name" = 'restaurant_kitchen'
ON CONFLICT DO NOTHING;

INSERT INTO "usr_role_permissions" ("roleId", "permissionId")
SELECT r."id", p."id"
FROM "usr_roles" r
JOIN "usr_permissions" p ON (p."resource", p."action") IN (
  ('orders', 'read'), ('restaurant_reports', 'read')
)
WHERE r."name" = 'restaurant_accountant'
ON CONFLICT DO NOTHING;

INSERT INTO "org_modules" ("id", "organizationId", "moduleKey", "enabled", "config", "createdAt", "updatedAt")
SELECT gen_random_uuid()::TEXT, o."id", 'restaurant_orders', TRUE, '{}'::JSONB, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
FROM "org_organizations" o
WHERE o."slug" IN ('fluffys', 'restaurant-demo')
ON CONFLICT ("organizationId", "moduleKey") DO UPDATE SET
  "enabled" = TRUE,
  "updatedAt" = CURRENT_TIMESTAMP;
