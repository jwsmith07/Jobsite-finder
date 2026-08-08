-- Correct behavioral RLS blockers found by the local matrix.
-- This migration restores only RLS-governed client DML and replaces recursive
-- project_claim policy paths with narrowly scoped authorization helpers.

begin;

grant select on table public.projects to anon, authenticated;
grant select on table public.job_posts to anon, authenticated;
grant select on table public.project_images to anon, authenticated;
grant select on table public.company_profiles to anon, authenticated;
grant select on table public.site_settings to anon, authenticated;

grant select, insert, update on table public.profiles to authenticated;
grant select, insert, update on table public.worker_profiles to authenticated;
grant select, insert, update, delete on table public.worker_certifications to authenticated;
grant select, insert, update on table public.company_profiles to authenticated;
grant insert, update on table public.projects to authenticated;
grant select, insert, update, delete on table public.job_posts to authenticated;
grant select, insert, update on table public.applications to authenticated;
grant select, insert, update on table public.project_claims to authenticated;
grant insert, update, delete on table public.project_images to authenticated;
grant select, insert, delete on table public.saved_jobs to authenticated;
grant select, insert, update, delete on table public.gc_candidate_pipeline to authenticated;
grant select, insert, update, delete on table public.gc_subcontractor_assignments to authenticated;
grant select, insert, update, delete on table public.site_settings to authenticated;
grant select, update on table public.organizations to authenticated;
grant select, insert, update on table public.organization_memberships to authenticated;
grant select, insert, update on table public.membership_invitations to authenticated;

grant usage on sequence
  public.applications_id_seq,
  public.company_profiles_id_seq,
  public.gc_candidate_pipeline_id_seq,
  public.job_posts_id_seq,
  public.organization_memberships_id_seq,
  public.project_claims_id_seq,
  public.saved_jobs_id_seq,
  public.worker_certifications_id_seq,
  public.worker_profiles_id_seq
to authenticated;

create or replace function public.current_user_owns_worker_profile(p_worker_profile_id bigint)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.worker_profiles
    where worker_profiles.id = p_worker_profile_id
      and worker_profiles.profile_id = auth.uid()
  );
$$;

revoke all on function public.current_user_owns_worker_profile(bigint) from public, anon, authenticated;
grant execute on function public.current_user_owns_worker_profile(bigint) to authenticated;

create or replace function public.current_user_can_view_worker_application_profile(p_worker_profile_id bigint)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.applications
    join public.job_posts
      on job_posts.id = applications.job_post_id
    where applications.worker_profile_id = p_worker_profile_id
      and public.current_user_can_manage_hiring_company_profile(job_posts.company_profile_id::text)
  );
$$;

revoke all on function public.current_user_can_view_worker_application_profile(bigint) from public, anon, authenticated;
grant execute on function public.current_user_can_view_worker_application_profile(bigint) to authenticated;

create or replace function public.current_user_can_manage_applications_for_job(p_job_post_id bigint)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.job_posts
    join public.company_profiles
      on company_profiles.id = job_posts.company_profile_id
    where job_posts.id = p_job_post_id
      and (
        company_profiles.profile_id = auth.uid()
        or public.current_user_can_manage_hiring_company_profile(job_posts.company_profile_id::text)
      )
  );
$$;

revoke all on function public.current_user_can_manage_applications_for_job(bigint) from public, anon, authenticated;
grant execute on function public.current_user_can_manage_applications_for_job(bigint) to authenticated;

create or replace function public.worker_profile_visible_to_current_gc_talent_pool(p_worker_profile_id bigint)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.worker_profiles
    where worker_profiles.id = p_worker_profile_id
      and coalesce(worker_profiles.talent_visibility, 'approved_gcs') in ('approved_gcs', 'hiring_companies')
  )
  and exists (
    select 1
    from public.project_claims
    join public.company_profiles
      on company_profiles.id = project_claims.company_profile_id
    where company_profiles.profile_id = auth.uid()
      and project_claims.status = 'approved'
      and coalesce(project_claims.company_role, project_claims.claim_type) in ('gc', 'general_contractor')
      and coalesce(project_claims.is_primary_gc, true) = true
  );
$$;

revoke all on function public.worker_profile_visible_to_current_gc_talent_pool(bigint) from public, anon, authenticated;
grant execute on function public.worker_profile_visible_to_current_gc_talent_pool(bigint) to authenticated;

create or replace function public.current_user_has_primary_gc_claim()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.project_claims
    join public.company_profiles
      on company_profiles.id = project_claims.company_profile_id
    where company_profiles.profile_id = auth.uid()
      and project_claims.status = 'approved'
      and coalesce(project_claims.company_role, project_claims.claim_type) in ('gc', 'general_contractor')
      and coalesce(project_claims.is_primary_gc, true) = true
  );
$$;

revoke all on function public.current_user_has_primary_gc_claim() from public, anon, authenticated;
grant execute on function public.current_user_has_primary_gc_claim() to authenticated;

create or replace function public.current_user_has_primary_gc_claim_for_project(p_project_id bigint)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.project_claims
    join public.company_profiles
      on company_profiles.id = project_claims.company_profile_id
    where project_claims.project_id = p_project_id
      and company_profiles.profile_id = auth.uid()
      and project_claims.status = 'approved'
      and coalesce(project_claims.company_role, project_claims.claim_type) in ('gc', 'general_contractor')
      and coalesce(project_claims.is_primary_gc, true) = true
  );
$$;

revoke all on function public.current_user_has_primary_gc_claim_for_project(bigint) from public, anon, authenticated;
grant execute on function public.current_user_has_primary_gc_claim_for_project(bigint) to authenticated;

create or replace function public.project_has_approved_company_claim(
  p_project_id bigint,
  p_company_profile_id bigint
)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.project_claims
    where project_claims.project_id = p_project_id
      and project_claims.company_profile_id = p_company_profile_id
      and project_claims.status = 'approved'
  );
$$;

revoke all on function public.project_has_approved_company_claim(bigint, bigint) from public, anon, authenticated;
grant execute on function public.project_has_approved_company_claim(bigint, bigint) to authenticated;

create or replace function public.can_manage_project_image(
  p_project_id bigint,
  p_company_id bigint
)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select public.is_admin_profile()
    or exists (
      select 1
      from public.project_claims
      join public.company_profiles
        on company_profiles.id = project_claims.company_profile_id
      where project_claims.project_id = p_project_id
        and project_claims.company_profile_id = p_company_id
        and project_claims.status = 'approved'
        and project_claims.company_role = 'gc'
        and project_claims.is_primary_gc = true
        and company_profiles.profile_id = auth.uid()
    )
    or (
      exists (
        select 1
        from public.project_claims
        where project_claims.project_id = p_project_id
          and project_claims.company_profile_id = p_company_id
          and project_claims.status = 'approved'
          and project_claims.company_role = 'gc'
          and project_claims.is_primary_gc = true
      )
      and public.current_user_can_manage_hiring_company_profile(p_company_id::text)
    );
$$;

revoke all on function public.can_manage_project_image(bigint, bigint) from public, anon, authenticated;
grant execute on function public.can_manage_project_image(bigint, bigint) to anon, authenticated;

create or replace function public.has_approved_project_company(p_project_id bigint)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.project_claims
    join public.company_profiles
      on company_profiles.id = project_claims.company_profile_id
    where project_claims.project_id = p_project_id
      and project_claims.status = 'approved'
      and company_profiles.profile_id = auth.uid()
  );
$$;

revoke all on function public.has_approved_project_company(bigint) from public, anon, authenticated;
grant execute on function public.has_approved_project_company(bigint) to anon, authenticated;

create or replace function public.has_approved_primary_gc_project_claim(p_project_id bigint)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select public.current_user_has_primary_gc_claim_for_project(p_project_id);
$$;

revoke all on function public.has_approved_primary_gc_project_claim(bigint) from public, anon, authenticated;
grant execute on function public.has_approved_primary_gc_project_claim(bigint) to authenticated;

create or replace function public.gc_can_manage_assignment_jobsite(
  p_gc_company_id bigint,
  p_jobsite_id bigint
)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.jobsites
    join public.project_claims
      on project_claims.project_id = jobsites.project_id
    join public.company_profiles
      on company_profiles.id = project_claims.company_profile_id
    where jobsites.id = p_jobsite_id
      and project_claims.company_profile_id = p_gc_company_id
      and project_claims.status = 'approved'
      and coalesce(project_claims.company_role, project_claims.claim_type) in ('gc', 'general_contractor')
      and company_profiles.profile_id = auth.uid()
  )
  or (
    exists (
      select 1
      from public.jobsites
      join public.project_claims
        on project_claims.project_id = jobsites.project_id
      where jobsites.id = p_jobsite_id
        and project_claims.company_profile_id = p_gc_company_id
        and project_claims.status = 'approved'
        and coalesce(project_claims.company_role, project_claims.claim_type) in ('gc', 'general_contractor')
    )
    and public.current_user_can_manage_hiring_company_profile(p_gc_company_id::text)
  );
$$;

revoke all on function public.gc_can_manage_assignment_jobsite(bigint, bigint) from public, anon, authenticated;
grant execute on function public.gc_can_manage_assignment_jobsite(bigint, bigint) to authenticated;

drop policy if exists "project_claims_gc_select_project_sc_requests" on public.project_claims;
create policy "project_claims_gc_select_project_sc_requests" on public.project_claims
  for select using (
    status = 'pending'
    and coalesce(company_role, claim_type) in ('subcontractor', 'sc')
    and public.current_user_has_primary_gc_claim_for_project(project_id)
  );

drop policy if exists "project_claims_gc_update_project_sc_requests" on public.project_claims;
create policy "project_claims_gc_update_project_sc_requests" on public.project_claims
  for update using (
    status = 'pending'
    and coalesce(company_role, claim_type) in ('subcontractor', 'sc')
    and public.current_user_has_primary_gc_claim_for_project(project_id)
  ) with check (
    status in ('approved', 'rejected')
    and coalesce(company_role, claim_type) in ('subcontractor', 'sc')
  );

drop policy if exists "worker_profiles_select_primary_gc_talent_pool" on public.worker_profiles;
create policy "worker_profiles_select_primary_gc_talent_pool" on public.worker_profiles
  for select using (
    coalesce(talent_visibility, 'approved_gcs') in ('approved_gcs', 'hiring_companies')
    and public.current_user_has_primary_gc_claim()
  );

drop policy if exists "worker_profiles_select_company_applicants" on public.worker_profiles;
create policy "worker_profiles_select_company_applicants" on public.worker_profiles
  for select using (
    public.current_user_can_view_worker_application_profile(id)
  );

drop policy if exists "worker_certifications_select_primary_gc_talent_pool" on public.worker_certifications;
create policy "worker_certifications_select_primary_gc_talent_pool" on public.worker_certifications
  for select using (
    public.worker_profile_visible_to_current_gc_talent_pool(worker_profile_id)
  );

drop policy if exists "worker_certifications_select_own" on public.worker_certifications;
create policy "worker_certifications_select_own" on public.worker_certifications
  for select using (
    public.current_user_owns_worker_profile(worker_profile_id)
  );

drop policy if exists "worker_certifications_update_own" on public.worker_certifications;
create policy "worker_certifications_update_own" on public.worker_certifications
  for update using (
    public.current_user_owns_worker_profile(worker_profile_id)
  ) with check (
    public.current_user_owns_worker_profile(worker_profile_id)
  );

drop policy if exists "worker_certifications_delete_own" on public.worker_certifications;
create policy "worker_certifications_delete_own" on public.worker_certifications
  for delete using (
    public.current_user_owns_worker_profile(worker_profile_id)
  );

drop policy if exists "worker_certifications_insert_own" on public.worker_certifications;
create policy "worker_certifications_insert_own" on public.worker_certifications
  for insert with check (
    public.current_user_owns_worker_profile(worker_profile_id)
  );

drop policy if exists "worker_certifications_select_company_applicants" on public.worker_certifications;
create policy "worker_certifications_select_company_applicants" on public.worker_certifications
  for select using (
    public.current_user_can_view_worker_application_profile(worker_profile_id)
  );

drop policy if exists "applications_select_own" on public.applications;
create policy "applications_select_own" on public.applications
  for select using (
    public.current_user_owns_worker_profile(worker_profile_id)
  );

drop policy if exists "applications_select_company" on public.applications;
create policy "applications_select_company" on public.applications
  for select using (
    public.current_user_can_manage_applications_for_job(job_post_id)
  );

drop policy if exists "applications_insert_own" on public.applications;
create policy "applications_insert_own" on public.applications
  for insert with check (
    public.current_user_owns_worker_profile(worker_profile_id)
  );

drop policy if exists "applications_update_own" on public.applications;
create policy "applications_update_own" on public.applications
  for update using (
    public.current_user_owns_worker_profile(worker_profile_id)
  ) with check (
    public.current_user_owns_worker_profile(worker_profile_id)
  );

drop policy if exists "job_posts_insert_own" on public.job_posts;
create policy "job_posts_insert_own" on public.job_posts
  for insert with check (
    public.current_user_can_manage_hiring_company_profile(company_profile_id::text)
    and public.is_major_project(project_id)
    and public.project_has_approved_company_claim(project_id, company_profile_id)
  );

drop policy if exists "job_posts_update_own" on public.job_posts;
create policy "job_posts_update_own" on public.job_posts
  for update using (
    public.current_user_can_manage_hiring_company_profile(company_profile_id::text)
    and public.is_major_project(project_id)
    and public.project_has_approved_company_claim(project_id, company_profile_id)
  ) with check (
    public.current_user_can_manage_hiring_company_profile(company_profile_id::text)
    and public.is_major_project(project_id)
    and public.project_has_approved_company_claim(project_id, company_profile_id)
  );

drop policy if exists "project_images_insert_connected_or_admin" on public.project_images;
create policy "project_images_insert_connected_or_admin" on public.project_images
  for insert with check (
    public.is_admin_profile()
    or (
      uploaded_by = auth.uid()
      and company_id is not null
      and public.can_manage_project_image(project_id, company_id)
    )
  );

commit;
