-- Structured workforce hiring fields for GC/SC job posts.
-- Safe to run multiple times. All columns are nullable to preserve existing jobs.

alter table public.job_posts
  add column if not exists hiring_tags text[] default '{}'::text[],
  add column if not exists camp_available text,
  add column if not exists project_assignment text,
  add column if not exists start_date date,
  add column if not exists duration text,
  add column if not exists required_certifications text;

create index if not exists job_posts_trade_experience_status_idx
on public.job_posts(trade, experience_level, status);
