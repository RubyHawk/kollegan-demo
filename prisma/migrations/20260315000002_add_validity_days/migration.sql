-- Add validityDays to off_offers
-- Stores the chosen validity window (in days) so validUntil can be
-- recalculated as sentAt + validityDays when the offer is actually sent.
-- Existing rows default to 30 days.

ALTER TABLE "off_offers"
  ADD COLUMN IF NOT EXISTS "validityDays" INTEGER NOT NULL DEFAULT 30;
