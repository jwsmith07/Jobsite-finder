export const CANADIAN_REGIONS = [
  { code: 'AB', label: 'Alberta', aliases: ['ab', 'alta', 'alta.', 'alberta'] },
  { code: 'BC', label: 'British Columbia', aliases: ['bc', 'b.c.', 'british columbia'] },
  { code: 'SK', label: 'Saskatchewan', aliases: ['sk', 'sask', 'sask.', 'saskatchewan'] },
  { code: 'MB', label: 'Manitoba', aliases: ['mb', 'man', 'man.', 'manitoba'] },
  { code: 'ON', label: 'Ontario', aliases: ['on', 'ont', 'ont.', 'ontario'] },
  { code: 'QC', label: 'Quebec', aliases: ['qc', 'que', 'que.', 'quebec', 'québec'] },
  { code: 'NB', label: 'New Brunswick', aliases: ['nb', 'n.b.', 'new brunswick'] },
  { code: 'NS', label: 'Nova Scotia', aliases: ['ns', 'n.s.', 'nova scotia'] },
  { code: 'PE', label: 'Prince Edward Island', aliases: ['pe', 'pei', 'p.e.i.', 'prince edward island'] },
  {
    code: 'NL',
    label: 'Newfoundland and Labrador',
    aliases: ['nl', 'n.l.', 'newfoundland', 'labrador', 'newfoundland and labrador'],
  },
  { code: 'YT', label: 'Yukon', aliases: ['yt', 'y.t.', 'yukon'] },
  { code: 'NT', label: 'Northwest Territories', aliases: ['nt', 'n.t.', 'nwt', 'northwest territories'] },
  { code: 'NU', label: 'Nunavut', aliases: ['nu', 'nunavut'] },
]

const REGION_BY_CODE = CANADIAN_REGIONS.reduce((acc, region) => {
  acc[region.code] = region
  return acc
}, {})

const CODE_BY_ALIAS = CANADIAN_REGIONS.reduce((acc, region) => {
  acc[region.code.toLowerCase()] = region.code
  acc[region.label.toLowerCase()] = region.code
  for (const alias of region.aliases) {
    acc[alias.toLowerCase()] = region.code
  }
  return acc
}, {})

export function normalizeCanadianRegion(value) {
  const key = String(value || '').trim().toLowerCase()
  return CODE_BY_ALIAS[key] || null
}

export function getCanadianRegionLabel(codeOrName) {
  const code = normalizeCanadianRegion(codeOrName)
  return code ? REGION_BY_CODE[code]?.label || code : ''
}
