-- Require contractor-created jobsites to be submitted by approved GC companies.
-- Keeps imported-project claim workflows unchanged; this only tightens inserts
-- into public.projects where source_type = 'contractor_created'.

create or replace function public.is_approved_gc_company_profile()
returns boolean
language sql
stable
as $$
  select exists (
    select 1
    from public.profiles
    join public.company_profiles
      on company_profiles.profile_id = profiles.id
    where profiles.id = auth.uid()
      and profiles.role = 'gc'
      and company_profiles.verified = true
      and coalesce(company_profiles.is_hidden, false) = false
      and lower(replace(replace(coalesce(company_profiles.company_type, ''), '-', '_'), ' ', '_'))
        in ('gc', 'general_contractor')
  );
$$;

drop policy if exists "projects_insert_contractor_created" on public.projects;
create policy "projects_insert_contractor_created" on public.projects
  for insert with check (
    public.is_approved_gc_company_profile()
    and source_type = 'contractor_created'
    and created_by = auth.uid()
    and review_status = 'pending_review'
  );

drop policy if exists "project_claims_admin_insert_all" on public.project_claims;
create policy "project_claims_admin_insert_all" on public.project_claims
  for insert with check (public.is_current_user_admin());

notify pgrst, 'reload schema';
