-- Establish protected platform staff authorization separate from profile roles
-- and organization memberships.

begin;

create table if not exists public.platform_staff (
  profile_id uuid primary key references public.profiles(id) on delete cascade,
  role text not null,
  status text not null default 'active',
  created_by uuid references public.profiles(id) on delete set null,
  updated_by uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint platform_staff_role_check
    check (role in ('platform_owner', 'platform_admin')),
  constraint platform_staff_status_check
    check (status in ('active', 'suspended', 'removed'))
);

create index if not exists platform_staff_role_status_idx
  on public.platform_staff(role, status);

alter table public.platform_staff enable row level security;

revoke all on table public.platform_staff from public, anon, authenticated;

create or replace function public.current_user_is_active_platform_owner()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.platform_staff
    where platform_staff.profile_id = auth.uid()
      and platform_staff.role = 'platform_owner'
      and platform_staff.status = 'active'
  );
$$;

revoke all on function public.current_user_is_active_platform_owner() from public, anon, authenticated;
grant execute on function public.current_user_is_active_platform_owner() to authenticated;

create or replace function public.current_user_is_active_platform_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.platform_staff
    where platform_staff.profile_id = auth.uid()
      and platform_staff.role = 'platform_admin'
      and platform_staff.status = 'active'
  );
$$;

revoke all on function public.current_user_is_active_platform_admin() from public, anon, authenticated;
grant execute on function public.current_user_is_active_platform_admin() to authenticated;

create or replace function public.current_user_is_active_platform_staff()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select coalesce(public.current_user_is_active_platform_owner(), false)
    or coalesce(public.current_user_is_active_platform_admin(), false);
$$;

revoke all on function public.current_user_is_active_platform_staff() from public, anon, authenticated;
grant execute on function public.current_user_is_active_platform_staff() to authenticated;

create or replace function public.is_current_user_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select public.current_user_is_active_platform_staff();
$$;

revoke all on function public.is_current_user_admin() from public, anon, authenticated;
grant execute on function public.is_current_user_admin() to authenticated;

create or replace function public.is_admin_profile()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select public.current_user_is_active_platform_staff();
$$;

revoke all on function public.is_admin_profile() from public, anon, authenticated;
grant execute on function public.is_admin_profile() to anon, authenticated;

drop policy if exists "platform_staff_select_owner" on public.platform_staff;
create policy "platform_staff_select_owner" on public.platform_staff
  for select using (
    public.current_user_is_active_platform_owner()
  );

drop policy if exists "platform_staff_select_self" on public.platform_staff;
create policy "platform_staff_select_self" on public.platform_staff
  for select using (
    profile_id = auth.uid()
  );

drop policy if exists "platform_staff_insert_admin_by_owner" on public.platform_staff;
create policy "platform_staff_insert_admin_by_owner" on public.platform_staff
  for insert with check (
    public.current_user_is_active_platform_owner()
    and role = 'platform_admin'
    and profile_id <> auth.uid()
  );

drop policy if exists "platform_staff_update_admin_by_owner" on public.platform_staff;
create policy "platform_staff_update_admin_by_owner" on public.platform_staff
  for update using (
    public.current_user_is_active_platform_owner()
    and role = 'platform_admin'
  ) with check (
    public.current_user_is_active_platform_owner()
    and role = 'platform_admin'
    and profile_id <> auth.uid()
  );

grant select, insert, update on table public.platform_staff to authenticated;
revoke truncate, trigger, references, delete on table public.platform_staff from public, anon, authenticated;

drop policy if exists "profiles_admin_select_all" on public.profiles;
create policy "profiles_admin_select_all" on public.profiles
  for select using (public.current_user_is_active_platform_staff());

drop policy if exists "worker_profiles_platform_staff_all" on public.worker_profiles;
create policy "worker_profiles_platform_staff_all" on public.worker_profiles
  for all using (public.current_user_is_active_platform_staff())
  with check (public.current_user_is_active_platform_staff());

drop policy if exists "company_profiles_admin_select_all" on public.company_profiles;
create policy "company_profiles_admin_select_all" on public.company_profiles
  for select using (public.current_user_is_active_platform_staff());

drop policy if exists "company_profiles_admin_update_all" on public.company_profiles;
create policy "company_profiles_admin_update_all" on public.company_profiles
  for update using (public.current_user_is_active_platform_staff())
  with check (public.current_user_is_active_platform_staff());

drop policy if exists "projects_admin_update_all" on public.projects;
create policy "projects_admin_update_all" on public.projects
  for update using (public.current_user_is_active_platform_staff())
  with check (public.current_user_is_active_platform_staff());

drop policy if exists "projects_admin_update_claim_status" on public.projects;
create policy "projects_admin_update_claim_status" on public.projects
  for update using (public.current_user_is_active_platform_staff())
  with check (public.current_user_is_active_platform_staff());

drop policy if exists "project_claims_admin_select_all" on public.project_claims;
create policy "project_claims_admin_select_all" on public.project_claims
  for select using (public.current_user_is_active_platform_staff());

drop policy if exists "project_claims_admin_update_all" on public.project_claims;
create policy "project_claims_admin_update_all" on public.project_claims
  for update using (public.current_user_is_active_platform_staff())
  with check (public.current_user_is_active_platform_staff());

drop policy if exists "project_claims_admin_insert_all" on public.project_claims;
create policy "project_claims_admin_insert_all" on public.project_claims
  for insert with check (public.current_user_is_active_platform_staff());

drop policy if exists "job_posts_platform_staff_all" on public.job_posts;
create policy "job_posts_platform_staff_all" on public.job_posts
  for all using (public.current_user_is_active_platform_staff())
  with check (public.current_user_is_active_platform_staff());

drop policy if exists "applications_admin_select_all" on public.applications;
create policy "applications_admin_select_all" on public.applications
  for select using (public.current_user_is_active_platform_staff());

drop policy if exists "applications_admin_update_all" on public.applications;
create policy "applications_admin_update_all" on public.applications
  for update using (public.current_user_is_active_platform_staff())
  with check (public.current_user_is_active_platform_staff());

drop policy if exists "project_images_platform_staff_all" on public.project_images;
create policy "project_images_platform_staff_all" on public.project_images
  for all using (public.current_user_is_active_platform_staff())
  with check (public.current_user_is_active_platform_staff());

drop policy if exists "site_settings_admin_all" on public.site_settings;
create policy "site_settings_admin_all" on public.site_settings
  for all using (public.current_user_is_active_platform_staff())
  with check (public.current_user_is_active_platform_staff());

drop policy if exists "waitlist_signups_admin_select" on public.waitlist_signups;
create policy "waitlist_signups_admin_select" on public.waitlist_signups
  for select using (public.current_user_is_active_platform_staff());

commit;
