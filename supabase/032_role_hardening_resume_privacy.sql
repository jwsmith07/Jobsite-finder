-- Jobsite Finder V2 Mission 1: role hardening and private resume access.
-- Draft only until explicitly approved and applied.
--
-- Security note:
-- GC/SC profile roles are UI experience roles only. They do not grant company,
-- project, job, application, or resume authority. Hiring-organization authority
-- must come from an active authorized organization membership in a later V2
-- migration. Until that exists, the company-authority helper below fails closed.

begin;

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

create or replace function public.guard_profile_role_assignment()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if new.role is not null then
    new.role := lower(btrim(new.role));
  end if;

  if new.role is not null and new.role not in ('worker', 'gc', 'sc', 'admin') then
    raise exception 'Invalid profile role.';
  end if;

  if tg_op = 'INSERT' then
    if new.role = 'admin' and not public.is_current_user_admin() then
      raise exception 'Admin role assignment requires an authorized admin workflow.';
    end if;
    return new;
  end if;

  if old.role is null and new.role in ('worker', 'gc', 'sc') then
    return new;
  end if;

  if new.role is distinct from old.role and not public.is_current_user_admin() then
    raise exception 'Role changes require an authorized admin workflow.';
  end if;

  return new;
end;
$$;

revoke all on function public.guard_profile_role_assignment() from public, anon, authenticated;

drop trigger if exists profiles_guard_role_assignment on public.profiles;
create trigger profiles_guard_role_assignment
  before insert or update on public.profiles
  for each row
  execute function public.guard_profile_role_assignment();

drop policy if exists "profiles_update_own" on public.profiles;
create policy "profiles_update_own" on public.profiles
  for update
  using (id = auth.uid())
  with check (id = auth.uid());

create or replace function public.current_user_worker_profile_id_text()
returns text
language sql
stable
security definer
set search_path = public
as $$
  select worker_profiles.id::text
  from public.worker_profiles
  where worker_profiles.profile_id = auth.uid()
  limit 1;
$$;

revoke all on function public.current_user_worker_profile_id_text() from public, anon, authenticated;
grant execute on function public.current_user_worker_profile_id_text() to authenticated;

create or replace function public.current_user_can_manage_hiring_company_profile(p_company_profile_id text)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  -- Deliberately fail closed until V2 organization memberships are introduced.
  -- Do not replace this with company_profiles.profile_id = auth.uid(); selecting
  -- GC/SC must not independently grant hiring authority.
  select false;
$$;

revoke all on function public.current_user_can_manage_hiring_company_profile(text) from public, anon, authenticated;
grant execute on function public.current_user_can_manage_hiring_company_profile(text) to authenticated;

create or replace function public.application_job_owner_company_id_text(p_job_post_id bigint)
returns text
language sql
stable
security definer
set search_path = public
as $$
  select job_posts.company_profile_id::text
  from public.job_posts
  where job_posts.id = p_job_post_id
  limit 1;
$$;

revoke all on function public.application_job_owner_company_id_text(bigint) from public, anon, authenticated;
grant execute on function public.application_job_owner_company_id_text(bigint) to authenticated;

create or replace function public.guard_application_update()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_worker_id text := public.current_user_worker_profile_id_text();
  v_owner_company_id text := public.application_job_owner_company_id_text(old.job_post_id);
  v_is_admin boolean := public.is_current_user_admin();
begin
  if v_is_admin then
    return new;
  end if;

  if v_worker_id is not null and old.worker_profile_id::text = v_worker_id then
    if (to_jsonb(new) - 'status') <> (to_jsonb(old) - 'status') then
      raise exception 'Workers may only withdraw their own applications.';
    end if;

    if new.status is distinct from old.status and new.status <> 'withdrawn' then
      raise exception 'Workers may only withdraw their own applications.';
    end if;

    return new;
  end if;

  if public.current_user_can_manage_hiring_company_profile(v_owner_company_id) then
    if (to_jsonb(new) - array['status', 'company_notes']) <> (to_jsonb(old) - array['status', 'company_notes']) then
      raise exception 'Hiring organizations may update only hiring fields.';
    end if;

    return new;
  end if;

  raise exception 'Application update is not authorized.';
end;
$$;

revoke all on function public.guard_application_update() from public, anon, authenticated;

drop trigger if exists applications_guard_update on public.applications;
create trigger applications_guard_update
  before update on public.applications
  for each row
  execute function public.guard_application_update();

drop policy if exists "applications_update_own" on public.applications;
create policy "applications_update_own" on public.applications
  for update
  using (worker_profile_id::text = public.current_user_worker_profile_id_text())
  with check (worker_profile_id::text = public.current_user_worker_profile_id_text());

drop policy if exists "applications_update_company" on public.applications;
create policy "applications_update_company" on public.applications
  for update
  using (
    public.current_user_can_manage_hiring_company_profile(public.application_job_owner_company_id_text(job_post_id))
  )
  with check (
    public.current_user_can_manage_hiring_company_profile(public.application_job_owner_company_id_text(job_post_id))
  );

drop policy if exists "applications_admin_update_all" on public.applications;
create policy "applications_admin_update_all" on public.applications
  for update
  using (public.is_current_user_admin())
  with check (public.is_current_user_admin());

update storage.buckets
set public = false
where id = 'resumes';

drop policy if exists "resumes_select_public" on storage.objects;
drop policy if exists "resumes_select_owner" on storage.objects;
drop policy if exists "resumes_select_application_company" on storage.objects;
drop policy if exists "resumes_select_admin" on storage.objects;

create policy "resumes_select_owner" on storage.objects
  for select using (
    bucket_id = 'resumes'
    and auth.uid()::text = (storage.foldername(name))[1]
  );

create policy "resumes_select_application_company" on storage.objects
  for select using (
    bucket_id = 'resumes'
    and exists (
      select 1
      from public.applications a
      join public.job_posts j on j.id = a.job_post_id
      join public.worker_profiles wp on wp.id = a.worker_profile_id
      where a.resume_url = storage.objects.name
        and wp.profile_id::text = (storage.foldername(storage.objects.name))[1]
        and public.current_user_can_manage_hiring_company_profile(j.company_profile_id::text)
    )
  );

create policy "resumes_select_admin" on storage.objects
  for select using (
    bucket_id = 'resumes'
    and public.is_current_user_admin()
  );

drop policy if exists "resumes_insert_own_folder" on storage.objects;
create policy "resumes_insert_own_folder" on storage.objects
  for insert with check (
    bucket_id = 'resumes'
    and auth.uid()::text = (storage.foldername(name))[1]
  );

drop policy if exists "resumes_update_own_folder" on storage.objects;
create policy "resumes_update_own_folder" on storage.objects
  for update using (
    bucket_id = 'resumes'
    and auth.uid()::text = (storage.foldername(name))[1]
  ) with check (
    bucket_id = 'resumes'
    and auth.uid()::text = (storage.foldername(name))[1]
  );

drop policy if exists "resumes_delete_own_folder" on storage.objects;
create policy "resumes_delete_own_folder" on storage.objects
  for delete using (
    bucket_id = 'resumes'
    and auth.uid()::text = (storage.foldername(name))[1]
  );

notify pgrst, 'reload schema';

commit;
