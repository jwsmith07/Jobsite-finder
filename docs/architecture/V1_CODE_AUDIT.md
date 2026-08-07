# Jobsite Finder V1 Code Audit

Status: Mission 1 read-only baseline converted into repository documentation.

## Git And Environment

- Current branch observed during baseline: `main...origin/main`.
- Working tree was clean before Mission 1 edits.
- `.env` is ignored and was not tracked by `git ls-files .env`.
- `.gitignore` protects `.env`, `.env.*`, `node_modules/`, `dist/`, logs, Vite cache, and local browser audit scratch directories.

## Existing Structure

```text
src/app
src/components/auth
src/components/common
src/components/company
src/components/jobs
src/components/layout
src/components/map
src/components/profile
src/components/projects
src/components/ui
src/config
src/hooks
src/lib
src/pages
src/services
src/styles
supabase
public
scripts
```

## Important Entry Points

```text
src/main.jsx
src/app/App.jsx
src/app/router.jsx
src/hooks/useAuth.js
src/lib/supabase.js
src/lib/env.js
```

## Authorization Findings

- React route guards are implemented in `src/components/auth/ProtectedRoute.jsx`.
- Role redirects are implemented in `src/components/auth/RoleRedirect.jsx`.
- Role normalization/default routing is in `src/lib/utils.js`.
- `useAuth` previously fell back to auth metadata roles. V2 security requires `profiles.role` to be the authorization source.
- Client-side service checks exist before admin, GC, SC, application, and job operations. These improve UX but do not replace RLS.

## P0 Security Findings

### Role Escalation

Users could choose roles from the frontend, and previous policies allowed broad own-profile updates. A database hardening migration is required so normal users cannot self-assign `admin` or later change roles outside controlled onboarding/admin workflows.

### Resume Privacy

Current V1 resume flow used the `resumes` Supabase Storage bucket as public and stored public URLs in `worker_profiles.resume_url` and `applications.resume_url`. This exposes private worker documents beyond the intended audience.

V2 repair direction:

- Make `resumes` private.
- Store object paths.
- Generate signed URLs only for authorized users.
- Do not expose resume access through talent discovery.

## Supabase Migration Risks

- Duplicate migration number: two `028_*.sql` files.
- Multiple policies are intentionally replaced across migrations.
- Repeated functions include `set_updated_at`, `is_admin_profile`, `guard_project_contractor_location_update`, `is_major_project`, and `run_canada_project_import`.
- Previously applied migrations must not be renumbered, deleted, or modified.

## First Security Repair Scope

Files:

```text
src/hooks/useAuth.js
src/pages/onboarding/SelectRolePage.jsx
src/services/applicationsService.js
src/services/profilesService.js
src/components/profile/ResumeUpload.jsx
src/pages/worker/WorkerProfilePage.jsx
src/pages/worker/ApplicationsPage.jsx
src/pages/gc/GCApplicantsPage.jsx
src/pages/gc/GCProjectWorkspacePage.jsx
supabase/032_role_hardening_resume_privacy.sql
```

Database objects:

```text
public.profiles
public.worker_profiles
public.applications
public.job_posts
public.company_profiles
storage.buckets
storage.objects
```
