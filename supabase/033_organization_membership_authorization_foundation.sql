-- Jobsite Finder V2 Mission 2: organization membership and company authorization foundation.
-- Draft only until explicitly approved and applied.
--
-- Purpose:
-- - Preserve existing V1 company_profiles records.
-- - Introduce V2 organizations and active memberships as the authority source.
-- - Keep GC/SC profile roles as UI experience labels only.
-- - Override the Mission 1B fail-closed hiring-company helper with membership checks.

begin;

create extension if not exists pgcrypto;

do $$
declare
  v_company_id_type text;
begin
  select columns.udt_name
    into v_company_id_type
  from information_schema.columns
  where columns.table_schema = 'public'
    and columns.table_name = 'company_profiles'
    and columns.column_name = 'id';

  if v_company_id_type is distinct from 'int8' then
    raise exception 'Mission 2 expects public.company_profiles.id to be bigint/int8, but found %. Stop and reconcile migration 020 before applying.', v_company_id_type;
  end if;
end;
$$;

create table if not exists public.organizations (
  id bigserial primary key,
  company_profile_id bigint not null unique references public.company_profiles(id) on delete restrict,
  name text not null,
  organization_type text not null default 'unknown',
  verification_status text not null default 'unverified',
  status text not null default 'active',
  created_by uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint organizations_type_check
    check (organization_type in ('general_contractor', 'subcontractor', 'unknown')),
  constraint organizations_verification_status_check
    check (verification_status in ('unverified', 'pending', 'verified', 'rejected', 'suspended')),
  constraint organizations_status_check
    check (status in ('active', 'suspended', 'archived'))
);

drop trigger if exists organizations_guard_member_update on public.organizations;
drop trigger if exists organizations_set_updated_at on public.organizations;

create table if not exists public.organization_backfill_quarantine (
  id bigserial primary key,
  company_profile_id bigint not null references public.company_profiles(id) on delete cascade,
  profile_id uuid,
  reason text not null,
  details jsonb not null default '{}'::jsonb,
  resolved_at timestamptz,
  resolved_by uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default now(),
  constraint organization_backfill_quarantine_reason_check
    check (reason in (
      'missing_profile_id',
      'missing_profile_row',
      'multiple_company_profiles_for_profile',
      'hidden_company',
      'blank_company_name'
    ))
);

create unique index if not exists organization_backfill_quarantine_open_unique_idx
  on public.organization_backfill_quarantine(company_profile_id, reason)
  where resolved_at is null;

insert into public.organization_backfill_quarantine (company_profile_id, profile_id, reason, details)
select company_profiles.id, company_profiles.profile_id, 'missing_profile_id',
  jsonb_build_object('company_name', company_profiles.company_name)
from public.company_profiles
where company_profiles.profile_id is null
on conflict do nothing;

insert into public.organization_backfill_quarantine (company_profile_id, profile_id, reason, details)
select company_profiles.id, company_profiles.profile_id, 'missing_profile_row',
  jsonb_build_object('company_name', company_profiles.company_name)
from public.company_profiles
left join public.profiles on profiles.id = company_profiles.profile_id
where company_profiles.profile_id is not null
  and profiles.id is null
on conflict do nothing;

insert into public.organization_backfill_quarantine (company_profile_id, profile_id, reason, details)
select company_profiles.id, company_profiles.profile_id, 'multiple_company_profiles_for_profile',
  jsonb_build_object(
    'company_name', company_profiles.company_name,
    'company_profile_count', counts.company_profile_count
  )
from public.company_profiles
join (
  select profile_id, count(*) as company_profile_count
  from public.company_profiles
  where profile_id is not null
  group by profile_id
  having count(*) > 1
) counts on counts.profile_id = company_profiles.profile_id
on conflict do nothing;

insert into public.organization_backfill_quarantine (company_profile_id, profile_id, reason, details)
select company_profiles.id, company_profiles.profile_id, 'hidden_company',
  jsonb_build_object('company_name', company_profiles.company_name)
from public.company_profiles
where coalesce(company_profiles.is_hidden, false)
on conflict do nothing;

insert into public.organization_backfill_quarantine (company_profile_id, profile_id, reason, details)
select company_profiles.id, company_profiles.profile_id, 'blank_company_name',
  jsonb_build_object('company_name', company_profiles.company_name)
from public.company_profiles
where nullif(btrim(coalesce(company_profiles.company_name, '')), '') is null
on conflict do nothing;

insert into public.organizations (
  company_profile_id,
  name,
  organization_type,
  verification_status,
  status,
  created_by
)
select
  company_profiles.id,
  coalesce(nullif(btrim(company_profiles.company_name), ''), 'Company ' || company_profiles.id::text),
  case
    when lower(replace(replace(coalesce(company_profiles.company_type, ''), '-', '_'), ' ', '_')) in ('gc', 'general_contractor') then 'general_contractor'
    when lower(replace(replace(coalesce(company_profiles.company_type, ''), '-', '_'), ' ', '_')) in ('sc', 'subcontractor') then 'subcontractor'
    else 'unknown'
  end,
  case when coalesce(company_profiles.verified, false) then 'verified' else 'unverified' end,
  case when coalesce(company_profiles.is_hidden, false) then 'suspended' else 'active' end,
  company_profiles.profile_id
from public.company_profiles
where not exists (
  select 1
  from public.organization_backfill_quarantine quarantine
  where quarantine.company_profile_id = company_profiles.id
    and quarantine.resolved_at is null
)
on conflict (company_profile_id) do update
set
  name = excluded.name,
  organization_type = excluded.organization_type,
  verification_status = excluded.verification_status,
  updated_at = now();

create table if not exists public.organization_memberships (
  id bigserial primary key,
  organization_id bigint not null references public.organizations(id) on delete cascade,
  profile_id uuid not null references public.profiles(id) on delete cascade,
  role text not null,
  status text not null default 'invited',
  invited_by uuid references public.profiles(id) on delete set null,
  invited_at timestamptz not null default now(),
  accepted_at timestamptz,
  suspended_at timestamptz,
  removed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint organization_memberships_role_check
    check (role in ('owner', 'admin', 'hiring_manager', 'member')),
  constraint organization_memberships_status_check
    check (status in ('invited', 'active', 'suspended', 'removed')),
  constraint organization_memberships_unique_profile_org
    unique (organization_id, profile_id)
);

drop trigger if exists organization_memberships_guard_write on public.organization_memberships;
drop trigger if exists organization_memberships_set_updated_at on public.organization_memberships;

create index if not exists organizations_company_profile_id_idx
  on public.organizations(company_profile_id);

create index if not exists organizations_type_status_idx
  on public.organizations(organization_type, status);

create index if not exists organization_memberships_profile_status_idx
  on public.organization_memberships(profile_id, status);

create index if not exists organization_memberships_org_status_role_idx
  on public.organization_memberships(organization_id, status, role);

create unique index if not exists organization_memberships_one_active_owner_idx
  on public.organization_memberships(organization_id, profile_id)
  where status = 'active' and role = 'owner';

insert into public.organization_memberships (
  organization_id,
  profile_id,
  role,
  status,
  invited_by,
  accepted_at
)
select
  organizations.id,
  company_profiles.profile_id,
  'owner',
  'active',
  company_profiles.profile_id,
  now()
from public.company_profiles
join public.organizations
  on organizations.company_profile_id = company_profiles.id
where company_profiles.profile_id is not null
  and not exists (
    select 1
    from public.organization_backfill_quarantine quarantine
    where quarantine.company_profile_id = company_profiles.id
      and quarantine.resolved_at is null
  )
on conflict (organization_id, profile_id) do update
set
  role = case
    when public.organization_memberships.role = 'owner' then public.organization_memberships.role
    else excluded.role
  end,
  status = case
    when public.organization_memberships.status = 'removed' then public.organization_memberships.status
    else 'active'
  end,
  updated_at = now();

create table if not exists public.membership_invitations (
  id uuid primary key default gen_random_uuid(),
  organization_id bigint not null references public.organizations(id) on delete cascade,
  email text not null,
  role text not null,
  status text not null default 'invited',
  token_hash text not null unique,
  invited_by uuid not null references public.profiles(id) on delete restrict,
  accepted_by uuid references public.profiles(id) on delete set null,
  expires_at timestamptz not null,
  accepted_at timestamptz,
  revoked_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint membership_invitations_role_check
    check (role in ('admin', 'hiring_manager', 'member')),
  constraint membership_invitations_status_check
    check (status in ('invited', 'accepted', 'revoked', 'expired'))
);

drop trigger if exists membership_invitations_set_updated_at on public.membership_invitations;

create index if not exists membership_invitations_org_status_idx
  on public.membership_invitations(organization_id, status);

create index if not exists membership_invitations_email_status_idx
  on public.membership_invitations(lower(email), status);

create or replace function public.set_organization_updated_at()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

revoke all on function public.set_organization_updated_at() from public, anon, authenticated;

drop trigger if exists organizations_set_updated_at on public.organizations;
create trigger organizations_set_updated_at
  before update on public.organizations
  for each row
  execute function public.set_organization_updated_at();

drop trigger if exists organization_memberships_set_updated_at on public.organization_memberships;
create trigger organization_memberships_set_updated_at
  before update on public.organization_memberships
  for each row
  execute function public.set_organization_updated_at();

drop trigger if exists membership_invitations_set_updated_at on public.membership_invitations;
create trigger membership_invitations_set_updated_at
  before update on public.membership_invitations
  for each row
  execute function public.set_organization_updated_at();

create or replace function public.is_current_user_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.profiles
    where profiles.id = auth.uid()
      and lower(coalesce(profiles.role, '')) = 'admin'
  );
$$;

revoke all on function public.is_current_user_admin() from public, anon, authenticated;
grant execute on function public.is_current_user_admin() to authenticated;

create or replace function public.current_user_has_organization_role(
  p_organization_id bigint,
  p_roles text[]
)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select coalesce(public.is_current_user_admin(), false)
    or exists (
      select 1
      from public.organization_memberships
      join public.organizations
        on organizations.id = organization_memberships.organization_id
      where organization_memberships.organization_id = p_organization_id
        and organization_memberships.profile_id = auth.uid()
        and organization_memberships.status = 'active'
        and organization_memberships.role = any(p_roles)
        and organizations.status = 'active'
        and organizations.verification_status <> 'suspended'
    );
$$;

revoke all on function public.current_user_has_organization_role(bigint, text[]) from public, anon, authenticated;
grant execute on function public.current_user_has_organization_role(bigint, text[]) to authenticated;

create or replace function public.current_user_can_view_organization(p_organization_id bigint)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select coalesce(public.is_current_user_admin(), false)
    or exists (
      select 1
      from public.organization_memberships
      join public.organizations
        on organizations.id = organization_memberships.organization_id
      where organization_memberships.organization_id = p_organization_id
        and organization_memberships.profile_id = auth.uid()
        and organization_memberships.status = 'active'
        and organizations.status = 'active'
        and organizations.verification_status <> 'suspended'
    );
$$;

revoke all on function public.current_user_can_view_organization(bigint) from public, anon, authenticated;
grant execute on function public.current_user_can_view_organization(bigint) to authenticated;

create or replace function public.current_user_can_manage_organization_members(p_organization_id bigint)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select public.current_user_has_organization_role(p_organization_id, array['owner', 'admin']);
$$;

revoke all on function public.current_user_can_manage_organization_members(bigint) from public, anon, authenticated;
grant execute on function public.current_user_can_manage_organization_members(bigint) to authenticated;

create or replace function public.current_user_can_manage_company_profile(
  p_company_profile_id text,
  p_roles text[] default array['owner', 'admin']
)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.organizations
    join public.organization_memberships
      on organization_memberships.organization_id = organizations.id
    where organizations.company_profile_id::text = p_company_profile_id
      and organizations.status = 'active'
      and organizations.verification_status <> 'suspended'
      and organization_memberships.profile_id = auth.uid()
      and organization_memberships.status = 'active'
      and organization_memberships.role = any(p_roles)
  )
  or coalesce(public.is_current_user_admin(), false);
$$;

revoke all on function public.current_user_can_manage_company_profile(text, text[]) from public, anon, authenticated;
grant execute on function public.current_user_can_manage_company_profile(text, text[]) to authenticated;

create or replace function public.current_user_can_manage_hiring_company_profile(p_company_profile_id text)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select public.current_user_can_manage_company_profile(
    p_company_profile_id,
    array['owner', 'admin', 'hiring_manager']
  );
$$;

revoke all on function public.current_user_can_manage_hiring_company_profile(text) from public, anon, authenticated;
grant execute on function public.current_user_can_manage_hiring_company_profile(text) to authenticated;

create or replace function public.guard_organization_membership_write()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if public.is_current_user_admin() then
    if tg_op = 'DELETE' then
      return old;
    end if;
    return new;
  end if;

  if tg_op = 'INSERT' then
    if not public.current_user_can_manage_organization_members(new.organization_id) then
      raise exception 'Organization membership changes require Owner or Admin authority.';
    end if;

    if new.role = 'owner' and not public.current_user_has_organization_role(new.organization_id, array['owner']) then
      raise exception 'Only an organization Owner may invite or create another Owner.';
    end if;

    if new.status not in ('invited', 'active') then
      raise exception 'New memberships must begin as invited or active.';
    end if;

    return new;
  end if;

  if tg_op = 'UPDATE' then
    if old.profile_id = auth.uid()
      and old.status = 'invited'
      and new.status = 'active'
      and new.organization_id = old.organization_id
      and new.profile_id = old.profile_id
      and new.role = old.role then
      new.accepted_at := coalesce(new.accepted_at, now());
      return new;
    end if;

    if not public.current_user_can_manage_organization_members(old.organization_id) then
      raise exception 'Organization membership changes require Owner or Admin authority.';
    end if;

    if new.organization_id is distinct from old.organization_id
      or new.profile_id is distinct from old.profile_id then
      raise exception 'Membership identity fields cannot be changed.';
    end if;

    if old.role = 'owner' or new.role = 'owner' then
      if not public.current_user_has_organization_role(old.organization_id, array['owner']) then
        raise exception 'Only an organization Owner may manage Owner memberships.';
      end if;
    end if;

    if old.role = 'owner'
      and old.status = 'active'
      and (new.role is distinct from old.role or new.status is distinct from old.status) then
      if not exists (
        select 1
        from public.organization_memberships owner_check
        where owner_check.organization_id = old.organization_id
          and owner_check.id <> old.id
          and owner_check.role = 'owner'
          and owner_check.status = 'active'
      ) then
        raise exception 'The final active Owner cannot be removed or demoted without a controlled ownership-transfer workflow.';
      end if;
    end if;

    if old.profile_id = auth.uid() and old.role = 'owner'
      and (new.role is distinct from old.role or new.status is distinct from old.status) then
      raise exception 'Owner self-demotion or self-removal requires a protected ownership-transfer workflow.';
    end if;

    if new.status = 'active' and old.status <> 'active' then
      new.accepted_at := coalesce(new.accepted_at, now());
    elsif new.status = 'suspended' and old.status <> 'suspended' then
      new.suspended_at := coalesce(new.suspended_at, now());
    elsif new.status = 'removed' and old.status <> 'removed' then
      new.removed_at := coalesce(new.removed_at, now());
    end if;

    return new;
  end if;

  raise exception 'Delete memberships by setting status to removed.';
end;
$$;

revoke all on function public.guard_organization_membership_write() from public, anon, authenticated;

create or replace function public.guard_organization_member_update()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if public.is_current_user_admin() then
    return new;
  end if;

  if new.id is distinct from old.id
    or new.company_profile_id is distinct from old.company_profile_id
    or new.verification_status is distinct from old.verification_status
    or new.status is distinct from old.status
    or new.created_by is distinct from old.created_by then
    raise exception 'Organization ownership, verification and status changes require a protected admin workflow.';
  end if;

  return new;
end;
$$;

revoke all on function public.guard_organization_member_update() from public, anon, authenticated;

create or replace function public.guard_company_profile_member_update()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if public.is_current_user_admin() then
    return new;
  end if;

  if new.id is distinct from old.id
    or new.profile_id is distinct from old.profile_id
    or new.verified is distinct from old.verified
    or new.is_hidden is distinct from old.is_hidden then
    raise exception 'Company ownership, verification and visibility changes require a protected admin workflow.';
  end if;

  return new;
end;
$$;

revoke all on function public.guard_company_profile_member_update() from public, anon, authenticated;

create or replace function public.guard_membership_invitation_write()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_actor_email text;
begin
  if tg_op = 'INSERT' then
    if not public.is_current_user_admin() and new.invited_by is distinct from auth.uid() then
      raise exception 'Invitation actor must match the authenticated user.';
    end if;

    select lower(coalesce(profiles.email, ''))
      into v_actor_email
    from public.profiles
    where profiles.id = auth.uid();

    if lower(btrim(new.email)) = v_actor_email then
      raise exception 'Users cannot invite themselves to an organization.';
    end if;

    if new.role = 'owner' then
      raise exception 'Owner authority requires a controlled ownership-transfer workflow.';
    end if;

    return new;
  end if;

  if tg_op = 'UPDATE' then
    if not public.is_current_user_admin() and not public.current_user_can_manage_organization_members(old.organization_id) then
      raise exception 'Invitation changes require Owner or Admin authority.';
    end if;

    if not public.is_current_user_admin()
      and (
        new.status = 'accepted'
        or new.accepted_by is distinct from old.accepted_by
        or new.accepted_at is distinct from old.accepted_at
      ) then
      raise exception 'Invitation acceptance requires the protected acceptance workflow.';
    end if;

    if new.organization_id is distinct from old.organization_id
      or new.email is distinct from old.email
      or new.role is distinct from old.role
      or new.token_hash is distinct from old.token_hash
      or new.invited_by is distinct from old.invited_by then
      raise exception 'Invitation identity fields cannot be changed.';
    end if;

    return new;
  end if;

  raise exception 'Delete invitations by setting status to revoked or expired.';
end;
$$;

revoke all on function public.guard_membership_invitation_write() from public, anon, authenticated;

drop trigger if exists company_profiles_guard_member_update on public.company_profiles;
create trigger company_profiles_guard_member_update
  before update on public.company_profiles
  for each row
  execute function public.guard_company_profile_member_update();

drop trigger if exists organization_memberships_guard_write on public.organization_memberships;
create trigger organization_memberships_guard_write
  before insert or update or delete on public.organization_memberships
  for each row
  execute function public.guard_organization_membership_write();

drop trigger if exists membership_invitations_guard_write on public.membership_invitations;
create trigger membership_invitations_guard_write
  before insert or update or delete on public.membership_invitations
  for each row
  execute function public.guard_membership_invitation_write();

alter table public.organizations enable row level security;
alter table public.organization_memberships enable row level security;
alter table public.membership_invitations enable row level security;

drop trigger if exists organizations_guard_member_update on public.organizations;
create trigger organizations_guard_member_update
  before update on public.organizations
  for each row
  execute function public.guard_organization_member_update();

drop policy if exists "organizations_select_member_or_admin" on public.organizations;
create policy "organizations_select_member_or_admin" on public.organizations
  for select
  using (public.current_user_can_view_organization(id));

drop policy if exists "organizations_update_owner_admin" on public.organizations;
create policy "organizations_update_owner_admin" on public.organizations
  for update
  using (public.current_user_has_organization_role(id, array['owner', 'admin']))
  with check (public.current_user_has_organization_role(id, array['owner', 'admin']));

drop policy if exists "organization_memberships_select_related" on public.organization_memberships;
create policy "organization_memberships_select_related" on public.organization_memberships
  for select
  using (
    profile_id = auth.uid()
    or public.current_user_can_view_organization(organization_id)
  );

drop policy if exists "organization_memberships_insert_owner_admin" on public.organization_memberships;
create policy "organization_memberships_insert_owner_admin" on public.organization_memberships
  for insert
  with check (public.current_user_can_manage_organization_members(organization_id));

drop policy if exists "organization_memberships_update_owner_admin_or_accept" on public.organization_memberships;
create policy "organization_memberships_update_owner_admin_or_accept" on public.organization_memberships
  for update
  using (
    public.current_user_can_manage_organization_members(organization_id)
    or (profile_id = auth.uid() and status = 'invited')
  )
  with check (
    public.current_user_can_manage_organization_members(organization_id)
    or profile_id = auth.uid()
  );

drop policy if exists "membership_invitations_select_org_admin" on public.membership_invitations;
create policy "membership_invitations_select_org_admin" on public.membership_invitations
  for select
  using (public.current_user_can_manage_organization_members(organization_id));

drop policy if exists "membership_invitations_insert_org_admin" on public.membership_invitations;
create policy "membership_invitations_insert_org_admin" on public.membership_invitations
  for insert
  with check (
    public.current_user_can_manage_organization_members(organization_id)
    and invited_by = auth.uid()
  );

drop policy if exists "membership_invitations_update_org_admin" on public.membership_invitations;
create policy "membership_invitations_update_org_admin" on public.membership_invitations
  for update
  using (public.current_user_can_manage_organization_members(organization_id))
  with check (public.current_user_can_manage_organization_members(organization_id));

drop policy if exists "company_profiles_update_own" on public.company_profiles;
drop policy if exists "company_profiles_update_member_authorized" on public.company_profiles;
create policy "company_profiles_update_member_authorized" on public.company_profiles
  for update
  using (public.current_user_can_manage_company_profile(id::text, array['owner', 'admin']))
  with check (public.current_user_can_manage_company_profile(id::text, array['owner', 'admin']));

drop policy if exists "job_posts_insert_own" on public.job_posts;
create policy "job_posts_insert_own" on public.job_posts
  for insert
  with check (
    public.current_user_can_manage_hiring_company_profile(company_profile_id::text)
    and public.is_major_project(job_posts.project_id)
    and exists (
      select 1
      from public.project_claims
      where project_claims.project_id = job_posts.project_id
        and project_claims.company_profile_id = job_posts.company_profile_id
        and project_claims.status = 'approved'
    )
  );

drop policy if exists "job_posts_update_own" on public.job_posts;
create policy "job_posts_update_own" on public.job_posts
  for update
  using (
    public.current_user_can_manage_hiring_company_profile(company_profile_id::text)
    and public.is_major_project(job_posts.project_id)
    and exists (
      select 1
      from public.project_claims
      where project_claims.project_id = job_posts.project_id
        and project_claims.company_profile_id = job_posts.company_profile_id
        and project_claims.status = 'approved'
    )
  )
  with check (
    public.current_user_can_manage_hiring_company_profile(company_profile_id::text)
    and public.is_major_project(job_posts.project_id)
    and exists (
      select 1
      from public.project_claims
      where project_claims.project_id = job_posts.project_id
        and project_claims.company_profile_id = job_posts.company_profile_id
        and project_claims.status = 'approved'
    )
  );

drop policy if exists "job_posts_delete_own" on public.job_posts;
create policy "job_posts_delete_own" on public.job_posts
  for delete
  using (
    public.current_user_can_manage_hiring_company_profile(company_profile_id::text)
  );

notify pgrst, 'reload schema';

commit;
