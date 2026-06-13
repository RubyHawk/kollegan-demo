-- Additive, non-destructive: structured ingredient list per menu item.
-- Stored as a JSONB array of { name, quantity, unit, note }. Nullable with no
-- backfill; existing rows keep NULL and are read as an empty list in the app.
ALTER TABLE "rst_menu_items"
  ADD COLUMN IF NOT EXISTS "ingredients" JSONB;
