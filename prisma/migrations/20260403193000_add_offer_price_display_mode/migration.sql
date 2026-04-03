ALTER TABLE "off_offers"
ADD COLUMN IF NOT EXISTS "priceDisplayMode" TEXT NOT NULL DEFAULT 'exclusive';
