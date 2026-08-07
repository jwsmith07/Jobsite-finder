# Supabase Migration Ledger

Status: Mission 1 baseline. Previously applied migrations are not renumbered, deleted, or modified.

## Execution Order

```text
001_worker_profiles_columns.sql
002_company_and_profiles_columns.sql
003_profile_rls_policies.sql
004_profile_preferences_column.sql
005_job_posts_applications_rls.sql
006_applications_company_notes.sql
007_applications_snapshot_fields.sql
008_worker_profiles_company_read.sql
009_project_claim_management.sql
010_project_company_connections.sql
011_admin_profile_company_management.sql
012_contractor_project_location_fields.sql
013_major_project_minimum.sql
014_project_images.sql
015_structured_job_posts.sql
016_job_status_management.sql
017_contractor_created_jobsites.sql
018_site_settings_maintenance_mode.sql
019_waitlist_signups.sql
020_gc_subcontractor_assignments.sql
021_gc_owned_contractor_created_jobsites.sql
022_primary_gc_project_workspace_updates.sql
023_saved_jobs_worker_bookmarks.sql
024_worker_credentials_foundation.sql
025_gc_talent_discovery_policies.sql
026_candidate_pipeline_worker_privacy.sql
027_privacy_security_hardening.sql
028_project_participation_workflow.sql
028_site_settings_map_provider_policy.sql
029_province_project_import_utilities.sql
030_canada_import_duplicate_protection.sql
031_project_eligibility_rules.sql
032_role_hardening_resume_privacy.sql
033_organization_membership_authorization_foundation.sql
```

## Known Numbering Conflict

Two existing files use migration number `028`:

```text
028_project_participation_workflow.sql
028_site_settings_map_provider_policy.sql
```

Decision: leave both filenames unchanged. Treat `032_role_hardening_resume_privacy.sql` as the next forward-only migration.

## Repeated Policy Names Observed

```text
job_posts_insert_own
job_posts_update_own
job_posts_select_public
project_images_select_public_projects
projects_insert_contractor_created
site_settings_admin_all
worker_profiles_select_primary_gc_talent_pool
worker_certifications_select_primary_gc_talent_pool
```

## Repeated Functions Observed

```text
public.set_updated_at
public.is_admin_profile
public.guard_project_contractor_location_update
public.is_major_project
public.run_canada_project_import
```

## Mission 1 Draft Migration

`032_role_hardening_resume_privacy.sql` is a draft-forward migration. It must not be applied until reviewed and explicitly approved.

Mission 1B review changed the draft to fail closed for hiring-organization authority. The repository does not yet contain the V2 active organization-membership schema required to grant company, project, job, application, or resume control. Applying `032` before that membership model exists would preserve worker/admin resume access and role hardening, but would intentionally block GC/SC hiring-organization application and resume access until a later authorized membership migration connects that authority.

## Mission 2 Draft Migration

`033_organization_membership_authorization_foundation.sql` is a draft-forward migration. It must not be applied until reviewed and tested with corrected `032` in a disposable Supabase environment.

Mission 2 records `company_profiles.id` as `bigint/int8` for compatibility because the repository overwhelmingly uses bigint company references. `020_gc_subcontractor_assignments.sql` remains the known outlier because it declares company profile foreign keys as UUID. Do not edit or renumber `020`; reconcile it with a later forward-only repair after disposable testing proves the live schema shape.
