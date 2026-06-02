export const STANDARD_TRADES = [
  'Labourer / General Construction',
  'Plumbing',
  'Electrical',
  'Welding',
  'Pipefitting',
  'Carpentry',
  'Concrete',
  'Ironwork',
  'Heavy Equipment Operator',
  'HVAC',
  'Sheet Metal',
  'Roofing',
  'Insulation',
  'Scaffolding',
  'Drywall',
  'Painting',
  'Flooring',
  'Glazing',
  'Millwright',
  'Instrumentation',
  'Safety',
  'Surveying',
  'Truck Driver',
  'Crane Operator',
  'Other',
]

export const APPRENTICESHIP_LEVELS = [
  'New to the Trades',
  '1st Year Apprentice',
  '2nd Year Apprentice',
  '3rd Year Apprentice',
  '4th Year Apprentice',
  'Journeyman / Red Seal',
  'Foreman / Lead Hand',
  'Supervisor',
]

export const HIRING_TAGS = [
  'New to the Trades Friendly',
  'Apprentice Friendly',
  'Camp Position',
  'Fly-In / Fly-Out',
  'Local Workers Preferred',
  'Immediate Start',
  'Overtime Available',
]

const TRADE_ALIASES = {
  plumber: 'Plumbing',
  plumbing: 'Plumbing',
  electrician: 'Electrical',
  electrical: 'Electrical',
  welder: 'Welding',
  welding: 'Welding',
  pipefitter: 'Pipefitting',
  pipefitting: 'Pipefitting',
  carpenter: 'Carpentry',
  carpentry: 'Carpentry',
  labourer: 'Labourer / General Construction',
  laborer: 'Labourer / General Construction',
  labour: 'Labourer / General Construction',
  labor: 'Labourer / General Construction',
  'general construction': 'Labourer / General Construction',
  'general labourer': 'Labourer / General Construction',
  'general laborer': 'Labourer / General Construction',
  'civil labourer': 'Labourer / General Construction',
  'civil laborer': 'Labourer / General Construction',
  'heavy equipment': 'Heavy Equipment Operator',
  'heavy equipment operator': 'Heavy Equipment Operator',
  'crane operator': 'Crane Operator',
  'truck driver': 'Truck Driver',
  roofer: 'Roofing',
  roofing: 'Roofing',
  scaffolder: 'Scaffolding',
  scaffolding: 'Scaffolding',
  glazier: 'Glazing',
  glazing: 'Glazing',
  millwright: 'Millwright',
  'instrumentation technician': 'Instrumentation',
  instrumentation: 'Instrumentation',
  'sheet metal': 'Sheet Metal',
  'sheet metal worker': 'Sheet Metal',
  hvac: 'HVAC',
  'hvac technician': 'HVAC',
  'hse officer': 'Safety',
  safety: 'Safety',
  'survey technician': 'Surveying',
  surveying: 'Surveying',
}

const LEVEL_ALIASES = {
  any: 'Any',
  apprentice: 'New to the Trades',
  'entry level': 'New to the Trades',
  beginner: 'New to the Trades',
  green: 'New to the Trades',
  helper: 'New to the Trades',
  labourer: 'New to the Trades',
  'new to trades': 'New to the Trades',
  'new to the trades': 'New to the Trades',
  foreman: 'Foreman / Lead Hand',
  'lead hand': 'Foreman / Lead Hand',
  supervisor: 'Supervisor',
  journeyman: 'Journeyman / Red Seal',
  'journeyman red seal': 'Journeyman / Red Seal',
  'journeyperson': 'Journeyman / Red Seal',
  'red seal': 'Journeyman / Red Seal',
}

function cleanKey(value) {
  return String(value || '')
    .trim()
    .toLowerCase()
    .replace(/[-_/()]+/g, ' ')
    .replace(/\s+/g, ' ')
}

function titleCaseFallback(value) {
  return String(value || '')
    .trim()
    .replace(/[-_]+/g, ' ')
    .replace(/\s+/g, ' ')
    .split(' ')
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(' ')
}

export function normalizeTrade(value) {
  const cleaned = String(value || '').trim()
  if (!cleaned) return ''
  if (STANDARD_TRADES.includes(cleaned)) return cleaned
  const key = cleanKey(cleaned)
  if (TRADE_ALIASES[key]) return TRADE_ALIASES[key]
  const exact = STANDARD_TRADES.find((trade) => cleanKey(trade) === key)
  if (exact) return exact

  if (key.includes('electric')) return 'Electrical'
  if (key.includes('plumb')) return 'Plumbing'
  if (key.includes('weld')) return 'Welding'
  if (key.includes('pipefit')) return 'Pipefitting'

  return titleCaseFallback(cleaned)
}

export function normalizeTradeForSave(value) {
  const normalized = normalizeTrade(value)
  if (!normalized) return null
  return STANDARD_TRADES.includes(normalized) ? normalized : normalized
}

export function normalizeApprenticeshipLevel(value) {
  const cleaned = String(value || '').trim()
  if (!cleaned) return ''
  if (cleaned === 'Any') return 'Any'
  if (APPRENTICESHIP_LEVELS.includes(cleaned)) return cleaned
  const key = cleanKey(cleaned)
  if (LEVEL_ALIASES[key]) return LEVEL_ALIASES[key]
  const exact = APPRENTICESHIP_LEVELS.find((level) => cleanKey(level) === key)
  return exact || titleCaseFallback(cleaned)
}

export function renderTradeOptions({ placeholder = 'Select trade', includeEmpty = true } = {}) {
  return (
    <>
      {includeEmpty && <option value="">{placeholder}</option>}
      {STANDARD_TRADES.map((trade) => (
        <option key={trade} value={trade}>{trade}</option>
      ))}
    </>
  )
}

export function renderApprenticeshipLevelOptions({
  placeholder = 'Select level',
  includeAny = false,
  includeEmpty = true,
} = {}) {
  return (
    <>
      {includeEmpty && <option value="">{placeholder}</option>}
      {includeAny && <option value="Any">Any</option>}
      {APPRENTICESHIP_LEVELS.map((level) => (
        <option key={level} value={level}>{level}</option>
      ))}
    </>
  )
}

export function tradeSelectValue(value) {
  const normalized = normalizeTrade(value)
  return STANDARD_TRADES.includes(normalized) ? normalized : ''
}

export function apprenticeshipSelectValue(value) {
  const normalized = normalizeApprenticeshipLevel(value)
  return APPRENTICESHIP_LEVELS.includes(normalized) || normalized === 'Any' ? normalized : ''
}
