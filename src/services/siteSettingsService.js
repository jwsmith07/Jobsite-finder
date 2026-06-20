import { supabase } from '../lib/supabase'

const FALLBACK_KEY = 'jobsitefinder.maintenance_mode'
const MAP_PROVIDER_FALLBACK_KEY = 'jobsitefinder.map_provider'
const MAP_PROVIDER_CHANGED_EVENT = 'jobsitefinder:map-provider-changed'
const MAP_PROVIDER_SETTING_KEY = 'map_provider'
const MAP_PROVIDERS = new Set(['google', 'maplibre'])
const SITE_SETTINGS_TIMEOUT_MS = 4000

function withTimeout(promise, fallback, label) {
  let timeoutId
  const timeout = new Promise((resolve) => {
    timeoutId = setTimeout(() => {
      if (typeof console !== 'undefined') {
        console.warn(`[siteSettingsService] ${label} timed out, using fallback.`)
      }
      resolve(fallback)
    }, SITE_SETTINGS_TIMEOUT_MS)
  })

  return Promise.race([promise, timeout]).finally(() => clearTimeout(timeoutId))
}

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

function parseMapProvider(value, fallback = 'maplibre') {
  const raw = typeof value === 'string'
    ? value
    : value?.provider || value?.map_provider || String(value || '')
  const normalized = raw.trim().toLowerCase()
  return MAP_PROVIDERS.has(normalized) ? normalized : fallback
}

function getFallbackMapProvider() {
  if (typeof window === 'undefined') return 'maplibre'
  return parseMapProvider(window.localStorage.getItem(MAP_PROVIDER_FALLBACK_KEY), 'maplibre')
}

function hasFallbackMapProvider() {
  return typeof window !== 'undefined' && window.localStorage.getItem(MAP_PROVIDER_FALLBACK_KEY)
}

function setFallbackMapProvider(provider) {
  if (typeof window !== 'undefined') {
    const normalized = parseMapProvider(provider)
    window.localStorage.setItem(MAP_PROVIDER_FALLBACK_KEY, normalized)
    window.dispatchEvent(new CustomEvent(MAP_PROVIDER_CHANGED_EVENT, { detail: { provider: normalized } }))
  }
}

export function getLocalMapProviderSetting() {
  return getFallbackMapProvider()
}

export { MAP_PROVIDER_CHANGED_EVENT }

async function requireAdmin() {
  const { data: authData, error: authError } = await supabase.auth.getUser()
  if (authError || !authData?.user?.id) throw new Error('Admin authorization required.')
  const { data: profile, error } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', authData.user.id)
    .maybeSingle()
  if (error) throw new Error(`Failed to verify admin permissions: ${error.message}`)
  if (String(profile?.role || '').toLowerCase() !== 'admin') {
    throw new Error('Admin authorization required.')
  }
}

export async function getMaintenanceMode() {
  const { data, error } = await withTimeout(
    supabase
      .from('site_settings')
      .select('value')
      .eq('key', 'maintenance_mode')
      .maybeSingle(),
    { data: null, error: new Error('Site settings request timed out.') },
    'maintenance mode read',
  )

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
  await requireAdmin()
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

export async function getMapProviderSetting() {
  if (hasFallbackMapProvider()) {
    return getFallbackMapProvider()
  }

  const { data, error } = await withTimeout(
    supabase
      .from('site_settings')
      .select('value')
      .eq('key', MAP_PROVIDER_SETTING_KEY)
      .maybeSingle(),
    { data: null, error: new Error('Map provider request timed out.') },
    'map provider read',
  )

  if (error) {
    if (typeof console !== 'undefined') {
      console.warn(`Map provider loaded from local fallback: ${error.message}`)
    }
    return getFallbackMapProvider()
  }

  return parseMapProvider(data?.value, 'maplibre')
}

export async function updateMapProviderSetting(provider) {
  await requireAdmin()
  const normalized = parseMapProvider(provider)
  setFallbackMapProvider(normalized)

  const { data, error } = await withTimeout(
    supabase
      .from('site_settings')
      .upsert(
        {
          key: MAP_PROVIDER_SETTING_KEY,
          value: normalized,
          updated_at: new Date().toISOString(),
        },
        { onConflict: 'key' },
      )
      .select('value')
      .maybeSingle(),
    { data: null, error: new Error('Map provider save timed out.') },
    'map provider save',
  )

  if (error) {
    if (typeof console !== 'undefined') {
      console.warn(`Map provider saved locally until Supabase setting is writable: ${error.message}`)
    }
    return normalized
  }

  return parseMapProvider(data?.value, normalized)
}
