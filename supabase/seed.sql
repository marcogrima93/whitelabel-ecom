-- ============================================================
-- Seed Data for White-Label Ecommerce
-- ============================================================

-- Categories
INSERT INTO categories (id, name, slug, description, sort_order) VALUES
  ('a1000000-0000-0000-0000-000000000001', 'Electronics', 'electronics', 'Phones, laptops, gadgets and more', 1),
  ('a1000000-0000-0000-0000-000000000002', 'Clothing', 'clothing', 'Apparel for men and women', 2),
  ('a1000000-0000-0000-0000-000000000003', 'Home & Garden', 'home-garden', 'Furniture, decor, and outdoor', 3),
  ('a1000000-0000-0000-0000-000000000004', 'Accessories', 'accessories', 'Bags, watches, jewellery', 4);

-- Products
INSERT INTO products (id, name, slug, short_description, description, category_id, price, compare_at_price, sku, inventory_count, is_featured, tags) VALUES
  ('b1000000-0000-0000-0000-000000000001', 'Wireless Noise-Cancelling Headphones', 'wireless-nc-headphones', 'Premium over-ear headphones with ANC', 'Experience studio-quality sound with active noise cancellation. 30-hour battery life, comfortable memory-foam ear cups, and Bluetooth 5.3 for seamless connectivity.', 'a1000000-0000-0000-0000-000000000001', 149.99, 199.99, 'ELEC-HP-001', 45, true, ARRAY['audio', 'wireless', 'bestseller']),
  ('b1000000-0000-0000-0000-000000000002', 'Smart Fitness Watch Pro', 'smart-fitness-watch-pro', 'Track your health and fitness goals', 'Advanced health monitoring with heart rate, SpO2, sleep tracking, and GPS. Water-resistant to 50m with a 7-day battery life.', 'a1000000-0000-0000-0000-000000000001', 229.00, NULL, 'ELEC-SW-001', 30, true, ARRAY['wearable', 'fitness', 'smart']),
  ('b1000000-0000-0000-0000-000000000003', 'Portable Bluetooth Speaker', 'portable-bt-speaker', 'Take your music anywhere', 'Compact, waterproof Bluetooth speaker with 360° sound. 12-hour playtime, built-in microphone, and USB-C charging.', 'a1000000-0000-0000-0000-000000000001', 59.99, 79.99, 'ELEC-SP-001', 80, false, ARRAY['audio', 'portable', 'waterproof']),

  ('b1000000-0000-0000-0000-000000000004', 'Classic Fit Cotton T-Shirt', 'classic-cotton-tshirt', '100% organic cotton everyday tee', 'Soft, breathable organic cotton t-shirt. Pre-shrunk fabric, reinforced seams, and a relaxed fit for everyday comfort.', 'a1000000-0000-0000-0000-000000000002', 24.99, NULL, 'CLTH-TS-001', 200, false, ARRAY['cotton', 'basics', 'unisex']),
  ('b1000000-0000-0000-0000-000000000005', 'Slim Fit Chino Trousers', 'slim-fit-chinos', 'Versatile chinos for work or play', 'Stretch cotton-blend chinos with a modern slim fit. Available in multiple colours with a comfortable elasticated waistband.', 'a1000000-0000-0000-0000-000000000002', 49.99, 65.00, 'CLTH-CH-001', 120, true, ARRAY['trousers', 'smart-casual', 'stretch']),
  ('b1000000-0000-0000-0000-000000000006', 'Lightweight Windbreaker Jacket', 'lightweight-windbreaker', 'Stay dry in unpredictable weather', 'Packable windbreaker with water-resistant coating, adjustable hood, and zip pockets. Weighs under 300g.', 'a1000000-0000-0000-0000-000000000002', 79.99, 99.99, 'CLTH-JK-001', 60, false, ARRAY['outerwear', 'waterproof', 'packable']),

  ('b1000000-0000-0000-0000-000000000007', 'Minimalist Ceramic Vase Set', 'minimalist-vase-set', 'Set of 3 handcrafted ceramic vases', 'Beautifully crafted ceramic vases in matte white, grey, and terracotta. Perfect for dried flowers or as standalone decor pieces.', 'a1000000-0000-0000-0000-000000000003', 44.99, NULL, 'HOME-VS-001', 35, false, ARRAY['decor', 'ceramic', 'handmade']),
  ('b1000000-0000-0000-0000-000000000008', 'Ergonomic Desk Lamp', 'ergonomic-desk-lamp', 'Adjustable LED lamp with USB charging', 'Touch-controlled LED desk lamp with 5 brightness levels and 3 colour temperatures. Built-in USB-A charging port and flexible gooseneck design.', 'a1000000-0000-0000-0000-000000000003', 39.99, 54.99, 'HOME-DL-001', 55, true, ARRAY['lighting', 'ergonomic', 'LED']),
  ('b1000000-0000-0000-0000-000000000009', 'Indoor Herb Garden Kit', 'indoor-herb-garden-kit', 'Grow fresh herbs year-round', 'Self-watering indoor garden with grow light. Includes basil, mint, and parsley seed pods. Compact design fits any kitchen counter.', 'a1000000-0000-0000-0000-000000000003', 34.99, NULL, 'HOME-HG-001', 40, false, ARRAY['garden', 'kitchen', 'organic']),

  ('b1000000-0000-0000-0000-000000000010', 'Leather Crossbody Bag', 'leather-crossbody-bag', 'Full-grain leather everyday bag', 'Handcrafted from full-grain Italian leather. Multiple compartments, adjustable strap, and antique brass hardware.', 'a1000000-0000-0000-0000-000000000004', 89.99, 120.00, 'ACCS-BG-001', 25, true, ARRAY['leather', 'bag', 'handmade']),
  ('b1000000-0000-0000-0000-000000000011', 'Polarised Aviator Sunglasses', 'polarised-aviator-sunglasses', 'UV400 protection with polarised lenses', 'Classic aviator style with titanium frame and polarised lenses. Includes hard-shell case and microfibre cloth.', 'a1000000-0000-0000-0000-000000000004', 64.99, NULL, 'ACCS-SG-001', 70, false, ARRAY['eyewear', 'UV-protection', 'titanium']),
  ('b1000000-0000-0000-0000-000000000012', 'Minimalist Automatic Watch', 'minimalist-automatic-watch', 'Japanese movement, sapphire crystal', 'Clean dial with a reliable Miyota automatic movement. Sapphire crystal glass, genuine leather strap, and 50m water resistance.', 'a1000000-0000-0000-0000-000000000004', 189.00, 249.00, 'ACCS-WT-001', 15, true, ARRAY['watch', 'automatic', 'sapphire']);

-- Product Images (placeholder URLs — replace with real Supabase Storage URLs)
INSERT INTO product_images (product_id, url, alt_text, sort_order, is_primary) VALUES
  ('b1000000-0000-0000-0000-000000000001', '/placeholder-product.svg', 'Wireless Noise-Cancelling Headphones', 0, true),
  ('b1000000-0000-0000-0000-000000000002', '/placeholder-product.svg', 'Smart Fitness Watch Pro', 0, true),
  ('b1000000-0000-0000-0000-000000000003', '/placeholder-product.svg', 'Portable Bluetooth Speaker', 0, true),
  ('b1000000-0000-0000-0000-000000000004', '/placeholder-product.svg', 'Classic Fit Cotton T-Shirt', 0, true),
  ('b1000000-0000-0000-0000-000000000005', '/placeholder-product.svg', 'Slim Fit Chino Trousers', 0, true),
  ('b1000000-0000-0000-0000-000000000006', '/placeholder-product.svg', 'Lightweight Windbreaker Jacket', 0, true),
  ('b1000000-0000-0000-0000-000000000007', '/placeholder-product.svg', 'Minimalist Ceramic Vase Set', 0, true),
  ('b1000000-0000-0000-0000-000000000008', '/placeholder-product.svg', 'Ergonomic Desk Lamp', 0, true),
  ('b1000000-0000-0000-0000-000000000009', '/placeholder-product.svg', 'Indoor Herb Garden Kit', 0, true),
  ('b1000000-0000-0000-0000-000000000010', '/placeholder-product.svg', 'Leather Crossbody Bag', 0, true),
  ('b1000000-0000-0000-0000-000000000011', '/placeholder-product.svg', 'Polarised Aviator Sunglasses', 0, true),
  ('b1000000-0000-0000-0000-000000000012', '/placeholder-product.svg', 'Minimalist Automatic Watch', 0, true);

-- Product Variants (selected products)
INSERT INTO product_variants (product_id, name, sku, price, inventory_count, options) VALUES
  ('b1000000-0000-0000-0000-000000000001', 'Black', 'ELEC-HP-001-BLK', 149.99, 20, '{"color": "Black"}'),
  ('b1000000-0000-0000-0000-000000000001', 'Silver', 'ELEC-HP-001-SLV', 149.99, 25, '{"color": "Silver"}'),
  ('b1000000-0000-0000-0000-000000000004', 'Small - White', 'CLTH-TS-001-S-WHT', 24.99, 50, '{"size": "S", "color": "White"}'),
  ('b1000000-0000-0000-0000-000000000004', 'Medium - White', 'CLTH-TS-001-M-WHT', 24.99, 50, '{"size": "M", "color": "White"}'),
  ('b1000000-0000-0000-0000-000000000004', 'Large - White', 'CLTH-TS-001-L-WHT', 24.99, 50, '{"size": "L", "color": "White"}'),
  ('b1000000-0000-0000-0000-000000000004', 'Medium - Black', 'CLTH-TS-001-M-BLK', 24.99, 50, '{"size": "M", "color": "Black"}'),
  ('b1000000-0000-0000-0000-000000000005', 'Navy - 32', 'CLTH-CH-001-NVY-32', 49.99, 30, '{"color": "Navy", "waist": "32"}'),
  ('b1000000-0000-0000-0000-000000000005', 'Khaki - 32', 'CLTH-CH-001-KHK-32', 49.99, 30, '{"color": "Khaki", "waist": "32"}'),
  ('b1000000-0000-0000-0000-000000000010', 'Tan', 'ACCS-BG-001-TAN', 89.99, 12, '{"color": "Tan"}'),
  ('b1000000-0000-0000-0000-000000000010', 'Black', 'ACCS-BG-001-BLK', 89.99, 13, '{"color": "Black"}');

-- Discount Codes
INSERT INTO discount_codes (code, type, value, min_order, max_uses, is_active) VALUES
  ('WELCOME10', 'percentage', 10.00, 30.00, 1000, true),
  ('FLAT5', 'fixed', 5.00, 25.00, 500, true);

-- CMS Pages
INSERT INTO pages (title, slug, content, is_published) VALUES
  ('About Us', 'about', '{"blocks": [{"type": "heading", "text": "About [STORE_NAME]"}, {"type": "paragraph", "text": "We are a modern ecommerce store committed to quality products and exceptional service."}]}', true),
  ('Privacy Policy', 'privacy-policy', '{"blocks": [{"type": "heading", "text": "Privacy Policy"}, {"type": "paragraph", "text": "Your privacy is important to us. This policy outlines how we collect, use, and protect your data."}]}', true),
  ('Terms & Conditions', 'terms', '{"blocks": [{"type": "heading", "text": "Terms & Conditions"}, {"type": "paragraph", "text": "By using our store, you agree to the following terms and conditions."}]}', true),
  ('Shipping & Returns', 'shipping-returns', '{"blocks": [{"type": "heading", "text": "Shipping & Returns"}, {"type": "paragraph", "text": "We offer island-wide delivery and a 30-day return policy on all items."}]}', true);
