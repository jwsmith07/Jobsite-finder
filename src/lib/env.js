const PRODUCTION_APP_URL = 'https://jobsitefinder.ca'

function normalizeOrigin(value) {
  if (!value) return ''

  try {
    return new URL(value).origin
  } catch {
    return ''
  }
}

function isLocalOrigin(origin) {
  return /^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/i.test(origin)
}

export function getAppOrigin() {
  const runtimeOrigin = normalizeOrigin(window.location.origin)
  const configuredOrigin = normalizeOrigin(import.meta.env.VITE_APP_URL)

  if (import.meta.env.DEV) {
    return runtimeOrigin || configuredOrigin || PRODUCTION_APP_URL
  }

  if (configuredOrigin && !isLocalOrigin(configuredOrigin)) {
    return configuredOrigin
  }

  if (runtimeOrigin && !isLocalOrigin(runtimeOrigin)) {
    return runtimeOrigin
  }

  return PRODUCTION_APP_URL
}

export function getOAuthRedirectUrl(path = '/') {
  return new URL(path, `${getAppOrigin()}/`).toString()
}

export const appUrl = getAppOrigin()

export const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
export const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

export const googleMapsApiKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY
export const googleMapsMapId = import.meta.env.VITE_GOOGLE_MAPS_MAP_ID || ''
export const googleMapsMapIdDark = import.meta.env.VITE_GOOGLE_MAPS_MAP_ID_DARK || ''
export const mapTilerKey = import.meta.env.VITE_MAPTILER_KEY || ''

export function validateEnv() {
  const missing = []
  if (!supabaseUrl) missing.push('VITE_SUPABASE_URL')
  if (!supabaseAnonKey) missing.push('VITE_SUPABASE_ANON_KEY')
  if (!googleMapsApiKey) missing.push('VITE_GOOGLE_MAPS_API_KEY')
  if (!googleMapsMapId) missing.push('VITE_GOOGLE_MAPS_MAP_ID')

  if (missing.length > 0) {
    console.warn(
      `[Jobsite Finder] Missing env vars: ${missing.join(', ')}. ` +
        'Copy .env.example to .env and fill in your real keys.',
    )
  }
  return missing.length === 0
}
