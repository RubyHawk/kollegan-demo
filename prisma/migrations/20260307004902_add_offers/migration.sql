-- AlterTable
ALTER TABLE "cmp_policies" ALTER COLUMN "updatedAt" DROP DEFAULT;

-- AlterTable
ALTER TABLE "cmp_risks" ALTER COLUMN "updatedAt" DROP DEFAULT;

-- AlterTable
ALTER TABLE "lead_leads" ALTER COLUMN "updatedAt" DROP DEFAULT;

-- AlterTable
ALTER TABLE "org_organizations" ALTER COLUMN "updatedAt" DROP DEFAULT;

-- AlterTable
ALTER TABLE "prt_portals" ALTER COLUMN "updatedAt" DROP DEFAULT;

-- AlterTable
ALTER TABLE "usr_users" ALTER COLUMN "updatedAt" DROP DEFAULT;

-- AlterTable
ALTER TABLE "wf_workflows" ALTER COLUMN "updatedAt" DROP DEFAULT;

-- CreateTable
CREATE TABLE "off_offers" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'draft',
    "recipientName" TEXT NOT NULL,
    "recipientEmail" TEXT NOT NULL,
    "recipientCompany" TEXT,
    "notes" TEXT,
    "validUntil" TIMESTAMP(3) NOT NULL,
    "createdBy" TEXT NOT NULL,
    "totalExVat" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "totalIncVat" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "sentAt" TIMESTAMP(3),
    "viewedAt" TIMESTAMP(3),
    "acceptedAt" TIMESTAMP(3),
    "declinedAt" TIMESTAMP(3),
    "leadId" TEXT,
    "customerId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "off_offers_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "off_line_items" (
    "id" TEXT NOT NULL,
    "offerId" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "quantity" DOUBLE PRECISION NOT NULL,
    "unitPrice" DOUBLE PRECISION NOT NULL,
    "vatRate" DOUBLE PRECISION NOT NULL DEFAULT 0.25,
    "discount" DOUBLE PRECISION DEFAULT 0,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "off_line_items_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "off_offers_organizationId_status_idx" ON "off_offers"("organizationId", "status");

-- CreateIndex
CREATE INDEX "off_offers_organizationId_createdAt_idx" ON "off_offers"("organizationId", "createdAt");

-- CreateIndex
CREATE INDEX "off_offers_organizationId_recipientEmail_idx" ON "off_offers"("organizationId", "recipientEmail");

-- CreateIndex
CREATE INDEX "off_offers_deletedAt_idx" ON "off_offers"("deletedAt");

-- CreateIndex
CREATE INDEX "off_line_items_offerId_idx" ON "off_line_items"("offerId");

-- AddForeignKey
ALTER TABLE "off_offers" ADD CONSTRAINT "off_offers_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "org_organizations"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "off_line_items" ADD CONSTRAINT "off_line_items_offerId_fkey" FOREIGN KEY ("offerId") REFERENCES "off_offers"("id") ON DELETE CASCADE ON UPDATE CASCADE;
