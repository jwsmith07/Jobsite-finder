-- Add missing worker_profiles columns expected by the app form.
-- Safe to run multiple times.

alter table public.worker_profiles
  add column if not exists headline          text,
  add column if not exists secondary_trade   text,
  add column if not exists apprenticeship_level text,
  add column if not exists province          text,
  add column if not exists phone             text,
  add column if not exists availability      text,
  add column if not exists camp_ready        boolean not null default false,
  add column if not exists willing_to_travel boolean not null default false,
  add column if not exists updated_at        timestamptz not null default now();

-- Auto-update updated_at on row change
create or replace function public.set_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end $$;

drop trigger if exists worker_profiles_set_updated_at on public.worker_profiles;
create trigger worker_profiles_set_updated_at
  before update on public.worker_profiles
  for each row execute function public.set_updated_at();
