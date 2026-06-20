const ELIGIBLE_CATEGORY_PATTERNS = [
  /\bresidential\b/,
  /\bhousing\b/,
  /\bapartment(s)?\b/,
  /\bcondo(minium)?(s)?\b/,
  /\btownhome(s)?\b/,
  /\bcommercial\b/,
  /\boffice\b/,
  /\bretail\b/,
  /\bindustrial\b/,
  /\bwarehouse\b/,
  /\bmanufacturing\b/,
  /\broad(s)?\b/,
  /\bhighway(s)?\b/,
  /\bbridge(s)?\b/,
  /\binterchange(s)?\b/,
  /\bairport\b.*\b(upgrade|expansion|terminal|runway|apron|redevelopment|improvement)s?\b/,
  /\b(upgrade|expansion|terminal|runway|apron|redevelopment|improvement)s?\b.*\bairport\b/,
  /\bwater\b.*\b(treatment|infrastructure|plant|main|distribution|reservoir)\b/,
  /\bwastewater\b/,
  /\bsewer\b/,
  /\benergy\b/,
  /\bpower\b/,
  /\btransmission\b/,
  /\bsubstation\b/,
  /\bsolar\b/,
  /\bwind\b/,
  /\bhydro\b/,
  /\bbattery storage\b/,
  /\bpipeline\b/,
  /\bmine\b.*\b(expansion|development|construction|facility|infrastructure)\b/,
  /\bmining\b.*\b(expansion|development|construction|facility|infrastructure)\b/,
  /\bcamp(s)?\b/,
  /\bindustrial facilit(y|ies)\b/,
]

const EXCLUSION_PATTERNS = {
  excluded_research: [
    /\bresearch\b/,
    /\bscientific stud(y|ies)\b/,
    /\bwildlife stud(y|ies)\b/,
    /\benvironmental monitoring\b/,
    /\barchaeolog(ical|y)\b/,
  ],
  excluded_permit: [
    /\bpermit(s|ting)?\b/,
    /\blicen[cs]e renewal(s)?\b/,
    /\bwater licen[cs]e application(s)?\b/,
    /\bland application(s)?\b/,
    /\bforestry permit(s)?\b/,
    /\bagriculture permit(s)?\b/,
    /\brecreation permit(s)?\b/,
    /\btourism permit(s)?\b/,
  ],
  excluded_exploration: [
    /\bexploration[-\s]?only\b/,
    /\bmineral exploration\b/,
    /\bexploration program\b/,
  ],
  excluded_assessment: [
    /\bassessment[-\s]?only\b/,
    /\bimpact assessment\b/,
    /\benvironmental assessment\b/,
    /\bfeasibility stud(y|ies)\b/,
  ],
  excluded_administrative: [
    /\badministrative amendment(s)?\b/,
    /\bamendment(s)?\b/,
    /\bpermit renewal(s)?\b/,
    /\blicen[cs]e renewal(s)?\b/,
    /\bextension request(s)?\b/,
  ],
}

function normalizeText(value) {
  return String(value || '').toLowerCase().replace(/\s+/g, ' ').trim()
}

function getProjectSearchText(project = {}) {
  return [
    project.project_type,
    project.sector,
    project.project_name,
    project.description,
  ].map(normalizeText).filter(Boolean).join(' ')
}

export function getEligibilityReason(project) {
  const text = getProjectSearchText(project)
  if (!text) return 'excluded_other'

  for (const [reason, patterns] of Object.entries(EXCLUSION_PATTERNS)) {
    if (patterns.some((pattern) => pattern.test(text))) return reason
  }

  if (ELIGIBLE_CATEGORY_PATTERNS.some((pattern) => pattern.test(text))) {
    return 'eligible'
  }

  return 'excluded_other'
}

export function isEligibleConstructionProject(project) {
  return getEligibilityReason(project) === 'eligible'
}

