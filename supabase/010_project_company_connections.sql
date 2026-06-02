-- Project-company connections for GC/SC project teams.
-- Extends the existing project_claims table so it can act as the
-- project_companies join table without breaking current claim flows.
-- Safe to run multiple times.

alter table public.project_claims
  add column if not exists company_role text,
  add column if not exists trade_scope text,
  add column if not exists is_primary_gc boolean not null default false,
  add column if not exists approved_by uuid references public.profiles(id);

alter table public.project_claims
  drop constraint if exists project_claims_company_role_check;

alter table public.project_claims
  add constraint project_claims_company_role_check
  check (company_role in ('gc', 'subcontractor'));

update public.project_claims
set company_role = case
  when claim_type = 'sc' then 'subcontractor'
  when claim_type = 'subcontractor' then 'subcontractor'
  else 'gc'
end
where company_role is null;

update public.project_claims
set is_primary_gc = true
where status = 'approved'
  and company_role = 'gc'
  and company_profile_id in (
    select claimed_by_company_id
    from public.projects
    where projects.id = project_claims.project_id
      and claimed_by_company_id is not null
  );

create unique index if not exists project_claims_one_approved_primary_gc
on public.project_claims(project_id)
where status = 'approved'
  and company_role = 'gc'
  and is_primary_gc = true;

drop policy if exists "project_claims_select_approved_public" on public.project_claims;
create policy "project_claims_select_approved_public" on public.project_claims
  for select using (status = 'approved');

-- Keep job posting access tied to approved project-company connections.
-- This repeats the tightened policies from 009 with the newer join-table
-- terminology in comments so this migration can stand alone operationally.
drop policy if exists "job_posts_insert_own" on public.job_posts;
create policy "job_posts_insert_own" on public.job_posts
  for insert with check (
    company_profile_id in (
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
    company_profile_id in (
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
    and exists (
      select 1 from public.project_claims
      where project_claims.project_id = job_posts.project_id
        and project_claims.company_profile_id = job_posts.company_profile_id
        and project_claims.status = 'approved'
    )
  );

notify pgrst, 'reload schema';
