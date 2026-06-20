-- Structured worker credentials and matching foundation.
-- Safe to run multiple times.

alter table public.worker_profiles
  add column if not exists availability_status text,
  add column if not exists work_preferences jsonb not null default '[]'::jsonb,
  add column if not exists preferred_regions jsonb not null default '[]'::jsonb,
  add column if not exists trade_level text;

create table if not exists public.worker_certifications (
  id bigserial primary key,
  worker_profile_id bigint not null references public.worker_profiles(id) on delete cascade,
  certification_name text not null,
  issuer text,
  expires_at date,
  created_at timestamptz not null default now(),
  unique (worker_profile_id, certification_name)
);

create index if not exists worker_certifications_worker_profile_id_idx
  on public.worker_certifications(worker_profile_id);

create index if not exists worker_certifications_name_idx
  on public.worker_certifications(certification_name);

create index if not exists worker_profiles_availability_status_idx
  on public.worker_profiles(availability_status);

create index if not exists worker_profiles_work_preferences_gin_idx
  on public.worker_profiles using gin(work_preferences);

create index if not exists worker_profiles_preferred_regions_gin_idx
  on public.worker_profiles using gin(preferred_regions);

alter table public.worker_certifications enable row level security;

drop policy if exists "worker_certifications_select_own" on public.worker_certifications;
create policy "worker_certifications_select_own" on public.worker_certifications
  for select using (
    worker_profile_id in (
      select id from public.worker_profiles where profile_id = auth.uid()
    )
  );

drop policy if exists "worker_certifications_insert_own" on public.worker_certifications;
create policy "worker_certifications_insert_own" on public.worker_certifications
  for insert with check (
    worker_profile_id in (
      select id from public.worker_profiles where profile_id = auth.uid()
    )
  );

drop policy if exists "worker_certifications_update_own" on public.worker_certifications;
create policy "worker_certifications_update_own" on public.worker_certifications
  for update using (
    worker_profile_id in (
      select id from public.worker_profiles where profile_id = auth.uid()
    )
  ) with check (
    worker_profile_id in (
      select id from public.worker_profiles where profile_id = auth.uid()
    )
  );

drop policy if exists "worker_certifications_delete_own" on public.worker_certifications;
create policy "worker_certifications_delete_own" on public.worker_certifications
  for delete using (
    worker_profile_id in (
      select id from public.worker_profiles where profile_id = auth.uid()
    )
  );

drop policy if exists "worker_certifications_select_company_applicants" on public.worker_certifications;
create policy "worker_certifications_select_company_applicants" on public.worker_certifications
  for select using (
    worker_profile_id in (
      select a.worker_profile_id
      from public.applications a
      join public.job_posts j on j.id = a.job_post_id
      where j.company_profile_id in (
        select id from public.company_profiles where profile_id = auth.uid()
      )
    )
  );
