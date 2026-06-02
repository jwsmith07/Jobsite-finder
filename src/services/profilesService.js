import { supabase } from '../lib/supabase'
import { normalizeApprenticeshipLevel, normalizeTradeForSave } from '../lib/trades'

export async function ensureProfile(user) {
  if (!user?.id) throw new Error('No authenticated user.')

  const meta = user.user_metadata || {}
  const row = {
    id: user.id,
    email: user.email ?? null,
    full_name: meta.full_name ?? null,
    avatar_url: meta.avatar_url ?? null,
  }
  if (meta.role) row.role = meta.role

  const { data, error } = await supabase
    .from('profiles')
    .upsert(row, { onConflict: 'id' })
    .select()
    .maybeSingle()

  if (error) throw new Error(`Failed to ensure profile: ${error.message}`)
  return data
}

export async function getMyProfile(userId) {
  if (!userId) return null
  const { data, error } = await supabase
    .from('profiles')
    .select('id, email, full_name, role, avatar_url, created_at')
    .eq('id', userId)
    .maybeSingle()
  if (error) throw new Error(`Failed to load profile: ${error.message}`)
  return data
}

// Read the per-user UI preferences blob (sort mode, distance filter, etc.)
// stored on profiles.preferences. Returns an object (possibly empty) or
// null when there's no signed-in user / no row.
export async function getMyPreferences(userId) {
  if (!userId) return null
  const { data, error } = await supabase
    .from('profiles')
    .select('preferences')
    .eq('id', userId)
    .maybeSingle()
  if (error) throw new Error(`Failed to load preferences: ${error.message}`)
  if (!data) return null
  const prefs = data.preferences
  return prefs && typeof prefs === 'object' ? prefs : {}
}

// Merge `patch` into profiles.preferences for the given user. Reads the
// current value first so we only overwrite the keys we own — leaves any
// future preferences fields written elsewhere intact.
//
// Uses upsert (not plain update) so this works even if the user's
// `profiles` row hasn't been created yet — e.g. a worker who signs up
// and lands directly on /jobsites without ever opening the role-specific
// profile pages that call `ensureProfile`. PostgREST upsert with merge
// semantics only writes the columns we provide on conflict, so an
// existing row's email / full_name / role / etc. are left untouched.
export async function saveMyPreferences(userId, patch) {
  if (!userId) throw new Error('No authenticated user.')
  if (!patch || typeof patch !== 'object') return null

  const current = (await getMyPreferences(userId)) ?? {}
  const merged = { ...current, ...patch }

  const { data, error } = await supabase
    .from('profiles')
    .upsert({ id: userId, preferences: merged }, { onConflict: 'id' })
    .select('preferences')
    .maybeSingle()
  if (error) throw new Error(`Failed to save preferences: ${error.message}`)
  return data?.preferences ?? merged
}

export async function getMyWorkerProfile(userId) {
  if (!userId) return null
  const { data, error } = await supabase
    .from('worker_profiles')
    .select('*')
    .eq('profile_id', userId)
    .maybeSingle()
  if (error) throw new Error(`Failed to load worker profile: ${error.message}`)
  return data
}

async function tryUpsertWorkerProfile(row) {
  return supabase
    .from('worker_profiles')
    .upsert(row, { onConflict: 'profile_id' })
    .select()
    .maybeSingle()
}

function hasValue(values, key) {
  return Object.prototype.hasOwnProperty.call(values, key)
}

function cleanText(value) {
  if (typeof value !== 'string') return value ?? null
  const trimmed = value.trim()
  return trimmed ? trimmed : null
}

function cleanNumber(value) {
  if (value === '' || value === null || value === undefined) return null
  const numeric = Number(value)
  return Number.isNaN(numeric) ? null : numeric
}

export async function saveWorkerProfile(userId, values) {
  if (!userId) throw new Error('No authenticated user.')

  const current = (await getMyWorkerProfile(userId)) || {}
  let row = {
    profile_id: userId,
    headline: hasValue(values, 'headline') ? cleanText(values.headline) : current.headline,
    trade: hasValue(values, 'trade') ? normalizeTradeForSave(values.trade) : current.trade,
    secondary_trade: hasValue(values, 'secondary_trade')
      ? normalizeTradeForSave(values.secondary_trade)
      : current.secondary_trade,
    apprenticeship_level: hasValue(values, 'apprenticeship_level')
      ? cleanText(normalizeApprenticeshipLevel(values.apprenticeship_level))
      : current.apprenticeship_level,
    experience_years: hasValue(values, 'experience_years')
      ? cleanNumber(values.experience_years)
      : current.experience_years,
    city: hasValue(values, 'city') ? cleanText(values.city) : current.city,
    province: hasValue(values, 'province') ? cleanText(values.province) : current.province,
    willing_to_travel: hasValue(values, 'willing_to_travel')
      ? !!values.willing_to_travel
      : current.willing_to_travel,
    camp_ready: hasValue(values, 'camp_ready')
      ? !!values.camp_ready
      : current.camp_ready,
    bio: hasValue(values, 'bio') ? cleanText(values.bio) : current.bio,
    phone: hasValue(values, 'phone') ? cleanText(values.phone) : current.phone,
    availability: hasValue(values, 'availability')
      ? cleanText(values.availability)
      : current.availability,
    resume_url: hasValue(values, 'resume_url') ? cleanText(values.resume_url) : current.resume_url,
  }

  // If a column is missing in the live schema, drop it and retry once per missing column.
  let saved = null
  let upsertSucceeded = false
  for (let attempt = 0; attempt < 8; attempt++) {
    const { data, error } = await tryUpsertWorkerProfile(row)
    if (!error) {
      saved = data
      upsertSucceeded = true
      break
    }
    const match = /Could not find the '([^']+)' column/i.exec(error.message)
    if (!match) {
      throw new Error(`Failed to save worker profile: ${error.message}`)
    }
    const missing = match[1]
    if (!(missing in row)) {
      throw new Error(`Failed to save worker profile: ${error.message}`)
    }
    if (hasValue(values, missing) && values[missing] !== '' && values[missing] !== null && values[missing] !== undefined) {
      throw new Error(
        `Worker profile field "${missing}" could not be saved because worker_profiles is missing that column. Run supabase/001_worker_profiles_columns.sql in Supabase, then save again.`,
      )
    }
    const { [missing]: _drop, ...rest } = row
    row = rest
    if (typeof console !== 'undefined') {
      console.warn(
        `worker_profiles is missing column "${missing}" — skipping it. Run supabase/001_worker_profiles_columns.sql to add it.`,
      )
    }
  }
  if (!upsertSucceeded) {
    throw new Error('Failed to save worker profile after dropping unknown columns.')
  }

  // Verify the row can actually be read back. With RLS enabled but no
  // SELECT policy, the upsert succeeds and the form looks "saved" but a
  // fresh read returns nothing — the row appears blank next visit.
  // Re-fetch and surface a clear error so the user knows what's wrong.
  const verify = await getMyWorkerProfile(userId)
  if (!verify) {
    throw new Error(
      'Profile saved but cannot be read back. Check that row-level security is configured on worker_profiles — run supabase/003_profile_rls_policies.sql in your Supabase SQL editor.',
    )
  }
  return verify ?? saved
}
