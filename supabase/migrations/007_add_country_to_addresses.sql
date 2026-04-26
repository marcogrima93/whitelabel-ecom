-- ============================================================================
-- Migration 007: Add `country` column to addresses table
-- ============================================================================
-- Adds an ISO 3166-1 alpha-2 country code column (default 'MT' for Malta).
-- Existing rows are backfilled to 'MT'. The column is NOT NULL with a default
-- so new rows without an explicit value also resolve to 'MT'.
-- ============================================================================

ALTER TABLE addresses
  ADD COLUMN IF NOT EXISTS country TEXT NOT NULL DEFAULT 'MT';

-- Backfill any existing rows (in case DEFAULT was not applied retroactively)
UPDATE addresses SET country = 'MT' WHERE country IS NULL OR country = '';
