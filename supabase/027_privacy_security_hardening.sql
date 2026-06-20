-- Privacy and security hardening for beta launch.
-- Safe to run multiple times.

drop policy if exists "worker_profiles_select_company" on public.worker_profiles;
drop policy if exists "worker_profiles_select_company_applicants" on public.worker_profiles;
create policy "worker_profiles_select_company_applicants" on public.worker_profiles
  for select using (
    id in (
      select a.worker_profile_id
      from public.applications a
      join public.job_posts j on j.id = a.job_post_id
      where j.company_profile_id in (
        select id from public.company_profiles where profile_id = auth.uid()
      )
    )
  );

drop policy if exists "worker_profiles_select_primary_gc_talent_pool" on public.worker_profiles;
create policy "worker_profiles_select_primary_gc_talent_pool" on public.worker_profiles
  for select using (
    coalesce(talent_visibility, 'approved_gcs') in ('approved_gcs', 'hiring_companies')
    and exists (
      select 1
      from public.project_claims pc
      join public.company_profiles cp on cp.id = pc.company_profile_id
      where cp.profile_id = auth.uid()
        and pc.status = 'approved'
        and coalesce(pc.company_role, pc.claim_type) in ('gc', 'general_contractor')
        and coalesce(pc.is_primary_gc, true) = true
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

drop policy if exists "worker_certifications_select_primary_gc_talent_pool" on public.worker_certifications;
create policy "worker_certifications_select_primary_gc_talent_pool" on public.worker_certifications
  for select using (
    worker_profile_id in (
      select wp.id
      from public.worker_profiles wp
      where coalesce(wp.talent_visibility, 'approved_gcs') in ('approved_gcs', 'hiring_companies')
    )
    and exists (
      select 1
      from public.project_claims pc
      join public.company_profiles cp on cp.id = pc.company_profile_id
      where cp.profile_id = auth.uid()
        and pc.status = 'approved'
        and coalesce(pc.company_role, pc.claim_type) in ('gc', 'general_contractor')
        and coalesce(pc.is_primary_gc, true) = true
    )
  );
