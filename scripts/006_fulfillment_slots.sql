-- ============================================================================
-- Migration 006: Fulfillment Slots + Per-Method Blocked Days/Dates
-- ============================================================================
-- This migration:
--   1. Creates fulfillment_slots table (slot matrix per method × day × slot)
--   2. Creates fulfillment_blocked_days (recurring day blocks per method)
--   3. Creates fulfillment_blocked_dates (one-off date blocks per method)
--
-- NOTE: The legacy delivery_settings table (single-row, method-agnostic) is
-- kept intact so existing data is not lost. Any existing blocked_days /
-- blocked_dates records in that table have NO method field — a developer
-- should decide whether to duplicate them for both methods. The new UI writes
-- only to the new tables below.
-- ============================================================================

-- ── 1. Fulfillment Slots Matrix ───────────────────────────────────────────────
-- One row per (method, day_of_week, slot). enabled=true means that slot is
-- available for bookings.
--   method:      'delivery' | 'collection'
--   day_of_week: 0=Mon, 1=Tue, 2=Wed, 3=Thu, 4=Fri, 5=Sat, 6=Sun
--   slot:        'morning' | 'afternoon' | 'evening'

CREATE TABLE IF NOT EXISTS fulfillment_slots (
  id          SERIAL PRIMARY KEY,
  method      TEXT NOT NULL CHECK (method IN ('delivery', 'collection')),
  day_of_week INTEGER NOT NULL CHECK (day_of_week BETWEEN 0 AND 6),
  slot        TEXT NOT NULL CHECK (slot IN ('morning', 'afternoon', 'evening')),
  enabled     BOOLEAN NOT NULL DEFAULT false,
  UNIQUE (method, day_of_week, slot)
);

-- RLS
ALTER TABLE fulfillment_slots ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "fulfillment_slots_read" ON fulfillment_slots;
CREATE POLICY "fulfillment_slots_read"
  ON fulfillment_slots FOR SELECT USING (true);

DROP POLICY IF EXISTS "fulfillment_slots_write" ON fulfillment_slots;
CREATE POLICY "fulfillment_slots_write"
  ON fulfillment_slots FOR ALL USING (true) WITH CHECK (true);

-- Seed all 42 combinations (2 methods × 7 days × 3 slots) as disabled.
-- Admin can then enable exactly the cells they want.
INSERT INTO fulfillment_slots (method, day_of_week, slot, enabled)
SELECT
  m.method,
  d.day,
  s.slot,
  false
FROM
  (VALUES ('delivery'), ('collection')) AS m(method),
  (VALUES (0),(1),(2),(3),(4),(5),(6))  AS d(day),
  (VALUES ('morning'),('afternoon'),('evening')) AS s(slot)
ON CONFLICT (method, day_of_week, slot) DO NOTHING;


-- ── 2. Fulfillment Blocked Days (recurring, per method) ───────────────────────
-- Each row blocks a recurring day-of-week for a specific fulfillment method.
--   day_of_week: 0=Mon … 6=Sun  (same convention as fulfillment_slots)
--   method:      'delivery' | 'collection'

CREATE TABLE IF NOT EXISTS fulfillment_blocked_days (
  id          SERIAL PRIMARY KEY,
  method      TEXT NOT NULL CHECK (method IN ('delivery', 'collection')),
  day_of_week INTEGER NOT NULL CHECK (day_of_week BETWEEN 0 AND 6),
  UNIQUE (method, day_of_week)
);

ALTER TABLE fulfillment_blocked_days ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "fulfillment_blocked_days_read" ON fulfillment_blocked_days;
CREATE POLICY "fulfillment_blocked_days_read"
  ON fulfillment_blocked_days FOR SELECT USING (true);

DROP POLICY IF EXISTS "fulfillment_blocked_days_write" ON fulfillment_blocked_days;
CREATE POLICY "fulfillment_blocked_days_write"
  ON fulfillment_blocked_days FOR ALL USING (true) WITH CHECK (true);


-- ── 3. Fulfillment Blocked Dates (one-off, per method) ────────────────────────
-- Each row blocks a specific calendar date for a specific fulfillment method.
--   date:   ISO date string 'YYYY-MM-DD'
--   method: 'delivery' | 'collection'

CREATE TABLE IF NOT EXISTS fulfillment_blocked_dates (
  id      SERIAL PRIMARY KEY,
  method  TEXT NOT NULL CHECK (method IN ('delivery', 'collection')),
  date    TEXT NOT NULL,  -- 'YYYY-MM-DD'
  UNIQUE (method, date)
);

ALTER TABLE fulfillment_blocked_dates ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "fulfillment_blocked_dates_read" ON fulfillment_blocked_dates;
CREATE POLICY "fulfillment_blocked_dates_read"
  ON fulfillment_blocked_dates FOR SELECT USING (true);

DROP POLICY IF EXISTS "fulfillment_blocked_dates_write" ON fulfillment_blocked_dates;
CREATE POLICY "fulfillment_blocked_dates_write"
  ON fulfillment_blocked_dates FOR ALL USING (true) WITH CHECK (true);
