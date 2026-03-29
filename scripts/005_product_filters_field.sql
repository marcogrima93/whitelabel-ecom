-- ============================================================================
-- Migration 005 — Add field column to product_filters
-- ============================================================================
-- Maps each filter group to the product table column it targets when filtering.
-- Defaults to 'filter_field' which matches the existing products.filter_field column.
-- ============================================================================

ALTER TABLE product_filters ADD COLUMN IF NOT EXISTS field TEXT NOT NULL DEFAULT 'filter_field';
