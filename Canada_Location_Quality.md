# Canada Location Quality Standard

`location_quality` describes how precise and trustworthy the imported location is. It determines map visibility, search behavior, and geocoding priority.

## Values

| Value | Definition | Coordinates | Map behavior | Search behavior |
| --- | --- | --- | --- | --- |
| `exact` | Verified project/site coordinates or parcel/site point. | Required for active map visibility. | Can show a pin. | Search by project, address, city, and nearby coordinates. |
| `address` | Civic address or intersection is known, but coordinates may be source-provided or geocoded. | Required for active map visibility after validation/geocoding. | Can show a pin once coordinates pass validation. | Search by address and city. |
| `municipality` | Only municipality/community is known. | Optional. | Do not show as exact active jobsite pin unless manually approved. | Search/list by municipality. |
| `region` | Only region/district/provincial area is known. | Optional. | Not active map-visible. | Search/list by region and province. |
| `unknown` | No reliable location. | Blank. | Hidden from map. | Search by project/province only after review. |

## Validation

- `exact` rows should have source-provided or manually verified WGS84 coordinates.
- `address` rows must include a usable `address` and at least `city` or `region`.
- `municipality` rows must include `city`.
- `region` rows must include `region` or a known regional descriptor.
- `unknown` rows should not include invented coordinates.
- Coordinates must fall inside or reasonably near Canada and match the stated province/territory.

## Geocoding Priority

1. `address`
2. `municipality`
3. `region`
4. `unknown`

`exact` records do not need geocoding unless coordinates fail validation.
