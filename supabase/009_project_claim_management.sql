-- Admin project claim management.
-- Adds lightweight history fields and policies needed to approve, reject,
-- revoke, reassign, or relink claims without deleting companies/projects.
-- Safe to run multiple times.

alter table public.project_claims
  add column if not exists approved_at timestamptz,
  add column if not exists revoked_at timestamptz,
  add column if not exists admin_notes text,
  add column if not exists updated_at timestamptz not null default now();

alter table public.project_claims
  drop constraint if exists project_claims_status_check;

alter table public.project_claims
  add constraint project_claims_status_check
  check (status in ('pending', 'approved', 'rejected', 'revoked'));

create or replace function public.set_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end $$;

drop trigger if exists project_claims_set_updated_at on public.project_claims;
create trigger project_claims_set_updated_at
  before update on public.project_claims
  for each row execute function public.set_updated_at();

alter table public.project_claims enable row level security;

drop policy if exists "project_claims_select_own" on public.project_claims;
create policy "project_claims_select_own" on public.project_claims
  for select using (
    company_profile_id in (
      select id from public.company_profiles where profile_id = auth.uid()
    )
  );

drop policy if exists "project_claims_insert_own_pending" on public.project_claims;
create policy "project_claims_insert_own_pending" on public.project_claims
  for insert with check (
    status = 'pending'
    and company_profile_id in (
      select id from public.company_profiles where profile_id = auth.uid()
    )
  );

drop policy if exists "project_claims_admin_select_all" on public.project_claims;
create policy "project_claims_admin_select_all" on public.project_claims
  for select using (
    exists (
      select 1 from public.profiles
      where profiles.id = auth.uid()
        and profiles.role = 'admin'
    )
  );

drop policy if exists "project_claims_admin_update_all" on public.project_claims;
create policy "project_claims_admin_update_all" on public.project_claims
  for update using (
    exists (
      select 1 from public.profiles
      where profiles.id = auth.uid()
        and profiles.role = 'admin'
    )
  ) with check (
    exists (
      select 1 from public.profiles
      where profiles.id = auth.uid()
        and profiles.role = 'admin'
    )
  );

drop policy if exists "projects_admin_update_claim_status" on public.projects;
create policy "projects_admin_update_claim_status" on public.projects
  for update using (
    exists (
      select 1 from public.profiles
      where profiles.id = auth.uid()
        and profiles.role = 'admin'
    )
  ) with check (
    exists (
      select 1 from public.profiles
      where profiles.id = auth.uid()
        and profiles.role = 'admin'
    )
  );

-- Tighten company job-post writes so project access follows approved claims.
-- Existing rows remain owned by the company, but new/updated project links
-- must point at a currently approved claim for that company.
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
