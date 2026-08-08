-- Construction project eligibility rules for public map visibility.
-- Excluded projects stay in the database with map_eligible = false.

alter table public.projects
  add column if not exists map_eligible boolean not null default true,
  add column if not exists eligibility_reason text not null default 'eligible';

alter table public.project_import_reports
  add column if not exists eligible_count integer not null default 0,
  add column if not exists excluded_count integer not null default 0,
  add column if not exists exclusion_reasons jsonb not null default '{}'::jsonb;

create index if not exists projects_map_eligible_public_idx
on public.projects(project_name, id)
where is_active = true
  and is_public_project = true
  and map_eligible = true;

create or replace function public.jf_project_eligibility_reason(
  p_project_type text,
  p_sector text,
  p_project_name text,
  p_description text
)
returns text
language plpgsql
immutable
as $$
declare
  v_text text := lower(concat_ws(' ', p_project_type, p_sector, p_project_name, p_description));
begin
  v_text := regexp_replace(coalesce(v_text, ''), '\s+', ' ', 'g');

  if v_text = '' then return 'excluded_other'; end if;

  if v_text ~ '\m(research)\M|scientific stud(y|ies)|wildlife stud(y|ies)|environmental monitoring|archaeolog(ical|y)' then
    return 'excluded_research';
  end if;

  if v_text ~ '\mpermit(s|ting)?\M|licen[cs]e renewal|water licen[cs]e application|land application|forestry permit|agriculture permit|recreation permit|tourism permit' then
    return 'excluded_permit';
  end if;

  if v_text ~ 'exploration[- ]?only|mineral exploration|exploration program' then
    return 'excluded_exploration';
  end if;

  if v_text ~ 'assessment[- ]?only|impact assessment|environmental assessment|feasibility stud(y|ies)' then
    return 'excluded_assessment';
  end if;

  if v_text ~ 'administrative amendment|\mamendment(s)?\M|permit renewal|licen[cs]e renewal|extension request' then
    return 'excluded_administrative';
  end if;

  if v_text ~ '\mresidential\M|\mhousing\M|apartment|condo|minium|townhome|\mcommercial\M|\moffice\M|\mretail\M|\mindustrial\M|warehouse|manufacturing|\mroad(s)?\M|\mhighway(s)?\M|\mbridge(s)?\M|interchange|airport.*(upgrade|expansion|terminal|runway|apron|redevelopment|improvement)|(upgrade|expansion|terminal|runway|apron|redevelopment|improvement).*airport|water.*(treatment|infrastructure|plant|main|distribution|reservoir)|wastewater|\msewer\M|\menergy\M|\mpower\M|transmission|substation|\msolar\M|\mwind\M|\mhydro\M|battery storage|pipeline|mine.*(expansion|development|construction|facility|infrastructure)|mining.*(expansion|development|construction|facility|infrastructure)|\mcamp(s)?\M|industrial facilit(y|ies)' then
    return 'eligible';
  end if;

  return 'excluded_other';
end;
$$;

create or replace function public.jf_is_eligible_construction_project(
  p_project_type text,
  p_sector text,
  p_project_name text,
  p_description text
)
returns boolean
language sql
immutable
as $$
  select public.jf_project_eligibility_reason($1, $2, $3, $4) = 'eligible';
$$;

update public.projects
set
  eligibility_reason = public.jf_project_eligibility_reason(project_type, sector, project_name, description),
  map_eligible = public.jf_is_eligible_construction_project(project_type, sector, project_name, description)
where eligibility_reason is null
  or eligibility_reason = 'eligible';

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
      and projects.map_eligible = true
      and (
        projects.estimated_value is null
        or projects.estimated_value >= 5000000
      )
  );
$$;

drop function if exists public.run_canada_project_import(text, text, text);

create or replace function public.run_canada_project_import(
  p_staging_table text default 'jobsite_project_import_staging',
  p_source_name text default 'government_import',
  p_import_batch text default null
)
returns table (
  import_batch text,
  total_rows integer,
  imported integer,
  duplicate_skipped integer,
  review_required integer,
  eligible integer,
  excluded integer,
  exclusion_reasons jsonb,
  report_id bigint
)
language plpgsql
as $$
declare
  v_report_id bigint;
  v_batch text := coalesce(nullif(trim(p_import_batch), ''), 'import-' || to_char(now(), 'YYYYMMDD-HH24MISS'));
  v_staging regclass;
begin
  v_staging := to_regclass('public.' || quote_ident(p_staging_table));
  if v_staging is null then
    raise exception 'Staging table public.% does not exist.', p_staging_table;
  end if;

  execute format(
    'create temporary table jf_import_incoming on commit drop as
     select * from (
       select
         row_number() over () as row_id,
         nullif(trim(project_name), '''') as project_name,
         nullif(trim(project_type), '''') as project_type,
         nullif(trim(sector), '''') as sector,
         nullif(trim(city), '''') as city,
         nullif(trim(region), '''') as region,
         nullif(trim(province), '''') as province,
         nullif(trim(address), '''') as address,
         latitude::numeric as latitude,
         longitude::numeric as longitude,
         coalesce(nullif(trim(stage), ''''), ''planned'') as stage,
         coalesce(nullif(trim(status), ''''), ''upcoming'') as status,
         estimated_value::numeric as estimated_value,
         nullif(trim(owner), '''') as owner,
         nullif(trim(general_contractor), '''') as general_contractor,
         start_date,
         end_date,
         nullif(trim(description), '''') as description,
         nullif(trim(source_url), '''') as source_url,
         coalesce(is_active, true) as is_active,
         coalesce(is_public_project, true) as is_public_project,
         public.jf_normalize_import_text(project_name) as name_key,
         public.jf_normalize_import_text(city) as city_key,
         upper(trim(coalesce(province, ''''))) as province_key
       from %s
     ) incoming',
    v_staging
  );

  alter table jf_import_incoming add column import_status text;
  alter table jf_import_incoming add column reason text;
  alter table jf_import_incoming add column existing_project_id bigint;
  alter table jf_import_incoming add column name_similarity numeric;
  alter table jf_import_incoming add column distance_meters numeric;
  alter table jf_import_incoming add column eligibility_reason text;
  alter table jf_import_incoming add column map_eligible boolean;

  update jf_import_incoming
  set
    eligibility_reason = public.jf_project_eligibility_reason(project_type, sector, project_name, description),
    map_eligible = public.jf_is_eligible_construction_project(project_type, sector, project_name, description);

  update jf_import_incoming
  set import_status = 'review_required',
      reason = 'missing required project_name or province'
  where project_name is null or province is null;

  update jf_import_incoming
  set import_status = 'review_required',
      reason = 'test/demo/sample row'
  where import_status is null
    and project_name ~* '^\s*(test|demo|sample)\b';

  with duplicate_in_file as (
    select row_id
    from (
      select row_id, row_number() over (partition by name_key, city_key, province_key order by row_id) as duplicate_rank
      from jf_import_incoming
      where import_status is null
    ) ranked
    where duplicate_rank > 1
  )
  update jf_import_incoming i
  set import_status = 'review_required',
      reason = 'duplicate inside import file'
  from duplicate_in_file d
  where i.row_id = d.row_id;

  with exact_matches as (
    select distinct on (i.row_id) i.row_id, p.id as project_id
    from jf_import_incoming i
    join public.projects p
      on public.jf_normalize_import_text(p.project_name) = i.name_key
     and public.jf_normalize_import_text(p.city) = i.city_key
     and upper(trim(coalesce(p.province, ''))) = i.province_key
    where i.import_status is null
    order by i.row_id, p.id
  )
  update jf_import_incoming i
  set import_status = 'duplicate_skipped',
      reason = 'exact duplicate: project_name, city, province',
      existing_project_id = e.project_id
  from exact_matches e
  where i.row_id = e.row_id;

  with coordinate_matches as (
    select distinct on (i.row_id)
      i.row_id,
      p.id as project_id,
      similarity(public.jf_normalize_import_text(p.project_name), i.name_key)::numeric as sim,
      public.jf_distance_meters(i.latitude, i.longitude, p.latitude::numeric, p.longitude::numeric) as meters
    from jf_import_incoming i
    join public.projects p
      on i.latitude is not null
     and i.longitude is not null
     and p.latitude is not null
     and p.longitude is not null
     and public.jf_distance_meters(i.latitude, i.longitude, p.latitude::numeric, p.longitude::numeric) <= 500
     and similarity(public.jf_normalize_import_text(p.project_name), i.name_key) >= 0.72
    where i.import_status is null
    order by i.row_id, sim desc, meters asc, p.id
  )
  update jf_import_incoming i
  set import_status = 'review_required',
      reason = 'possible coordinate/name duplicate within 500 meters',
      existing_project_id = c.project_id,
      name_similarity = c.sim,
      distance_meters = c.meters
  from coordinate_matches c
  where i.row_id = c.row_id;

  update jf_import_incoming
  set import_status = 'imported',
      reason = 'new project'
  where import_status is null;

  update public.projects p
  set
    project_type = coalesce(p.project_type, i.project_type),
    sector = coalesce(p.sector, i.sector),
    city = coalesce(p.city, i.city),
    region = coalesce(p.region, i.region),
    province = coalesce(p.province, i.province),
    address = coalesce(p.address, i.address),
    latitude = coalesce(p.latitude, i.latitude),
    longitude = coalesce(p.longitude, i.longitude),
    stage = coalesce(nullif(trim(p.stage), ''), i.stage),
    status = coalesce(nullif(trim(p.status), ''), i.status),
    estimated_value = coalesce(p.estimated_value, i.estimated_value),
    owner = coalesce(p.owner, i.owner),
    general_contractor = coalesce(p.general_contractor, i.general_contractor),
    start_date = coalesce(p.start_date, i.start_date),
    end_date = coalesce(p.end_date, i.end_date),
    description = coalesce(p.description, i.description),
    source_url = coalesce(p.source_url, i.source_url),
    is_active = coalesce(p.is_active, i.is_active),
    is_public_project = coalesce(p.is_public_project, i.is_public_project),
    map_eligible = i.map_eligible,
    eligibility_reason = i.eligibility_reason,
    source_name = coalesce(p.source_name, p_source_name),
    import_batch = coalesce(p.import_batch, v_batch),
    last_imported_at = now()
  from jf_import_incoming i
  where i.import_status = 'duplicate_skipped'
    and p.id = i.existing_project_id;

  insert into public.projects (
    project_name, project_type, sector, city, region, province, address,
    latitude, longitude, stage, status, estimated_value, owner,
    general_contractor, start_date, end_date, description, source_url,
    is_active, is_public_project, map_eligible, eligibility_reason,
    source_name, import_batch, last_imported_at
  )
  select
    project_name, project_type, sector, city, region, province, address,
    latitude, longitude, stage, status, estimated_value, owner,
    general_contractor, start_date, end_date, description, source_url,
    is_active, is_public_project, map_eligible, eligibility_reason,
    p_source_name, v_batch, now()
  from jf_import_incoming
  where import_status = 'imported';

  insert into public.project_import_reports (
    import_batch, source_name, staging_table, total_rows, imported_count,
    duplicate_skipped_count, review_required_count, eligible_count,
    excluded_count, exclusion_reasons
  )
  select
    v_batch,
    p_source_name,
    p_staging_table,
    count(*)::integer,
    count(*) filter (where import_status = 'imported')::integer,
    count(*) filter (where import_status = 'duplicate_skipped')::integer,
    count(*) filter (where import_status = 'review_required')::integer,
    count(*) filter (where map_eligible = true)::integer,
    count(*) filter (where map_eligible = false)::integer,
    (
      select coalesce(jsonb_object_agg(reason, reason_count), '{}'::jsonb)
      from (
        select eligibility_reason as reason, count(*) as reason_count
        from jf_import_incoming
        where eligibility_reason <> 'eligible'
        group by eligibility_reason
      ) reason_counts
    )
  from jf_import_incoming
  returning id into v_report_id;

  insert into public.project_import_review_items (
    report_id, import_batch, source_name, import_status, reason,
    existing_project_id, incoming_project_name, incoming_city,
    incoming_province, incoming_latitude, incoming_longitude,
    matched_project_name, matched_city, matched_province, matched_latitude,
    matched_longitude, name_similarity, distance_meters
  )
  select
    v_report_id, v_batch, p_source_name, i.import_status,
    case when i.map_eligible = false then i.eligibility_reason else i.reason end,
    i.existing_project_id, i.project_name, i.city, i.province, i.latitude,
    i.longitude, p.project_name, p.city, p.province, p.latitude, p.longitude,
    i.name_similarity, i.distance_meters
  from jf_import_incoming i
  left join public.projects p on p.id = i.existing_project_id
  where i.import_status in ('duplicate_skipped', 'review_required')
     or i.map_eligible = false;

  return query
  select
    v_batch,
    r.total_rows,
    r.imported_count,
    r.duplicate_skipped_count,
    r.review_required_count,
    r.eligible_count,
    r.excluded_count,
    r.exclusion_reasons,
    r.id
  from public.project_import_reports r
  where r.id = v_report_id;
end;
$$;

notify pgrst, 'reload schema';
