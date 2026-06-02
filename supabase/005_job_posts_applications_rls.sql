-- RLS policies for job_posts and applications tables
-- Safe to run multiple times.

-- ============================================================
-- job_posts  (company_profile_id links to company_profiles.id)
-- ============================================================
alter table public.job_posts enable row level security;

-- Companies can read/write their own job posts
drop policy if exists "job_posts_select_own" on public.job_posts;
create policy "job_posts_select_own" on public.job_posts
  for select using (
    company_profile_id in (
      select id from public.company_profiles where profile_id = auth.uid()
    )
  );

drop policy if exists "job_posts_insert_own" on public.job_posts;
create policy "job_posts_insert_own" on public.job_posts
  for insert with check (
    company_profile_id in (
      select id from public.company_profiles where profile_id = auth.uid()
    )
  );

drop policy if exists "job_posts_update_own" on public.job_posts;
create policy "job_posts_update_own" on public.job_posts
  for update using (
    company_profile_id in (
      select id from public.company_profiles where profile_id = auth.uid()
    )
  ) with check (
    company_profile_id in (
      select id from public.company_profiles where profile_id = auth.uid()
    )
  );

drop policy if exists "job_posts_delete_own" on public.job_posts;
create policy "job_posts_delete_own" on public.job_posts
  for delete using (
    company_profile_id in (
      select id from public.company_profiles where profile_id = auth.uid()
    )
  );

-- Public read access for job posts (so workers can see them)
drop policy if exists "job_posts_select_public" on public.job_posts;
create policy "job_posts_select_public" on public.job_posts
  for select using (status = 'open');

-- ============================================================
-- applications  (worker_profile_id links to worker_profiles.id)
-- ============================================================
alter table public.applications enable row level security;

-- Workers can read/write their own applications
drop policy if exists "applications_select_own" on public.applications;
create policy "applications_select_own" on public.applications
  for select using (
    worker_profile_id in (
      select id from public.worker_profiles where profile_id = auth.uid()
    )
  );

drop policy if exists "applications_insert_own" on public.applications;
create policy "applications_insert_own" on public.applications
  for insert with check (
    worker_profile_id in (
      select id from public.worker_profiles where profile_id = auth.uid()
    )
  );

drop policy if exists "applications_update_own" on public.applications;
create policy "applications_update_own" on public.applications
  for update using (
    worker_profile_id in (
      select id from public.worker_profiles where profile_id = auth.uid()
    )
  ) with check (
    worker_profile_id in (
      select id from public.worker_profiles where profile_id = auth.uid()
    )
  );

-- Companies can read applications for their job posts
drop policy if exists "applications_select_company" on public.applications;
create policy "applications_select_company" on public.applications
  for select using (
    job_post_id in (
      select id from public.job_posts where company_profile_id in (
        select id from public.company_profiles where profile_id = auth.uid()
      )
    )
  );

-- Companies can update application status for their job posts
drop policy if exists "applications_update_company" on public.applications;
create policy "applications_update_company" on public.applications
  for update using (
    job_post_id in (
      select id from public.job_posts where company_profile_id in (
        select id from public.company_profiles where profile_id = auth.uid()
      )
    )
  ) with check (
    job_post_id in (
      select id from public.job_posts where company_profile_id in (
        select id from public.company_profiles where profile_id = auth.uid()
      )
    )
  );