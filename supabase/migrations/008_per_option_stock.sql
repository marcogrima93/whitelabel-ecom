-- ============================================================================
-- Migration 008 — Per-Option Stock Tracking
-- ============================================================================
-- Extends option_configs JSONB to carry a stock_quantity field per option value.
-- No schema column change needed — option_configs is already JSONB and the new
-- field is optional (null = unlimited / product-level stock).
--
-- Adds:
--   decrement_stock_option(p_id, p_option_value, p_qty)
--     Atomically decrements the stock_quantity of a specific option inside the
--     option_configs JSONB array, guarded by >= p_qty check.
--     Returns the updated row if successful, empty set if sold out.
-- ============================================================================

-- ── Atomic per-option stock decrement ───────────────────────────────────────
-- Logic:
--  1. Find the option_config element whose "value" matches p_option_value.
--  2. Only proceed if its "stock_quantity" (cast to int) >= p_qty.
--  3. Decrement that element and re-derive stock_status from the aggregate.
-- ============================================================================
CREATE OR REPLACE FUNCTION decrement_stock_option(
  p_id           UUID,
  p_option_value TEXT,
  p_qty          INTEGER
)
RETURNS SETOF products
LANGUAGE plpgsql
AS $$
DECLARE
  v_configs      JSONB;
  v_opt          JSONB;
  v_current_qty  INTEGER;
  v_new_qty      INTEGER;
  v_new_configs  JSONB;
  v_total_qty    INTEGER;
  v_new_status   TEXT;
BEGIN
  -- Lock the row for update
  SELECT option_configs INTO v_configs
  FROM products
  WHERE id = p_id AND stock_mode = 'LIMITED'
  FOR UPDATE;

  IF NOT FOUND THEN
    RETURN;
  END IF;

  -- Find the matching option element
  SELECT elem INTO v_opt
  FROM jsonb_array_elements(v_configs) AS elem
  WHERE elem->>'value' = p_option_value;

  IF v_opt IS NULL THEN
    RETURN;
  END IF;

  -- Read current qty; null means unlimited for this option — skip decrement
  IF v_opt->'stock_quantity' IS NULL OR v_opt->>'stock_quantity' = 'null' THEN
    -- Option has no per-option stock; fall back to product-level (already handled)
    RETURN QUERY
      SELECT * FROM products WHERE id = p_id;
    RETURN;
  END IF;

  v_current_qty := (v_opt->>'stock_quantity')::INTEGER;

  -- Guard: not enough stock
  IF v_current_qty < p_qty THEN
    RETURN;
  END IF;

  v_new_qty := v_current_qty - p_qty;

  -- Rebuild the configs array with the updated element
  SELECT jsonb_agg(
    CASE
      WHEN elem->>'value' = p_option_value
        THEN elem || jsonb_build_object('stock_quantity', v_new_qty)
      ELSE elem
    END
  )
  INTO v_new_configs
  FROM jsonb_array_elements(v_configs) AS elem;

  -- Derive aggregate stock_status from all LIMITED options
  -- (options with null stock_quantity contribute unlimited, so total is infinite)
  -- We only consider options that have an explicit stock_quantity
  SELECT COALESCE(SUM((elem->>'stock_quantity')::INTEGER), 0)
  INTO v_total_qty
  FROM jsonb_array_elements(v_new_configs) AS elem
  WHERE elem->'stock_quantity' IS NOT NULL
    AND elem->>'stock_quantity' != 'null';

  v_new_status := CASE
    WHEN v_total_qty <= 0 THEN 'OUT_OF_STOCK'
    WHEN v_total_qty <= 2 THEN 'LOW_STOCK'
    ELSE 'IN_STOCK'
  END;

  RETURN QUERY
  UPDATE products
  SET
    option_configs = v_new_configs,
    stock_status   = v_new_status::stock_status,
    updated_at     = NOW()
  WHERE id = p_id
  RETURNING *;
END;
$$;
