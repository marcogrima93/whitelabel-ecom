-- ============================================================================
-- Migration: 003_drop_address_phone_and_full_name
-- Purpose:   Remove the phone and full_name columns from the addresses table.
--
-- Rationale:
--   - phone     → stored exclusively on profiles.phone
--   - full_name → stored exclusively on profiles.name
--
--   Having these columns on addresses created duplicates and potential sources
--   of conflicting data. All application code has been updated to read both
--   values from the profiles table instead.
--
-- Dependencies resolved before this migration:
--   - app/account/addresses/AddressesClient.tsx — phone + full_name fields
--                                                  removed from UI and all
--                                                  action calls
--   - app/api/account/addresses/route.ts        — phone + full_name removed
--                                                  from INSERT payload
--   - app/checkout/page.tsx                     — buildDeliveryAddress now
--                                                  reads both from userProfile;
--                                                  getCustomerName reads from
--                                                  userProfile.name;
--                                                  SavedAddress interface
--                                                  updated
--   - lib/supabase/types.ts                     — phone + full_name removed
--                                                  from Address interface
--
-- Run manually in the Supabase SQL editor or via the Supabase CLI.
-- ============================================================================

ALTER TABLE addresses
  DROP COLUMN IF EXISTS phone,
  DROP COLUMN IF EXISTS full_name;
