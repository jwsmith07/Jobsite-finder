-- Authorize candidate-pipeline access through active organization hiring roles.
-- Legacy company-profile ownership remains temporarily supported for compatibility.

begin;

create or replace function public.current_user_can_manage_candidate_pipeline(
  p_gc_company_id bigint,
  p_project_id bigint
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
    join public.company_profiles
      on company_profiles.id = project_claims.company_profile_id
    where project_claims.project_id = p_project_id
      and project_claims.company_profile_id = p_gc_company_id
      and project_claims.status = 'approved'
      and coalesce(project_claims.company_role, project_claims.claim_type) in ('gc', 'general_contractor')
      and (
        company_profiles.profile_id = auth.uid()
        or public.current_user_can_manage_hiring_company_profile(p_gc_company_id::text)
      )
  );
$$;

revoke all on function public.current_user_can_manage_candidate_pipeline(bigint, bigint) from public, anon, authenticated;
grant execute on function public.current_user_can_manage_candidate_pipeline(bigint, bigint) to authenticated;

drop policy if exists "gc_candidate_pipeline_select_own_company" on public.gc_candidate_pipeline;
create policy "gc_candidate_pipeline_select_own_company" on public.gc_candidate_pipeline
  for select using (
    public.current_user_can_manage_candidate_pipeline(gc_company_id, project_id)
  );

drop policy if exists "gc_candidate_pipeline_insert_own_company" on public.gc_candidate_pipeline;
create policy "gc_candidate_pipeline_insert_own_company" on public.gc_candidate_pipeline
  for insert with check (
    public.current_user_can_manage_candidate_pipeline(gc_company_id, project_id)
  );

drop policy if exists "gc_candidate_pipeline_update_own_company" on public.gc_candidate_pipeline;
create policy "gc_candidate_pipeline_update_own_company" on public.gc_candidate_pipeline
  for update using (
    public.current_user_can_manage_candidate_pipeline(gc_company_id, project_id)
  ) with check (
    public.current_user_can_manage_candidate_pipeline(gc_company_id, project_id)
  );

drop policy if exists "gc_candidate_pipeline_delete_own_company" on public.gc_candidate_pipeline;
create policy "gc_candidate_pipeline_delete_own_company" on public.gc_candidate_pipeline
  for delete using (
    public.current_user_can_manage_candidate_pipeline(gc_company_id, project_id)
  );

commit;
