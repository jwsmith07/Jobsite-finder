-- Province project import utilities for Jobsite Finder.
-- Replace jobsite_project_import_staging with your staging table name if needed.
-- Expected staging columns match Canada_Master_Import_Template.csv.

-- 1) Apply import defaults in staging before review/publish.
update jobsite_project_import_staging
set
  is_active = coalesce(is_active, true),
  is_public_project = coalesce(is_public_project, true),
  stage = coalesce(nullif(trim(stage), ''), 'planned'),
  status = coalesce(nullif(trim(status), ''), 'upcoming');

-- 1b) Preview construction eligibility before review/publish.
select
  public.jf_project_eligibility_reason(project_type, sector, project_name, description) as eligibility_reason,
  count(*) as row_count
from jobsite_project_import_staging
group by public.jf_project_eligibility_reason(project_type, sector, project_name, description)
order by eligibility_reason;

-- 1c) Import summary preview: total imported, eligible, excluded, and exclusion reasons.
select
  count(*) as total_imported,
  count(*) filter (
    where public.jf_is_eligible_construction_project(project_type, sector, project_name, description)
  ) as eligible,
  count(*) filter (
    where not public.jf_is_eligible_construction_project(project_type, sector, project_name, description)
  ) as excluded,
  (
    select coalesce(jsonb_object_agg(reason, reason_count), '{}'::jsonb)
    from (
      select
        public.jf_project_eligibility_reason(project_type, sector, project_name, description) as reason,
        count(*) as reason_count
      from jobsite_project_import_staging
      group by public.jf_project_eligibility_reason(project_type, sector, project_name, description)
      having public.jf_project_eligibility_reason(project_type, sector, project_name, description) <> 'eligible'
    ) reason_counts
  ) as exclusion_reasons
from jobsite_project_import_staging;

-- 2) Preview imported province/territory counts.
select
  province,
  count(*) as row_count
from jobsite_project_import_staging
group by province
order by province;

-- 3) Count rows with valid Canada-ish coordinates.
select count(*) as valid_coordinate_rows
from jobsite_project_import_staging
where
  latitude between 41 and 84
  and longitude between -142 and -52;

-- 4) Count rows missing or invalid coordinates.
select count(*) as missing_or_invalid_coordinate_rows
from jobsite_project_import_staging
where
  latitude is null
  or longitude is null
  or latitude not between 41 and 84
  or longitude not between -142 and -52;

-- 5) Count likely duplicates inside the incoming file.
select
  lower(trim(project_name)) as project_name_key,
  upper(trim(province)) as province_key,
  lower(trim(coalesce(city, ''))) as city_key,
  estimated_value,
  count(*) as duplicate_count
from jobsite_project_import_staging
group by
  lower(trim(project_name)),
  upper(trim(province)),
  lower(trim(coalesce(city, ''))),
  estimated_value
having count(*) > 1
order by duplicate_count desc, project_name_key;

-- 6) Count likely duplicates against existing projects.
select count(*) as likely_existing_duplicates
from jobsite_project_import_staging s
join projects p
  on lower(trim(p.project_name)) = lower(trim(s.project_name))
  and upper(trim(p.province)) = upper(trim(s.province))
  and lower(trim(coalesce(p.city, ''))) = lower(trim(coalesce(s.city, '')))
  and coalesce(p.estimated_value, -1) = coalesce(s.estimated_value, -1);

-- 7) Publish valid-coordinate rows as public active map candidates.
-- Use this after reviewing duplicate results. This preserves app-owned fields
-- on existing rows because it updates only source-owned import fields.
insert into projects (
  project_name,
  project_type,
  sector,
  city,
  region,
  province,
  address,
  latitude,
  longitude,
  stage,
  status,
  estimated_value,
  owner,
  general_contractor,
  start_date,
  end_date,
  description,
  source_url,
  is_active,
  is_public_project,
  map_eligible,
  eligibility_reason
)
select
  nullif(trim(project_name), ''),
  nullif(trim(project_type), ''),
  nullif(trim(sector), ''),
  nullif(trim(city), ''),
  nullif(trim(region), ''),
  nullif(trim(province), ''),
  nullif(trim(address), ''),
  latitude,
  longitude,
  coalesce(nullif(trim(stage), ''), 'planned'),
  coalesce(nullif(trim(status), ''), 'upcoming'),
  estimated_value,
  nullif(trim(owner), ''),
  nullif(trim(general_contractor), ''),
  start_date,
  end_date,
  nullif(trim(description), ''),
  nullif(trim(source_url), ''),
  coalesce(is_active, true),
  coalesce(is_public_project, true),
  public.jf_is_eligible_construction_project(project_type, sector, project_name, description),
  public.jf_project_eligibility_reason(project_type, sector, project_name, description)
from jobsite_project_import_staging
where
  nullif(trim(project_name), '') is not null
  and nullif(trim(province), '') is not null
  and latitude between 41 and 84
  and longitude between -142 and -52
  and coalesce(is_active, true) = true
  and coalesce(is_public_project, true) = true;

-- 8) Keep no-coordinate rows in projects but hidden from the map.
-- They remain active/public for admin/search workflows, but the frontend will
-- not render a pin until latitude/longitude are added.
insert into projects (
  project_name,
  project_type,
  sector,
  city,
  region,
  province,
  address,
  latitude,
  longitude,
  stage,
  status,
  estimated_value,
  owner,
  general_contractor,
  start_date,
  end_date,
  description,
  source_url,
  is_active,
  is_public_project,
  map_eligible,
  eligibility_reason
)
select
  nullif(trim(project_name), ''),
  nullif(trim(project_type), ''),
  nullif(trim(sector), ''),
  nullif(trim(city), ''),
  nullif(trim(region), ''),
  nullif(trim(province), ''),
  nullif(trim(address), ''),
  null,
  null,
  coalesce(nullif(trim(stage), ''), 'planned'),
  coalesce(nullif(trim(status), ''), 'upcoming'),
  estimated_value,
  nullif(trim(owner), ''),
  nullif(trim(general_contractor), ''),
  start_date,
  end_date,
  nullif(trim(description), ''),
  nullif(trim(source_url), ''),
  coalesce(is_active, true),
  coalesce(is_public_project, true),
  public.jf_is_eligible_construction_project(project_type, sector, project_name, description),
  public.jf_project_eligibility_reason(project_type, sector, project_name, description)
from jobsite_project_import_staging
where
  nullif(trim(project_name), '') is not null
  and nullif(trim(province), '') is not null
  and (
    latitude is null
    or longitude is null
    or latitude not between 41 and 84
    or longitude not between -142 and -52
  );
