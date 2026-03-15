-- ─── Extend off_offers: offer number + reminder tracking ───────────────────────

ALTER TABLE "off_offers"
  ADD COLUMN IF NOT EXISTS "offerNumber"    INTEGER,
  ADD COLUMN IF NOT EXISTS "reminderSentAt" TIMESTAMP(3),
  ADD COLUMN IF NOT EXISTS "reminderCount"  INTEGER NOT NULL DEFAULT 0;

-- Unique constraint: one offer number per organization per year is enforced
-- at the application level; DB uniqueness across the whole column is sufficient.
CREATE UNIQUE INDEX IF NOT EXISTS "off_offers_organizationId_offerNumber_key"
  ON "off_offers"("organizationId", "offerNumber");

-- ─── Product / Service Library ────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS "off_products" (
  "id"             TEXT        NOT NULL,
  "organizationId" TEXT        NOT NULL,
  "name"           TEXT        NOT NULL,
  "description"    TEXT,
  "unitPrice"      DOUBLE PRECISION NOT NULL,
  "vatRate"        DOUBLE PRECISION NOT NULL DEFAULT 0.25,
  "unit"           TEXT,
  "createdBy"      TEXT        NOT NULL,
  "createdAt"      TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt"      TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "deletedAt"      TIMESTAMP(3),
  CONSTRAINT "off_products_pkey" PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS "off_products_orgId_createdAt_idx"
  ON "off_products"("organizationId", "createdAt");

CREATE INDEX IF NOT EXISTS "off_products_deletedAt_idx"
  ON "off_products"("deletedAt");

ALTER TABLE "off_products"
  ADD CONSTRAINT "off_products_organizationId_fkey"
  FOREIGN KEY ("organizationId")
  REFERENCES "org_organizations"("id")
  ON DELETE RESTRICT ON UPDATE CASCADE;
