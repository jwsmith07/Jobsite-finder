# Canada Duplicate Prevention Rules

National imports must prevent duplicate projects across repeat dataset imports and across overlapping provincial/national sources.

## Primary Key

Use this compound external key:

```text
source_dataset + source_id
```

Rules:

- `source_dataset` must be stable across import runs.
- `source_id` must be stable across import runs.
- If a row with the same compound key already exists, update the existing project rather than creating a new one.
- Never use project name alone as a primary key.

## Fallback Detection

When no existing primary key match is found, flag duplicate candidates using:

```text
project_name + province + city + estimated_value
```

Fallback candidate rules:

- Normalize case, whitespace, punctuation, and common corporate suffixes before comparing names.
- Treat blank `estimated_value` as weak evidence, not a match.
- Treat same `project_name` and `province` with nearby coordinates as a strong candidate even when `city` differs.
- Treat same owner/general contractor as supporting evidence.
- Do not auto-merge fallback candidates unless the dataset-specific import guide allows it.

## Update Behavior

- Preserve existing app-owned fields such as claim state, approved company connections, contractor jobsite access notes, project images, and open job posts.
- Update source-owned fields from the latest dataset when the primary key matches.
- Do not overwrite manually curated values with blanks.
- Store or compute an import hash in future versions to detect unchanged rows.

## Review Queue

Flag rows for review when:

- Primary key is missing.
- Fallback match confidence is high but `source_dataset/source_id` differs.
- Coordinates conflict with the existing project province/city.
- Source indicates completed/cancelled but the app has active hiring activity.
