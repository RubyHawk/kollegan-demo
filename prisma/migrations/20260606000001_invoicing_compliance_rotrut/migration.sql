-- Migration: 20260606000001_invoicing_compliance_rotrut
--
-- Extends the M0 invoicing tables (inv_invoices, inv_line_items) for Milestone 3:
--   1. Credit notes (kreditfaktura) — documentType + self-reference to the
--      credited invoice; credit notes share the gapless invoice number series.
--   2. Immutability metadata — issuedAt (set when an invoice leaves draft) and a
--      paymentReference (bankgiro/OCR) shown on the PDF.
--   3. ROT/RUT tax deduction (Swedish households) — invoice-level claimant/property
--      details + labour/deduction amounts; line-level labour/material split.
--
-- All DDL is additive: new columns are nullable or carry safe defaults, and the
-- inv_* tables are currently empty (M3 is the first feature to create invoices),
-- so there is no table rewrite. Safe to deploy with zero downtime.

-- ─── 1. inv_invoices: document type, immutability, ROT/RUT ─────────────────────

ALTER TABLE "inv_invoices"
  ADD COLUMN "documentType"            TEXT NOT NULL DEFAULT 'invoice',
  ADD COLUMN "creditedInvoiceId"       TEXT,
  ADD COLUMN "issuedAt"                TIMESTAMP(3),
  ADD COLUMN "paymentReference"        TEXT,
  ADD COLUMN "rotRutType"              TEXT,
  ADD COLUMN "buyerPersonalNumber"     TEXT,
  ADD COLUMN "propertyDesignation"     TEXT,
  ADD COLUMN "housingSocietyOrgNumber" TEXT,
  ADD COLUMN "rotRutLaborAmount"       DOUBLE PRECISION NOT NULL DEFAULT 0,
  ADD COLUMN "rotRutDeductionAmount"   DOUBLE PRECISION NOT NULL DEFAULT 0,
  ADD COLUMN "rotRutClaimStatus"       TEXT;

-- Self-reference: a credit note points at the invoice it credits.
ALTER TABLE "inv_invoices"
  ADD CONSTRAINT "inv_invoices_creditedInvoiceId_fkey"
  FOREIGN KEY ("creditedInvoiceId") REFERENCES "inv_invoices"("id")
  ON DELETE SET NULL ON UPDATE CASCADE;

CREATE INDEX "inv_invoices_organizationId_documentType_idx"
  ON "inv_invoices"("organizationId", "documentType");

CREATE INDEX "inv_invoices_organizationId_creditedInvoiceId_idx"
  ON "inv_invoices"("organizationId", "creditedInvoiceId");

-- ─── 2. inv_line_items: labour/material split for ROT/RUT ──────────────────────

ALTER TABLE "inv_line_items"
  ADD COLUMN "lineType"       TEXT NOT NULL DEFAULT 'standard',
  ADD COLUMN "rotRutEligible" BOOLEAN NOT NULL DEFAULT FALSE;
