import { supabase } from '../lib/supabase'

const FALLBACK_KEY = 'jobsitefinder.maintenance_mode'

function parseBoolean(value, fallback = true) {
  if (typeof value === 'boolean') return value
  if (typeof value === 'string') {
    const normalized = value.trim().toLowerCase()
    if (['true', '1', 'on', 'yes'].includes(normalized)) return true
    if (['false', '0', 'off', 'no'].includes(normalized)) return false
  }
  return fallback
}

function getFallbackMaintenanceMode() {
  if (typeof window === 'undefined') return true
  return parseBoolean(window.localStorage.getItem(FALLBACK_KEY), true)
}

function setFallbackMaintenanceMode(enabled) {
  if (typeof window !== 'undefined') {
    window.localStorage.setItem(FALLBACK_KEY, String(!!enabled))
  }
}

export async function getMaintenanceMode() {
  const { data, error } = await supabase
    .from('site_settings')
    .select('value')
    .eq('key', 'maintenance_mode')
    .maybeSingle()

  if (error) {
    if (typeof console !== 'undefined') {
      console.warn(`Maintenance mode loaded from local fallback: ${error.message}`)
    }
    return getFallbackMaintenanceMode()
  }

  if (!data) return true
  return parseBoolean(data.value, true)
}

export async function updateMaintenanceMode(enabled) {
  setFallbackMaintenanceMode(enabled)

  const { data, error } = await supabase
    .from('site_settings')
    .upsert(
      {
        key: 'maintenance_mode',
        value: !!enabled,
        updated_at: new Date().toISOString(),
      },
      { onConflict: 'key' },
    )
    .select('value')
    .maybeSingle()

  if (error) {
    throw new Error(`Failed to update maintenance mode: ${error.message}`)
  }

  return parseBoolean(data?.value, !!enabled)
}
