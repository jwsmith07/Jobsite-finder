# BC Compatibility Report

This report defines how the BC Major Projects dataset should be assessed against the Canada Master Import Standard. No BC import is performed in this sprint.

## Assumption

The BC source should be treated as a provincial major projects dataset with project identity, name, status/stage, location, value, sector/category, owner/proponent, timeline, and description fields where available. A row-level `source_id` must be selected from the most stable BC identifier before import.

## Map Ready

BC records are map ready when all conditions are true:

- Valid `source_dataset` and `source_id`.
- Non-empty `project_name`.
- `province` normalized to British Columbia or BC.
- `status_normalized` is `active`, `procurement`, or `near_completion`.
- Valid `latitude` and `longitude`.
- `location_quality` is `exact` or `address`.
- No high-confidence duplicate candidate exists.

Expected output category:

```text
Map Ready
```

## Upcoming

BC records are upcoming when:

- `status_normalized` is `planning`.
- Coordinates may be missing or approximate.
- `project_name` and `province` are present.
- Location can be represented by `city`, `region`, or description without creating an exact map pin.

Expected output category:

```text
Upcoming
```

## Review Required

BC records require review when any condition is true:

- Missing `source_id`.
- Missing `project_name`.
- Missing or invalid `province`.
- `status_normalized` maps to `unknown`.
- Active/procurement/near-completion record has missing or invalid coordinates.
- Coordinates fall outside British Columbia or conflict with stated city/region.
- `estimated_value` cannot be parsed and is needed for duplicate confidence.
- Fallback duplicate candidate matches `project_name + province + city + estimated_value`.
- Source status indicates `completed`, `cancelled`, or `on_hold` but the record appears otherwise active.

Expected output category:

```text
Review Required
```

## BC Field Mapping Targets

| Canada Master field | BC mapping target |
| --- | --- |
| `source_dataset` | Constant, recommended `bc_major_projects`. |
| `source_id` | Stable BC project/record identifier. |
| `source_url` | BC project detail or dataset URL. |
| `source_last_updated` | BC record or dataset modified date. |
| `project_name` | BC project name/title. |
| `project_type` | BC project type/category when available. |
| `sector` | BC sector/industry/category. |
| `owner` | Proponent/owner. |
| `general_contractor` | Contractor field if available; otherwise blank. |
| `estimated_value` | Capital cost/value normalized to numeric CAD. |
| `city` | Municipality/community. |
| `region` | BC region/development region. |
| `address` | Site address if present. |
| `latitude` / `longitude` | Source coordinates or verified geocode. |
| `location_quality` | Based on coordinate/address precision. |
| `status_raw` | Original BC status/stage. |
| `status_normalized` | Canada status mapping. |
| `start_date` / `end_date` | Construction/start/completion dates where available. |
| `description` | Project description. |

## Compatibility Conclusion

BC is compatible with the Canada Master Import Standard if the import process can produce stable `source_dataset/source_id`, normalize BC statuses into the national enum, validate coordinates, and route approximate or duplicate-prone rows into review. The next sprint should generate an actual BC master-format CSV and counts for Map Ready, Upcoming, and Review Required.
