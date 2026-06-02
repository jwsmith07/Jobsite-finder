-- Add a JSON `preferences` column to public.profiles so per-user UI
-- preferences (sort mode, radius filter, etc.) can sync across devices.
-- Safe to run multiple times.

alter table public.profiles
  add column if not exists preferences jsonb not null default '{}'::jsonb;
