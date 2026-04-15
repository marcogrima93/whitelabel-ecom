-- ============================================================================
-- Migration: 003_drop_address_phone
-- Purpose:   Remove the phone column from the addresses table.
--
-- Rationale: Phone numbers are stored exclusively on the profiles table
--            (profiles.phone). Having a phone column on addresses created a
--            duplicate and a potential source of conflicting data.
--            All application code has been updated to read phone from
--            profiles instead of from the address record.
--
-- Dependencies resolved before this migration:
--   - app/account/addresses/AddressesClient.tsx — phone field removed from UI
--   - app/api/account/addresses/route.ts        — phone removed from INSERT
--   - app/checkout/page.tsx                     — buildDeliveryAddress now
--                                                  reads phone from userProfile
--   - lib/supabase/types.ts                     — phone removed from Address
--                                                  interface
--
-- Run manually in the Supabase SQL editor or via the Supabase CLI.
-- ============================================================================

ALTER TABLE addresses
  DROP COLUMN IF EXISTS phone;
