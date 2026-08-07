# Mission 2 Organization Membership and Company Authorization Foundation

Status: Draft. Do not apply `033_organization_membership_authorization_foundation.sql` or `032_role_hardening_resume_privacy.sql` to production yet.

Checkpoint before Mission 2: `5b552f3 Checkpoint Mission 1 security baseline`. Working tree was clean before Mission 2 edits.

## Current Company-Authorization Gap Analysis

V1 repeatedly treats `company_profiles.profile_id = auth.uid()` as company authority. That means the user who created or owns a company profile can manage company-scoped resources directly, without a separate membership layer.

This violates the V2 architecture rule:

```text
Authenticated user + platform role + organization membership + resource relationship + record state -> allow or deny
```

Affected areas include:

| Area | Current authority pattern | Risk |
| --- | --- | --- |
| Company profile updates | `company_profiles.profile_id = auth.uid()` | One personal account acts as the company; no team roles or membership status. |
| Job posts | `job_posts.company_profile_id in (select id from company_profiles where profile_id = auth.uid())` | GC/SC profile ownership can grant hiring power without organization membership. |
| Applications | Job company profile tied to current profile owner | Cross-company protection depends on a personal company owner, not team membership. |
| Project claims | Claim company profile tied to current profile owner | Claim authority is not role-scoped. |
| Project images | Project claim plus current company profile owner | No team role separation. |
| Candidate pipeline | GC company ID tied to current company profile owner | Talent discovery authority is overbroad and not consent-complete. |
| GC/SC subcontractor assignments | Uses UUID company IDs in migration `020`, conflicting with dominant bigint schema | Migration may not apply or may be incompatible with existing tables. |
| Resume access | Mission 1B now fails closed for hiring orgs | Needs active membership before legitimate applicant resume access can be restored. |

## Identifier Conflict Resolution

Recommendation: use `bigint` as the canonical compatibility identifier for existing V1 `company_profiles.id` and introduce V2 `organizations.id` as a new `bigserial` primary key.

Evidence:

- `014_project_images.sql` uses `company_id bigint references public.company_profiles(id)`.
- `026_candidate_pipeline_worker_privacy.sql` uses `gc_company_id bigint references public.company_profiles(id)`.
- `023_saved_jobs_worker_bookmarks.sql` and many services use numeric IDs and `Number(...)` casts around project/company-related records.
- `claimsService.js` casts `company_profile_id` with `Number(values.company_profile_id)`.
- `projectImagesService.js` casts `company_id` with `Number(companyId)`.
- `020_gc_subcontractor_assignments.sql` is the outlier: it declares `gc_company_id uuid`, `subcontractor_company_id uuid`, and `current_user_company_id() returns uuid`.

Do not modify historical migration `020`. The safe forward strategy is:

1. Add a preflight guard in `033` that refuses to apply if `public.company_profiles.id` is not `int8`.
2. Keep `company_profiles.id` as the legacy company-profile compatibility key.
3. Create `organizations.id bigint` as the V2 organization key.
4. Link each organization to one existing `company_profiles.id`.
5. Repair or replace `020` in a later forward-only migration after disposable testing proves whether it was ever applied successfully.

## Proposed Tables

### `public.organizations`

| Column | Type | Rule |
| --- | --- | --- |
| `id` | `bigserial primary key` | Canonical V2 organization identifier. |
| `company_profile_id` | `bigint unique not null references company_profiles(id)` | Compatibility bridge to V1 company records. |
| `name` | `text not null` | Backfilled from `company_profiles.company_name`. |
| `organization_type` | `text not null` | `general_contractor`, `subcontractor`, `unknown`. |
| `verification_status` | `text not null` | `unverified`, `pending`, `verified`, `rejected`, `suspended`. |
| `status` | `text not null` | `active`, `suspended`, `archived`. |
| `created_by` | `uuid references profiles(id)` | Original creator when known. |
| timestamps | `timestamptz` | `created_at`, `updated_at`. |

### `public.organization_memberships`

| Column | Type | Rule |
| --- | --- | --- |
| `id` | `bigserial primary key` | Membership record. |
| `organization_id` | `bigint references organizations(id)` | Organization scope. |
| `profile_id` | `uuid references profiles(id)` | User identity. |
| `role` | `text` | `owner`, `admin`, `hiring_manager`, `member`. |
| `status` | `text` | `invited`, `active`, `suspended`, `removed`. |
| lifecycle fields | `uuid/timestamptz` | `invited_by`, `invited_at`, `accepted_at`, `suspended_at`, `removed_at`. |

### `public.membership_invitations`

| Column | Type | Rule |
| --- | --- | --- |
| `id` | `uuid primary key` | Invitation identifier. |
| `organization_id` | `bigint references organizations(id)` | Organization scope. |
| `email` | `text not null` | Invitee address. |
| `role` | `text not null` | `admin`, `hiring_manager`, `member`; owner transfer is separate. |
| `status` | `text not null` | `invited`, `accepted`, `revoked`, `expired`. |
| `token_hash` | `text unique not null` | Store only hashed token. |
| audit fields | `uuid/timestamptz` | inviter, acceptor, expiry and timestamps. |

## Membership Role-And-Permission Matrix

| Permission | Owner | Admin | Hiring Manager | Member | Platform Admin |
| --- | --- | --- | --- | --- | --- |
| View organization | Yes | Yes | Yes | Yes | Yes |
| Edit company profile | Yes | Yes | No | No | Support/admin workflow |
| Change verification/visibility | No | No | No | No | Yes |
| Invite member | Yes | Yes | No | No | Yes |
| Invite Admin | Yes | Controlled | No | No | Yes |
| Create/transfer Owner | Protected owner-transfer workflow | No | No | No | Platform emergency workflow |
| Manage jobs | Yes | Yes | Yes | Explicit later grant only | No routine creation |
| Manage applications | Yes | Yes | Yes | Explicit later grant only | Documented duty |
| Access applicant resume | Yes, if job relationship exists | Yes, if job relationship exists | Yes, if job relationship exists | No by default | Documented duty |
| Billing | Yes | Configurable later | No | No | Support/admin workflow |

## RLS Policy Design

`033` adds membership helpers:

- `current_user_has_organization_role(organization_id, roles[])`
- `current_user_can_view_organization(organization_id)`
- `current_user_can_manage_organization_members(organization_id)`
- `current_user_can_manage_company_profile(company_profile_id, roles[])`
- `current_user_can_manage_hiring_company_profile(company_profile_id)`

Policies added or replaced:

- `organizations`: members/admins can read; Owner/Admin can update.
- `organization_memberships`: users can read their own rows; active org members can read org membership roster; Owner/Admin can manage controlled changes; invited users can accept only their own invitation.
- `membership_invitations`: Owner/Admin can create/read/update invitations.
- `organization_backfill_quarantine`: records ambiguous legacy company ownership that must be reviewed before authority is granted.
- `company_profiles`: old self-owner update policy is replaced by Owner/Admin membership authorization; trigger blocks non-platform-admin edits to ownership, verification and visibility fields.
- `job_posts`: insert/update/delete require hiring membership authority and preserve existing major-project plus approved-claim requirements.

## Secure Workflows

### Invitation

1. Owner/Admin requests invitation through a protected server/database workflow.
2. Server verifies active membership and permitted target role.
3. Server creates `membership_invitations` with a hashed token and expiry.
4. Email sends the raw token once.
5. Invitation can be revoked or expired without deleting evidence.

### Acceptance

1. Invited user authenticates.
2. Protected workflow verifies token hash, email, expiry and status.
3. It creates or activates `organization_memberships`.
4. User may only accept their own invitation; role cannot be changed during acceptance.

### Suspension And Removal

1. Owner/Admin sets membership status to `suspended` or `removed`.
2. Suspended/removed memberships grant no authority.
3. Deletion is blocked; status changes preserve auditability.

### Owner Bootstrap And Transfer

Unambiguous V1 company-profile owners are backfilled as active organization Owners. A company profile is quarantined and excluded from automatic Owner backfill when it has no owner profile id, points to a missing profile row, shares the same profile owner with other company profiles, is hidden, or has a blank company name. New company creation must use a protected workflow that creates the company profile, organization and first Owner atomically.

Owner transfer must be a protected workflow:

1. Current Owner selects an active member.
2. Workflow promotes target to Owner.
3. Workflow optionally demotes old Owner only after at least one active Owner remains.
4. Platform Admin emergency transfer requires a reason and audit event.

## Migration 032 Integration Changes

Mission 1B `032` used a singular fail-closed company helper. Mission 2 changed it to:

```sql
public.current_user_can_manage_hiring_company_profile(p_company_profile_id text)
```

`032` remains safe by default because this helper returns `false`. `033` overrides it with the active membership check, allowing application updates and resume access only for Owner/Admin/Hiring Manager members of the job-owning organization.

## Later Frontend And Service Changes

Do not reorganize modules yet. Later changes should be narrow:

- Replace service helpers named `getCompanyIdForUser(userId)` with organization-context selectors.
- Add an organization switcher for users with multiple active memberships.
- Route company dashboard/actions through selected organization context.
- Update jobs/applications/claims services to pass selected organization/company profile ID instead of deriving authority from `profile_id`.
- Add Team page workflows for invitations, acceptance, suspension and removal.
- Preserve V1 visual appearance during each incremental change.

## Disposable Supabase Test Procedure

Run only against local/disposable Supabase.

1. Apply migrations through `031`.
2. Attempt `020` in isolation if needed and record whether the UUID foreign keys fail against `company_profiles.id`.
3. Apply corrected `032`.
4. Apply draft `033`.
5. Verify `company_profiles.id` type:

```sql
select udt_name
from information_schema.columns
where table_schema = 'public'
  and table_name = 'company_profiles'
  and column_name = 'id';
```

6. Seed users: worker A, worker B, GC owner, GC hiring manager, GC member, unrelated GC owner, SC owner, platform Admin.
7. Seed two company profiles, two organizations, memberships, project claims, jobs, applications and resume objects.
8. Run permitted/forbidden checks:

| Actor | Action | Expected |
| --- | --- | --- |
| GC profile with no membership | update company/job/application | denied |
| Active Owner | update company profile safe fields | allowed |
| Active Owner | change `verified`, `is_hidden`, `profile_id` | denied |
| Active Admin | invite Hiring Manager/Member | allowed |
| Hiring Manager | update job application status/notes for own org job | allowed |
| Hiring Manager | update company ownership/verification | denied |
| Member | manage application/resume | denied |
| Suspended Owner/Admin | manage anything | denied |
| Removed member | read private org/applicant data | denied |
| Other org Owner | read applications/resumes for unrelated org | denied |
| Worker | withdraw own application only | allowed |
| Worker | alter hiring status/company notes | denied |
| Platform Admin | emergency organization support action | allowed, must be audited later |

## Production Data-Migration And Deployment Plan

1. Do not deploy until disposable test proves `032 + 033` together.
2. Back up production database, auth users, storage metadata and storage objects.
3. Confirm at least one database-backed platform Admin exists.
4. Run read-only production preflight for `company_profiles.id` type and `020` table existence/type.
5. Inventory existing company profiles with `profile_id is null`; decide owner bootstrap manually.
6. Inventory duplicate or suspicious company profiles for the same user/company name.
7. Convert legacy resume public URLs to object paths before private resume rollout.
8. Apply in staging first: corrected `032`, then `033`.
9. Run cross-company RLS tests and public regression smoke tests.
10. Apply to production only after explicit approval.

## Forward-Only Rollback Outline

Create a new migration; do not edit applied `032` or `033`.

- Disable membership-based job/company policies and recreate previous policies only if accepting temporary V1 risk.
- Restore `current_user_can_manage_hiring_company_profile(text)` to fail closed if application/resume access must be locked.
- Mark affected organizations or memberships as suspended rather than deleting them.
- Leave `organizations`, `organization_memberships` and `membership_invitations` tables in place for forensic traceability.
- Reload PostgREST schema.

## Risks And Decisions Requiring Approval

- Approve `bigint` as the canonical compatibility type for `company_profiles.id`.
- Decide whether to repair `020_gc_subcontractor_assignments.sql` behavior in a later forward-only migration before production.
- Approve backfilling existing `company_profiles.profile_id` users as active organization Owners.
- Approve the quarantine criteria for ambiguous legacy company ownership.
- Decide how to handle company profiles with no owner profile.
- Decide whether Admin role should remain `profiles.role = 'admin'` temporarily or move to a platform role table.
- Approve the exact organization roles for beta: Owner, Admin, Hiring Manager, Member.
- Approve whether Hiring Manager may create jobs immediately or only manage applicants.
- Approve audit-event table/workflow scope before enabling production membership management.
