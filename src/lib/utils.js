import { useCallback, useEffect, useRef, useState } from 'react'

export function cn(...classes) {
  return classes.filter(Boolean).join(' ')
}

// Tiny localStorage-backed state hook.
//
// Behaviour:
// - Lazy-initializes from `window.localStorage[key]`, falling back to
//   `initialValue` if the entry is missing, unparseable, or rejected by
//   the optional `validate` predicate.
// - Persists every subsequent value back to localStorage.
// - When `key` changes (e.g. user signs in/out and we re-scope the key),
//   re-reads from storage so the UI reflects the new scope.
// - Pass `key = null` to disable read/write entirely (useful while auth
//   is still resolving and we don't yet know which scope to use).
// - Storage failures (private mode, quota, disabled) are swallowed so
//   the UI still works.
export function useLocalStorage(key, initialValue, options) {
  const initialRef = useRef(initialValue)
  const validateRef = useRef(options?.validate)

  // Keep the latest validate fn without retriggering effects.
  useEffect(() => {
    validateRef.current = options?.validate
  })

  const read = useCallback((k) => {
    if (typeof window === 'undefined' || k == null) return initialRef.current
    try {
      const raw = window.localStorage.getItem(k)
      if (raw == null) return initialRef.current
      const parsed = JSON.parse(raw)
      const validate = validateRef.current
      if (validate && !validate(parsed)) return initialRef.current
      return parsed
    } catch {
      return initialRef.current
    }
  }, [])

  const [value, setValue] = useState(() => read(key))

  // Re-read whenever the key identity changes (scope swap).
  const prevKeyRef = useRef(key)
  useEffect(() => {
    if (prevKeyRef.current === key) return
    prevKeyRef.current = key
    setValue(read(key))
  }, [key, read])

  useEffect(() => {
    if (typeof window === 'undefined' || key == null) return
    try {
      window.localStorage.setItem(key, JSON.stringify(value))
    } catch {
      // Storage may be full or disabled (private mode); silently skip.
    }
  }, [key, value])

  return [value, setValue]
}

// Returns `value` after it has stayed unchanged for `delay` ms. Useful
// for taming an input that drives an expensive memo (e.g. a search box
// that re-runs a big filter pipeline on every keystroke).
export function useDebouncedValue(value, delay = 150) {
  const [debounced, setDebounced] = useState(value)
  useEffect(() => {
    const id = setTimeout(() => setDebounced(value), delay)
    return () => clearTimeout(id)
  }, [value, delay])
  return debounced
}

export function formatCurrency(value) {
  if (value == null || value === '') return '—'
  const num = typeof value === 'number' ? value : Number(String(value).replace(/[^0-9.-]/g, ''))
  if (!Number.isFinite(num)) return typeof value === 'string' ? value : '—'
  return new Intl.NumberFormat('en-CA', {
    style: 'currency',
    currency: 'CAD',
    maximumFractionDigits: 0,
  }).format(num)
}

export function formatCurrencyShort(value) {
  if (value == null || value === '') return '—'
  const num = typeof value === 'number' ? value : Number(String(value).replace(/[^0-9.-]/g, ''))
  if (!Number.isFinite(num)) return typeof value === 'string' ? value : '—'
  const abs = Math.abs(num)
  if (abs >= 1_000_000_000) return `$${(num / 1_000_000_000).toFixed(num % 1_000_000_000 === 0 ? 0 : 1)}B`
  if (abs >= 1_000_000) return `$${(num / 1_000_000).toFixed(num % 1_000_000 === 0 ? 0 : 1)}M`
  if (abs >= 10_000) return `$${Math.round(num / 1_000)}K`
  return formatCurrency(num)
}

export function normalizeRole(role) {
  if (typeof role !== 'string') return ''
  const value = role.trim().toLowerCase()
  switch (value) {
    case 'subcontractor':
      return 'sc'
    case 'general_contractor':
    case 'general-contractor':
      return 'gc'
    default:
      return value
  }
}

export function getRoleLabel(role) {
  switch (normalizeRole(role)) {
    case 'worker':
      return 'Worker'
    case 'sc':
      return 'Subcontractor'
    case 'gc':
      return 'General Contractor'
    case 'admin':
      return 'Admin'
    default:
      return typeof role === 'string' && role.trim() ? role : 'Unknown'
  }
}

export function getDefaultRouteForRole(role) {
  switch (normalizeRole(role)) {
    case 'worker':
      return '/worker/dashboard'
    case 'gc':
      return '/gc/dashboard'
    case 'sc':
      return '/subcontractor/dashboard'
    case 'admin':
      return '/admin/dashboard'
    default:
      return null
  }
}

function cleanLocationPart(value) {
  return String(value || '')
    .replace(/\bNo\.\s*\d+\b/gi, '')
    .replace(/\b(Municipal District|M\.D\.|MD|County|City|Town|Village|Hamlet|Rural Municipality|Regional Municipality)\b/gi, '')
    .replace(/\s+/g, ' ')
    .trim()
}

function isGenericLocationPart(value) {
  const normalized = String(value || '').trim().toLowerCase()
  return (
    !normalized ||
    normalized === 'alberta' ||
    normalized === 'ab' ||
    normalized === 'canada'
  )
}

function isAlbertaRegion(value) {
  return /^(northern|southern|central)\s+alberta$/i.test(String(value || '').trim())
}

export function getPublicDisplayLocation(projectOrLocation) {
  const project =
    typeof projectOrLocation === 'string'
      ? { city: projectOrLocation }
      : projectOrLocation || {}
  const province = cleanLocationPart(project.province) || 'Alberta'
  const rawCandidates = [
    project.city,
    project.region,
    project.address,
  ].filter(Boolean)
  const rawText = rawCandidates.join(', ')
  const parts = rawText
    .split(',')
    .map((part) => part.trim())
    .filter((part) => !isGenericLocationPart(part))

  const directCity = cleanLocationPart(project.city)
  if (isAlbertaRegion(directCity)) return directCity
  if (
    directCity &&
    !directCity.includes(',') &&
    !/\b(county|no\.|municipal district|m\.d\.|md|regional municipality)\b/i.test(project.city)
  ) {
    return `${directCity}, ${province}`
  }

  const namedPlace = [...parts]
    .reverse()
    .map(cleanLocationPart)
    .find((part) => (
      part &&
      !isGenericLocationPart(part) &&
      !/\b(alberta|canada)\b/i.test(part)
    ))

  if (namedPlace) {
    return `${parts.length > 1 ? 'Near ' : ''}${namedPlace}, ${province}`
  }

  const region = cleanLocationPart(project.region)
  if (isAlbertaRegion(region)) return region
  if (region && !isGenericLocationPart(region)) {
    return region
  }

  const lat = Number(project.latitude)
  if (Number.isFinite(lat) && lat >= 55) return 'Northern Alberta'

  return province
}

export function getContractorDisplayLocation(projectOrLocation) {
  const project =
    typeof projectOrLocation === 'string'
      ? { display_address: projectOrLocation }
      : projectOrLocation || {}
  const contractorAddress = String(project.display_address || '').trim()
  return contractorAddress || getPublicDisplayLocation(project)
}

export function hasContractorLocation(project) {
  if (!project) return false
  return [
    project.display_address,
    project.site_access_notes,
    project.gate_entrance,
    project.parking_instructions,
    project.muster_point,
    project.google_maps_url,
  ].some((value) => String(value || '').trim())
}

// Great-circle distance in kilometers between two {lat, lng} points using the
// Haversine formula. Returns null if either point is missing/non-finite.
export function haversineKm(a, b) {
  if (!a || !b) return null
  const lat1 = Number(a.lat)
  const lng1 = Number(a.lng)
  const lat2 = Number(b.lat)
  const lng2 = Number(b.lng)
  if (
    !Number.isFinite(lat1) ||
    !Number.isFinite(lng1) ||
    !Number.isFinite(lat2) ||
    !Number.isFinite(lng2)
  ) {
    return null
  }
  const R = 6371 // km
  const toRad = (d) => (d * Math.PI) / 180
  const dLat = toRad(lat2 - lat1)
  const dLng = toRad(lng2 - lng1)
  const phi1 = toRad(lat1)
  const phi2 = toRad(lat2)
  const x =
    Math.sin(dLat / 2) ** 2 +
    Math.sin(dLng / 2) ** 2 * Math.cos(phi1) * Math.cos(phi2)
  return 2 * R * Math.asin(Math.sqrt(x))
}

// Human-friendly distance label, e.g. "850 m", "12.4 km", "126 km".
export function formatDistanceKm(km) {
  if (km == null || !Number.isFinite(km)) return ''
  if (km < 1) return `${Math.round(km * 1000)} m`
  if (km < 10) return `${km.toFixed(1)} km`
  return `${Math.round(km)} km`
}

export function formatDate(value) {
  if (!value) return 'Not available'
  const d = new Date(value)
  if (Number.isNaN(d.getTime())) return 'Not available'
  try {
    return d.toLocaleDateString()
  } catch {
    return 'Not available'
  }
}
