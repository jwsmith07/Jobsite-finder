export const MINIMUM_MAJOR_PROJECT_VALUE = 5000000
export const MAJOR_PROJECT_MESSAGE = 'Major construction projects $5M+'

export const PROJECT_VALUE_FILTER_OPTIONS = [
  { value: '0', label: 'All Major Projects' },
  { value: '5000000', label: '$5M+' },
  { value: '10000000', label: '$10M+' },
  { value: '50000000', label: '$50M+' },
  { value: '100000000', label: '$100M+' },
  { value: '500000000', label: '$500M+' },
]

export const PROJECT_VALUE_FILTER_LABELS = PROJECT_VALUE_FILTER_OPTIONS.reduce(
  (labels, option) => ({ ...labels, [option.value]: option.label }),
  {},
)

export function parseProjectValue(value) {
  if (value == null || value === '') return null
  if (typeof value === 'number') return Number.isFinite(value) ? value : null

  const text = String(value).trim().toLowerCase()
  if (!text) return null

  const multiplier = text.includes('b') ? 1000000000 : text.includes('m') ? 1000000 : 1
  const numeric = Number(text.replace(/[^0-9.-]/g, ''))

  if (!Number.isFinite(numeric)) return null
  return numeric * multiplier
}

export function isMajorProject(project) {
  if (!project?.is_active || !project?.is_public_project) return false
  const value = parseProjectValue(project?.estimated_value)
  return value == null || value >= MINIMUM_MAJOR_PROJECT_VALUE
}

export function normalizeProjectValueFilter(value) {
  const n = Number(value)
  if (!Number.isFinite(n) || n <= 0) return 0
  return Math.max(n, MINIMUM_MAJOR_PROJECT_VALUE)
}
