export const appUrl = import.meta.env.VITE_APP_URL || window.location.origin

export const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
export const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

export const googleMapsApiKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY
export const googleMapsMapId = import.meta.env.VITE_GOOGLE_MAPS_MAP_ID || ''
export const googleMapsMapIdDark = import.meta.env.VITE_GOOGLE_MAPS_MAP_ID_DARK || ''

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
