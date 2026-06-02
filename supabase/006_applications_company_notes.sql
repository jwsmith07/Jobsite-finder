-- Add company_notes column to applications table for GC/SC notes on applicants.
-- Safe to run multiple times.

alter table public.applications
  add column if not exists company_notes text;