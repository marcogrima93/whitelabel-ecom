-- ============================================================================
-- Seed Data: The Village Butcher
-- ============================================================================
-- Run this in your Supabase SQL editor AFTER running 001_init.sql
-- ============================================================================

INSERT INTO products (name, slug, description, category, filter_field, retail_price, wholesale_price, stock_status, options)
VALUES 
  (
    'Premium Wagyu Ribeye Steak (A5)', 
    'wagyu-ribeye-a5', 
    'The pinnacle of premium beef. Our A5 Wagyu Ribeye features incredible marbling, offering a melt-in-your-mouth texture and rich, buttery flavour. Perfect for special occasions.', 
    'beef', 
    'Steak', 
    85.00, 
    75.00, 
    'IN_STOCK', 
    '{"300g", "500g", "1kg"}'
  ),
  (
    'Dry-Aged Tomahawk Steak', 
    'dry-aged-tomahawk', 
    'A spectacular cut for sharing. Dry-aged for 28 days to intensify the beefy notes and ensure maximum tenderness. French-trimmed for a stunning presentation.', 
    'beef', 
    'Steak', 
    65.00, 
    55.00, 
    'IN_STOCK', 
    '{"800g", "1kg", "1.2kg"}'
  ),
  (
    'Free-Range Chicken Breast', 
    'free-range-chicken-breast', 
    'Locally sourced, free-range chicken breasts. Lean, versatile, and packed with flavour. Perfect for grilling, roasting, or pan-frying.', 
    'poultry', 
    'Whole', 
    14.50, 
    11.00, 
    'IN_STOCK', 
    '{"500g", "1kg", "2.5kg Box"}'
  ),
  (
    'Premium Pork Belly Slices', 
    'premium-pork-belly', 
    'Thick-cut pork belly slices with the perfect meat-to-fat ratio. Ideal for slow roasting until crispy or throwing straight onto the BBQ.', 
    'pork', 
    'Chops', 
    12.90, 
    9.50, 
    'IN_STOCK', 
    '{"500g", "1kg"}'
  ),
  (
    'New Zealand Lamb Chops', 
    'nz-lamb-chops', 
    'Tender and sweet New Zealand lamb chops. Carefully prepared and trimmed by our expert butchers.', 
    'lamb', 
    'Chops', 
    24.00, 
    19.00, 
    'IN_STOCK', 
    '{"500g", "1kg"}'
  ),
  (
    'Traditional Maltese Sausage', 
    'maltese-sausage', 
    'Our signature house-made Maltese sausage, packed with premium pork, coriander seeds, garlic, and cracked black pepper.', 
    'pork', 
    'Sausages', 
    9.50, 
    7.50, 
    'IN_STOCK', 
    '{"500g", "1kg", "5kg Wholesale Box"}'
  ),
  (
    'Lean Beef Mince (5% Fat)', 
    'lean-beef-mince', 
    'Freshly ground daily from premium lean cuts. Perfect for healthy bolognese, meatballs, or handmade burgers.', 
    'beef', 
    'Mince', 
    13.50, 
    10.50, 
    'IN_STOCK', 
    '{"500g", "1kg", "2.5kg Tub"}'
  ),
  (
    'Whole Free-Range Turkey', 
    'whole-turkey', 
    'A magnificent centrepiece for any feast. Our free-range turkeys are plump, juicy, and full of traditional flavour.', 
    'poultry', 
    'Whole', 
    45.00, 
    38.00, 
    'LOW_STOCK', 
    '{"4kg", "5kg", "6kg"}'
  )
ON CONFLICT (slug) DO NOTHING;
