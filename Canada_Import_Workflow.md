# Canada Province Import Workflow

Use this flow for every new province or territory CSV. The frontend does not need custom province code when the CSV follows the master schema.

## 1. Prepare The CSV

Use `Canada_Master_Import_Template.csv` exactly:

```csv
project_name,project_type,sector,city,region,province,address,latitude,longitude,stage,status,estimated_value,owner,general_contractor,start_date,end_date,description,source_url,is_active,is_public_project
```

Apply defaults before publishing:

- Missing/blank `is_active` -> `true`
- Missing/blank `is_public_project` -> `true`
- Blank `stage` -> `planned`
- Blank `status` -> `upcoming`

## 2. Load To Staging

Import the CSV into a temporary or staging table with the same columns, for example `jobsite_project_import_staging`.

Do not import directly into `projects` until preview counts, coordinate counts, and duplicate checks have been reviewed.

## 3. Run Safety Checks

Use [supabase/029_province_project_import_utilities.sql](supabase/029_province_project_import_utilities.sql) for quick preview checks:

- Preview imported province counts
- Count valid coordinates
- Count missing or invalid coordinates
- Count likely duplicates inside the import file
- Count likely duplicates against existing `projects`

Use [supabase/030_canada_import_duplicate_protection.sql](supabase/030_canada_import_duplicate_protection.sql) for the actual import. It protects existing project IDs, skips exact duplicates, flags likely coordinate/name duplicates for review, and writes an import report.

## 4. Publish

After loading the CSV into staging, run:

```sql
select * from public.run_canada_project_import(
  'jobsite_project_import_staging',
  'Source Name',
  'province-or-territory-batch-id'
);
```

The importer creates a report with:

- `imported`
- `duplicate_skipped`
- `review_required`

Review duplicate/report rows before importing another batch:

```sql
select *
from public.project_import_review_items
where import_batch = 'province-or-territory-batch-id'
order by import_status, reason, incoming_project_name;
```

Rows with valid coordinates can appear on the map when they are active/public and not completed, cancelled, or on hold. Rows missing coordinates stay in the database for review/geocoding and will not render pins.

## 5. Verify In The App

Open the Jobsites Map and confirm:

- The new province/territory appears in the Province/Territory filter automatically.
- Active and Upcoming filters group stages correctly.
- Hiring and Claimed filters still work.
- No completed/cancelled/on-hold projects appear on the public map.
