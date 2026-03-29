-- Add `field` column to product_filters so each filter group knows which
-- product column to filter against (e.g. "filter_field", "category", etc.)
ALTER TABLE public.product_filters
  ADD COLUMN IF NOT EXISTS field TEXT NOT NULL DEFAULT 'filter_field';
