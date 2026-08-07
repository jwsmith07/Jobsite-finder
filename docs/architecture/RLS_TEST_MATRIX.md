# Automated RLS Test Matrix

Status: Mission 1 draft. These tests should be run against a disposable Supabase project or local Supabase environment, not production.

## Personas

```text
anonymous
worker_a
worker_b
gc_owner
gc_other
sc_owner
gc_hiring_manager
gc_member
admin_user
```

## Role Tests

| Actor | Action | Expected |
| --- | --- | --- |
| anonymous | insert profile with role `admin` | denied |
| worker_a | update own `profiles.role` to `admin` | denied |
| worker_a | update own `profiles.role` to `gc` after role exists | denied |
| new authenticated user | insert own profile with role `worker` | allowed |
| new authenticated user | insert own profile with role `gc` | allowed |
| new authenticated user | insert own profile with role `sc` | allowed |
| admin_user | update another profile role through approved DB workflow | allowed |

## Resume Storage Tests

| Actor | Action | Expected |
| --- | --- | --- |
| anonymous | select/download `resumes` object | denied |
| worker_a | upload to `worker_a_uid/file.pdf` | allowed |
| worker_b | upload to `worker_a_uid/file.pdf` | denied |
| worker_a | create signed URL for own object | allowed |
| worker_b | create signed URL for worker_a object | denied |
| gc_owner with only `company_profiles.profile_id` ownership | create signed URL for applicant resume tied to owned job | denied |
| gc_owner with active V2 Owner membership | create signed URL for applicant resume tied to owned job | allowed after membership migration |
| gc_hiring_manager with active V2 membership | create signed URL for applicant resume tied to owned job | allowed after membership migration |
| gc_member with active V2 Member membership | create signed URL for applicant resume tied to owned job | denied |
| suspended org member | create signed URL for applicant resume tied to previously owned job | denied |
| gc_other | create signed URL for same resume without owned job | denied |
| sc_owner with only `company_profiles.profile_id` ownership | create signed URL for applicant resume tied to owned job | denied |
| sc_owner with active authorized V2 organization membership | create signed URL for applicant resume tied to owned job | allowed after membership migration |
| admin_user | create signed URL for resume object | allowed |
| approved primary GC talent discovery only | create signed URL without application/job ownership | denied |

## Application Tests

| Actor | Action | Expected |
| --- | --- | --- |
| worker_a | insert own application with own resume path | allowed |
| worker_b | insert application for worker_a profile | denied |
| worker_a | withdraw own application | allowed |
| worker_a | update own status to `hired` | denied |
| worker_a | update `company_notes` | denied |
| worker_a | change `job_post_id` or `worker_profile_id` | denied |
| gc_owner with only `company_profiles.profile_id` ownership | update status/company_notes for owned job application | denied |
| gc_owner with active V2 Owner membership | update status/company_notes for owned job application | allowed after membership migration |
| gc_hiring_manager with active V2 membership | update status/company_notes for owned job application | allowed after membership migration |
| gc_member with active V2 Member membership | update status/company_notes for owned job application | denied |
| suspended org member | update status/company_notes for previously owned job application | denied |
| gc_other | update status/company_notes for unowned job application | denied |
| gc_owner | change application ownership fields | denied |

## Organization Membership Tests

| Actor | Action | Expected |
| --- | --- | --- |
| GC profile with no membership | update company profile | denied |
| active Owner | update safe company profile fields | allowed |
| active Owner | update `verified`, `is_hidden`, `profile_id` | denied |
| active Admin | invite Hiring Manager or Member | allowed |
| active Hiring Manager | invite Admin or Member | denied |
| active Member | manage memberships | denied |
| invited user | accept own invitation without changing role/org/profile | allowed |
| invited user | accept invitation while changing role | denied |
| Owner | self-remove or self-demote | denied without protected ownership transfer |
| Platform Admin | perform emergency membership update | allowed |

## Regression Tests

| Area | Expected |
| --- | --- |
| company logos | public display still works |
| jobsite images | public display still works |
| public map | still renders public jobsites |
| worker profile | resume upload stores object path |
| applicants page | resume button opens short-lived signed URL |
