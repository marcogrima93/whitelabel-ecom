-- ============================================================
-- Migration: create discount_codes table
-- ============================================================

create table if not exists public.discount_codes (
  id          uuid primary key default gen_random_uuid(),
  code        text not null unique,
  percentage  numeric(5,2) not null check (percentage > 0 and percentage <= 100),
  active      boolean not null default true,
  created_at  timestamptz not null default now()
);

-- Index for fast lookups by code string
create index if not exists discount_codes_code_idx on public.discount_codes (lower(code));

-- RLS: only service-role can write; authenticated users can read active codes via the API
alter table public.discount_codes enable row level security;

-- Allow the service role (used by API routes) full access
create policy "service_role_all" on public.discount_codes
  for all
  using (true)
  with check (true);
