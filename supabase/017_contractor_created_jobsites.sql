-- Contractor-created map jobsites.
-- Extends public.projects so contractor-created jobsites can live beside
-- imported public projects without changing the job-post jobsites table.
-- Safe to run multiple times.

alter table public.projects
  add column if not exists source_type text not null default 'public_import',
  add column if not exists created_by uuid references auth.users(id),
  add column if not exists review_status text not null default 'approved',
  add column if not exists reviewed_by uuid references auth.users(id),
  add column if not exists reviewed_at timestamptz,
  add column if not exists rejection_reason text,
  add column if not exists is_public boolean not null default true,
  add column if not exists trades_needed text,
  add column if not exists hiring_status text,
  add column if not exists project_value_display text,
  add column if not exists primary_image_url text;

alter table public.projects
  drop constraint if exists projects_source_type_check,
  drop constraint if exists projects_review_status_check;

alter table public.projects
  add constraint projects_source_type_check
  check (source_type in ('public_import', 'contractor_created'));

alter table public.projects
  add constraint projects_review_status_check
  check (review_status in ('pending_review', 'approved', 'rejected', 'hidden'));

update public.projects
set
  source_type = coalesce(source_type, 'public_import'),
  review_status = coalesce(review_status, 'approved'),
  is_public = coalesce(is_public, true)
where source_type is null
   or review_status is null
   or is_public is null;

create index if not exists projects_public_review_idx
on public.projects(review_status, is_public, is_active, is_public_project, source_type);

create index if not exists projects_contractor_created_by_idx
on public.projects(created_by, review_status)
where source_type = 'contractor_created';

alter table public.projects enable row level security;

create or replace function public.is_contractor_profile()
returns boolean
language sql
stable
as $$
  select exists (
    select 1 from public.profiles
    where profiles.id = auth.uid()
      and profiles.role in ('gc', 'sc')
  );
$$;

create or replace function public.can_edit_project_jobsite(p_project_id bigint)
returns boolean
language sql
stable
as $$
  select public.is_admin_profile()
    or exists (
      select 1
      from public.projects
      where projects.id = p_project_id
        and projects.source_type = 'contractor_created'
        and projects.created_by = auth.uid()
        and projects.review_status in ('pending_review', 'approved')
    )
    or public.has_approved_project_company(p_project_id);
$$;

create or replace function public.guard_project_contractor_location_update()
returns trigger
language plpgsql
as $$
declare
  allowed_keys text[] := array[
    'project_name',
    'project_type',
    'sector',
    'stage',
    'estimated_value',
    'project_value_display',
    'start_date',
    'end_date',
    'description',
    'trades_needed',
    'hiring_status',
    'display_address',
    'address',
    'city',
    'region',
    'province',
    'latitude',
    'longitude',
    'site_access_notes',
    'gate_entrance',
    'parking_instructions',
    'muster_point',
    'google_maps_url',
    'primary_image_url',
    'contractor_location_updated_at',
    'contractor_location_updated_by'
  ];
  allowed_location_keys text[] := array[
    'display_address',
    'site_access_notes',
    'gate_entrance',
    'parking_instructions',
    'muster_point',
    'google_maps_url',
    'contractor_location_updated_at',
    'contractor_location_updated_by'
  ];
  changed boolean;
begin
  if public.is_admin_profile() then
    return new;
  end if;

  if new.project_status_type = 'claimed'
    and old.project_status_type = 'unverified'
    and (to_jsonb(new) - 'project_status_type') = (to_jsonb(old) - 'project_status_type')
  then
    return new;
  end if;

  if old.source_type = 'contractor_created' and old.created_by = auth.uid() then
    if old.review_status not in ('pending_review', 'approved') then
      raise exception 'This jobsite cannot be edited in its current review status.';
    end if;
    if new.source_type is distinct from old.source_type
      or new.created_by is distinct from old.created_by
      or new.review_status is distinct from old.review_status
      or new.reviewed_by is distinct from old.reviewed_by
      or new.reviewed_at is distinct from old.reviewed_at
      or new.rejection_reason is distinct from old.rejection_reason
      or new.is_public is distinct from old.is_public
    then
      raise exception 'Review fields can only be changed by an admin.';
    end if;
    if (to_jsonb(new) - allowed_keys) is distinct from (to_jsonb(old) - allowed_keys) then
      raise exception 'Only contractor-created jobsite fields can be updated by the owner.';
    end if;
  else
    if (to_jsonb(new) - allowed_location_keys) is distinct from (to_jsonb(old) - allowed_location_keys) then
      raise exception 'Only contractor-managed jobsite access fields can be updated by connected contractors.';
    end if;
    if not public.has_approved_project_company(old.id) then
      raise exception 'Only approved companies connected to this project can update jobsite access details.';
    end if;
  end if;

  changed := to_jsonb(new) is distinct from to_jsonb(old);
  if changed then
    new.contractor_location_updated_at = now();
    new.contractor_location_updated_by = auth.uid();
  end if;

  return new;
end;
$$;

drop policy if exists "projects_select_public_approved" on public.projects;
create policy "projects_select_public_approved" on public.projects
  for select using (
    public.is_admin_profile()
    or created_by = auth.uid()
    or public.has_approved_project_company(id)
    or (
      review_status = 'approved'
      and is_public = true
      and is_active = true
      and is_public_project = true
    )
  );

drop policy if exists "projects_insert_contractor_created" on public.projects;
create policy "projects_insert_contractor_created" on public.projects
  for insert with check (
    public.is_contractor_profile()
    and source_type = 'contractor_created'
    and created_by = auth.uid()
    and review_status = 'pending_review'
  );

drop policy if exists "projects_update_contractor_created_or_claimed" on public.projects;
create policy "projects_update_contractor_created_or_claimed" on public.projects
  for update using (
    public.can_edit_project_jobsite(id)
  ) with check (
    public.can_edit_project_jobsite(id)
  );

create or replace function public.is_major_project(p_project_id bigint)
returns boolean
language sql
stable
as $$
  select exists (
    select 1
    from public.projects
    where projects.id = p_project_id
      and projects.is_active = true
      and projects.is_public_project = true
      and projects.review_status = 'approved'
      and projects.is_public = true
      and (
        projects.estimated_value is null
        or projects.estimated_value >= 5000000
        or projects.source_type = 'contractor_created'
      )
  );
$$;

drop policy if exists "project_images_select_public_projects" on public.project_images;
create policy "project_images_select_public_projects" on public.project_images
  for select using (
    exists (
      select 1
      from public.projects
      where projects.id = project_images.project_id
        and projects.is_active = true
        and projects.is_public_project = true
        and projects.review_status = 'approved'
        and projects.is_public = true
    )
    or public.is_admin_profile()
    or public.can_manage_project_image(project_id, company_id)
  );

notify pgrst, 'reload schema';
