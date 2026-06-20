# Canada Source Tracking Standard

Source tracking makes re-imports, audits, duplicate prevention, and claim review reliable.

## Required Fields

| Field | Type | Required | Description |
| --- | --- | --- | --- |
| `source_dataset` | text | yes | Stable slug for the dataset, such as `ab_major_projects` or `bc_major_projects`. |
| `source_id` | text | yes | Stable project identifier from the source. |
| `source_url` | text/url | yes when available | Project detail URL, dataset record URL, or dataset landing URL. |
| `source_last_updated` | date/datetime | yes when available | Last modified date from the source system or dataset metadata. |

## Import Tracking Structure

Future import tables or metadata should track:

| Field | Type | Purpose |
| --- | --- | --- |
| `import_run_id` | text/uuid | Groups rows imported in one run. |
| `imported_at` | datetime | Audit timestamp. |
| `imported_by` | text/uuid | Admin/system actor. |
| `source_record_hash` | text | Detects changed source rows. |
| `raw_source_payload` | json | Optional raw record for audit/debugging. |
| `import_status` | enum | Imported, updated, skipped, review_required, failed. |
| `import_notes` | text | Human-readable import decisions. |

## Rules

- Always preserve the source identity even after a project is claimed.
- Do not let contractor updates overwrite source tracking fields.
- Prefer record-level URLs over dataset landing URLs.
- If only a dataset URL exists, use it consistently for every row and rely on `source_id` for record identity.
- If `source_last_updated` is unavailable, use the dataset publication date and document that choice in the dataset guide.
