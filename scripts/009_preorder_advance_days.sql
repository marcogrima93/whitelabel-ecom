-- ============================================================================
-- Migration 009: PRE_ORDER stock status + fulfillment_advance_days table
-- ============================================================================

-- 1. Add PRE_ORDER to the stock_status enum
ALTER TYPE stock_status ADD VALUE IF NOT EXISTS 'PRE_ORDER';

-- 2. Create the advance-days configuration table
-- Each row defines: given a product's stock status + the chosen fulfilment
-- method, how many days ahead must the customer select their date?
-- The noon cutoff logic (+1 day if order placed at/after 12:00) is applied
-- on top of advance_days in the checkout.
CREATE TABLE IF NOT EXISTS fulfillment_advance_days (
  id                  SERIAL PRIMARY KEY,
  stock_status        TEXT NOT NULL,          -- 'IN_STOCK' | 'LOW_STOCK' | 'PRE_ORDER'
  fulfillment_method  TEXT NOT NULL,          -- 'delivery' | 'collection'
  advance_days        INT  NOT NULL DEFAULT 1 CHECK (advance_days >= 0),
  UNIQUE (stock_status, fulfillment_method)
);

-- 3. Seed with sensible defaults (in-stock = 1 day, pre-order = 14 days)
INSERT INTO fulfillment_advance_days (stock_status, fulfillment_method, advance_days) VALUES
  ('IN_STOCK',  'delivery',   1),
  ('IN_STOCK',  'collection', 1),
  ('LOW_STOCK', 'delivery',   1),
  ('LOW_STOCK', 'collection', 1),
  ('PRE_ORDER', 'delivery',   14),
  ('PRE_ORDER', 'collection', 14)
ON CONFLICT (stock_status, fulfillment_method) DO NOTHING;
