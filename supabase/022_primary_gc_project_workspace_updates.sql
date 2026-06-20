-- Allow approved Primary GCs to manage selected project workspace fields.
-- Preserves admin access, contractor-created owner edits, and existing claim flows.

create or replace function public.has_approved_primary_gc_project_claim(p_project_id bigint)
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
      and project_claims.company_role = 'gc'
      and project_claims.is_primary_gc = true
      and company_profiles.profile_id = auth.uid()
  );
$$;

create or replace function public.guard_project_contractor_location_update()
returns trigger
language plpgsql
as $$
declare
  contractor_created_keys text[] := array[
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
    'is_public',
    'contractor_location_updated_at',
    'contractor_location_updated_by'
  ];
  primary_gc_keys text[] := array[
    'description',
    'stage',
    'hiring_status',
    'end_date',
    'trades_needed',
    'is_public',
    'display_address',
    'site_access_notes',
    'gate_entrance',
    'parking_instructions',
    'muster_point',
    'google_maps_url',
    'contractor_location_updated_at',
    'contractor_location_updated_by'
  ];
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
    then
      raise exception 'Review fields can only be changed by an admin.';
    end if;
    if (to_jsonb(new) - contractor_created_keys) is distinct from (to_jsonb(old) - contractor_created_keys) then
      raise exception 'Only contractor-created jobsite fields can be updated by the owner.';
    end if;
  else
    if (to_jsonb(new) - primary_gc_keys) is distinct from (to_jsonb(old) - primary_gc_keys) then
      raise exception 'Only approved Primary GCs can update project workspace fields.';
    end if;
    if not public.has_approved_primary_gc_project_claim(old.id) then
      raise exception 'Only the approved Primary GC can update this project.';
    end if;
  end if;

  if to_jsonb(new) is distinct from to_jsonb(old) then
    new.contractor_location_updated_at = now();
    new.contractor_location_updated_by = auth.uid();
  end if;

  return new;
end;
$$;

notify pgrst, 'reload schema';
