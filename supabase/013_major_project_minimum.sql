-- Enforce public major-project surfaces without excluding imported Alberta
-- Major Projects rows whose value is unavailable in the normalized column.
-- Keeps valid project-company/job connections intact while preventing
-- known low-value projects from entering public hiring surfaces.
-- Safe to run multiple times.

create or replace function public.is_major_project(p_project_id bigint)
returns boolean
language sql
stable
as $$
  select exists (
    select 1
    from public.projects
    where projects.id = p_project_id
      and projects.is_active = true
      and projects.is_public_project = true
      and (
        projects.estimated_value is null
        or projects.estimated_value >= 5000000
      )
  );
$$;

create index if not exists projects_active_major_public_idx
on public.projects(project_name, id)
where is_active = true
  and is_public_project = true
  and (
    estimated_value is null
    or estimated_value >= 5000000
  );

create index if not exists job_posts_open_major_project_idx
on public.job_posts(project_id, created_at desc)
where status = 'open';

drop policy if exists "job_posts_insert_own" on public.job_posts;
create policy "job_posts_insert_own" on public.job_posts
  for insert with check (
    public.is_major_project(job_posts.project_id)
    and company_profile_id in (
      select id from public.company_profiles where profile_id = auth.uid()
    )
    and exists (
      select 1 from public.project_claims
      where project_claims.project_id = job_posts.project_id
        and project_claims.company_profile_id = job_posts.company_profile_id
        and project_claims.status = 'approved'
    )
  );

drop policy if exists "job_posts_update_own" on public.job_posts;
create policy "job_posts_update_own" on public.job_posts
  for update using (
    company_profile_id in (
      select id from public.company_profiles where profile_id = auth.uid()
    )
  ) with check (
    public.is_major_project(job_posts.project_id)
    and company_profile_id in (
      select id from public.company_profiles where profile_id = auth.uid()
    )
    and exists (
      select 1 from public.project_claims
      where project_claims.project_id = job_posts.project_id
        and project_claims.company_profile_id = job_posts.company_profile_id
        and project_claims.status = 'approved'
    )
  );

drop policy if exists "job_posts_select_public" on public.job_posts;
create policy "job_posts_select_public" on public.job_posts
  for select using (
    status = 'open'
    and public.is_major_project(job_posts.project_id)
    and exists (
      select 1 from public.project_claims
      where project_claims.project_id = job_posts.project_id
        and project_claims.company_profile_id = job_posts.company_profile_id
        and project_claims.status = 'approved'
    )
  );

notify pgrst, 'reload schema';
