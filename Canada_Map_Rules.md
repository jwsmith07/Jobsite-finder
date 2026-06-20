# Canada Map Visibility Rules

The public Jobsites Map is province-agnostic. It does not contain Alberta-, BC-, or territory-specific project logic.

## A Project Appears On The Map When

- `is_active = true`
- `is_public_project = true`
- It has valid decimal `latitude` and `longitude`
- It is not completed
- It is not cancelled
- It is not on hold
- It is not hidden by the user's current filters

Rows without coordinates should remain in the database for search, admin review, future geocoding, and import audit work. They simply do not render pins.

## Stage Groups

The map UI stays simple:

| Map group | Source/import values |
| --- | --- |
| Active | `construction`, `active`, under construction, underway, in progress, near completion, closeout, commissioning |
| Upcoming | `planning`, `proposed`, `design`, `upcoming`, `planned`, permit, tender, bid, procurement, mobilization |
| Hidden by default | `on_hold`, `completed`, `cancelled`, unknown/unmapped values |

## Filters

Public map filters should remain:

- Active
- Upcoming
- Hiring
- Claimed

Province/territory options are generated from imported project data. Do not hardcode a province into the React map when importing a new CSV.
