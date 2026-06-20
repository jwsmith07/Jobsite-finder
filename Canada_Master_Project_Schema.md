# Canada Master Project Schema

This is the required CSV contract for provincial and territorial imports. It matches the existing `projects` table fields used by Jobsite Finder, so adding Yukon, NWT, Nunavut, Saskatchewan, Manitoba, Ontario, or any later province/territory does not require frontend changes.

## Required CSV Header

```csv
project_name,project_type,sector,city,region,province,address,latitude,longitude,stage,status,estimated_value,owner,general_contractor,start_date,end_date,description,source_url,is_active,is_public_project
```

## Field Rules

| Field | Required | Notes |
| --- | --- | --- |
| `project_name` | yes | Public project/jobsite name. |
| `project_type` | no | Building, road, hospital, mine, school, energy, etc. |
| `sector` | no | Public, private, infrastructure, industrial, commercial, institutional, residential, energy, etc. |
| `city` | no | Municipality/community. Do not invent if unknown. |
| `region` | no | District, county, provincial region, or territory region. |
| `province` | yes | Province/territory name or code. The app normalizes Canadian names/codes for filtering. |
| `address` | no | Civic/site address when known. |
| `latitude` | no | Decimal WGS84. Rows without valid coordinates stay in the database but do not render map pins. |
| `longitude` | no | Decimal WGS84. Rows without valid coordinates stay in the database but do not render map pins. |
| `stage` | no | Defaults to `planned` when blank. Normalized by the map into Active/Upcoming/hidden groups. |
| `status` | no | Defaults to `upcoming` when blank. Completed/cancelled rows are hidden from the public map. |
| `estimated_value` | no | Numeric CAD value preferred; leave blank if unknown. |
| `owner` | no | Owner/developer/public agency. |
| `general_contractor` | no | General contractor or construction manager when known. |
| `start_date` | no | ISO `YYYY-MM-DD` preferred. |
| `end_date` | no | ISO `YYYY-MM-DD` preferred. |
| `description` | no | Plain text source-safe summary. |
| `source_url` | no | Source project page or dataset URL. |
| `is_active` | no | Defaults to `true` when missing/blank. |
| `is_public_project` | no | Defaults to `true` when missing/blank. |

## Import Defaults

Apply these defaults during CSV cleanup or SQL staging before inserting/upserting into `projects`:

- `is_active = true` when missing or blank.
- `is_public_project = true` when missing or blank.
- `stage = planned` when blank.
- `status = upcoming` when blank.
- Blank optional text/date/value fields should import as `null`, not placeholder text.

## Map Stage Groups

- Active: `construction`, `active`, and near-completion/closeout values.
- Upcoming: `planning`, `proposed`, `design`, `upcoming`, `planned`, procurement/tender/bid values.
- Hidden by default: `on_hold`, `completed`, `cancelled`, plus rows hidden by filters or missing valid coordinates.

## Public Map Eligibility

A project can appear on the Jobsites Map when all of these are true:

- `is_active = true`
- `is_public_project = true`
- Valid `latitude` and `longitude`
- Not completed
- Not cancelled
- Not on hold
- Not hidden by user filters

Province filters are generated from the project data loaded by the app. Do not add province-specific frontend code for new CSVs.
