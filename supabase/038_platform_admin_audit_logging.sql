-- Append-only audit logging for sensitive platform staff actions.

begin;

create table if not exists public.platform_audit_events (
  id uuid primary key default gen_random_uuid(),
  occurred_at timestamptz not null default now(),
  actor_profile_id uuid references public.profiles(id) on delete set null,
  actor_platform_role text,
  action text not null,
  target_table text not null,
  target_record_id text,
  before_state jsonb not null default '{}'::jsonb,
  after_state jsonb not null default '{}'::jsonb,
  correlation_id text,
  created_at timestamptz not null default now(),
  constraint platform_audit_events_actor_role_check
    check (actor_platform_role is null or actor_platform_role in ('platform_owner', 'platform_admin')),
  constraint platform_audit_events_action_check
    check (length(btrim(action)) > 0),
  constraint platform_audit_events_target_table_check
    check (length(btrim(target_table)) > 0)
);

create index if not exists platform_audit_events_occurred_at_idx
  on public.platform_audit_events(occurred_at desc);

create index if not exists platform_audit_events_actor_idx
  on public.platform_audit_events(actor_profile_id, occurred_at desc);

create index if not exists platform_audit_events_target_idx
  on public.platform_audit_events(target_table, target_record_id);

alter table public.platform_audit_events enable row level security;

revoke all on table public.platform_audit_events from public, anon, authenticated;
grant select on table public.platform_audit_events to authenticated;
revoke insert, update, delete, truncate, trigger, references on table public.platform_audit_events from public, anon, authenticated;

drop policy if exists "platform_audit_events_select_staff" on public.platform_audit_events;
create policy "platform_audit_events_select_staff" on public.platform_audit_events
  for select using (public.current_user_is_active_platform_staff());

create or replace function public.platform_audit_actor_role()
returns text
language sql
stable
security definer
set search_path = public
as $$
  select platform_staff.role
  from public.platform_staff
  where platform_staff.profile_id = auth.uid()
    and platform_staff.status = 'active'
    and platform_staff.role in ('platform_owner', 'platform_admin')
  limit 1;
$$;

revoke all on function public.platform_audit_actor_role() from public, anon, authenticated;

create or replace function public.platform_audit_safe_state(
  p_table_name text,
  p_row jsonb
)
returns jsonb
language sql
stable
security definer
set search_path = public
as $$
  select case p_table_name
    when 'platform_staff' then
      jsonb_build_object(
        'profile_id', p_row ->> 'profile_id',
        'role', p_row ->> 'role',
        'status', p_row ->> 'status'
      )
    when 'company_profiles' then
      jsonb_build_object(
        'id', p_row ->> 'id',
        'company_type', p_row ->> 'company_type',
        'verified', p_row -> 'verified',
        'is_public', p_row -> 'is_public',
        'is_hidden', p_row -> 'is_hidden'
      )
    when 'projects' then
      jsonb_build_object(
        'id', p_row ->> 'id',
        'status', p_row ->> 'status',
        'review_status', p_row ->> 'review_status',
        'is_active', p_row -> 'is_active',
        'is_public', p_row -> 'is_public',
        'is_public_project', p_row -> 'is_public_project',
        'map_eligible', p_row -> 'map_eligible'
      )
    when 'project_claims' then
      jsonb_build_object(
        'id', p_row ->> 'id',
        'project_id', p_row ->> 'project_id',
        'company_profile_id', p_row ->> 'company_profile_id',
        'status', p_row ->> 'status',
        'company_role', p_row ->> 'company_role',
        'claim_type', p_row ->> 'claim_type',
        'is_primary_gc', p_row -> 'is_primary_gc'
      )
    when 'job_posts' then
      jsonb_build_object(
        'id', p_row ->> 'id',
        'project_id', p_row ->> 'project_id',
        'company_profile_id', p_row ->> 'company_profile_id',
        'status', p_row ->> 'status',
        'title', p_row ->> 'title'
      )
    when 'applications' then
      jsonb_build_object(
        'id', p_row ->> 'id',
        'job_post_id', p_row ->> 'job_post_id',
        'worker_profile_id', p_row ->> 'worker_profile_id',
        'status', p_row ->> 'status'
      )
    when 'project_images' then
      jsonb_build_object(
        'id', p_row ->> 'id',
        'project_id', p_row ->> 'project_id',
        'company_id', p_row ->> 'company_id',
        'is_primary', p_row -> 'is_primary'
      )
    when 'site_settings' then
      jsonb_build_object(
        'id', p_row ->> 'id',
        'key', p_row ->> 'key',
        'value', p_row -> 'value'
      )
    else '{}'::jsonb
  end;
$$;

revoke all on function public.platform_audit_safe_state(text, jsonb) from public, anon, authenticated;

create or replace function public.log_platform_audit_event()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  actor_role text;
  old_state jsonb := '{}'::jsonb;
  new_state jsonb := '{}'::jsonb;
  target_id text;
  action_name text;
begin
  actor_role := public.platform_audit_actor_role();

  if actor_role is null then
    return coalesce(new, old);
  end if;

  if tg_op in ('UPDATE', 'DELETE') then
    old_state := public.platform_audit_safe_state(tg_table_name, to_jsonb(old));
    target_id := coalesce(to_jsonb(old) ->> 'id', to_jsonb(old) ->> 'profile_id', to_jsonb(old) ->> 'key');
  end if;

  if tg_op in ('INSERT', 'UPDATE') then
    new_state := public.platform_audit_safe_state(tg_table_name, to_jsonb(new));
    target_id := coalesce(to_jsonb(new) ->> 'id', to_jsonb(new) ->> 'profile_id', to_jsonb(new) ->> 'key', target_id);
  end if;

  if tg_table_name = 'site_settings' then
    target_id := coalesce(to_jsonb(new) ->> 'key', to_jsonb(old) ->> 'key', target_id);
  end if;

  action_name := lower(tg_table_name || '.' || tg_op);

  if tg_table_name = 'platform_staff' and tg_op = 'INSERT' then
    action_name := 'platform_staff.appoint';
  elsif tg_table_name = 'platform_staff' and tg_op = 'UPDATE' then
    if old.status is distinct from new.status and new.status = 'suspended' then
      action_name := 'platform_staff.suspend';
    elsif old.status is distinct from new.status and new.status = 'active' then
      action_name := 'platform_staff.reactivate';
    elsif old.status is distinct from new.status and new.status = 'removed' then
      action_name := 'platform_staff.remove';
    else
      action_name := 'platform_staff.update';
    end if;
  elsif tg_table_name = 'company_profiles' and tg_op = 'UPDATE' then
    if coalesce(old.is_hidden, false) is distinct from coalesce(new.is_hidden, false) and coalesce(new.is_hidden, false) then
      action_name := 'company.suspend';
    elsif coalesce(old.is_hidden, false) is distinct from coalesce(new.is_hidden, false) and not coalesce(new.is_hidden, false) then
      action_name := 'company.reactivate';
    else
      action_name := 'company.update';
    end if;
  elsif tg_table_name = 'projects' and tg_op = 'UPDATE' then
    if coalesce(old.is_public, true) is distinct from coalesce(new.is_public, true) and not coalesce(new.is_public, true) then
      action_name := 'project.hide';
    elsif coalesce(old.is_public, true) is distinct from coalesce(new.is_public, true) and coalesce(new.is_public, true) then
      action_name := 'project.restore';
    else
      action_name := 'project.update';
    end if;
  elsif tg_table_name = 'projects' and tg_op = 'DELETE' then
    action_name := 'project.delete';
  elsif tg_table_name = 'project_claims' and tg_op = 'UPDATE' then
    if old.status is distinct from new.status and new.status = 'approved' then
      action_name := 'project_claim.approve';
    elsif old.status is distinct from new.status and new.status = 'rejected' then
      action_name := 'project_claim.reject';
    else
      action_name := 'project_claim.update';
    end if;
  elsif tg_table_name = 'job_posts' then
    action_name := 'job.moderate.' || lower(tg_op);
  elsif tg_table_name = 'applications' then
    action_name := 'application.moderate.' || lower(tg_op);
  elsif tg_table_name = 'project_images' then
    action_name := 'project_image.moderate.' || lower(tg_op);
  elsif tg_table_name = 'site_settings' then
    action_name := 'site_setting.change';
  end if;

  insert into public.platform_audit_events (
    actor_profile_id,
    actor_platform_role,
    action,
    target_table,
    target_record_id,
    before_state,
    after_state,
    correlation_id
  ) values (
    auth.uid(),
    actor_role,
    action_name,
    tg_table_name,
    target_id,
    old_state,
    new_state,
    nullif(current_setting('request.headers', true)::jsonb ->> 'x-request-id', '')
  );

  return coalesce(new, old);
end;
$$;

revoke all on function public.log_platform_audit_event() from public, anon, authenticated;

drop trigger if exists platform_staff_audit on public.platform_staff;
create trigger platform_staff_audit
  after insert or update on public.platform_staff
  for each row execute function public.log_platform_audit_event();

drop trigger if exists company_profiles_platform_audit on public.company_profiles;
create trigger company_profiles_platform_audit
  after update on public.company_profiles
  for each row execute function public.log_platform_audit_event();

drop trigger if exists projects_platform_audit on public.projects;
create trigger projects_platform_audit
  after update or delete on public.projects
  for each row execute function public.log_platform_audit_event();

drop trigger if exists project_claims_platform_audit on public.project_claims;
create trigger project_claims_platform_audit
  after update on public.project_claims
  for each row execute function public.log_platform_audit_event();

drop trigger if exists job_posts_platform_audit on public.job_posts;
create trigger job_posts_platform_audit
  after insert or update or delete on public.job_posts
  for each row execute function public.log_platform_audit_event();

drop trigger if exists applications_platform_audit on public.applications;
create trigger applications_platform_audit
  after update on public.applications
  for each row execute function public.log_platform_audit_event();

drop trigger if exists project_images_platform_audit on public.project_images;
create trigger project_images_platform_audit
  after insert or update or delete on public.project_images
  for each row execute function public.log_platform_audit_event();

drop trigger if exists site_settings_platform_audit on public.site_settings;
create trigger site_settings_platform_audit
  after update on public.site_settings
  for each row execute function public.log_platform_audit_event();

commit;
