-- Sprint 8 project participation workflow.
-- Allows approved primary GCs to review subcontractor participation requests
-- and subcontractors to accept/decline their own project invitations.

drop policy if exists "project_claims_gc_select_project_sc_requests" on public.project_claims;
create policy "project_claims_gc_select_project_sc_requests" on public.project_claims
for select
using (
  status = 'pending'
  and coalesce(company_role, claim_type) in ('subcontractor', 'sc')
  and exists (
    select 1
    from public.project_claims gc_claim
    join public.company_profiles gc_company
      on gc_company.id = gc_claim.company_profile_id
    where gc_claim.project_id = project_claims.project_id
      and gc_claim.status = 'approved'
      and coalesce(gc_claim.company_role, gc_claim.claim_type) in ('gc', 'general_contractor')
      and coalesce(gc_claim.is_primary_gc, true) = true
      and gc_company.profile_id = auth.uid()
  )
);

drop policy if exists "project_claims_gc_update_project_sc_requests" on public.project_claims;
create policy "project_claims_gc_update_project_sc_requests" on public.project_claims
for update
using (
  status = 'pending'
  and coalesce(company_role, claim_type) in ('subcontractor', 'sc')
  and exists (
    select 1
    from public.project_claims gc_claim
    join public.company_profiles gc_company
      on gc_company.id = gc_claim.company_profile_id
    where gc_claim.project_id = project_claims.project_id
      and gc_claim.status = 'approved'
      and coalesce(gc_claim.company_role, gc_claim.claim_type) in ('gc', 'general_contractor')
      and coalesce(gc_claim.is_primary_gc, true) = true
      and gc_company.profile_id = auth.uid()
  )
)
with check (
  status in ('approved', 'rejected')
  and coalesce(company_role, claim_type) in ('subcontractor', 'sc')
);

drop policy if exists "gc_subcontractor_assignments_subcontractor_update_invite" on public.gc_subcontractor_assignments;
create policy "gc_subcontractor_assignments_subcontractor_update_invite"
on public.gc_subcontractor_assignments
for update
using (
  status = 'pending'
  and subcontractor_company_id = public.current_user_company_id()
)
with check (
  status in ('active', 'removed')
  and subcontractor_company_id = public.current_user_company_id()
);

notify pgrst, 'reload schema';
