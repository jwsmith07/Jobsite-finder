import { supabase } from '../lib/supabase'
import { attachProjectImages, getProjectImagesForProjects } from './projectImagesService'

const PROJECT_FIELDS = `
  id, project_name, city, province, stage, status, estimated_value,
  is_active, is_public_project, display_address, site_access_notes,
  gate_entrance, parking_instructions, muster_point, google_maps_url,
  trades_needed, hiring_status, project_value_display, primary_image_url,
  latitude, longitude, project_type, sector, start_date, end_date, description,
  source_type, created_by, review_status, reviewed_by, reviewed_at,
  rejection_reason, is_public,
  contractor_location_updated_at, contractor_location_updated_by, created_at
`

const PROFILE_FIELDS = `id, email, full_name, role, created_at`

const COMPANY_FIELDS = `
  id, profile_id, company_name, company_type, logo_url, website, phone, email,
  description, trades_hired, service_area, verified, is_hidden, created_at
`

const LEGACY_COMPANY_FIELDS = `
  id, profile_id, company_name, company_type, logo_url, website, phone, email,
  description, trades_hired, service_area, verified, created_at
`

const ADMIN_JOB_FIELDS = `
  id, title, trade, employment_type, status, created_at, expires_at,
  positions_count, company:company_profiles(id, company_name),
  project:projects(id, project_name, city, province)
`

function withProfileEmails(companies, profiles) {
  const profilesById = new Map((profiles ?? []).map((profile) => [profile.id, profile]))
  return (companies ?? []).map((company) => ({
    ...company,
    is_hidden: !!company.is_hidden,
    account_email: profilesById.get(company.profile_id)?.email ?? null,
  }))
}

function isMissingColumn(error, columnName) {
  const message = String(error?.message || '')
  return (
    message.includes(`'${columnName}' column`) ||
    message.includes(`column company_profiles.${columnName} does not exist`)
  )
}

async function selectCompanies({ pendingOnly = false } = {}) {
  let query = supabase.from('company_profiles').select(COMPANY_FIELDS)
  if (pendingOnly) query = query.eq('verified', false)
  let result = await query.order('created_at', { ascending: false })
  if (isMissingColumn(result.error, 'is_hidden')) {
    let legacyQuery = supabase.from('company_profiles').select(LEGACY_COMPANY_FIELDS)
    if (pendingOnly) legacyQuery = legacyQuery.eq('verified', false)
    result = await legacyQuery.order('created_at', { ascending: false })
  }
  return result
}

async function attachCompanyEmails(companies) {
  const profileIds = [...new Set((companies ?? []).map((company) => company.profile_id).filter(Boolean))]
  if (profileIds.length === 0) return withProfileEmails(companies, [])

  const { data: profiles, error: profilesError } = await supabase
    .from('profiles')
    .select('id, email')
    .in('id', profileIds)
  if (profilesError) {
    if (typeof console !== 'undefined') {
      console.warn(`Companies loaded without account emails: ${profilesError.message}`)
    }
    return withProfileEmails(companies, [])
  }

  return withProfileEmails(companies, profiles)
}

export async function getAllProjects() {
  const { data, error } = await supabase
    .from('projects')
    .select(PROJECT_FIELDS)
    .order('created_at', { ascending: false })
    .order('project_name', { ascending: true })
  if (error) throw new Error(`Failed to load projects: ${error.message}`)
  const rows = data ?? []
  const imagesByProject = await getProjectImagesForProjects(rows.map((project) => project.id))
  return attachProjectImages(rows, imagesByProject)
}

export async function updateProject(projectId, values) {
  const patch = {}
  if (values.project_name !== undefined) patch.project_name = values.project_name
  if (values.city !== undefined) patch.city = values.city
  if (values.province !== undefined) patch.province = values.province
  if (values.stage !== undefined) patch.stage = values.stage
  if (values.status !== undefined) patch.status = values.status
  if (values.estimated_value !== undefined) patch.estimated_value = values.estimated_value
  if (values.is_active !== undefined) patch.is_active = !!values.is_active
  if (values.is_public_project !== undefined) patch.is_public_project = !!values.is_public_project
  if (values.is_public !== undefined) patch.is_public = !!values.is_public
  if (values.review_status !== undefined) patch.review_status = values.review_status
  if (values.rejection_reason !== undefined) patch.rejection_reason = values.rejection_reason || null
  if (values.display_address !== undefined) patch.display_address = values.display_address || null
  if (values.site_access_notes !== undefined) patch.site_access_notes = values.site_access_notes || null
  if (values.gate_entrance !== undefined) patch.gate_entrance = values.gate_entrance || null
  if (values.parking_instructions !== undefined) patch.parking_instructions = values.parking_instructions || null
  if (values.muster_point !== undefined) patch.muster_point = values.muster_point || null
  if (values.google_maps_url !== undefined) patch.google_maps_url = values.google_maps_url || null

  const { data, error } = await supabase
    .from('projects')
    .update(patch)
    .eq('id', projectId)
    .select(PROJECT_FIELDS)
    .maybeSingle()
  if (error) throw new Error(`Failed to update project: ${error.message}`)
  return data
}

export async function getPendingContractorJobsites() {
  const { data, error } = await supabase
    .from('projects')
    .select(PROJECT_FIELDS)
    .eq('source_type', 'contractor_created')
    .eq('review_status', 'pending_review')
    .order('created_at', { ascending: false })
    .range(0, 9999)
  if (error) throw new Error(`Failed to load pending contractor jobsites: ${error.message}`)
  return data ?? []
}

export async function reviewContractorJobsite(projectId, action, { adminId, reason } = {}) {
  const patch = {
    reviewed_by: adminId || null,
    reviewed_at: new Date().toISOString(),
  }
  if (action === 'approve') {
    patch.review_status = 'approved'
    patch.rejection_reason = null
    patch.is_public = true
  } else if (action === 'reject') {
    patch.review_status = 'rejected'
    patch.rejection_reason = reason || null
    patch.is_public = false
  } else if (action === 'hide') {
    patch.review_status = 'hidden'
    patch.is_public = false
  } else {
    throw new Error('Unknown jobsite review action.')
  }

  const { data, error } = await supabase
    .from('projects')
    .update(patch)
    .eq('id', projectId)
    .select(PROJECT_FIELDS)
    .maybeSingle()
  if (error) throw new Error(`Failed to update jobsite review: ${error.message}`)
  return data
}

export async function getAllProfiles() {
  const { data, error } = await supabase
    .from('profiles')
    .select(PROFILE_FIELDS)
    .order('created_at', { ascending: false })
  if (error) throw new Error(`Failed to load profiles: ${error.message}`)
  return data ?? []
}

export async function getPendingCompanyProfiles() {
  const { data, error } = await selectCompanies({ pendingOnly: true })
  if (error) {
    throw new Error(`Failed to load pending companies: ${error.message}`)
  }

  return attachCompanyEmails(data ?? [])
}

export async function getAllCompanyProfiles() {
  const { data, error } = await selectCompanies()
  if (error) {
    throw new Error(`Failed to load companies: ${error.message}`)
  }

  return attachCompanyEmails(data ?? [])
}

export async function getAllJobPosts() {
  const { data, error } = await supabase
    .from('job_posts')
    .select(ADMIN_JOB_FIELDS)
    .order('created_at', { ascending: false })
    .range(0, 9999)
  if (error) throw new Error(`Failed to load job posts: ${error.message}`)
  return data ?? []
}

export async function updateCompanyVerification(companyProfileId, verified) {
  let result = await supabase
    .from('company_profiles')
    .update({ verified: !!verified })
    .eq('id', companyProfileId)
    .select(COMPANY_FIELDS)
    .maybeSingle()
  if (isMissingColumn(result.error, 'is_hidden')) {
    result = await supabase
      .from('company_profiles')
      .update({ verified: !!verified })
      .eq('id', companyProfileId)
      .select(LEGACY_COMPANY_FIELDS)
      .maybeSingle()
  }
  if (result.error) {
    throw new Error(`Failed to update verification: ${result.error.message}`)
  }
  return { ...result.data, is_hidden: !!result.data?.is_hidden }
}

function buildCompanyAdminPatch(values = {}) {
  const patch = {}
  if (values.company_name !== undefined) patch.company_name = values.company_name || null
  if (values.company_type !== undefined) patch.company_type = values.company_type || null
  if (values.website !== undefined) patch.website = values.website || null
  if (values.phone !== undefined) patch.phone = values.phone || null
  if (values.email !== undefined) patch.email = values.email || null
  if (values.description !== undefined) patch.description = values.description || null
  if (values.trades_hired !== undefined) patch.trades_hired = values.trades_hired || null
  if (values.service_area !== undefined) patch.service_area = values.service_area || null
  if (values.verified !== undefined) patch.verified = !!values.verified
  if (values.is_hidden !== undefined) patch.is_hidden = !!values.is_hidden
  return patch
}

export async function updateCompanyAdmin(companyProfileId, values) {
  let patch = buildCompanyAdminPatch(values)
  let result = await supabase
    .from('company_profiles')
    .update(patch)
    .eq('id', companyProfileId)
    .select(COMPANY_FIELDS)
    .maybeSingle()

  if (isMissingColumn(result.error, 'is_hidden') && Object.prototype.hasOwnProperty.call(patch, 'is_hidden')) {
    const { is_hidden: _drop, ...legacyPatch } = patch
    patch = legacyPatch
    result = await supabase
      .from('company_profiles')
      .update(patch)
      .eq('id', companyProfileId)
      .select(LEGACY_COMPANY_FIELDS)
      .maybeSingle()
  }

  if (result.error) {
    throw new Error(`Failed to update company: ${result.error.message}`)
  }
  return { ...result.data, is_hidden: !!result.data?.is_hidden }
}

export async function getCompaniesForPicker() {
  const { data, error } = await supabase
    .from('company_profiles')
    .select('id, company_name, company_type')
    .order('company_name', { ascending: true })
    .range(0, 9999)
  if (error) throw new Error(`Failed to load companies: ${error.message}`)
  return data ?? []
}

const JOBSITE_FIELDS = `
  id, project_id, name, address, city, latitude, longitude, status, notes, created_at
`

export async function getAllJobsites() {
  const { data, error } = await supabase
    .from('jobsites')
    .select(`${JOBSITE_FIELDS}, project:projects(id, project_name, city)`)
    .order('created_at', { ascending: false })
    .range(0, 9999)
  if (error) throw new Error(`Failed to load jobsites: ${error.message}`)
  return data ?? []
}

export async function getProjectsForPicker() {
  const { data, error } = await supabase
    .from('projects')
    .select('id, project_name, city')
    .order('project_name', { ascending: true })
    .range(0, 9999)
  if (error) throw new Error(`Failed to load projects: ${error.message}`)
  return data ?? []
}

function buildJobsitePatch(values) {
  const patch = {}
  if (values.project_id !== undefined) patch.project_id = values.project_id || null
  if (values.name !== undefined) patch.name = values.name || null
  if (values.address !== undefined) patch.address = values.address || null
  if (values.city !== undefined) patch.city = values.city || null
  if (values.latitude !== undefined) {
    patch.latitude = values.latitude === '' || values.latitude == null ? null : Number(values.latitude)
  }
  if (values.longitude !== undefined) {
    patch.longitude = values.longitude === '' || values.longitude == null ? null : Number(values.longitude)
  }
  if (values.status !== undefined) patch.status = values.status || null
  if (values.notes !== undefined) patch.notes = values.notes || null
  return patch
}

export async function createJobsite(values) {
  if (!values?.project_id) throw new Error('project_id is required.')
  if (!values?.name) throw new Error('name is required.')
  const { data, error } = await supabase
    .from('jobsites')
    .insert(buildJobsitePatch(values))
    .select(JOBSITE_FIELDS)
    .maybeSingle()
  if (error) throw new Error(`Failed to create jobsite: ${error.message}`)
  return data
}

export async function updateJobsite(jobsiteId, values) {
  const { data, error } = await supabase
    .from('jobsites')
    .update(buildJobsitePatch(values))
    .eq('id', jobsiteId)
    .select(JOBSITE_FIELDS)
    .maybeSingle()
  if (error) throw new Error(`Failed to update jobsite: ${error.message}`)
  return data
}

export async function deleteJobsite(jobsiteId) {
  const { error } = await supabase.from('jobsites').delete().eq('id', jobsiteId)
  if (error) throw new Error(`Failed to delete jobsite: ${error.message}`)
  return true
}
