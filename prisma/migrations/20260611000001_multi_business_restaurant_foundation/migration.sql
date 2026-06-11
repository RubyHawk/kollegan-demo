-- Migration: 20260611000001_multi_business_restaurant_foundation
--
-- Adds tenant domain/module foundations plus restaurant public-content and
-- workforce tables. Additive only: no existing production data is deleted or
-- rewritten. Seed statements are idempotent and use ON CONFLICT DO NOTHING.

-- Tenant domain resolution.
CREATE TABLE "org_domains" (
  "id" TEXT NOT NULL DEFAULT gen_random_uuid()::TEXT,
  "organizationId" TEXT NOT NULL,
  "hostname" TEXT NOT NULL,
  "kind" TEXT NOT NULL,
  "isPrimary" BOOLEAN NOT NULL DEFAULT FALSE,
  "verifiedAt" TIMESTAMP(3),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "org_domains_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "org_domains_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "org_organizations"("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

CREATE UNIQUE INDEX "org_domains_hostname_key" ON "org_domains"("hostname");
CREATE INDEX "org_domains_organizationId_kind_idx" ON "org_domains"("organizationId", "kind");

-- Tenant module enablement.
CREATE TABLE "org_modules" (
  "id" TEXT NOT NULL DEFAULT gen_random_uuid()::TEXT,
  "organizationId" TEXT NOT NULL,
  "moduleKey" TEXT NOT NULL,
  "enabled" BOOLEAN NOT NULL DEFAULT TRUE,
  "config" JSONB NOT NULL DEFAULT '{}',
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "org_modules_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "org_modules_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "org_organizations"("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

CREATE UNIQUE INDEX "org_modules_organizationId_moduleKey_key" ON "org_modules"("organizationId", "moduleKey");
CREATE INDEX "org_modules_organizationId_enabled_idx" ON "org_modules"("organizationId", "enabled");

-- Public site settings.
CREATE TABLE "org_public_site_settings" (
  "id" TEXT NOT NULL DEFAULT gen_random_uuid()::TEXT,
  "organizationId" TEXT NOT NULL,
  "siteName" TEXT NOT NULL,
  "heroTitle" TEXT NOT NULL,
  "heroSubtitle" TEXT,
  "about" TEXT,
  "phone" TEXT,
  "email" TEXT,
  "addressLine1" TEXT,
  "addressLine2" TEXT,
  "postalCode" TEXT,
  "city" TEXT,
  "country" TEXT DEFAULT 'SE',
  "reservationEmail" TEXT,
  "seoTitle" TEXT,
  "seoDescription" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "org_public_site_settings_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "org_public_site_settings_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "org_organizations"("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

CREATE UNIQUE INDEX "org_public_site_settings_organizationId_key" ON "org_public_site_settings"("organizationId");

-- Restaurant public content.
CREATE TABLE "rst_menu_categories" (
  "id" TEXT NOT NULL DEFAULT gen_random_uuid()::TEXT,
  "organizationId" TEXT NOT NULL,
  "name" TEXT NOT NULL,
  "description" TEXT,
  "sortOrder" INTEGER NOT NULL DEFAULT 0,
  "isActive" BOOLEAN NOT NULL DEFAULT TRUE,
  "createdBy" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "deletedAt" TIMESTAMP(3),
  CONSTRAINT "rst_menu_categories_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "rst_menu_categories_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "org_organizations"("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

CREATE INDEX "rst_menu_categories_organizationId_sortOrder_idx" ON "rst_menu_categories"("organizationId", "sortOrder");
CREATE INDEX "rst_menu_categories_deletedAt_idx" ON "rst_menu_categories"("deletedAt");

CREATE TABLE "rst_menu_items" (
  "id" TEXT NOT NULL DEFAULT gen_random_uuid()::TEXT,
  "organizationId" TEXT NOT NULL,
  "categoryId" TEXT NOT NULL,
  "name" TEXT NOT NULL,
  "description" TEXT,
  "priceCents" INTEGER,
  "currency" TEXT NOT NULL DEFAULT 'SEK',
  "imageUrl" TEXT,
  "allergens" TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
  "tags" TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
  "isAvailable" BOOLEAN NOT NULL DEFAULT TRUE,
  "sortOrder" INTEGER NOT NULL DEFAULT 0,
  "createdBy" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "deletedAt" TIMESTAMP(3),
  CONSTRAINT "rst_menu_items_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "rst_menu_items_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "org_organizations"("id") ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT "rst_menu_items_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "rst_menu_categories"("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

CREATE INDEX "rst_menu_items_organizationId_categoryId_sortOrder_idx" ON "rst_menu_items"("organizationId", "categoryId", "sortOrder");
CREATE INDEX "rst_menu_items_organizationId_isAvailable_idx" ON "rst_menu_items"("organizationId", "isAvailable");
CREATE INDEX "rst_menu_items_deletedAt_idx" ON "rst_menu_items"("deletedAt");

CREATE TABLE "rst_opening_hours" (
  "id" TEXT NOT NULL DEFAULT gen_random_uuid()::TEXT,
  "organizationId" TEXT NOT NULL,
  "dayOfWeek" INTEGER NOT NULL,
  "opensAt" TEXT,
  "closesAt" TEXT,
  "isClosed" BOOLEAN NOT NULL DEFAULT FALSE,
  "label" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "rst_opening_hours_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "rst_opening_hours_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "org_organizations"("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

CREATE UNIQUE INDEX "rst_opening_hours_organizationId_dayOfWeek_key" ON "rst_opening_hours"("organizationId", "dayOfWeek");

CREATE TABLE "rst_events" (
  "id" TEXT NOT NULL DEFAULT gen_random_uuid()::TEXT,
  "organizationId" TEXT NOT NULL,
  "title" TEXT NOT NULL,
  "description" TEXT,
  "startsAt" TIMESTAMP(3) NOT NULL,
  "endsAt" TIMESTAMP(3),
  "isPublished" BOOLEAN NOT NULL DEFAULT FALSE,
  "createdBy" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "deletedAt" TIMESTAMP(3),
  CONSTRAINT "rst_events_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "rst_events_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "org_organizations"("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

CREATE INDEX "rst_events_organizationId_startsAt_idx" ON "rst_events"("organizationId", "startsAt");
CREATE INDEX "rst_events_organizationId_isPublished_idx" ON "rst_events"("organizationId", "isPublished");
CREATE INDEX "rst_events_deletedAt_idx" ON "rst_events"("deletedAt");

CREATE TABLE "rst_reservation_requests" (
  "id" TEXT NOT NULL DEFAULT gen_random_uuid()::TEXT,
  "organizationId" TEXT NOT NULL,
  "guestName" TEXT NOT NULL,
  "guestEmail" TEXT,
  "guestPhone" TEXT,
  "partySize" INTEGER NOT NULL,
  "requestedAt" TIMESTAMP(3) NOT NULL,
  "message" TEXT,
  "status" TEXT NOT NULL DEFAULT 'new',
  "handledBy" TEXT,
  "handledAt" TIMESTAMP(3),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "deletedAt" TIMESTAMP(3),
  CONSTRAINT "rst_reservation_requests_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "rst_reservation_requests_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "org_organizations"("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

CREATE INDEX "rst_reservation_requests_organizationId_requestedAt_idx" ON "rst_reservation_requests"("organizationId", "requestedAt");
CREATE INDEX "rst_reservation_requests_organizationId_status_idx" ON "rst_reservation_requests"("organizationId", "status");
CREATE INDEX "rst_reservation_requests_deletedAt_idx" ON "rst_reservation_requests"("deletedAt");

-- Workforce / attendance.
CREATE TABLE "wf_attendance_shifts" (
  "id" TEXT NOT NULL DEFAULT gen_random_uuid()::TEXT,
  "organizationId" TEXT NOT NULL,
  "userId" TEXT NOT NULL,
  "clockInAt" TIMESTAMP(3) NOT NULL,
  "clockOutAt" TIMESTAMP(3),
  "status" TEXT NOT NULL DEFAULT 'active',
  "clockInSource" TEXT,
  "clockOutSource" TEXT,
  "deviceLabel" TEXT,
  "location" TEXT,
  "correctedBy" TEXT,
  "correctionReason" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "deletedAt" TIMESTAMP(3),
  CONSTRAINT "wf_attendance_shifts_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "wf_attendance_shifts_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "org_organizations"("id") ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT "wf_attendance_shifts_userId_fkey" FOREIGN KEY ("userId") REFERENCES "usr_users"("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

CREATE INDEX "wf_attendance_shifts_organizationId_userId_status_idx" ON "wf_attendance_shifts"("organizationId", "userId", "status");
CREATE INDEX "wf_attendance_shifts_organizationId_clockInAt_idx" ON "wf_attendance_shifts"("organizationId", "clockInAt");
CREATE INDEX "wf_attendance_shifts_deletedAt_idx" ON "wf_attendance_shifts"("deletedAt");
CREATE UNIQUE INDEX "wf_attendance_active_user_org_key" ON "wf_attendance_shifts"("organizationId", "userId") WHERE "status" = 'active' AND "deletedAt" IS NULL;

CREATE TABLE "wf_staff_schedule_shifts" (
  "id" TEXT NOT NULL DEFAULT gen_random_uuid()::TEXT,
  "organizationId" TEXT NOT NULL,
  "userId" TEXT NOT NULL,
  "startsAt" TIMESTAMP(3) NOT NULL,
  "endsAt" TIMESTAMP(3) NOT NULL,
  "roleLabel" TEXT,
  "notes" TEXT,
  "status" TEXT NOT NULL DEFAULT 'scheduled',
  "createdBy" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "deletedAt" TIMESTAMP(3),
  CONSTRAINT "wf_staff_schedule_shifts_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "wf_staff_schedule_shifts_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "org_organizations"("id") ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT "wf_staff_schedule_shifts_userId_fkey" FOREIGN KEY ("userId") REFERENCES "usr_users"("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

CREATE INDEX "wf_staff_schedule_shifts_organizationId_startsAt_idx" ON "wf_staff_schedule_shifts"("organizationId", "startsAt");
CREATE INDEX "wf_staff_schedule_shifts_organizationId_userId_startsAt_idx" ON "wf_staff_schedule_shifts"("organizationId", "userId", "startsAt");
CREATE INDEX "wf_staff_schedule_shifts_deletedAt_idx" ON "wf_staff_schedule_shifts"("deletedAt");

CREATE TABLE "wf_checklist_tasks" (
  "id" TEXT NOT NULL DEFAULT gen_random_uuid()::TEXT,
  "organizationId" TEXT NOT NULL,
  "title" TEXT NOT NULL,
  "area" TEXT,
  "dueAt" TIMESTAMP(3),
  "assignedToUserId" TEXT,
  "completedAt" TIMESTAMP(3),
  "completedBy" TEXT,
  "createdBy" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "deletedAt" TIMESTAMP(3),
  CONSTRAINT "wf_checklist_tasks_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "wf_checklist_tasks_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "org_organizations"("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

CREATE INDEX "wf_checklist_tasks_organizationId_dueAt_idx" ON "wf_checklist_tasks"("organizationId", "dueAt");
CREATE INDEX "wf_checklist_tasks_organizationId_completedAt_idx" ON "wf_checklist_tasks"("organizationId", "completedAt");
CREATE INDEX "wf_checklist_tasks_deletedAt_idx" ON "wf_checklist_tasks"("deletedAt");

CREATE TABLE "wf_inventory_notes" (
  "id" TEXT NOT NULL DEFAULT gen_random_uuid()::TEXT,
  "organizationId" TEXT NOT NULL,
  "title" TEXT NOT NULL,
  "content" TEXT,
  "priority" TEXT NOT NULL DEFAULT 'normal',
  "createdBy" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "deletedAt" TIMESTAMP(3),
  CONSTRAINT "wf_inventory_notes_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "wf_inventory_notes_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "org_organizations"("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

CREATE INDEX "wf_inventory_notes_organizationId_createdAt_idx" ON "wf_inventory_notes"("organizationId", "createdAt");
CREATE INDEX "wf_inventory_notes_deletedAt_idx" ON "wf_inventory_notes"("deletedAt");

CREATE TABLE "wf_supplier_notes" (
  "id" TEXT NOT NULL DEFAULT gen_random_uuid()::TEXT,
  "organizationId" TEXT NOT NULL,
  "supplierName" TEXT,
  "title" TEXT NOT NULL,
  "content" TEXT,
  "createdBy" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "deletedAt" TIMESTAMP(3),
  CONSTRAINT "wf_supplier_notes_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "wf_supplier_notes_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "org_organizations"("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

CREATE INDEX "wf_supplier_notes_organizationId_createdAt_idx" ON "wf_supplier_notes"("organizationId", "createdAt");
CREATE INDEX "wf_supplier_notes_deletedAt_idx" ON "wf_supplier_notes"("deletedAt");

-- Restaurant roles.
INSERT INTO "usr_roles" ("id", "name", "displayName", "description", "isSystem", "createdAt")
VALUES
  (gen_random_uuid()::TEXT, 'restaurant_owner',      'Restaurant Owner',      'Full restaurant tenant access.', TRUE, CURRENT_TIMESTAMP),
  (gen_random_uuid()::TEXT, 'restaurant_manager',    'Restaurant Manager',    'Manages staff, menu, attendance, and daily operations.', TRUE, CURRENT_TIMESTAMP),
  (gen_random_uuid()::TEXT, 'restaurant_staff',      'Restaurant Staff',      'Standard restaurant staff access.', TRUE, CURRENT_TIMESTAMP),
  (gen_random_uuid()::TEXT, 'restaurant_kitchen',    'Restaurant Kitchen',    'Kitchen operations and checklist access.', TRUE, CURRENT_TIMESTAMP),
  (gen_random_uuid()::TEXT, 'restaurant_accountant', 'Restaurant Accountant', 'Read-only operational and reporting access.', TRUE, CURRENT_TIMESTAMP)
ON CONFLICT ("name") DO NOTHING;

INSERT INTO "usr_permissions" ("id", "resource", "action", "createdAt")
VALUES
  (gen_random_uuid()::TEXT, 'clock_in',           'self',    CURRENT_TIMESTAMP),
  (gen_random_uuid()::TEXT, 'attendance',         'read',    CURRENT_TIMESTAMP),
  (gen_random_uuid()::TEXT, 'attendance',         'correct', CURRENT_TIMESTAMP),
  (gen_random_uuid()::TEXT, 'menu',               'read',    CURRENT_TIMESTAMP),
  (gen_random_uuid()::TEXT, 'menu',               'write',   CURRENT_TIMESTAMP),
  (gen_random_uuid()::TEXT, 'schedule',           'read',    CURRENT_TIMESTAMP),
  (gen_random_uuid()::TEXT, 'schedule',           'write',   CURRENT_TIMESTAMP),
  (gen_random_uuid()::TEXT, 'tasks',              'read',    CURRENT_TIMESTAMP),
  (gen_random_uuid()::TEXT, 'tasks',              'write',   CURRENT_TIMESTAMP),
  (gen_random_uuid()::TEXT, 'restaurant_reports', 'read',    CURRENT_TIMESTAMP)
ON CONFLICT ("resource", "action") DO NOTHING;

INSERT INTO "usr_role_permissions" ("roleId", "permissionId")
SELECT r."id", p."id"
FROM "usr_roles" r
JOIN "usr_permissions" p ON (p."resource", p."action") IN (
  ('clock_in', 'self'),
  ('attendance', 'read'), ('attendance', 'correct'),
  ('menu', 'read'), ('menu', 'write'),
  ('schedule', 'read'), ('schedule', 'write'),
  ('tasks', 'read'), ('tasks', 'write'),
  ('restaurant_reports', 'read'),
  ('users', 'read'), ('users', 'write')
)
WHERE r."name" IN ('restaurant_owner', 'restaurant_manager')
ON CONFLICT DO NOTHING;

INSERT INTO "usr_role_permissions" ("roleId", "permissionId")
SELECT r."id", p."id"
FROM "usr_roles" r
JOIN "usr_permissions" p ON (p."resource", p."action") IN (
  ('clock_in', 'self'),
  ('menu', 'read'),
  ('schedule', 'read'),
  ('tasks', 'read'), ('tasks', 'write')
)
WHERE r."name" IN ('restaurant_staff', 'restaurant_kitchen')
ON CONFLICT DO NOTHING;

INSERT INTO "usr_role_permissions" ("roleId", "permissionId")
SELECT r."id", p."id"
FROM "usr_roles" r
JOIN "usr_permissions" p ON (p."resource", p."action") IN (
  ('attendance', 'read'),
  ('menu', 'read'),
  ('schedule', 'read'),
  ('restaurant_reports', 'read')
)
WHERE r."name" = 'restaurant_accountant'
ON CONFLICT DO NOTHING;

-- Idempotent tenant bootstrap. Existing Soleria rows are not overwritten.
INSERT INTO "org_organizations" ("id", "name", "slug", "plan", "orgType", "createdAt", "updatedAt")
VALUES
  (gen_random_uuid()::TEXT, 'Soleria', 'soleria', 'starter', 'internal', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  (gen_random_uuid()::TEXT, 'Restaurant Demo', 'restaurant-demo', 'starter', 'internal', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
ON CONFLICT ("slug") DO NOTHING;

INSERT INTO "org_domains" ("id", "organizationId", "hostname", "kind", "isPrimary", "verifiedAt", "createdAt", "updatedAt")
SELECT gen_random_uuid()::TEXT, o."id", d."hostname", d."kind", d."isPrimary", CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
FROM "org_organizations" o
JOIN (
  VALUES
    ('soleria', 'soleria.se', 'public', TRUE),
    ('soleria', 'offert.soleria.se', 'offer', TRUE),
    ('restaurant-demo', 'restaurantdomain.se', 'public', TRUE),
    ('restaurant-demo', 'portal.restaurantdomain.se', 'portal', TRUE)
) AS d("slug", "hostname", "kind", "isPrimary") ON d."slug" = o."slug"
ON CONFLICT ("hostname") DO NOTHING;

INSERT INTO "org_modules" ("id", "organizationId", "moduleKey", "enabled", "config", "createdAt", "updatedAt")
SELECT gen_random_uuid()::TEXT, o."id", m."moduleKey", TRUE, '{}'::JSONB, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
FROM "org_organizations" o
JOIN (
  VALUES
    ('soleria', 'offers'), ('soleria', 'projects'), ('soleria', 'invoicing'), ('soleria', 'announcements'),
    ('restaurant-demo', 'restaurant_public_site'), ('restaurant-demo', 'restaurant_menu'), ('restaurant-demo', 'clock_in'),
    ('restaurant-demo', 'staff_schedule'), ('restaurant-demo', 'tasks'), ('restaurant-demo', 'announcements'), ('restaurant-demo', 'documents')
) AS m("slug", "moduleKey") ON m."slug" = o."slug"
ON CONFLICT ("organizationId", "moduleKey") DO NOTHING;

INSERT INTO "org_public_site_settings" (
  "id", "organizationId", "siteName", "heroTitle", "heroSubtitle", "about",
  "phone", "email", "addressLine1", "postalCode", "city", "country",
  "reservationEmail", "seoTitle", "seoDescription", "createdAt", "updatedAt"
)
SELECT
  gen_random_uuid()::TEXT,
  o."id",
  'Restaurant Demo',
  'Restaurant Demo',
  'Seasonal food, warm service, and a portal-ready operation.',
  'A practical restaurant website managed from the internal business portal.',
  '+46 8 000 00 00',
  'hello@restaurantdomain.se',
  'Exempelgatan 1',
  '111 22',
  'Stockholm',
  'SE',
  'booking@restaurantdomain.se',
  'Restaurant Demo',
  'Menu, opening hours, reservations, and events.',
  CURRENT_TIMESTAMP,
  CURRENT_TIMESTAMP
FROM "org_organizations" o
WHERE o."slug" = 'restaurant-demo'
ON CONFLICT ("organizationId") DO NOTHING;

INSERT INTO "rst_menu_categories" ("id", "organizationId", "name", "description", "sortOrder", "createdAt", "updatedAt")
SELECT gen_random_uuid()::TEXT, o."id", c."name", c."description", c."sortOrder", CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
FROM "org_organizations" o
JOIN (
  VALUES
    ('Small plates', 'For the table.', 10),
    ('Mains', 'Seasonal kitchen favorites.', 20),
    ('Dessert', 'Sweet finishers.', 30)
) AS c("name", "description", "sortOrder") ON TRUE
WHERE o."slug" = 'restaurant-demo'
ON CONFLICT DO NOTHING;

INSERT INTO "rst_opening_hours" ("id", "organizationId", "dayOfWeek", "opensAt", "closesAt", "isClosed", "label", "createdAt", "updatedAt")
SELECT gen_random_uuid()::TEXT, o."id", h."dayOfWeek", h."opensAt", h."closesAt", h."isClosed", h."label", CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
FROM "org_organizations" o
JOIN (
  VALUES
    (1, NULL, NULL, TRUE, 'Closed'),
    (2, '11:00', '22:00', FALSE, NULL),
    (3, '11:00', '22:00', FALSE, NULL),
    (4, '11:00', '22:00', FALSE, NULL),
    (5, '11:00', '23:00', FALSE, NULL),
    (6, '12:00', '23:00', FALSE, NULL),
    (7, '12:00', '21:00', FALSE, NULL)
) AS h("dayOfWeek", "opensAt", "closesAt", "isClosed", "label") ON TRUE
WHERE o."slug" = 'restaurant-demo'
ON CONFLICT ("organizationId", "dayOfWeek") DO NOTHING;
