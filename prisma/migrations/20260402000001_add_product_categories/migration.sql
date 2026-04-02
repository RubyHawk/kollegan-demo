-- AddTable: ProductCategory (two-level tree: main → subcategory)
CREATE TABLE "off_product_categories" (
    "id"             TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "name"           TEXT NOT NULL,
    "parentId"       TEXT,
    "createdAt"      TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt"      TIMESTAMP(3) NOT NULL,
    "deletedAt"      TIMESTAMP(3),

    CONSTRAINT "off_product_categories_pkey" PRIMARY KEY ("id")
);

-- AddIndex
CREATE UNIQUE INDEX "off_product_categories_organizationId_parentId_name_key"
    ON "off_product_categories"("organizationId", "parentId", "name");

CREATE INDEX "off_product_categories_organizationId_parentId_idx"
    ON "off_product_categories"("organizationId", "parentId");

CREATE INDEX "off_product_categories_deletedAt_idx"
    ON "off_product_categories"("deletedAt");

-- AddForeignKey: ProductCategory.organizationId → organizations.id
ALTER TABLE "off_product_categories"
    ADD CONSTRAINT "off_product_categories_organizationId_fkey"
    FOREIGN KEY ("organizationId") REFERENCES "organizations"("id")
    ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey: ProductCategory.parentId → self
ALTER TABLE "off_product_categories"
    ADD CONSTRAINT "off_product_categories_parentId_fkey"
    FOREIGN KEY ("parentId") REFERENCES "off_product_categories"("id")
    ON DELETE SET NULL ON UPDATE CASCADE;

-- AlterTable: OfferProduct — add categoryId FK column
ALTER TABLE "off_products"
    ADD COLUMN "categoryId" TEXT;

-- AddIndex for categoryId
CREATE INDEX "off_products_organizationId_categoryId_idx"
    ON "off_products"("organizationId", "categoryId");

-- AddForeignKey: OfferProduct.categoryId → off_product_categories.id
ALTER TABLE "off_products"
    ADD CONSTRAINT "off_products_categoryId_fkey"
    FOREIGN KEY ("categoryId") REFERENCES "off_product_categories"("id")
    ON DELETE SET NULL ON UPDATE CASCADE;
