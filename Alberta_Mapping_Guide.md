# Alberta Mapping Guide

This guide maps the current Alberta-compatible project architecture into the Canada Master Import Standard.

## Direct Mappings

| Canada Master field | Current app/project field | Notes |
| --- | --- | --- |
| `project_name` | `projects.project_name` | Direct. |
| `project_type` | `projects.project_type` | Direct. |
| `sector` | `projects.sector` | Direct. |
| `owner` | `projects.owner` | Direct. |
| `general_contractor` | `projects.general_contractor` | Direct. |
| `estimated_value` | `projects.estimated_value` | Direct numeric value. |
| `province` | `projects.province` | Direct; normalize to national region standard. |
| `city` | `projects.city` | Direct. |
| `region` | `projects.region` | Direct. |
| `address` | `projects.address` | Direct source/import address. |
| `latitude` | `projects.latitude` | Direct. |
| `longitude` | `projects.longitude` | Direct. |
| `status_normalized` | `projects.stage` | Current public lifecycle field. |
| `status_raw` | `projects.status` | Current raw/secondary status field. |
| `start_date` | `projects.start_date` | Direct. |
| `end_date` | `projects.end_date` | Direct. |
| `description` | `projects.description` | Direct. |
| `source_url` | `projects.source_url` | Direct. |

## Existing Architecture Support

Alberta-compatible projects already support:

- Map visibility through coordinates plus public project flags.
- Project claims through `project_claims`.
- Hiring through `job_posts` linked to approved project claims.
- Worker applications through job posts.
- Subcontractor/company connections through approved claims and company profile links.
- Contractor-maintained jobsite access details through `display_address`, `site_access_notes`, `gate_entrance`, `parking_instructions`, `muster_point`, and `google_maps_url`.

## Missing Fields

| Canada Master field | Gap |
| --- | --- |
| `source_dataset` | Not currently present as a first-class project field; closest existing field is `source_type`, but it is not a dataset key. |
| `source_id` | Not currently present as a first-class project field. |
| `source_last_updated` | Not currently present as a first-class project field. |
| `location_quality` | Not currently present as a first-class project field. |
| `status_normalized` enum | Current app stage recognizes planning/active/near_completion; national standard has additional states. |

## Recommended Upgrades

- Add source tracking columns or an import tracking table before large multi-province imports.
- Add a unique constraint or import-side upsert key on `source_dataset + source_id`.
- Add `location_quality` to distinguish exact jobsites from municipality/region-only projects.
- Expand status/stage handling to include `procurement`, `completed`, `on_hold`, `cancelled`, and `unknown`.
- Keep contractor-managed access fields separate from source-owned location fields.
- Preserve existing claim and hiring records during re-imports.
