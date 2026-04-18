-- Project subsystem: CRM customers, delivery projects, suppliers, purchase orders.

-- Demo reset for the unused legacy project scaffold.
DROP TABLE IF EXISTS "prj_tasks" CASCADE;
DROP TABLE IF EXISTS "prj_projects" CASCADE;

DO $$ BEGIN
  CREATE TYPE "ProjectStage" AS ENUM ('details', 'ordered', 'arrived', 'in_progress', 'completed');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  CREATE TYPE "PurchaseOrderStatus" AS ENUM ('draft', 'submitted', 'received', 'cancelled');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

CREATE TABLE "crm_customers" (
  "id" TEXT NOT NULL,
  "organizationId" TEXT NOT NULL,
  "name" TEXT NOT NULL,
  "email" TEXT,
  "phone" TEXT,
  "company" TEXT,
  "address" TEXT,
  "postalCode" TEXT,
  "city" TEXT,
  "country" TEXT DEFAULT 'SE',
  "notes" TEXT,
  "convertedFromLeadId" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  "deletedAt" TIMESTAMP(3),
  CONSTRAINT "crm_customers_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "prj_projects" (
  "id" TEXT NOT NULL,
  "organizationId" TEXT NOT NULL,
  "customerId" TEXT NOT NULL,
  "offerId" TEXT NOT NULL,
  "name" TEXT NOT NULL,
  "stage" "ProjectStage" NOT NULL DEFAULT 'details',
  "offerNumber" INTEGER,
  "offerAcceptedAt" TIMESTAMP(3),
  "priceDisplayMode" TEXT NOT NULL DEFAULT 'exclusive',
  "totalExVat" DOUBLE PRECISION NOT NULL DEFAULT 0,
  "totalIncVat" DOUBLE PRECISION NOT NULL DEFAULT 0,
  "siteAddress" TEXT,
  "sitePostalCode" TEXT,
  "siteCity" TEXT,
  "siteCountry" TEXT DEFAULT 'SE',
  "squareMeters" DOUBLE PRECISION,
  "objectType" TEXT,
  "objectDescription" TEXT,
  "accessNotes" TEXT,
  "wishedInstallDate" TIMESTAMP(3),
  "wishedInstallDateText" TEXT,
  "onsiteContactName" TEXT,
  "onsiteContactPhone" TEXT,
  "onsiteContactEmail" TEXT,
  "internalNotes" TEXT,
  "createdBy" TEXT,
  "completedAt" TIMESTAMP(3),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  "deletedAt" TIMESTAMP(3),
  CONSTRAINT "prj_projects_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "prj_line_items" (
  "id" TEXT NOT NULL,
  "organizationId" TEXT NOT NULL,
  "projectId" TEXT NOT NULL,
  "sourceOfferLineItemId" TEXT,
  "sourceProductId" TEXT,
  "productName" TEXT NOT NULL,
  "description" TEXT NOT NULL,
  "quantity" DOUBLE PRECISION NOT NULL,
  "unit" TEXT NOT NULL DEFAULT 'st',
  "unitPrice" DOUBLE PRECISION NOT NULL,
  "vatRate" DOUBLE PRECISION NOT NULL DEFAULT 0.25,
  "discount" DOUBLE PRECISION NOT NULL DEFAULT 0,
  "lineTotalExVat" DOUBLE PRECISION NOT NULL DEFAULT 0,
  "lineTotalIncVat" DOUBLE PRECISION NOT NULL DEFAULT 0,
  "sortOrder" INTEGER NOT NULL DEFAULT 0,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "prj_line_items_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "prj_stage_events" (
  "id" TEXT NOT NULL,
  "organizationId" TEXT NOT NULL,
  "projectId" TEXT NOT NULL,
  "fromStage" "ProjectStage",
  "toStage" "ProjectStage" NOT NULL,
  "actorId" TEXT,
  "reason" TEXT,
  "metadata" JSONB,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "prj_stage_events_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "proc_suppliers" (
  "id" TEXT NOT NULL,
  "organizationId" TEXT NOT NULL,
  "name" TEXT NOT NULL,
  "email" TEXT,
  "phone" TEXT,
  "orgNumber" TEXT,
  "address" TEXT,
  "postalCode" TEXT,
  "city" TEXT,
  "country" TEXT DEFAULT 'SE',
  "notes" TEXT,
  "createdBy" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  "deletedAt" TIMESTAMP(3),
  CONSTRAINT "proc_suppliers_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "proc_purchase_orders" (
  "id" TEXT NOT NULL,
  "organizationId" TEXT NOT NULL,
  "projectId" TEXT NOT NULL,
  "supplierId" TEXT NOT NULL,
  "poNumber" INTEGER,
  "status" "PurchaseOrderStatus" NOT NULL DEFAULT 'draft',
  "supplierReference" TEXT,
  "expectedDeliveryDate" TIMESTAMP(3),
  "submittedAt" TIMESTAMP(3),
  "submittedBy" TEXT,
  "receivedAt" TIMESTAMP(3),
  "receivedBy" TEXT,
  "notes" TEXT,
  "totalExVat" DOUBLE PRECISION NOT NULL DEFAULT 0,
  "totalIncVat" DOUBLE PRECISION NOT NULL DEFAULT 0,
  "createdBy" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  "deletedAt" TIMESTAMP(3),
  CONSTRAINT "proc_purchase_orders_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "proc_purchase_order_line_items" (
  "id" TEXT NOT NULL,
  "organizationId" TEXT NOT NULL,
  "purchaseOrderId" TEXT NOT NULL,
  "projectLineItemId" TEXT,
  "description" TEXT NOT NULL,
  "quantity" DOUBLE PRECISION NOT NULL,
  "receivedQuantity" DOUBLE PRECISION NOT NULL DEFAULT 0,
  "unit" TEXT NOT NULL DEFAULT 'st',
  "unitCost" DOUBLE PRECISION NOT NULL,
  "vatRate" DOUBLE PRECISION NOT NULL DEFAULT 0.25,
  "sortOrder" INTEGER NOT NULL DEFAULT 0,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "proc_purchase_order_line_items_pkey" PRIMARY KEY ("id")
);

ALTER TABLE "off_line_items" ADD COLUMN IF NOT EXISTS "productId" TEXT;
ALTER TABLE "off_line_items" ADD COLUMN IF NOT EXISTS "unit" TEXT;

-- Preserve existing contact links before crm_customers becomes the canonical Customer table.
-- Existing offers/leads may point at demo_hotel_customers from the old contact picker.
INSERT INTO "crm_customers" (
  "id",
  "organizationId",
  "name",
  "email",
  "phone",
  "company",
  "notes",
  "createdAt",
  "updatedAt"
)
SELECT DISTINCT ON (refs."customerId")
  c."id",
  refs."organizationId",
  COALESCE(c."name", c."email", c."phone", 'Kund') AS "name",
  c."email",
  c."phone",
  c."company",
  c."notes",
  COALESCE(c."firstSeen", CURRENT_TIMESTAMP) AS "createdAt",
  COALESCE(c."lastSeen", CURRENT_TIMESTAMP) AS "updatedAt"
FROM (
  SELECT "customerId", "organizationId" FROM "off_offers" WHERE "customerId" IS NOT NULL
  UNION
  SELECT "customerId", "organizationId" FROM "lead_leads" WHERE "customerId" IS NOT NULL
) refs
JOIN "demo_hotel_customers" c ON c."id" = refs."customerId"
ON CONFLICT ("id") DO NOTHING;

CREATE UNIQUE INDEX "crm_customers_organizationId_email_key" ON "crm_customers"("organizationId", "email");
CREATE UNIQUE INDEX "crm_customers_convertedFromLeadId_key" ON "crm_customers"("convertedFromLeadId");
CREATE INDEX "crm_customers_organizationId_name_idx" ON "crm_customers"("organizationId", "name");
CREATE INDEX "crm_customers_organizationId_company_idx" ON "crm_customers"("organizationId", "company");
CREATE INDEX "crm_customers_organizationId_createdAt_idx" ON "crm_customers"("organizationId", "createdAt");
CREATE INDEX "crm_customers_deletedAt_idx" ON "crm_customers"("deletedAt");

CREATE UNIQUE INDEX "prj_projects_organizationId_offerId_key" ON "prj_projects"("organizationId", "offerId");
CREATE INDEX "prj_projects_organizationId_stage_idx" ON "prj_projects"("organizationId", "stage");
CREATE INDEX "prj_projects_organizationId_customerId_idx" ON "prj_projects"("organizationId", "customerId");
CREATE INDEX "prj_projects_organizationId_createdAt_idx" ON "prj_projects"("organizationId", "createdAt");
CREATE INDEX "prj_projects_deletedAt_idx" ON "prj_projects"("deletedAt");
CREATE INDEX "prj_line_items_organizationId_projectId_idx" ON "prj_line_items"("organizationId", "projectId");
CREATE INDEX "prj_line_items_projectId_sortOrder_idx" ON "prj_line_items"("projectId", "sortOrder");
CREATE INDEX "prj_stage_events_organizationId_projectId_createdAt_idx" ON "prj_stage_events"("organizationId", "projectId", "createdAt");
CREATE INDEX "prj_stage_events_organizationId_toStage_idx" ON "prj_stage_events"("organizationId", "toStage");

CREATE INDEX "proc_suppliers_organizationId_name_idx" ON "proc_suppliers"("organizationId", "name");
CREATE INDEX "proc_suppliers_organizationId_email_idx" ON "proc_suppliers"("organizationId", "email");
CREATE INDEX "proc_suppliers_deletedAt_idx" ON "proc_suppliers"("deletedAt");
CREATE UNIQUE INDEX "proc_purchase_orders_organizationId_poNumber_key" ON "proc_purchase_orders"("organizationId", "poNumber");
CREATE INDEX "proc_purchase_orders_organizationId_projectId_idx" ON "proc_purchase_orders"("organizationId", "projectId");
CREATE INDEX "proc_purchase_orders_organizationId_supplierId_idx" ON "proc_purchase_orders"("organizationId", "supplierId");
CREATE INDEX "proc_purchase_orders_organizationId_status_idx" ON "proc_purchase_orders"("organizationId", "status");
CREATE INDEX "proc_purchase_orders_deletedAt_idx" ON "proc_purchase_orders"("deletedAt");
CREATE INDEX "proc_purchase_order_line_items_organizationId_purchaseOrderId_idx" ON "proc_purchase_order_line_items"("organizationId", "purchaseOrderId");
CREATE INDEX "proc_purchase_order_line_items_projectLineItemId_idx" ON "proc_purchase_order_line_items"("projectLineItemId");

CREATE INDEX IF NOT EXISTS "lead_leads_organizationId_customerId_idx" ON "lead_leads"("organizationId", "customerId");
CREATE INDEX IF NOT EXISTS "off_offers_organizationId_customerId_idx" ON "off_offers"("organizationId", "customerId");
CREATE INDEX IF NOT EXISTS "off_line_items_productId_idx" ON "off_line_items"("productId");

ALTER TABLE "crm_customers" ADD CONSTRAINT "crm_customers_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "org_organizations"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "crm_customers" ADD CONSTRAINT "crm_customers_convertedFromLeadId_fkey" FOREIGN KEY ("convertedFromLeadId") REFERENCES "lead_leads"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "lead_leads" ADD CONSTRAINT "lead_leads_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "crm_customers"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "off_offers" ADD CONSTRAINT "off_offers_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "crm_customers"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "off_line_items" ADD CONSTRAINT "off_line_items_productId_fkey" FOREIGN KEY ("productId") REFERENCES "off_products"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "prj_projects" ADD CONSTRAINT "prj_projects_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "org_organizations"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "prj_projects" ADD CONSTRAINT "prj_projects_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "crm_customers"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "prj_projects" ADD CONSTRAINT "prj_projects_offerId_fkey" FOREIGN KEY ("offerId") REFERENCES "off_offers"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "prj_line_items" ADD CONSTRAINT "prj_line_items_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "org_organizations"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "prj_line_items" ADD CONSTRAINT "prj_line_items_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "prj_projects"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "prj_stage_events" ADD CONSTRAINT "prj_stage_events_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "org_organizations"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "prj_stage_events" ADD CONSTRAINT "prj_stage_events_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "prj_projects"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "proc_suppliers" ADD CONSTRAINT "proc_suppliers_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "org_organizations"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "proc_purchase_orders" ADD CONSTRAINT "proc_purchase_orders_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "org_organizations"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "proc_purchase_orders" ADD CONSTRAINT "proc_purchase_orders_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "prj_projects"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "proc_purchase_orders" ADD CONSTRAINT "proc_purchase_orders_supplierId_fkey" FOREIGN KEY ("supplierId") REFERENCES "proc_suppliers"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "proc_purchase_order_line_items" ADD CONSTRAINT "proc_purchase_order_line_items_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "org_organizations"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "proc_purchase_order_line_items" ADD CONSTRAINT "proc_purchase_order_line_items_purchaseOrderId_fkey" FOREIGN KEY ("purchaseOrderId") REFERENCES "proc_purchase_orders"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "proc_purchase_order_line_items" ADD CONSTRAINT "proc_purchase_order_line_items_projectLineItemId_fkey" FOREIGN KEY ("projectLineItemId") REFERENCES "prj_line_items"("id") ON DELETE SET NULL ON UPDATE CASCADE;
