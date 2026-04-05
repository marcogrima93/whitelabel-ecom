-- ============================================================================
-- Migration 007 — Stock Tracking
-- ============================================================================
-- Adds two columns to products:
--   stock_mode     TEXT  'UNLIMITED' | 'LIMITED'  (default UNLIMITED)
--   stock_quantity INTEGER  (meaningful only when stock_mode = 'LIMITED')
--
-- All existing products default to UNLIMITED, preserving current behaviour.
-- ============================================================================

ALTER TABLE products
  ADD COLUMN IF NOT EXISTS stock_mode TEXT NOT NULL DEFAULT 'UNLIMITED'
    CHECK (stock_mode IN ('UNLIMITED', 'LIMITED')),
  ADD COLUMN IF NOT EXISTS stock_quantity INTEGER NOT NULL DEFAULT 0;

-- Index to speed up checkout stock checks
CREATE INDEX IF NOT EXISTS idx_products_stock_mode ON products(stock_mode);

-- ── Atomic stock decrement function ─────────────────────────────────────
-- Called from the application layer during checkout.
-- Decrements stock_quantity by p_qty and derives the new stock_status in one
-- atomic write, guarded by WHERE stock_quantity >= p_qty.
-- Returns the updated row if successful, or an empty result set if sold out.
CREATE OR REPLACE FUNCTION decrement_stock(p_id UUID, p_qty INTEGER)
RETURNS SETOF products
LANGUAGE sql
AS $$
  UPDATE products
  SET
    stock_quantity = stock_quantity - p_qty,
    stock_status = CASE
      WHEN (stock_quantity - p_qty) <= 0   THEN 'OUT_OF_STOCK'::stock_status
      WHEN (stock_quantity - p_qty) <= 2   THEN 'LOW_STOCK'::stock_status
      ELSE                                      'IN_STOCK'::stock_status
    END,
    updated_at = NOW()
  WHERE
    id = p_id
    AND stock_mode = 'LIMITED'
    AND stock_quantity >= p_qty
  RETURNING *;
$$;
