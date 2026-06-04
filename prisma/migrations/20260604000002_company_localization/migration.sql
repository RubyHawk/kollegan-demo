-- Migration: 20260604000002_company_localization
--
-- Adds localisation and tax configuration at the Company (brand) level.
-- Enables multi-currency, multi-VAT-regime ERP operation: e.g. Company A in SE
-- invoices in SEK at 25% VAT, Company B in NO invoices in NOK at 25% MVA.
--
-- All columns are additive with safe defaults — no existing rows are modified
-- or removed. Safe to deploy on production with zero downtime.

ALTER TABLE "off_companies"
  ADD COLUMN "currency"       TEXT NOT NULL DEFAULT 'SEK',
  ADD COLUMN "vatNumber"      TEXT,
  ADD COLUMN "defaultVatRate" DOUBLE PRECISION NOT NULL DEFAULT 0.25;
