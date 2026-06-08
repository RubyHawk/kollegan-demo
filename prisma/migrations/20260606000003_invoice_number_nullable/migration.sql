-- Migration: 20260606000003_invoice_number_nullable
--
-- Make inv_invoices.invoiceNumber nullable. Drafts hold NULL (no number); the
-- gapless invoice number is assigned only at issue/send. Postgres permits many
-- NULLs under the unique (organizationId, invoiceNumber) index, so multiple
-- draft invoices can coexist in an org without a unique collision.
--
-- Relaxing-only DDL (DROP NOT NULL) — no data is rewritten and the inv_*
-- tables are empty. Safe to deploy with zero downtime.

ALTER TABLE "inv_invoices" ALTER COLUMN "invoiceNumber" DROP NOT NULL;
