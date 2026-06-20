# Canada Status Mapping

All source project statuses must map to one universal lifecycle value.

## Universal Status Values

| Normalized status | Meaning | Public handling |
| --- | --- | --- |
| `planning` | Proposed, announced, feasibility, design, permitting, environmental review, or pre-tender. | Upcoming opportunity. |
| `procurement` | Tender, bid, RFP, RFQ, award pending, procurement, pre-construction procurement, or contract negotiation. | Active jobsite map/list eligibility when coordinates exist; strong future hiring signal. |
| `active` | Construction started, underway, in progress, under construction, mobilized, awarded and active. | Active jobsite map/list eligibility when coordinates exist. |
| `near_completion` | Commissioning, closeout, substantially complete, final works, nearing completion. | Active jobsite map/list eligibility when coordinates exist. |
| `completed` | Complete, completed, operational, opened, finished. | Hidden from active map. |
| `on_hold` | Deferred, paused, suspended, delayed indefinitely, awaiting decision. | Not map-visible unless manually approved later. |
| `cancelled` | Cancelled, canceled, abandoned, withdrawn, terminated. | Hidden. |
| `unknown` | Missing, unclear, or unmappable source status. | Review required; not active map-visible. |

## Source Keyword Mapping

| Source status contains | Map to |
| --- | --- |
| proposed, proposal, planning, planned, announced, concept, feasibility, design, permitting, permit, environmental assessment, pre-application | `planning` |
| tender, bid, bidding, procurement, RFP, RFQ, RFEOI, EOI, award pending, contract negotiation, pre-construction | `procurement` |
| active, underway, under way, under construction, construction, in progress, mobilization, mobilized, execution, implementation | `active` |
| near complete, near completion, closeout, close out, commissioning, substantially complete, final phase, final works | `near_completion` |
| complete, completed, operational, opened, finished, in service | `completed` |
| on hold, paused, suspended, deferred, delayed, pending decision | `on_hold` |
| cancelled, canceled, abandoned, withdrawn, terminated | `cancelled` |
| unknown, n/a, not available, blank, unclear | `unknown` |

## Mapping Rules

- Prefer explicit source lifecycle/status fields over descriptive text.
- If multiple source fields conflict, use the field closest to construction lifecycle and preserve the conflict in import notes.
- Procurement terms take precedence over planning terms when both appear.
- Completion/cancellation terms take precedence over all active/planning terms.
- Do not infer `active` from a future `start_date` alone.
- Preserve the original value in `status_raw` for audit and future remapping.

## Alberta Compatibility

The current app recognizes public stages `planning`, `active`, and `near_completion`. National V1 adds `procurement`, `completed`, `on_hold`, `cancelled`, and `unknown` as import-standard values. Until app support is expanded, `procurement` can be displayed as planning/upcoming in old UI surfaces while remaining `procurement` in the import file.
