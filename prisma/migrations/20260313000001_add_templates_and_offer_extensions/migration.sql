-- ─── Add Offer Templates table ─────────────────────────────────────────────────

CREATE TABLE "off_templates" (
  "id"             TEXT NOT NULL,
  "organizationId" TEXT NOT NULL,
  "name"           TEXT NOT NULL,
  "content"        TEXT NOT NULL DEFAULT '{}',
  "createdBy"      TEXT NOT NULL,
  "createdAt"      TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt"      TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "deletedAt"      TIMESTAMP(3),
  CONSTRAINT "off_templates_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "off_templates_orgId_createdAt_idx"
  ON "off_templates"("organizationId", "createdAt");

CREATE INDEX "off_templates_deletedAt_idx"
  ON "off_templates"("deletedAt");

ALTER TABLE "off_templates"
  ADD CONSTRAINT "off_templates_organizationId_fkey"
  FOREIGN KEY ("organizationId")
  REFERENCES "org_organizations"("id")
  ON DELETE RESTRICT ON UPDATE CASCADE;

-- ─── Extend off_offers table ────────────────────────────────────────────────────

ALTER TABLE "off_offers"
  ADD COLUMN "templateId"           TEXT,
  ADD COLUMN "generatedDocument"    TEXT,
  ADD COLUMN "signatureImage"       TEXT,
  ADD COLUMN "publicToken"          TEXT NOT NULL DEFAULT gen_random_uuid()::TEXT,
  ADD COLUMN "publicTokenExpiresAt" TIMESTAMP(3);

-- Unique index for publicToken (used as the signing URL token)
CREATE UNIQUE INDEX "off_offers_publicToken_key"
  ON "off_offers"("publicToken");

-- FK from offers to templates (nullable — template may be deleted after offer created)
ALTER TABLE "off_offers"
  ADD CONSTRAINT "off_offers_templateId_fkey"
  FOREIGN KEY ("templateId")
  REFERENCES "off_templates"("id")
  ON DELETE SET NULL ON UPDATE CASCADE;
