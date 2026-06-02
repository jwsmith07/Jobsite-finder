-- Add missing columns expected by the company profile form and base profiles.
-- Safe to run multiple times.

alter table public.company_profiles
  add column if not exists logo_url     text,
  add column if not exists website      text,
  add column if not exists phone        text,
  add column if not exists email        text,
  add column if not exists service_area text,
  add column if not exists updated_at   timestamptz not null default now();

alter table public.profiles
  add column if not exists avatar_url text,
  add column if not exists updated_at timestamptz not null default now();

-- Reuse the trigger function created in 001 (no-op if already present)
create or replace function public.set_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end $$;

drop trigger if exists company_profiles_set_updated_at on public.company_profiles;
create trigger company_profiles_set_updated_at
  before update on public.company_profiles
  for each row execute function public.set_updated_at();

drop trigger if exists profiles_set_updated_at on public.profiles;
create trigger profiles_set_updated_at
  before update on public.profiles
  for each row execute function public.set_updated_at();
