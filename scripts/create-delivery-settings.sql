-- Delivery settings table
-- Stores a single row of recurring blocked days and one-off blocked dates

CREATE TABLE IF NOT EXISTS delivery_settings (
  id            INTEGER PRIMARY KEY DEFAULT 1 CHECK (id = 1), -- singleton row
  blocked_days  INTEGER[] NOT NULL DEFAULT '{}',              -- 0=Sun,1=Mon,...,6=Sat (JS getDay() convention)
  blocked_dates TEXT[]    NOT NULL DEFAULT '{}',              -- ISO dates e.g. '2025-12-25'
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Seed a default singleton row if it doesn't exist
INSERT INTO delivery_settings (id, blocked_days, blocked_dates)
VALUES (1, '{}', '{}')
ON CONFLICT (id) DO NOTHING;

-- RLS: allow service role full access, allow anon/authenticated to read
ALTER TABLE delivery_settings ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "delivery_settings_read" ON delivery_settings;
CREATE POLICY "delivery_settings_read"
  ON delivery_settings FOR SELECT
  USING (true);

DROP POLICY IF EXISTS "delivery_settings_write" ON delivery_settings;
CREATE POLICY "delivery_settings_write"
  ON delivery_settings FOR ALL
  USING (true)
  WITH CHECK (true);
