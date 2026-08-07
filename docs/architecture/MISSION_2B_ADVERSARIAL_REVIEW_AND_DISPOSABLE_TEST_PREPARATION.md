# Mission 2B Adversarial Review and Disposable-Test Preparation

Status: Draft review complete. Do not apply `032` or `033` to any Supabase environment until explicitly approved.

## Dependency Analysis: `032` Then `033`

Filename execution order is:

1. `032_role_hardening_resume_privacy.sql`
2. `033_organization_membership_authorization_foundation.sql`

`032` must execute before organization tables exist. It therefore creates these security objects without depending on Mission 2 tables:

| Object in `032` | Dependency | Behavior before `033` |
| --- | --- | --- |
| `is_current_user_admin()` | `profiles.id`, `profiles.role` | Platform Admin remains DB-profile based. |
| `guard_profile_role_assignment()` | `profiles.role` | Blocks self-admin and later role changes. |
| `current_user_worker_profile_id_text()` | `worker_profiles.id`, `worker_profiles.profile_id` | Worker self-application updates keep working. |
| `current_user_can_manage_hiring_company_profile(text)` | none beyond function shell | Returns `false`, so company hiring access fails closed. |
| `application_job_owner_company_id_text(bigint)` | `job_posts.id`, `job_posts.company_profile_id` | Finds job owner as text without assuming company ID return type. |
| `guard_application_update()` | `applications`, helpers above | Worker withdrawal only; hiring org access denied until `033`. |
| private resume storage policies | `storage.objects`, `applications`, `job_posts`, `worker_profiles` | Owner/Admin access only; hiring org access denied until `033`. |

`033` replaces only one `032` helper:

```sql
public.current_user_can_manage_hiring_company_profile(p_company_profile_id text)
```

After `033`, this helper allows Owner/Admin/Hiring Manager members of the active organization linked to the job-owning `company_profiles.id`. This makes `032` work for multi-organization users because the authorization check is boolean per company, not a single current company ID.

## Proven SQL Defects and Corrections

| Defect | Correction |
| --- | --- |
| `033` initially trusted every `company_profiles.profile_id` for Owner backfill. | Added `organization_backfill_quarantine` and excluded ambiguous records from automatic Owner membership. |
| `033` second execution could be blocked by its own triggers during upsert/backfill. | Drops draft triggers before controlled upsert/backfill and recreates them afterward. |
| `032` originally used a singular company helper, weak for multi-organization users. | Replaced with `current_user_can_manage_hiring_company_profile(text)`. |
| Organization updates lacked trigger-level protection for status/verification/company link fields. | Added `guard_organization_member_update()`. |
| Company profile updates could alter ownership/verification fields through member policy. | Added `guard_company_profile_member_update()`. |
| Membership changes did not prevent final active Owner removal. | Added final Owner check in `guard_organization_membership_write()`. |
| Invitations lacked self-invite and identity-field guards. | Added `guard_membership_invitation_write()`. |

## Type Compatibility and UUID Mismatch

`033` uses:

- `organizations.id bigserial`
- `organizations.company_profile_id bigint references company_profiles(id)`
- `organization_memberships.organization_id bigint`
- `membership_invitations.organization_id bigint`
- helper arguments that accept legacy company IDs as `text` where they must interoperate with `032`

`033` begins with a clear preflight failure if `public.company_profiles.id` is not `int8`.

Migration `020_gc_subcontractor_assignments.sql` remains the UUID outlier:

```sql
gc_company_id uuid references public.company_profiles(id)
subcontractor_company_id uuid references public.company_profiles(id)
current_user_company_id() returns uuid
```

`032` does not reference `gc_subcontractor_assignments`, `current_user_company_id()`, or UUID company IDs. `033` does not alter migration `020`, does not add UUID casts, and does not change existing `company_profiles.id`. Therefore `032/033` do not worsen the mismatch. A later forward-only repair must reconcile `020` after disposable testing proves whether it ever applied to the live schema.

## Legacy-Owner Backfill Preflight Report

Run read-only before applying `033`:

```sql
select udt_name as company_profiles_id_type
from information_schema.columns
where table_schema = 'public'
  and table_name = 'company_profiles'
  and column_name = 'id';

select company_profiles.*
from public.company_profiles
where profile_id is null;

select company_profiles.*
from public.company_profiles
left join public.profiles on profiles.id = company_profiles.profile_id
where company_profiles.profile_id is not null
  and profiles.id is null;

select profile_id, count(*) as company_profile_count, array_agg(id order by id) as company_profile_ids
from public.company_profiles
where profile_id is not null
group by profile_id
having count(*) > 1;

select id, profile_id, company_name, company_type, verified, is_hidden
from public.company_profiles
where coalesce(is_hidden, false)
   or nullif(btrim(coalesce(company_name, '')), '') is null;
```

Predicted automatic Owner backfill set:

```sql
with ambiguous_company_profiles as (
  select id from public.company_profiles where profile_id is null
  union
  select cp.id
  from public.company_profiles cp
  left join public.profiles p on p.id = cp.profile_id
  where cp.profile_id is not null and p.id is null
  union
  select cp.id
  from public.company_profiles cp
  join (
    select profile_id
    from public.company_profiles
    where profile_id is not null
    group by profile_id
    having count(*) > 1
  ) dup on dup.profile_id = cp.profile_id
  union
  select id from public.company_profiles where coalesce(is_hidden, false)
  union
  select id from public.company_profiles where nullif(btrim(coalesce(company_name, '')), '') is null
)
select cp.id, cp.profile_id, cp.company_name, cp.company_type
from public.company_profiles cp
where cp.profile_id is not null
  and not exists (
    select 1 from ambiguous_company_profiles a where a.id = cp.id
  )
order by cp.id;
```

## Ambiguous-Record Quarantine Plan

`033` creates `organization_backfill_quarantine` and records unresolved ambiguity reasons:

- `missing_profile_id`
- `missing_profile_row`
- `multiple_company_profiles_for_profile`
- `hidden_company`
- `blank_company_name`

Quarantined company profiles do not receive an organization row or Owner membership automatically. Manual review must resolve the record, set `resolved_at`/`resolved_by`, and use a later protected workflow or forward-only migration to create the organization and Owner.

## Executable Disposable RLS Test Cases

Run with synthetic users in a disposable Supabase database. Use local JWT/session tooling or SQL test helpers to set `auth.uid()` for each actor.

| Case | SQL/action | Expected |
| --- | --- | --- |
| 032 before 033 company fail closed | GC profile owner updates application status | denied |
| 032 worker withdrawal | Worker updates own application `status = 'withdrawn'` only | allowed |
| 032 worker field tamper | Worker changes `company_notes` or `job_post_id` | denied |
| 033 active Owner hiring | Owner updates application status/notes for own organization job | allowed |
| 033 active Admin hiring | Admin member updates application status/notes for own organization job | allowed |
| 033 active Hiring Manager hiring | Hiring Manager updates application status/notes for own organization job | allowed |
| 033 active Member hiring | Member updates application status/notes | denied |
| invited membership | Invited user manages job/application/resume | denied |
| suspended membership | Suspended user manages job/application/resume | denied |
| removed membership | Removed user manages job/application/resume | denied |
| cross organization | Org A Owner reads/updates Org B application/resume | denied |
| self invite | Owner/Admin inserts invitation to their own profile email | denied |
| wrong-user acceptance | User updates another user's invited membership to active | denied |
| role elevation on accept | Invited user changes role while accepting | denied |
| Admin creates Owner | Organization Admin inserts Owner membership | denied |
| Hiring Manager membership management | Hiring Manager inserts/updates membership | denied |
| final Owner removal | Last active Owner is demoted/removed | denied |
| company authority fields | Owner/Admin member changes `profile_id`, `verified`, `is_hidden` | denied |
| platform Admin | `profiles.role = 'admin'` performs emergency support action | allowed |

## Expected Results By Role and Status

| Membership | Status | Company profile safe edit | Jobs | Applications | Résumés | Memberships |
| --- | --- | --- | --- | --- | --- | --- |
| Owner | active | allowed | allowed | allowed | allowed through job relationship | allowed, except unsafe Owner transfer |
| Admin | active | allowed | allowed | allowed | allowed through job relationship | allowed, cannot create Owner |
| Hiring Manager | active | denied | allowed | allowed | allowed through job relationship | denied |
| Member | active | denied | denied by current draft | denied | denied | denied |
| any role | invited | denied | denied | denied | denied | own accept only |
| any role | suspended | denied | denied | denied | denied | denied |
| any role | removed | denied | denied | denied | denied | denied |
| Platform Admin | n/a | support/admin allowed | support/admin allowed | support/admin allowed | support/admin allowed | emergency allowed |

## Disposable Setup Procedure

1. Create a disposable Supabase project or local Supabase database with synthetic data only.
2. Apply the full historical migration sequence through `031` in filename order, preserving the duplicate `028` ledger order.
3. Record whether `020_gc_subcontractor_assignments.sql` succeeds or fails against the actual `company_profiles.id` type.
4. Apply `032`.
5. Run fail-closed checks for company hiring access.
6. Apply `033`.
7. Run the preflight report queries and compare with `organization_backfill_quarantine`.
8. Seed roles/statuses listed above.
9. Run the RLS matrix from this document and `RLS_TEST_MATRIX.md`.
10. Attempt a second execution of `032` then `033` on the disposable database. Expected: repeatable completion, or a clear transaction failure with no partial security state.
11. Verify public map, company logos, and jobsite images remain unaffected.

## Deployment Plan

1. Keep Mission 2 changes in a separate Git checkpoint after review approval.
2. Run preflight only against a disposable copy first.
3. Prove historical migrations through `032` and `033` in disposable.
4. Review quarantine output and decide manual ownership assignments.
5. Convert legacy resume public URLs to object paths.
6. Stage deployment with database backup and RLS matrix.
7. Production deployment only after explicit approval.

## Forward-Only Rollback Plan

If deployed and issues are found, create the next migration:

- Replace `current_user_can_manage_hiring_company_profile(text)` with the fail-closed `select false` implementation.
- Drop or tighten job/application/company update policies that depend on membership.
- Suspend affected organizations/memberships instead of deleting evidence.
- Preserve quarantine and membership tables for audit.
- Recreate prior policies only if accepting temporary V1 risk.
- Reload PostgREST schema.

## Remaining Decisions Requiring Approval

- Approve quarantine-first legacy Owner backfill.
- Approve whether hidden companies should be excluded from automatic organization creation.
- Approve Owner/Admin/Hiring Manager/Member as beta roles.
- Approve platform Admin remaining temporarily as `profiles.role = 'admin'`.
- Approve a later forward-only repair for `020` UUID company IDs.
- Approve whether active Members should receive any read-only company/project access in the next frontend mission.
