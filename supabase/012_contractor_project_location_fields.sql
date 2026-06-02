-- Contractor-managed jobsite access information.
-- Keeps imported project location/coordinates intact while allowing approved
-- project companies to maintain worker-facing access details.
-- Safe to run multiple times.

alter table public.projects
  add column if not exists display_address text,
  add column if not exists site_access_notes text,
  add column if not exists gate_entrance text,
  add column if not exists parking_instructions text,
  add column if not exists muster_point text,
  add column if not exists google_maps_url text,
  add column if not exists contractor_location_updated_at timestamptz,
  add column if not exists contractor_location_updated_by uuid references public.profiles(id);

create or replace function public.is_admin_profile()
returns boolean
language sql
stable
as $$
  select exists (
    select 1
    from public.profiles
    where profiles.id = auth.uid()
      and profiles.role = 'admin'
  );
$$;

create or replace function public.has_approved_project_company(p_project_id bigint)
returns boolean
language sql
stable
as $$
  select exists (
    select 1
    from public.project_claims
    join public.company_profiles
      on company_profiles.id = project_claims.company_profile_id
    where project_claims.project_id = p_project_id
      and project_claims.status = 'approved'
      and company_profiles.profile_id = auth.uid()
  );
$$;

create or replace function public.guard_project_contractor_location_update()
returns trigger
language plpgsql
as $$
declare
  allowed_keys text[] := array[
    'display_address',
    'site_access_notes',
    'gate_entrance',
    'parking_instructions',
    'muster_point',
    'google_maps_url',
    'contractor_location_updated_at',
    'contractor_location_updated_by'
  ];
  location_changed boolean;
begin
  if public.is_admin_profile() then
    return new;
  end if;

  -- Preserve the existing claim flow, which marks an unverified project as
  -- claimed when a contractor submits a pending claim.
  if new.project_status_type = 'claimed'
    and old.project_status_type = 'unverified'
    and (to_jsonb(new) - 'project_status_type') = (to_jsonb(old) - 'project_status_type')
  then
    return new;
  end if;

  if (to_jsonb(new) - allowed_keys) is distinct from (to_jsonb(old) - allowed_keys) then
    raise exception 'Only contractor-managed jobsite access fields can be updated by connected contractors.';
  end if;

  if not public.has_approved_project_company(old.id) then
    raise exception 'Only approved companies connected to this project can update jobsite access details.';
  end if;

  location_changed :=
    new.display_address is distinct from old.display_address
    or new.site_access_notes is distinct from old.site_access_notes
    or new.gate_entrance is distinct from old.gate_entrance
    or new.parking_instructions is distinct from old.parking_instructions
    or new.muster_point is distinct from old.muster_point
    or new.google_maps_url is distinct from old.google_maps_url;

  if location_changed then
    new.contractor_location_updated_at = now();
    new.contractor_location_updated_by = auth.uid();
  end if;

  return new;
end;
$$;

drop trigger if exists projects_guard_contractor_location_update on public.projects;
create trigger projects_guard_contractor_location_update
  before update on public.projects
  for each row execute function public.guard_project_contractor_location_update();

drop policy if exists "projects_contractor_update_location" on public.projects;
create policy "projects_contractor_update_location" on public.projects
  for update using (
    public.has_approved_project_company(id)
  ) with check (
    public.has_approved_project_company(id)
  );

drop policy if exists "projects_admin_update_all" on public.projects;
create policy "projects_admin_update_all" on public.projects
  for update using (
    public.is_admin_profile()
  ) with check (
    public.is_admin_profile()
  );

notify pgrst, 'reload schema';
