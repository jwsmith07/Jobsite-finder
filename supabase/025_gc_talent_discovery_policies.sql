-- GC talent discovery read policies.
-- Safe to run multiple times.

drop policy if exists "worker_profiles_select_primary_gc_talent_pool" on public.worker_profiles;
create policy "worker_profiles_select_primary_gc_talent_pool" on public.worker_profiles
  for select using (
    exists (
      select 1
      from public.project_claims pc
      join public.company_profiles cp on cp.id = pc.company_profile_id
      where cp.profile_id = auth.uid()
        and pc.status = 'approved'
        and coalesce(pc.company_role, pc.claim_type) in ('gc', 'general_contractor')
        and coalesce(pc.is_primary_gc, true) = true
    )
  );

drop policy if exists "worker_certifications_select_primary_gc_talent_pool" on public.worker_certifications;
create policy "worker_certifications_select_primary_gc_talent_pool" on public.worker_certifications
  for select using (
    exists (
      select 1
      from public.project_claims pc
      join public.company_profiles cp on cp.id = pc.company_profile_id
      where cp.profile_id = auth.uid()
        and pc.status = 'approved'
        and coalesce(pc.company_role, pc.claim_type) in ('gc', 'general_contractor')
        and coalesce(pc.is_primary_gc, true) = true
    )
  );
