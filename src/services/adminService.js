import { supabase } from '../lib/supabase'
import { attachProjectImages, getProjectImagesForProjects } from './projectImagesService'
import { getEligibilityReason, isEligibleConstructionProject } from '../lib/projectEligibility'

const PROJECT_FIELDS = `
  id, project_name, city, province, stage, status, estimated_value,
  is_active, is_public_project, display_address, site_access_notes,
  gate_entrance, parking_instructions, muster_point, google_maps_url,
  trades_needed, hiring_status, project_value_display, primary_image_url,
  latitude, longitude, project_type, sector, start_date, end_date, description,
  source_type, created_by, review_status, reviewed_by, reviewed_at,
  rejection_reason, is_public,
  map_eligible, eligibility_reason,
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

const CLAIM_FIELDS = `
  id, project_id, company_profile_id, claim_type, status, notes, admin_notes,
  company_role, trade_scope, is_primary_gc, approved_by,
  created_at, approved_at, revoked_at, updated_at
`

const CONTRACTOR_CREATED_APPROVAL_ERROR =
  'Cannot approve project because the submitting user is not connected to an approved General Contractor company.'

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
  return authData.user
}

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

function isApprovedGcCompany(company) {
  return (
    !!company &&
    company.verified === true &&
    company.is_hidden !== true &&
    normalizeCompanyRole(company.company_type) === 'gc'
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

async function getApprovedGcCompanyForUser(userId) {
  if (!userId) throw new Error(CONTRACTOR_CREATED_APPROVAL_ERROR)

  let result = await supabase
    .from('company_profiles')
    .select('id, profile_id, company_name, company_type, verified, is_hidden')
    .eq('profile_id', userId)
    .maybeSingle()

  if (isMissingColumn(result.error, 'is_hidden')) {
    result = await supabase
      .from('company_profiles')
      .select('id, profile_id, company_name, company_type, verified')
      .eq('profile_id', userId)
      .maybeSingle()
  }

  if (result.error) throw new Error(`Failed to verify submitting company: ${result.error.message}`)
  const company = result.data ? { ...result.data, is_hidden: !!result.data.is_hidden } : null
  if (!isApprovedGcCompany(company)) throw new Error(CONTRACTOR_CREATED_APPROVAL_ERROR)
  return company
}

async function validateContractorCreatedApproval(projectId) {
  const { data: project, error } = await supabase
    .from('projects')
    .select(PROJECT_FIELDS)
    .eq('id', projectId)
    .maybeSingle()
  if (error) throw new Error(`Failed to verify contractor-created project: ${error.message}`)
  if (!project) throw new Error('Project not found.')
  if (project.source_type !== 'contractor_created') return null
  if (!project.created_by) throw new Error(CONTRACTOR_CREATED_APPROVAL_ERROR)

  const company = await getApprovedGcCompanyForUser(project.created_by)
  return { project, company }
}

async function clearOtherPrimaryGc(projectId, claimId = null) {
  if (!projectId) return
  let query = supabase
    .from('project_claims')
    .update({ is_primary_gc: false })
    .eq('project_id', projectId)
    .eq('company_role', 'gc')
    .eq('is_primary_gc', true)

  if (claimId) query = query.neq('id', claimId)

  const { error } = await query
  if (error) throw new Error(`Failed to reassign primary General Contractor: ${error.message}`)
}

async function findExistingProjectClaim(projectId, companyId) {
  const { data, error } = await supabase
    .from('project_claims')
    .select(CLAIM_FIELDS)
    .eq('project_id', projectId)
    .eq('company_profile_id', companyId)
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle()
  if (error) throw new Error(`Failed to check existing project claim: ${error.message}`)
  return data
}

async function ensurePrimaryGcClaimForContractorProject(project, company, adminId) {
  if (project?.source_type !== 'contractor_created') return null
  const approvedAt = new Date().toISOString()
  const existingClaim = await findExistingProjectClaim(project.id, company.id)

  await clearOtherPrimaryGc(project.id, existingClaim?.id || null)

  const claimPatch = {
    project_id: project.id,
    company_profile_id: company.id,
    claim_type: 'gc',
    company_role: 'gc',
    is_primary_gc: true,
    status: 'approved',
    approved_by: adminId || null,
    approved_at: existingClaim?.approved_at || approvedAt,
    revoked_at: null,
    admin_notes: existingClaim?.admin_notes || 'Auto-approved from contractor-created jobsite approval.',
  }

  let claimResult
  if (existingClaim) {
    claimResult = await supabase
      .from('project_claims')
      .update(claimPatch)
      .eq('id', existingClaim.id)
      .select(CLAIM_FIELDS)
      .maybeSingle()
  } else {
    claimResult = await supabase
      .from('project_claims')
      .insert(claimPatch)
      .select(CLAIM_FIELDS)
      .maybeSingle()
  }

  if (claimResult.error) {
    throw new Error(`Failed to assign Primary General Contractor: ${claimResult.error.message}`)
  }
  if (!claimResult.data) throw new Error('Failed to assign Primary General Contractor.')

  const { error: projectError } = await supabase
    .from('projects')
    .update({
      project_status_type: 'verified',
      claimed_by_company_id: company.id,
    })
    .eq('id', project.id)
  if (projectError) throw new Error(`Failed to update project ownership: ${projectError.message}`)

  return claimResult.data
}

async function revertContractorProjectApproval(projectId, reason) {
  const { error } = await supabase
    .from('projects')
    .update({
      review_status: 'pending_review',
      reviewed_by: null,
      reviewed_at: null,
      rejection_reason: reason || null,
      is_public: false,
    })
    .eq('id', projectId)
    .eq('source_type', 'contractor_created')
  if (error) {
    throw new Error(`${reason} Approval was reverted unsuccessfully: ${error.message}`)
  }
}

export async function getAllProjects() {
  await requireAdmin()
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
  await requireAdmin()
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
  if (values.map_eligible !== undefined) patch.map_eligible = !!values.map_eligible
  if (values.eligibility_reason !== undefined) patch.eligibility_reason = values.eligibility_reason || null
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
  await requireAdmin()
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
  await requireAdmin()
  const contractorApproval = action === 'approve'
    ? await validateContractorCreatedApproval(projectId)
    : null
  const patch = {
    reviewed_by: adminId || null,
    reviewed_at: new Date().toISOString(),
  }
  if (action === 'approve') {
    patch.review_status = 'approved'
    patch.rejection_reason = null
    patch.is_public = true
    if (contractorApproval?.project) {
      patch.map_eligible = isEligibleConstructionProject(contractorApproval.project)
      patch.eligibility_reason = getEligibilityReason(contractorApproval.project)
    }
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
  if (action === 'approve' && contractorApproval) {
    try {
      await ensurePrimaryGcClaimForContractorProject(data, contractorApproval.company, adminId)
    } catch (err) {
      const message = err?.message || 'Failed to assign Primary General Contractor.'
      await revertContractorProjectApproval(projectId, message)
      throw new Error(message)
    }
  }
  return data
}

export async function getAllProfiles() {
  await requireAdmin()
  const { data, error } = await supabase
    .from('profiles')
    .select(PROFILE_FIELDS)
    .order('created_at', { ascending: false })
  if (error) throw new Error(`Failed to load profiles: ${error.message}`)
  return data ?? []
}

export async function getPendingCompanyProfiles() {
  await requireAdmin()
  const { data, error } = await selectCompanies({ pendingOnly: true })
  if (error) {
    throw new Error(`Failed to load pending companies: ${error.message}`)
  }

  return attachCompanyEmails(data ?? [])
}

export async function getAllCompanyProfiles() {
  await requireAdmin()
  const { data, error } = await selectCompanies()
  if (error) {
    throw new Error(`Failed to load companies: ${error.message}`)
  }

  return attachCompanyEmails(data ?? [])
}

export async function getAllJobPosts() {
  await requireAdmin()
  const { data, error } = await supabase
    .from('job_posts')
    .select(ADMIN_JOB_FIELDS)
    .order('created_at', { ascending: false })
    .range(0, 9999)
  if (error) throw new Error(`Failed to load job posts: ${error.message}`)
  return data ?? []
}

export async function updateCompanyVerification(companyProfileId, verified) {
  await requireAdmin()
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
  await requireAdmin()
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
  await requireAdmin()
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
  await requireAdmin()
  const { data, error } = await supabase
    .from('jobsites')
    .select(`${JOBSITE_FIELDS}, project:projects(id, project_name, city)`)
    .order('created_at', { ascending: false })
    .range(0, 9999)
  if (error) throw new Error(`Failed to load jobsites: ${error.message}`)
  return data ?? []
}

export async function getProjectsForPicker() {
  await requireAdmin()
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
  await requireAdmin()
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
  await requireAdmin()
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
  await requireAdmin()
  const { error } = await supabase.from('jobsites').delete().eq('id', jobsiteId)
  if (error) throw new Error(`Failed to delete jobsite: ${error.message}`)
  return true
}
