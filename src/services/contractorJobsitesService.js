import { supabase } from '../lib/supabase'

const CONTRACTOR_PROJECT_FIELDS = `
  id, project_name, display_address, address, city, province, latitude, longitude,
  project_type, sector, stage, estimated_value, project_value_display,
  start_date, end_date, description, trades_needed, hiring_status,
  site_access_notes, gate_entrance, parking_instructions, muster_point,
  google_maps_url, primary_image_url, source_type, created_by, review_status,
  reviewed_by, reviewed_at, rejection_reason, is_public, is_active,
  is_public_project, created_at
`

function toNumberOrNull(value) {
  if (value === '' || value == null) return null
  const next = Number(value)
  return Number.isFinite(next) ? next : null
}

function cleanText(value) {
  return String(value || '').trim() || null
}

function normalizeCompanyRole(value) {
  const normalized = String(value || '').trim().toLowerCase()
  const compact = normalized.replace(/[^a-z]/g, '')
  if (
    normalized === 'gc' ||
    normalized === 'general_contractor' ||
    normalized === 'general-contractor' ||
    compact === 'generalcontractor'
  ) {
    return 'gc'
  }
  if (
    normalized === 'sc' ||
    normalized === 'subcontractor' ||
    compact === 'subcontractor'
  ) {
    return 'subcontractor'
  }
  return normalized
}

function isMissingCompanyColumn(error, columnName) {
  const message = String(error?.message || '')
  return (
    message.includes(`'${columnName}' column`) ||
    message.includes(`column company_profiles.${columnName} does not exist`)
  )
}

async function getApprovedGcCompanyForUser(userId) {
  let result = await supabase
    .from('company_profiles')
    .select('id, company_type, verified, is_hidden')
    .eq('profile_id', userId)
    .maybeSingle()

  if (isMissingCompanyColumn(result.error, 'is_hidden')) {
    result = await supabase
      .from('company_profiles')
      .select('id, company_type, verified')
      .eq('profile_id', userId)
      .maybeSingle()
  }

  if (result.error) throw new Error(`Failed to verify company profile: ${result.error.message}`)
  const company = result.data ? { ...result.data, is_hidden: !!result.data.is_hidden } : null
  if (
    !company ||
    company.verified !== true ||
    company.is_hidden === true ||
    normalizeCompanyRole(company.company_type) !== 'gc'
  ) {
    throw new Error('Only approved General Contractor companies can create jobsites.')
  }
  return company
}

function buildContractorJobsiteRow(values = {}, userId) {
  return {
    project_name: cleanText(values.project_name),
    display_address: cleanText(values.display_address || values.location),
    address: cleanText(values.display_address || values.location),
    latitude: toNumberOrNull(values.latitude),
    longitude: toNumberOrNull(values.longitude),
    project_type: cleanText(values.project_type),
    sector: cleanText(values.sector),
    stage: cleanText(values.stage),
    project_value_display: cleanText(values.project_value_display),
    start_date: cleanText(values.start_date),
    end_date: cleanText(values.estimated_completion_date),
    description: cleanText(values.description),
    trades_needed: cleanText(values.trades_needed),
    hiring_status: cleanText(values.hiring_status),
    site_access_notes: cleanText(values.site_access_notes),
    gate_entrance: cleanText(values.gate_entrance),
    parking_instructions: cleanText(values.parking_instructions),
    muster_point: cleanText(values.muster_point),
    google_maps_url: cleanText(values.google_maps_url),
    primary_image_url: cleanText(values.primary_image_url),
    source_type: 'contractor_created',
    created_by: userId,
    review_status: 'pending_review',
    is_public: false,
    is_active: true,
    is_public_project: true,
    project_status_type: 'unverified',
  }
}

export async function createContractorJobsite(values, userId) {
  if (!userId) throw new Error('You must be signed in to create a jobsite.')
  await getApprovedGcCompanyForUser(userId)
  if (!cleanText(values?.project_name)) throw new Error('Project name is required.')
  if (toNumberOrNull(values?.latitude) == null || toNumberOrNull(values?.longitude) == null) {
    throw new Error('Latitude and longitude are required for the V1 map pin.')
  }

  const { data, error } = await supabase
    .from('projects')
    .insert(buildContractorJobsiteRow(values, userId))
    .select(CONTRACTOR_PROJECT_FIELDS)
    .maybeSingle()

  if (error) throw new Error(`Failed to submit jobsite: ${error.message}`)
  return data
}

export async function getMyContractorJobsites(userId) {
  if (!userId) return []
  const { data, error } = await supabase
    .from('projects')
    .select(CONTRACTOR_PROJECT_FIELDS)
    .eq('source_type', 'contractor_created')
    .eq('created_by', userId)
    .order('created_at', { ascending: false })
    .range(0, 9999)
  if (error) throw new Error(`Failed to load your jobsites: ${error.message}`)
  return data ?? []
}
