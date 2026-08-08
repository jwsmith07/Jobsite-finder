-- Forward-only privilege hardening for reconstructed V2 schema.
-- This migration does not change RLS policy logic or legacy company-ownership
-- authorization. It removes client privileges that bypass or sit outside RLS.

revoke truncate, trigger, references on table
  public.applications,
  public.company_profiles,
  public.gc_candidate_pipeline,
  public.gc_subcontractor_assignments,
  public.job_posts,
  public.jobsites,
  public.membership_invitations,
  public.organization_backfill_quarantine,
  public.organization_memberships,
  public.organizations,
  public.profiles,
  public.project_claims,
  public.project_images,
  public.project_import_reports,
  public.project_import_review_items,
  public.projects,
  public.saved_jobs,
  public.site_settings,
  public.waitlist_signups,
  public.worker_certifications,
  public.worker_profiles
from public, anon, authenticated;

revoke update on sequence
  public.applications_id_seq,
  public.company_profiles_id_seq,
  public.gc_candidate_pipeline_id_seq,
  public.job_posts_id_seq,
  public.jobsites_id_seq,
  public.organization_backfill_quarantine_id_seq,
  public.organization_memberships_id_seq,
  public.organizations_id_seq,
  public.project_claims_id_seq,
  public.project_import_reports_id_seq,
  public.project_import_review_items_id_seq,
  public.projects_id_seq,
  public.saved_jobs_id_seq,
  public.worker_certifications_id_seq,
  public.worker_profiles_id_seq
from public, anon, authenticated;

alter table public.project_import_reports enable row level security;
alter table public.project_import_review_items enable row level security;
alter table public.organization_backfill_quarantine enable row level security;

revoke all on table
  public.project_import_reports,
  public.project_import_review_items,
  public.organization_backfill_quarantine
from public, anon, authenticated;

revoke all on sequence
  public.project_import_reports_id_seq,
  public.project_import_review_items_id_seq,
  public.organization_backfill_quarantine_id_seq
from public, anon, authenticated;

revoke all on function public.run_canada_project_import(text, text, text)
from public, anon, authenticated;

grant execute on function public.run_canada_project_import(text, text, text)
to service_role;

revoke all on function public.guard_application_update()
from public, anon, authenticated;

revoke all on function public.guard_company_profile_member_update()
from public, anon, authenticated;

revoke all on function public.guard_membership_invitation_write()
from public, anon, authenticated;

revoke all on function public.guard_organization_member_update()
from public, anon, authenticated;

revoke all on function public.guard_organization_membership_write()
from public, anon, authenticated;

revoke all on function public.guard_profile_role_assignment()
from public, anon, authenticated;

revoke all on function public.guard_project_contractor_location_update()
from public, anon, authenticated;

revoke all on function public.guard_project_image_primary()
from public, anon, authenticated;

revoke all on function public.set_organization_updated_at()
from public, anon, authenticated;

revoke all on function public.set_updated_at()
from public, anon, authenticated;
