# Mission 1B Adversarial Review and Disposable-Environment Test Plan

Status: Draft. Do not apply `supabase/032_role_hardening_resume_privacy.sql` to production until the open approval decisions are resolved.

## Files Reviewed

- `supabase/032_role_hardening_resume_privacy.sql`
- `supabase/001_worker_profiles_columns.sql` through `supabase/031_project_eligibility_rules.sql`
- `supabase/020_gc_subcontractor_assignments.sql`
- `supabase/026_candidate_pipeline_worker_privacy.sql`
- `src/services/applicationsService.js`
- `src/services/resumeAccessService.js`
- `src/components/profile/ResumeUpload.jsx`
- `src/pages/gc/GCApplicantsPage.jsx`
- `src/pages/gc/GCProjectWorkspacePage.jsx`
- `src/pages/worker/ApplicationsPage.jsx`

## SQL Defects and Schema Mismatches Found

1. The original `032` draft granted hiring authority from `company_profiles.profile_id = auth.uid()`. That violates the V2 rule that selecting `GC` or `SC` is only a profile experience and must not independently grant company, project, job, application, or resume control.
2. The migration history has conflicting assumptions for `company_profiles.id`: most migrations treat it as `bigint`, while `020_gc_subcontractor_assignments.sql` declares `gc_company_id uuid references public.company_profiles(id)`. The corrected `032` avoids returning a fixed company ID type by comparing IDs as text at policy boundaries.
3. The original application trigger blocked a hard-coded list of worker-controlled columns. That would permit future or unlisted application columns to be changed accidentally. The corrected trigger uses JSONB row comparison and allows only the exact approved fields.
4. Security-definer helper functions lacked explicit function privilege hardening. The corrected draft revokes default public execution and grants only the policy-required helper functions to authenticated users.
5. The repository does not contain `organizations` or `organization_memberships` tables. `032` therefore cannot safely implement hiring-organization authorization yet. It now fails closed through `current_user_authorized_company_profile_id_text()`.
6. `applications.status = 'withdrawn'` is used by frontend code and `032`, but no repository migration defines an application status enum or check constraint. A disposable database must verify any existing production constraint before applying `032`.
7. Existing resume records may contain full public URLs in `worker_profiles.resume_url` and `applications.resume_url`. Private storage policies require object paths, so legacy data must be converted before private resume access is considered complete.

## Required Corrections Made to Migration 032

- Replaced direct company-profile ownership helper with `current_user_authorized_company_profile_id_text()`, which deliberately returns `null` until active V2 organization membership exists.
- Changed worker/company helper comparisons to text to avoid the repository's existing `bigint`/`uuid` migration conflict.
- Changed `guard_application_update()` to allow workers to change only `status`, and only to `withdrawn`.
- Changed hiring-organization application updates to allow only `status` and `company_notes`, with no ownership, job, worker, resume, snapshot, or pipeline-field changes.
- Removed company-profile self-ownership from resume select policy.
- Added explicit `revoke all`/`grant execute` statements for security-definer helpers.

## Admin Bootstrap Analysis

After metadata roles are removed from authorization, Admin authority is based only on `public.profiles.role = 'admin'`.

- Existing users with `profiles.role = 'admin'` remain usable.
- Users who only have `auth.users.raw_user_meta_data.role = 'admin'` lose Admin authority.
- No authenticated user can insert or update themselves into Admin through normal client RLS.
- If no profile row already has `role = 'admin'`, a service-role or database-owner bootstrap workflow is required before deployment. That workflow must be outside public client code and must be logged.

## Organization-Membership Authorization Analysis

Current V1 policies repeatedly equate company authority with `company_profiles.profile_id = auth.uid()`. This appears in job posts, applications, project claims, project images, subcontractor assignments, and candidate pipeline policies.

That model is not V2-compliant. The V2 rule requires active authorized organization membership before a user can control a company or hiring workflow.

`032` now fails closed for application updates and applicant resume access by hiring organizations until the V2 organization membership schema and helper are added. The follow-on migration must define:

- organization table and company/profile relationship;
- active membership table;
- Admin-controlled membership grants and revocations;
- accepted member roles and scopes;
- replacement RLS helpers for company, project, job, application, and resume authority.

## Legacy Resume Data-Migration Plan

Do not make the `resumes` bucket private until legacy values are inventoried.

1. Identify public URLs:

```sql
select 'worker_profiles' as source, id, resume_url
from public.worker_profiles
where resume_url ~* '^https?://'
union all
select 'applications' as source, id, resume_url
from public.applications
where resume_url ~* '^https?://';
```

2. Convert only URLs that match the Supabase public object shape:

```text
/storage/v1/object/public/resumes/<object-path>
```

3. Store only `<object-path>`, preserving the first path segment as the resume owner's `auth.uid()`.
4. Quarantine rows that do not match the expected bucket/path pattern for manual review.
5. After conversion, verify each `applications.resume_url` equals a real `storage.objects.name` row in the `resumes` bucket.

## Disposable Supabase Test Procedure

Run only against a local or disposable Supabase project.

1. Create a fresh disposable database from the existing migration sequence.
2. Before applying `032`, capture schema facts:

```sql
select table_schema, table_name
from information_schema.tables
where table_schema in ('public', 'storage')
order by table_schema, table_name;

select table_name, column_name, data_type, udt_name, is_nullable
from information_schema.columns
where table_schema = 'public'
  and table_name in ('profiles', 'worker_profiles', 'company_profiles', 'job_posts', 'applications', 'project_claims')
order by table_name, ordinal_position;

select conrelid::regclass as table_name, conname, pg_get_constraintdef(oid) as definition
from pg_constraint
where conrelid::regclass::text in ('public.applications', 'public.job_posts', 'public.company_profiles', 'public.worker_profiles');
```

3. Apply `032` once in the disposable database.
4. Re-run the schema-fact queries and verify every function, trigger, and policy exists.
5. Attempt to apply `032` a second time. Expected result: no unsafe duplicate triggers or policies. If the bucket is missing, the bucket update is a no-op.
6. Seed disposable test personas: anonymous, worker A, worker B, GC profile, SC profile, other GC profile, Admin profile.
7. Execute the RLS matrix in `docs/architecture/RLS_TEST_MATRIX.md`.

## Expected Permitted and Forbidden Results

| Actor | Action | Expected |
| --- | --- | --- |
| Anonymous | Read any `resumes` object | Forbidden |
| Worker A | Upload/select `resumes/<worker-a-uid>/file.pdf` | Permitted |
| Worker B | Read Worker A resume object | Forbidden |
| Worker A | Insert own application | Permitted |
| Worker A | Update own application to `withdrawn` | Permitted |
| Worker A | Change application status to `hired` | Forbidden |
| Worker A | Change application `company_notes`, `job_post_id`, `worker_profile_id`, `resume_url`, or snapshots | Forbidden |
| GC/SC profile without active org membership | Update application or read applicant resume | Forbidden |
| GC/SC profile with only talent-discovery access | Read applicant resume | Forbidden |
| Admin profile | Read resumes and update protected roles/application fields | Permitted |
| Authenticated non-admin | Set own role to `admin` | Forbidden |
| New authenticated user | Select `worker`, `gc`, or `sc` during first onboarding | Permitted |
| Existing user | Change `worker`/`gc`/`sc` role later | Forbidden |

## Production Backup, Deployment, and Verification Checklist

Do not deploy until approved.

1. Confirm an existing database-backed Admin profile exists.
2. Export a full production backup, including auth, public schema, storage metadata, and storage objects.
3. Inventory and convert legacy public resume URLs to private object paths in a reviewed forward-only migration.
4. Add or approve the V2 organization-membership schema before enabling hiring-organization application and resume access.
5. Apply migrations in a maintenance window.
6. Verify `resumes` bucket is private and `company-logos` plus `jobsite-images` remain public.
7. Verify anonymous and unrelated authenticated users cannot read resumes.
8. Verify Admin can still access protected workflows.
9. Verify public map, public job pages, logos, and jobsite images still render.

## Forward-Only Rollback Migration Outline

If `032` causes unacceptable production behavior, do not edit or delete applied migrations. Create a new numbered migration that:

- restores `resumes` bucket public setting only if business approval accepts the privacy regression;
- drops `applications_guard_update` and `profiles_guard_role_assignment` triggers if required;
- recreates the previous application/profile/storage policies from the migration ledger;
- preserves an audit note that the rollback temporarily reopens known V1 authorization gaps;
- re-runs `notify pgrst, 'reload schema'`.

## Unresolved Risks and Approval Decisions

- Decide whether to add the V2 organization-membership schema before deploying any part of `032`.
- Decide the canonical type of `company_profiles.id` and reconcile the `020` UUID conflict.
- Decide the allowed application status values and add/repair a database check constraint if needed.
- Approve a legacy resume URL conversion migration before making resume access private in production.
- Approve an Admin bootstrap procedure if no database-backed Admin profile exists.
