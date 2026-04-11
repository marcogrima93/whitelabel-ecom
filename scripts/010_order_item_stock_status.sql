-- Migration 010: add stock_status_at_order to order_items
-- Records the stock status of each product at the time the order was placed.

ALTER TABLE order_items
  ADD COLUMN IF NOT EXISTS stock_status_at_order TEXT DEFAULT NULL;
