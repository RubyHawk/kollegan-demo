-- Migration: 20260301000005_add_compliance_evidence_risks_policies
--
-- Creates the org-scoped compliance tables:
--   cmp_evidence  → append-only evidence snapshots; FK to cmp_controls
--   cmp_risks     → mutable risk register
--   cmp_policies  → versioned policy vault
--
-- Depends on: 20260301000004_add_compliance_controls (cmp_controls must exist)

-- ─── Evidence Snapshots (append-only) ─────────────────────────────────────────
-- CRITICAL: This table is append-only. Never expose UPDATE or DELETE on it.

CREATE TABLE "cmp_evidence" (
    "id"             TEXT         NOT NULL,
    "organizationId" TEXT         NOT NULL,
    "controlId"      TEXT         NOT NULL,
    "status"         TEXT         NOT NULL,
    "payload"        JSONB        NOT NULL,
    "summary"        TEXT         NOT NULL,
    "collectedAt"    TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "collectedBy"    TEXT         NOT NULL DEFAULT 'system',

    CONSTRAINT "cmp_evidence_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "cmp_evidence_organizationId_controlId_collectedAt_idx"
    ON "cmp_evidence"("organizationId", "controlId", "collectedAt");
CREATE INDEX "cmp_evidence_organizationId_collectedAt_idx"
    ON "cmp_evidence"("organizationId", "collectedAt");
CREATE INDEX "cmp_evidence_controlId_collectedAt_idx"
    ON "cmp_evidence"("controlId", "collectedAt");

ALTER TABLE "cmp_evidence"
    ADD CONSTRAINT "cmp_evidence_controlId_fkey"
    FOREIGN KEY ("controlId") REFERENCES "cmp_controls"("id")
    ON DELETE RESTRICT ON UPDATE CASCADE;

-- ─── Risk Register ─────────────────────────────────────────────────────────────

CREATE TABLE "cmp_risks" (
    "id"             TEXT         NOT NULL,
    "organizationId" TEXT         NOT NULL,
    "asset"          TEXT         NOT NULL,
    "threat"         TEXT         NOT NULL,
    "vulnerability"  TEXT         NOT NULL,
    "likelihood"     INTEGER      NOT NULL,
    "impact"         INTEGER      NOT NULL,
    "riskScore"      INTEGER      NOT NULL,
    "treatment"      TEXT         NOT NULL,
    "treatmentDesc"  TEXT,
    "owner"          TEXT,
    "dueDate"        TIMESTAMP(3),
    "status"         TEXT         NOT NULL DEFAULT 'open',
    "createdAt"      TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt"      TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdBy"      TEXT         NOT NULL,
    "deletedAt"      TIMESTAMP(3),

    CONSTRAINT "cmp_risks_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "cmp_risks_organizationId_status_idx"    ON "cmp_risks"("organizationId", "status");
CREATE INDEX "cmp_risks_organizationId_riskScore_idx" ON "cmp_risks"("organizationId", "riskScore");
CREATE INDEX "cmp_risks_organizationId_createdAt_idx" ON "cmp_risks"("organizationId", "createdAt");

-- ─── Policy Vault ──────────────────────────────────────────────────────────────

CREATE TABLE "cmp_policies" (
    "id"              TEXT         NOT NULL,
    "organizationId"  TEXT         NOT NULL,
    "name"            TEXT         NOT NULL,
    "category"        TEXT         NOT NULL,
    "version"         TEXT         NOT NULL DEFAULT '1.0',
    "content"         TEXT         NOT NULL,
    "reviewCycleDays" INTEGER      NOT NULL DEFAULT 365,
    "nextReviewDate"  TIMESTAMP(3),
    "owner"           TEXT,
    "approvedAt"      TIMESTAMP(3),
    "approvedBy"      TEXT,
    "status"          TEXT         NOT NULL DEFAULT 'draft',
    "createdAt"       TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt"       TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdBy"       TEXT         NOT NULL,
    "deletedAt"       TIMESTAMP(3),

    CONSTRAINT "cmp_policies_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "cmp_policies_organizationId_status_idx"         ON "cmp_policies"("organizationId", "status");
CREATE INDEX "cmp_policies_organizationId_category_idx"       ON "cmp_policies"("organizationId", "category");
CREATE INDEX "cmp_policies_organizationId_nextReviewDate_idx" ON "cmp_policies"("organizationId", "nextReviewDate");
