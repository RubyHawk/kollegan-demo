-- Migration: 20260301000004_add_compliance_controls
--
-- Creates the global ISO 27001:2022 Annex A control registry.
-- This table is seeded (no organizationId) and shared across all orgs.
-- Must be created before cmp_evidence which has a FK to this table.

-- ─── Control Registry (seeded, global) ────────────────────────────────────────

CREATE TABLE "cmp_controls" (
    "id"           TEXT    NOT NULL,
    "controlId"    TEXT    NOT NULL,
    "name"         TEXT    NOT NULL,
    "description"  TEXT    NOT NULL,
    "category"     TEXT    NOT NULL,
    "evidenceType" TEXT    NOT NULL,
    "isActive"     BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "cmp_controls_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "cmp_controls_controlId_key" ON "cmp_controls"("controlId");
CREATE        INDEX "cmp_controls_controlId_idx"    ON "cmp_controls"("controlId");
CREATE        INDEX "cmp_controls_evidenceType_idx" ON "cmp_controls"("evidenceType");
