-- Migration: 20260619000001_restaurant_pos_full_v1
--
-- Additive POS v1 fields for Fluffy's internal restaurant portal.
-- No existing restaurant, Soleria, offer, or customer data is deleted or rewritten.
-- Existing orders keep their current values and are read with safe defaults.

ALTER TABLE "rst_menu_items"
  ADD COLUMN IF NOT EXISTS "variants" JSONB,
  ADD COLUMN IF NOT EXISTS "modifierGroups" JSONB,
  ADD COLUMN IF NOT EXISTS "kitchenStation" TEXT;

ALTER TABLE "rst_orders"
  ADD COLUMN IF NOT EXISTS "tableLabel" TEXT,
  ADD COLUMN IF NOT EXISTS "bookingReference" TEXT,
  ADD COLUMN IF NOT EXISTS "discountCents" INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS "taxCents" INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS "taxRateBps" INTEGER NOT NULL DEFAULT 1200,
  ADD COLUMN IF NOT EXISTS "isHeld" BOOLEAN NOT NULL DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS "kotStatus" TEXT NOT NULL DEFAULT 'not_sent',
  ADD COLUMN IF NOT EXISTS "sentToKitchenAt" TIMESTAMP(3),
  ADD COLUMN IF NOT EXISTS "printedAt" TIMESTAMP(3),
  ADD COLUMN IF NOT EXISTS "printCount" INTEGER NOT NULL DEFAULT 0;

ALTER TABLE "rst_order_items"
  ADD COLUMN IF NOT EXISTS "variantName" TEXT,
  ADD COLUMN IF NOT EXISTS "variantPriceCents" INTEGER,
  ADD COLUMN IF NOT EXISTS "selectedModifiers" JSONB,
  ADD COLUMN IF NOT EXISTS "modifierTotalCents" INTEGER NOT NULL DEFAULT 0;

CREATE INDEX IF NOT EXISTS "rst_orders_organizationId_isHeld_idx" ON "rst_orders"("organizationId", "isHeld");
CREATE INDEX IF NOT EXISTS "rst_orders_organizationId_kotStatus_idx" ON "rst_orders"("organizationId", "kotStatus");
