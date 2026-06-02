import { supabase } from '../lib/supabase'

export async function getMyCompanyProfile(userId) {
  if (!userId) return null
  const { data, error } = await supabase
    .from('company_profiles')
    .select('*')
    .eq('profile_id', userId)
    .maybeSingle()
  if (error) throw new Error(`Failed to load company profile: ${error.message}`)
  return normalizeCompanyProfile(data)
}

async function tryUpsertCompanyProfile(row) {
  return supabase
    .from('company_profiles')
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

function firstDefined(...values) {
  return values.find((value) => value !== undefined && value !== null) ?? null
}

function firstContactValue(...values) {
  return values.find((value) => value !== undefined && value !== null && value !== '') ?? ''
}

function normalizeCompanyProfile(profile) {
  if (!profile) return profile
  return {
    ...profile,
    website: firstContactValue(profile.website, profile.website_url),
    phone: firstContactValue(profile.phone, profile.phone_number),
    email: firstContactValue(profile.email, profile.contact_email),
  }
}

function addContactField(row, current, values, formKey, columnNames) {
  const nextValue = hasValue(values, formKey)
    ? cleanText(values[formKey])
    : firstDefined(...columnNames.map((columnName) => current[columnName]))

  for (const columnName of columnNames) {
    row[columnName] = nextValue
  }
}

const CONTACT_FIELDS = [
  { formKey: 'website', columnNames: ['website', 'website_url'] },
  { formKey: 'phone', columnNames: ['phone', 'phone_number'] },
  { formKey: 'email', columnNames: ['email', 'contact_email'] },
]

function getMissingSavedContactFields(values, verify, droppedColumns) {
  return CONTACT_FIELDS.filter(({ formKey, columnNames }) => {
    const userProvidedValue = hasValue(values, formKey) && cleanText(values[formKey]) !== null
    if (!userProvidedValue) return false

    const everyCandidateWasDropped = columnNames.every((columnName) =>
      droppedColumns.has(columnName),
    )
    const readBackValue = cleanText(verify?.[formKey])
    return everyCandidateWasDropped || readBackValue === null
  }).map(({ formKey, columnNames }) => `${formKey} (${columnNames.join(' or ')})`)
}

export async function saveCompanyProfile(userId, values) {
  if (!userId) throw new Error('No authenticated user.')

  const current = (await getMyCompanyProfile(userId)) || {}
  let row = {
    profile_id: userId,
    company_name: hasValue(values, 'company_name')
      ? cleanText(values.company_name)
      : current.company_name,
    company_type: hasValue(values, 'company_type')
      ? cleanText(values.company_type)
      : current.company_type,
    logo_url: hasValue(values, 'logo_url') ? cleanText(values.logo_url) : current.logo_url,
    description: hasValue(values, 'description')
      ? cleanText(values.description)
      : current.description,
    trades_hired: hasValue(values, 'trades_hired')
      ? cleanText(values.trades_hired)
      : current.trades_hired,
    service_area: hasValue(values, 'service_area')
      ? cleanText(values.service_area)
      : current.service_area,
  }
  for (const contactField of CONTACT_FIELDS) {
    addContactField(row, current, values, contactField.formKey, contactField.columnNames)
  }

  let saved = null
  let upsertSucceeded = false
  const droppedColumns = new Set()
  while (Object.keys(row).length > 1) {
    const { data, error } = await tryUpsertCompanyProfile(row)
    if (!error) {
      saved = data
      upsertSucceeded = true
      break
    }
    const match = /Could not find the '([^']+)' column/i.exec(error.message)
    if (!match) {
      throw new Error(`Failed to save company profile: ${error.message}`)
    }
    const missing = match[1]
    if (!(missing in row)) {
      throw new Error(`Failed to save company profile: ${error.message}`)
    }
    if (droppedColumns.has(missing)) {
      throw new Error(`Failed to save company profile: ${error.message}`)
    }
    if (hasValue(values, missing) && values[missing] !== '' && values[missing] !== null && values[missing] !== undefined) {
      throw new Error(
        `Company profile field "${missing}" could not be saved because company_profiles is missing that column. Run supabase/002_company_and_profiles_columns.sql in Supabase, then save again.`,
      )
    }
    droppedColumns.add(missing)
    const { [missing]: _drop, ...rest } = row
    row = rest
    if (typeof console !== 'undefined') {
      console.warn(
        `company_profiles is missing column "${missing}" — skipping it. Run supabase/002_company_and_profiles_columns.sql to add it.`,
      )
    }
  }
  if (!upsertSucceeded) {
    throw new Error('Failed to save company profile after dropping unknown columns.')
  }

  // Verify the row can actually be read back. With RLS enabled but no
  // SELECT policy the upsert succeeds but a fresh read returns nothing,
  // making it look saved when it isn't.
  const verify = await getMyCompanyProfile(userId)
  if (!verify) {
    throw new Error(
      'Profile saved but cannot be read back. Check that row-level security is configured on company_profiles — run supabase/003_profile_rls_policies.sql in your Supabase SQL editor.',
    )
  }
  const missingSavedContactFields = getMissingSavedContactFields(values, verify, droppedColumns)
  if (missingSavedContactFields.length > 0) {
    throw new Error(
      `Company profile saved, but these contact fields could not be saved because company_profiles is missing the matching database columns: ${missingSavedContactFields.join(', ')}. Run supabase/002_company_and_profiles_columns.sql in Supabase, then save again.`,
    )
  }
  return verify ?? saved
}
