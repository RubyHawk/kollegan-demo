ALTER TABLE "off_products"
  ADD COLUMN IF NOT EXISTS "categoryId" TEXT;

CREATE TABLE IF NOT EXISTS "off_product_categories" (
  "id"             TEXT         NOT NULL,
  "organizationId" TEXT         NOT NULL,
  "name"           TEXT         NOT NULL,
  "parentId"       TEXT,
  "createdBy"      TEXT         NOT NULL,
  "createdAt"      TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt"      TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "deletedAt"      TIMESTAMP(3),
  CONSTRAINT "off_product_categories_pkey" PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS "off_product_categories_org_parent_name_idx"
  ON "off_product_categories"("organizationId", "parentId", "name");

CREATE INDEX IF NOT EXISTS "off_product_categories_deletedAt_idx"
  ON "off_product_categories"("deletedAt");

CREATE INDEX IF NOT EXISTS "off_products_organizationId_categoryId_idx"
  ON "off_products"("organizationId", "categoryId");

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'off_product_categories_organizationId_fkey'
  ) THEN
    ALTER TABLE "off_product_categories"
      ADD CONSTRAINT "off_product_categories_organizationId_fkey"
      FOREIGN KEY ("organizationId")
      REFERENCES "org_organizations"("id")
      ON DELETE RESTRICT ON UPDATE CASCADE;
  END IF;

  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'off_product_categories_parentId_fkey'
  ) THEN
    ALTER TABLE "off_product_categories"
      ADD CONSTRAINT "off_product_categories_parentId_fkey"
      FOREIGN KEY ("parentId")
      REFERENCES "off_product_categories"("id")
      ON DELETE SET NULL ON UPDATE CASCADE;
  END IF;

  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'off_products_categoryId_fkey'
  ) THEN
    ALTER TABLE "off_products"
      ADD CONSTRAINT "off_products_categoryId_fkey"
      FOREIGN KEY ("categoryId")
      REFERENCES "off_product_categories"("id")
      ON DELETE SET NULL ON UPDATE CASCADE;
  END IF;
END $$;
