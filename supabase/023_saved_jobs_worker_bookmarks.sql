-- Worker saved jobs.
-- Safe to run multiple times.

create table if not exists public.saved_jobs (
  id bigserial primary key,
  worker_profile_id bigint not null references public.worker_profiles(id) on delete cascade,
  job_post_id bigint not null references public.job_posts(id) on delete cascade,
  created_at timestamptz not null default now(),
  unique (worker_profile_id, job_post_id)
);

create index if not exists saved_jobs_worker_profile_id_idx
  on public.saved_jobs(worker_profile_id);

create index if not exists saved_jobs_job_post_id_idx
  on public.saved_jobs(job_post_id);

alter table public.saved_jobs enable row level security;

drop policy if exists "saved_jobs_select_own" on public.saved_jobs;
create policy "saved_jobs_select_own" on public.saved_jobs
  for select using (
    worker_profile_id in (
      select id from public.worker_profiles where profile_id = auth.uid()
    )
  );

drop policy if exists "saved_jobs_insert_own" on public.saved_jobs;
create policy "saved_jobs_insert_own" on public.saved_jobs
  for insert with check (
    worker_profile_id in (
      select id from public.worker_profiles where profile_id = auth.uid()
    )
  );

drop policy if exists "saved_jobs_delete_own" on public.saved_jobs;
create policy "saved_jobs_delete_own" on public.saved_jobs
  for delete using (
    worker_profile_id in (
      select id from public.worker_profiles where profile_id = auth.uid()
    )
  );
