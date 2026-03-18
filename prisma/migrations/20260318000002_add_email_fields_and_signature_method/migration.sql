-- AlterTable: Add email customization fields to templates
ALTER TABLE "off_templates" ADD COLUMN "emailSubject" TEXT;
ALTER TABLE "off_templates" ADD COLUMN "emailBody" TEXT;

-- AlterTable: Add email customization and signature method fields to offers
ALTER TABLE "off_offers" ADD COLUMN "emailSubject" TEXT;
ALTER TABLE "off_offers" ADD COLUMN "emailBody" TEXT;
ALTER TABLE "off_offers" ADD COLUMN "signatureMethod" TEXT NOT NULL DEFAULT 'canvas';
