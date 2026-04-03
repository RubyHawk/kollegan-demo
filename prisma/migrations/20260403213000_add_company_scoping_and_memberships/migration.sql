-- Company scoping for templates, products, and categories
ALTER TABLE "off_templates" ADD COLUMN IF NOT EXISTS "companyId" TEXT;
ALTER TABLE "off_products" ADD COLUMN IF NOT EXISTS "companyId" TEXT;
ALTER TABLE "off_product_categories" ADD COLUMN IF NOT EXISTS "companyId" TEXT;

-- Company-specific sender/branding fields
ALTER TABLE "off_companies" ADD COLUMN IF NOT EXISTS "senderEmail" TEXT;
ALTER TABLE "off_companies" ADD COLUMN IF NOT EXISTS "senderName" TEXT;
ALTER TABLE "off_companies" ADD COLUMN IF NOT EXISTS "emailHeaderConfig" TEXT;

-- Company membership mapping
CREATE TABLE IF NOT EXISTS "off_company_members" (
  "id" TEXT NOT NULL,
  "companyId" TEXT NOT NULL,
  "userId" TEXT NOT NULL,
  "role" TEXT NOT NULL DEFAULT 'staff',
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "grantedBy" TEXT,
  CONSTRAINT "off_company_members_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "off_company_members_companyId_userId_key"
  ON "off_company_members"("companyId", "userId");
CREATE INDEX IF NOT EXISTS "off_company_members_userId_idx"
  ON "off_company_members"("userId");
CREATE INDEX IF NOT EXISTS "off_company_members_companyId_role_idx"
  ON "off_company_members"("companyId", "role");

CREATE INDEX IF NOT EXISTS "off_templates_organizationId_companyId_createdAt_idx"
  ON "off_templates"("organizationId", "companyId", "createdAt");
CREATE INDEX IF NOT EXISTS "off_products_organizationId_companyId_categoryId_idx"
  ON "off_products"("organizationId", "companyId", "categoryId");
CREATE INDEX IF NOT EXISTS "off_products_organizationId_companyId_category_idx"
  ON "off_products"("organizationId", "companyId", "category");
CREATE INDEX IF NOT EXISTS "off_products_organizationId_companyId_isActive_name_idx"
  ON "off_products"("organizationId", "companyId", "isActive", "name");
CREATE INDEX IF NOT EXISTS "off_product_categories_organizationId_companyId_parentId_idx"
  ON "off_product_categories"("organizationId", "companyId", "parentId");

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'off_templates_companyId_fkey'
  ) THEN
    ALTER TABLE "off_templates"
      ADD CONSTRAINT "off_templates_companyId_fkey"
      FOREIGN KEY ("companyId") REFERENCES "off_companies"("id")
      ON DELETE SET NULL ON UPDATE CASCADE;
  END IF;

  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'off_products_companyId_fkey'
  ) THEN
    ALTER TABLE "off_products"
      ADD CONSTRAINT "off_products_companyId_fkey"
      FOREIGN KEY ("companyId") REFERENCES "off_companies"("id")
      ON DELETE SET NULL ON UPDATE CASCADE;
  END IF;

  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'off_product_categories_companyId_fkey'
  ) THEN
    ALTER TABLE "off_product_categories"
      ADD CONSTRAINT "off_product_categories_companyId_fkey"
      FOREIGN KEY ("companyId") REFERENCES "off_companies"("id")
      ON DELETE SET NULL ON UPDATE CASCADE;
  END IF;

  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'off_company_members_companyId_fkey'
  ) THEN
    ALTER TABLE "off_company_members"
      ADD CONSTRAINT "off_company_members_companyId_fkey"
      FOREIGN KEY ("companyId") REFERENCES "off_companies"("id")
      ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;

  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'off_company_members_userId_fkey'
  ) THEN
    ALTER TABLE "off_company_members"
      ADD CONSTRAINT "off_company_members_userId_fkey"
      FOREIGN KEY ("userId") REFERENCES "usr_users"("id")
      ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;
END $$;
