-- Add snapshot fields to applications table to denormalize applicant data at time of application
-- This prevents broken links when worker_profiles are updated or deleted
-- Safe to run multiple times.

alter table public.applications
  add column if not exists worker_name text,
  add column if not exists worker_trade text,
  add column if not exists worker_experience integer;
