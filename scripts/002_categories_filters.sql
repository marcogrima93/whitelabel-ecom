-- ============================================================================
-- Migration 002 — Categories & Product Filters
-- ============================================================================
-- Moves categories and filter options out of site.config into the database
-- so they can be managed from the admin portal.
-- ============================================================================

-- ── Categories ──────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS categories (
  id   UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  image TEXT NOT NULL DEFAULT '',
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ── Product Filters ──────────────────────────────────────────────────────
-- Each row is a named filter group (e.g. label="Cut") with an ordered
-- list of option values (e.g. ["Steak","Chops","Mince","Whole","Sausages"]).
CREATE TABLE IF NOT EXISTS product_filters (
  id      UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  label   TEXT NOT NULL,          -- e.g. "Cut"
  options TEXT[] NOT NULL DEFAULT '{}',
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ── RLS ──────────────────────────────────────────────────────────────────
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE product_filters ENABLE ROW LEVEL SECURITY;

-- Public read, admin write
CREATE POLICY "Categories viewable by everyone" ON categories FOR SELECT USING (true);
CREATE POLICY "Categories editable by admins"   ON categories FOR ALL    USING (is_admin());

CREATE POLICY "Filters viewable by everyone" ON product_filters FOR SELECT USING (true);
CREATE POLICY "Filters editable by admins"   ON product_filters FOR ALL    USING (is_admin());

-- ── Auto-update updated_at ───────────────────────────────────────────────
CREATE TRIGGER categories_updated_at
  BEFORE UPDATE ON categories
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER product_filters_updated_at
  BEFORE UPDATE ON product_filters
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- ── Seed from site.config values ────────────────────────────────────────
INSERT INTO categories (name, slug, image, sort_order) VALUES
  ('Beef',    'beef',    '/images/categories/beef.jpg',    1),
  ('Pork',    'pork',    '/images/categories/pork.jpg',    2),
  ('Poultry', 'poultry', '/images/categories/poultry.jpg', 3),
  ('Lamb',    'lamb',    '/images/categories/lamb.jpg',    4)
ON CONFLICT (slug) DO NOTHING;

-- Derive unique filter values from existing product data
INSERT INTO product_filters (label, options, sort_order) VALUES
  ('Cut', ARRAY[
    'Breast','Burgers','Chops','Collar','Fillet','Legs',
    'Loin','Mince','Offal','Ribs','Shank','Shoulder',
    'Steak','Sausages','Thighs','Whole','Wings'
  ], 1)
ON CONFLICT DO NOTHING;
