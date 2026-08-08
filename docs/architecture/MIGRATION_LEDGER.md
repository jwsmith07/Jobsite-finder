# Supabase Migration Ledger

Status: Mission 1 baseline. Previously applied migrations are not renumbered, deleted, or modified.

## Execution Order

```text
000_initial_v1_schema_baseline.sql
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
030_canada_import_duplicate_protection.sql
031_project_eligibility_rules.sql
032_role_hardening_resume_privacy.sql
033_organization_membership_authorization_foundation.sql
034_database_privilege_hardening.sql
035_rls_behavioral_blocker_corrections.sql
036_candidate_pipeline_organization_authorization.sql
037_platform_staff_authorization.sql
038_platform_admin_audit_logging.sql
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

## Manual Import Utility Reclassification

`029_province_project_import_utilities.sql` was originally tracked with schema migrations, but a clean local replay failed at that file with SQLSTATE `42P01` because `jobsite_project_import_staging` does not exist. Review confirmed it was a manual data-import utility, not a permanent schema migration:

- It depends on an externally created staging relation, with `public.jobsite_project_import_staging` only serving as the documented example name.
- It also references eligibility helper functions introduced later by `031_project_eligibility_rules.sql`.
- No permanent staging table was added to `000_initial_v1_schema_baseline.sql`.
- The historical SQL was preserved at `supabase/manual/029_province_project_import_utilities.sql`.
- It is excluded from generated local migration artifacts and must not be included in automatic migration replay.

## Import Function Return-Type Rebuild

Clean local replay then reached `031_project_eligibility_rules.sql` and failed with SQLSTATE `42P13`: `CREATE OR REPLACE FUNCTION` cannot change the OUT-parameter structure of a `RETURNS TABLE` function. `030_canada_import_duplicate_protection.sql` creates `public.run_canada_project_import(text, text, text)`, and `031` intentionally upgrades the return structure to include eligibility counts and exclusion reasons.

Repair: `031` explicitly drops `public.run_canada_project_import(text, text, text)` immediately before recreating the upgraded function, without `CASCADE`. Repository analysis found no dependent schema objects, grants, comments, or application RPC calls requiring restoration after the drop/recreate.

## Database Privilege Hardening

`034_database_privilege_hardening.sql` is a forward-only privilege hardening migration created after clean schema reconstruction exposed broad client grants. It revokes `TRUNCATE`, `TRIGGER`, and `REFERENCES` from `PUBLIC`, `anon`, and `authenticated` on application-owned public tables because `TRUNCATE` bypasses RLS. It revokes client sequence `UPDATE`, protects operational import/quarantine tables with RLS enabled and no client policies, and revokes client execution of the manual Canada import RPC and trigger-only functions.

This migration deliberately does not alter legacy company-ownership RLS policies. The transition from `company_profiles.profile_id` authority to organization membership requires separate behavioral RLS testing and authorization work.

## RLS Behavioral Blocker Corrections

`035_rls_behavioral_blocker_corrections.sql` is a forward-only corrective migration for the first local behavioral RLS matrix. The matrix found that legitimate positive cases could not reach RLS because ordinary client DML privileges were missing after hardening, and that recursive `project_claims` policy paths caused PostgreSQL recursion errors.

The migration restores narrow RLS-governed client DML grants, grants sequence `USAGE` only for supported authenticated inserts, and replaces recursive project-claim checks with fixed-search-path `SECURITY DEFINER` boolean helpers. It does not restore `TRUNCATE`, `TRIGGER`, `REFERENCES`, sequence `UPDATE`, operational-table access, import RPC client access, or change the broader legacy-to-organization transition model.

Validated harness rerun then confirmed SQLSTATE `42P17` recursion in the remaining `worker_profiles` and `applications` policy graph: `worker_profiles`/`worker_certifications` company-applicant policies read `applications`, while `applications` own-worker policies read `worker_profiles`. `035` now replaces those cross-table policy subqueries with fixed-search-path `SECURITY DEFINER` helpers that return only ownership or visibility facts. The same correction updates `can_manage_project_image(bigint, bigint)` and `gc_can_manage_assignment_jobsite(bigint, bigint)` so active organization Owner/Admin/Hiring Manager membership can authorize the action while preserving deliberate legacy company-owner compatibility. Candidate-pipeline organization-role access remains intentionally unresolved and unchanged.

The final decided RLS matrix failure was `RLS-048`: Hiring Manager application status updates passed the organization-membership UPDATE policy but returned no row because `applications_select_company` still used legacy-only `company_profiles.profile_id = auth.uid()` visibility. `035` replaces that SELECT policy with `current_user_can_manage_applications_for_job(bigint)`, which preserves legacy owner visibility and adds active organization Owner/Admin/Hiring Manager visibility for the job post's hiring company.

## Candidate Pipeline Organization Authorization

`036_candidate_pipeline_organization_authorization.sql` implements the approved candidate-pipeline role model. Active organization Owner, Admin, and Hiring Manager memberships may view and manage candidate-pipeline records only when their company has the approved GC/general-contractor claim for the record's project. Ordinary Members, invited/suspended/removed memberships, unrelated organizations, and workers remain denied. Temporary legacy company-owner compatibility is preserved through `company_profiles.profile_id = auth.uid()` for the same claimed company/project relationship.

## Platform Staff Authorization

`037_platform_staff_authorization.sql` creates `platform_staff` as the protected source of platform-wide authority, separate from profile experience roles and customer organization memberships. It defines active `platform_owner` and `platform_admin` helpers, repoints legacy admin helper names to the staff table, and adds platform-staff policies for administrative access to profiles, workers, companies, projects, claims, project images, jobs, applications, site settings and waitlist review. Platform Owner can appoint and suspend Platform Admins through RLS; Platform Admins cannot appoint owners, demote the owner, or promote themselves.

Production Platform Owner bootstrap must be performed manually through a service-role/database-owner SQL insert for Joseph's verified profile UUID after deployment. The repository does not guess or hard-code Joseph's email or UUID. Dedicated admin audit logging remains a mandatory follow-up because no complete audit-event infrastructure exists yet.

## Platform Admin Audit Logging

`038_platform_admin_audit_logging.sql` creates append-only `platform_audit_events` for sensitive platform staff actions. Trigger-created events cover platform staff appointment/status changes, company suspension/reactivation, project edits/hide/restore/delete, project-claim approval/rejection, job/application/project-image moderation, and site-setting changes. Events record actor id, active platform role, action, target table/id, timestamp, and allowlisted before/after fields only; passwords, tokens, service credentials, payment details, resumes, and full rows are deliberately excluded. Clients cannot insert, update, delete, truncate, trigger, or reference audit rows; active Platform Owner/Admin may read them through RLS.

## Mission 1 Draft Migration

`032_role_hardening_resume_privacy.sql` is a draft-forward migration. It must not be applied until reviewed and explicitly approved.

Mission 1B review changed the draft to fail closed for hiring-organization authority. The repository does not yet contain the V2 active organization-membership schema required to grant company, project, job, application, or resume control. Applying `032` before that membership model exists would preserve worker/admin resume access and role hardening, but would intentionally block GC/SC hiring-organization application and resume access until a later authorized membership migration connects that authority.

## Mission 2 Draft Migration

`033_organization_membership_authorization_foundation.sql` is a draft-forward migration. It must not be applied until reviewed and tested with corrected `032` in a disposable Supabase environment.

Mission 2 records `company_profiles.id` as `bigint/int8` for compatibility because the repository overwhelmingly uses bigint company references.

`020_gc_subcontractor_assignments.sql` previously declared `gc_company_id`, `subcontractor_company_id`, and `jobsite_id` as `uuid`, which failed in local disposable testing with SQLSTATE `42804` because `company_profiles.id` and `jobsites.id` are `bigint`. The migration was corrected in place to use bigint foreign-key columns while preserving the assignment table's UUID primary key.

## Local Disposable Baseline

`000_initial_v1_schema_baseline.sql` is a reconstructed schema-only baseline for local disposable testing. It creates the V1 foundation that predates the tracked migration history: `profiles`, `worker_profiles`, `company_profiles`, `projects`, `jobsites`, `job_posts`, `applications`, and `project_claims`.

It is derived from a schema-only dump of the existing Supabase project and excludes table data, auth users, storage object records, storage internals, and objects introduced by migrations `001` through `033`. It must run before `001_worker_profiles_columns.sql` only in local/disposable reconstruction.

The baseline includes `job_posts.positions_count integer default 1` and `job_posts.experience_level text` because the production schema defines both fields, application code treats them as base job fields, and no tracked migration creates them. Migration `015_structured_job_posts.sql` expects `experience_level` to already exist when creating `job_posts_trade_experience_status_idx`.
