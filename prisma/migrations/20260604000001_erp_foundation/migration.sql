-- Migration: 20260604000001_erp_foundation
--
-- Adds the schema foundation for ERP Milestone 1:
--   1. Custom field definitions table (org_custom_field_definitions)
--   2. customFields JSONB column on: off_offers, off_products, off_companies,
--      lead_leads, crm_customers, prj_projects
--   3. sharedAcrossOrg flag on off_products (org-level shared catalog)
--   4. Native invoicing tables (inv_invoices, inv_line_items)
--   5. Time tracking table (prj_time_entries)
--
-- All DDL is additive. No existing columns are modified or dropped.
-- Safe to run on production with zero downtime (no table rewrites).

-- ─── 1. Custom Field Definitions ──────────────────────────────────────────────

CREATE TABLE "org_custom_field_definitions" (
  "id"             TEXT NOT NULL,
  "organizationId" TEXT NOT NULL,
  "entityType"     TEXT NOT NULL,
  "key"            TEXT NOT NULL,
  "label"          TEXT NOT NULL,
  "fieldType"      TEXT NOT NULL,
  "options"        JSONB,
  "required"       BOOLEAN NOT NULL DEFAULT FALSE,
  "sortOrder"      INTEGER NOT NULL DEFAULT 0,
  "createdAt"      TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt"      TIMESTAMP(3) NOT NULL,
  "deletedAt"      TIMESTAMP(3),

  CONSTRAINT "org_custom_field_definitions_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "org_custom_field_definitions_organizationId_entityType_key_key"
  ON "org_custom_field_definitions"("organizationId", "entityType", "key");

CREATE INDEX "org_custom_field_definitions_organizationId_entityType_idx"
  ON "org_custom_field_definitions"("organizationId", "entityType");

CREATE INDEX "org_custom_field_definitions_deletedAt_idx"
  ON "org_custom_field_definitions"("deletedAt");

ALTER TABLE "org_custom_field_definitions"
  ADD CONSTRAINT "org_custom_field_definitions_organizationId_fkey"
  FOREIGN KEY ("organizationId") REFERENCES "org_organizations"("id")
  ON DELETE RESTRICT ON UPDATE CASCADE;

-- ─── 2. customFields JSONB columns on existing tables ─────────────────────────

ALTER TABLE "off_offers"     ADD COLUMN "customFields" JSONB;
ALTER TABLE "off_products"   ADD COLUMN "customFields" JSONB;
ALTER TABLE "off_companies"  ADD COLUMN "customFields" JSONB;
ALTER TABLE "lead_leads"     ADD COLUMN "customFields" JSONB;
ALTER TABLE "crm_customers"  ADD COLUMN "customFields" JSONB;
ALTER TABLE "prj_projects"   ADD COLUMN "customFields" JSONB;

-- ─── 3. Shared catalog flag on off_products ────────────────────────────────────

ALTER TABLE "off_products"
  ADD COLUMN "sharedAcrossOrg" BOOLEAN NOT NULL DEFAULT FALSE;

-- ─── 4. Invoicing tables ──────────────────────────────────────────────────────

CREATE TABLE "inv_invoices" (
  "id"               TEXT NOT NULL,
  "organizationId"   TEXT NOT NULL,
  "companyId"        TEXT NOT NULL,
  "customerId"       TEXT,
  "offerId"          TEXT,
  "projectId"        TEXT,
  "invoiceNumber"    INTEGER NOT NULL,
  "status"           TEXT NOT NULL DEFAULT 'draft',
  "issueDate"        DATE NOT NULL,
  "dueDate"          DATE NOT NULL,
  "paidAt"           TIMESTAMP(3),
  "totalExVat"       DOUBLE PRECISION NOT NULL DEFAULT 0,
  "totalVat"         DOUBLE PRECISION NOT NULL DEFAULT 0,
  "totalIncVat"      DOUBLE PRECISION NOT NULL DEFAULT 0,
  "currency"         TEXT NOT NULL DEFAULT 'SEK',
  "recipientName"    TEXT NOT NULL,
  "recipientEmail"   TEXT,
  "recipientCompany" TEXT,
  "notes"            TEXT,
  "generatedPdf"     BYTEA,
  "sentAt"           TIMESTAMP(3),
  "reminderSentAt"   TIMESTAMP(3),
  "fortnoxId"        TEXT,
  "fortnoxSyncedAt"  TIMESTAMP(3),
  "createdBy"        TEXT NOT NULL,
  "createdAt"        TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt"        TIMESTAMP(3) NOT NULL,
  "deletedAt"        TIMESTAMP(3),

  CONSTRAINT "inv_invoices_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "inv_invoices_organizationId_invoiceNumber_key"
  ON "inv_invoices"("organizationId", "invoiceNumber");

CREATE INDEX "inv_invoices_organizationId_status_idx"
  ON "inv_invoices"("organizationId", "status");

CREATE INDEX "inv_invoices_organizationId_companyId_idx"
  ON "inv_invoices"("organizationId", "companyId");

CREATE INDEX "inv_invoices_organizationId_customerId_idx"
  ON "inv_invoices"("organizationId", "customerId");

CREATE INDEX "inv_invoices_organizationId_offerId_idx"
  ON "inv_invoices"("organizationId", "offerId");

CREATE INDEX "inv_invoices_organizationId_createdAt_idx"
  ON "inv_invoices"("organizationId", "createdAt");

CREATE INDEX "inv_invoices_deletedAt_idx"
  ON "inv_invoices"("deletedAt");

ALTER TABLE "inv_invoices"
  ADD CONSTRAINT "inv_invoices_organizationId_fkey"
  FOREIGN KEY ("organizationId") REFERENCES "org_organizations"("id")
  ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "inv_invoices"
  ADD CONSTRAINT "inv_invoices_companyId_fkey"
  FOREIGN KEY ("companyId") REFERENCES "off_companies"("id")
  ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "inv_invoices"
  ADD CONSTRAINT "inv_invoices_customerId_fkey"
  FOREIGN KEY ("customerId") REFERENCES "crm_customers"("id")
  ON DELETE SET NULL ON UPDATE CASCADE;

-- ─── 5. Invoice line items ─────────────────────────────────────────────────────

CREATE TABLE "inv_line_items" (
  "id"          TEXT NOT NULL,
  "invoiceId"   TEXT NOT NULL,
  "description" TEXT NOT NULL,
  "quantity"    DOUBLE PRECISION NOT NULL,
  "unit"        TEXT,
  "unitPrice"   DOUBLE PRECISION NOT NULL,
  "vatRate"     DOUBLE PRECISION NOT NULL DEFAULT 0.25,
  "discount"    DOUBLE PRECISION NOT NULL DEFAULT 0,
  "productId"   TEXT,
  "timeEntryId" TEXT,
  "sortOrder"   INTEGER NOT NULL DEFAULT 0,

  CONSTRAINT "inv_line_items_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "inv_line_items_invoiceId_idx"
  ON "inv_line_items"("invoiceId");

CREATE INDEX "inv_line_items_invoiceId_sortOrder_idx"
  ON "inv_line_items"("invoiceId", "sortOrder");

ALTER TABLE "inv_line_items"
  ADD CONSTRAINT "inv_line_items_invoiceId_fkey"
  FOREIGN KEY ("invoiceId") REFERENCES "inv_invoices"("id")
  ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "inv_line_items"
  ADD CONSTRAINT "inv_line_items_productId_fkey"
  FOREIGN KEY ("productId") REFERENCES "off_products"("id")
  ON DELETE SET NULL ON UPDATE CASCADE;

-- ─── 6. Time entries ──────────────────────────────────────────────────────────

CREATE TABLE "prj_time_entries" (
  "id"             TEXT NOT NULL,
  "organizationId" TEXT NOT NULL,
  "projectId"      TEXT,
  "userId"         TEXT NOT NULL,
  "date"           DATE NOT NULL,
  "hours"          DOUBLE PRECISION NOT NULL,
  "description"    TEXT,
  "billable"       BOOLEAN NOT NULL DEFAULT TRUE,
  "invoiceId"      TEXT,
  "createdAt"      TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt"      TIMESTAMP(3) NOT NULL,
  "deletedAt"      TIMESTAMP(3),

  CONSTRAINT "prj_time_entries_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "prj_time_entries_organizationId_projectId_idx"
  ON "prj_time_entries"("organizationId", "projectId");

CREATE INDEX "prj_time_entries_organizationId_userId_date_idx"
  ON "prj_time_entries"("organizationId", "userId", "date");

CREATE INDEX "prj_time_entries_organizationId_billable_invoiceId_idx"
  ON "prj_time_entries"("organizationId", "billable", "invoiceId");

CREATE INDEX "prj_time_entries_deletedAt_idx"
  ON "prj_time_entries"("deletedAt");

ALTER TABLE "prj_time_entries"
  ADD CONSTRAINT "prj_time_entries_organizationId_fkey"
  FOREIGN KEY ("organizationId") REFERENCES "org_organizations"("id")
  ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "prj_time_entries"
  ADD CONSTRAINT "prj_time_entries_projectId_fkey"
  FOREIGN KEY ("projectId") REFERENCES "prj_projects"("id")
  ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "prj_time_entries"
  ADD CONSTRAINT "prj_time_entries_userId_fkey"
  FOREIGN KEY ("userId") REFERENCES "usr_users"("id")
  ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "prj_time_entries"
  ADD CONSTRAINT "prj_time_entries_invoiceId_fkey"
  FOREIGN KEY ("invoiceId") REFERENCES "inv_invoices"("id")
  ON DELETE SET NULL ON UPDATE CASCADE;

-- ─── 7. Wire timeEntryId FK on inv_line_items ─────────────────────────────────
-- Added after prj_time_entries exists to avoid forward-reference issues.

ALTER TABLE "inv_line_items"
  ADD CONSTRAINT "inv_line_items_timeEntryId_fkey"
  FOREIGN KEY ("timeEntryId") REFERENCES "prj_time_entries"("id")
  ON DELETE SET NULL ON UPDATE CASCADE;
