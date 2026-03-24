-- ============================================================================
-- White-Label Ecommerce — Supabase Database Migration
-- ============================================================================
-- Run this in your Supabase SQL editor to create all tables.
-- ============================================================================

-- Enums
CREATE TYPE stock_status AS ENUM ('IN_STOCK', 'LOW_STOCK', 'OUT_OF_STOCK');
CREATE TYPE user_role AS ENUM ('RETAIL', 'WHOLESALE', 'ADMIN');
CREATE TYPE order_status AS ENUM ('PENDING', 'CONFIRMED', 'DISPATCHED', 'DELIVERED', 'CANCELLED');
CREATE TYPE delivery_method AS ENUM ('DELIVERY', 'COLLECTION');

-- ── Products ────────────────────────────────────────────────────────────
CREATE TABLE products (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  description TEXT NOT NULL DEFAULT '',
  category TEXT NOT NULL,
  filter_field TEXT NOT NULL DEFAULT '',
  images TEXT[] NOT NULL DEFAULT '{}',
  retail_price DECIMAL(10,2) NOT NULL,
  wholesale_price DECIMAL(10,2) NOT NULL,
  stock_status stock_status NOT NULL DEFAULT 'IN_STOCK',
  options TEXT[] NOT NULL DEFAULT '{}',
  is_archived BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ── Profiles (extends auth.users) ───────────────────────────────────────
CREATE TABLE profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  name TEXT NOT NULL,
  phone TEXT,
  role user_role NOT NULL DEFAULT 'RETAIL',
  wholesale_approved BOOLEAN NOT NULL DEFAULT FALSE,
  business_name TEXT,
  vat_number TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ── Addresses ───────────────────────────────────────────────────────────
CREATE TABLE addresses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  label TEXT NOT NULL DEFAULT 'Home',
  full_name TEXT NOT NULL,
  phone TEXT NOT NULL,
  line_1 TEXT NOT NULL,
  line_2 TEXT,
  city TEXT NOT NULL,
  region TEXT NOT NULL,
  postcode TEXT NOT NULL,
  is_default BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ── Orders ──────────────────────────────────────────────────────────────
CREATE TABLE orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_number TEXT UNIQUE NOT NULL,
  user_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
  email TEXT NOT NULL,
  status order_status NOT NULL DEFAULT 'PENDING',
  delivery_method delivery_method NOT NULL DEFAULT 'DELIVERY',
  delivery_address JSONB,
  delivery_fee DECIMAL(10,2) NOT NULL DEFAULT 0,
  delivery_slot TEXT,
  subtotal DECIMAL(10,2) NOT NULL,
  vat_amount DECIMAL(10,2) NOT NULL,
  total DECIMAL(10,2) NOT NULL,
  discount_code TEXT,
  discount_amount DECIMAL(10,2) NOT NULL DEFAULT 0,
  notes TEXT,
  stripe_payment_intent_id TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ── Order Items ─────────────────────────────────────────────────────────
CREATE TABLE order_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  product_id UUID NOT NULL,
  product_name TEXT NOT NULL,
  product_image TEXT NOT NULL DEFAULT '',
  selected_option TEXT NOT NULL DEFAULT '',
  price_per_unit DECIMAL(10,2) NOT NULL,
  quantity INTEGER NOT NULL,
  line_total DECIMAL(10,2) NOT NULL
);

-- ── Quote Requests ──────────────────────────────────────────────────────
CREATE TABLE quote_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  business TEXT NOT NULL,
  email TEXT NOT NULL,
  phone TEXT,
  categories TEXT[] NOT NULL DEFAULT '{}',
  quantity TEXT NOT NULL,
  frequency TEXT,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ── Indexes ─────────────────────────────────────────────────────────────
CREATE INDEX idx_products_category ON products(category);
CREATE INDEX idx_products_slug ON products(slug);
CREATE INDEX idx_products_stock ON products(stock_status);
CREATE INDEX idx_orders_user ON orders(user_id);
CREATE INDEX idx_orders_status ON orders(status);
CREATE INDEX idx_order_items_order ON order_items(order_id);
CREATE INDEX idx_addresses_user ON addresses(user_id);

-- ── Row Level Security ──────────────────────────────────────────────────
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE addresses ENABLE ROW LEVEL SECURITY;
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE order_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE quote_requests ENABLE ROW LEVEL SECURITY;

-- Admin check function (SECURITY DEFINER bypasses RLS to prevent recursion)
CREATE OR REPLACE FUNCTION is_admin()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'ADMIN'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Products: public read, admin write
CREATE POLICY "Products are viewable by everyone" ON products FOR SELECT USING (true);
CREATE POLICY "Products are editable by admins" ON products FOR ALL USING (is_admin());

-- Profiles: users can read/update own profile, admins can read all
CREATE POLICY "Users can view own profile" ON profiles FOR SELECT USING (id = auth.uid());
CREATE POLICY "Admins can view all profiles" ON profiles FOR SELECT USING (is_admin());
CREATE POLICY "Users can update own profile" ON profiles FOR UPDATE USING (id = auth.uid());

-- Addresses: users manage their own addresses
CREATE POLICY "Users manage own addresses" ON addresses FOR ALL USING (user_id = auth.uid());

-- Orders: users see own orders, admins see all
CREATE POLICY "Users can view own orders" ON orders FOR SELECT USING (user_id = auth.uid());
CREATE POLICY "Admins can manage all orders" ON orders FOR ALL USING (is_admin());

-- Order items: viewable by order owner
CREATE POLICY "Users can view own order items" ON order_items FOR SELECT USING (
  EXISTS (SELECT 1 FROM orders WHERE orders.id = order_items.order_id AND orders.user_id = auth.uid())
);
CREATE POLICY "Admins can manage all order items" ON order_items FOR ALL USING (is_admin());

-- Quote requests: anyone can insert, admins can read
CREATE POLICY "Anyone can submit quotes" ON quote_requests FOR INSERT WITH CHECK (true);
CREATE POLICY "Admins can view quotes" ON quote_requests FOR SELECT USING (is_admin());

-- ── Auto-create profile on signup ───────────────────────────────────────
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, name, phone, role, business_name, vat_number)
  VALUES (
    NEW.id, 
    NEW.email, 
    COALESCE(NEW.raw_user_meta_data->>'name', ''),
    NEW.raw_user_meta_data->>'phone',
    COALESCE((NEW.raw_user_meta_data->>'role')::public.user_role, 'RETAIL'::public.user_role),
    NEW.raw_user_meta_data->>'business_name',
    NEW.raw_user_meta_data->>'vat_number'
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- ── Auto-update updated_at ──────────────────────────────────────────────
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER products_updated_at BEFORE UPDATE ON products FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER profiles_updated_at BEFORE UPDATE ON profiles FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER orders_updated_at BEFORE UPDATE ON orders FOR EACH ROW EXECUTE FUNCTION update_updated_at();
