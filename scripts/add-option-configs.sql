-- Migration: extend product option values with optional price override and image link
-- The existing `options` column is text[] (array of plain strings like "Red", "Blue", "XL").
-- We add a new JSONB column `option_configs` that stores the richer per-value data:
--   [{ "value": "Red", "price_override": null, "image_url": "https://..." }, ...]
-- The text[] column is left untouched so no existing data is affected.

ALTER TABLE products
  ADD COLUMN IF NOT EXISTS option_configs jsonb NOT NULL DEFAULT '[]'::jsonb;
