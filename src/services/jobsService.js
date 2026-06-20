import { supabase } from '../lib/supabase'
import { isMajorProject } from '../lib/projectValue'
import { normalizeApprenticeshipLevel, normalizeTradeForSave } from '../lib/trades'
import { attachProjectImages, getProjectImagesForProjects } from './projectImagesService'

const BASE_JOB_FIELDS = `
  id,
  project_id,
  jobsite_id,
  company_profile_id,
  title,
  trade,
  employment_type,
  schedule,
  pay_range,
  description,
  requirements,
  status,
  created_at,
  expires_at,
  positions_count,
  experience_level
`

const STRUCTURED_JOB_FIELDS = `
  hiring_tags,
  camp_available,
  project_assignment,
  start_date,
  duration,
  required_certifications
`

const JOB_FIELDS = `${BASE_JOB_FIELDS}, ${STRUCTURED_JOB_FIELDS}`
export const JOB_STATUSES = ['open', 'filled', 'paused', 'closed', 'archived']

export function normalizeJobStatus(status) {
  const normalized = String(status || '').trim().toLowerCase()
  return JOB_STATUSES.includes(normalized) ? normalized : 'open'
}

function isMissingStructuredJobColumn(error) {
  const message = String(error?.message || '')
  return [
    'hiring_tags',
    'camp_available',
    'project_assignment',
    'start_date',
    'duration',
    'required_certifications',
  ].some((column) => (
    message.includes(`'${column}' column`) ||
    message.includes(`column job_posts.${column} does not exist`) ||
    message.includes(`Could not find the '${column}' column`)
  ))
}

function withStructuredFallback(row) {
  return {
    ...row,
    status: normalizeJobStatus(row?.status),
    hiring_tags: Array.isArray(row?.hiring_tags) ? row.hiring_tags : [],
    camp_available: row?.camp_available ?? null,
    project_assignment: row?.project_assignment ?? null,
    start_date: row?.start_date ?? null,
    duration: row?.duration ?? null,
    required_certifications: row?.required_certifications ?? null,
  }
}

function normalizeHiringTags(value) {
  if (!Array.isArray(value)) return []
  return value.filter(Boolean).map((tag) => String(tag).trim()).filter(Boolean)
}

function mapRows(data) {
  return (data ?? []).map(withStructuredFallback)
}

function mapRow(data) {
  return data ? withStructuredFallback(data) : data
}

async function getApplicantCountsForJobIds(jobIds) {
  const ids = [...new Set((jobIds || []).filter(Boolean))]
  if (ids.length === 0) return new Map()

  const { data, error } = await supabase
    .from('applications')
    .select('job_post_id')
    .in('job_post_id', ids)
  if (error) {
    console.warn('[jobsService] Failed to load applicant counts:', error.message)
    return new Map()
  }

  const counts = new Map()
  for (const row of data ?? []) {
    counts.set(row.job_post_id, (counts.get(row.job_post_id) || 0) + 1)
  }
  return counts
}

async function withApplicantCounts(jobs) {
  const counts = await getApplicantCountsForJobIds((jobs || []).map((job) => job.id))
  return (jobs || []).map((job) => ({
    ...job,
    applicants_count: counts.get(job.id) || 0,
  }))
}

function isMissingProjectTeamColumn(error) {
  const message = String(error?.message || '')
  return (
    message.includes("'company_role' column") ||
    message.includes("'trade_scope' column") ||
    message.includes("'is_primary_gc' column") ||
    message.includes('column project_claims.company_role does not exist') ||
    message.includes('column project_claims.trade_scope does not exist') ||
    message.includes('column project_claims.is_primary_gc does not exist')
  )
}

function toCompanyRole(value) {
  if (value === 'sc' || value === 'subcontractor') return 'subcontractor'
  return 'gc'
}

async function getCompanyIdForUser(userId) {
  if (!userId) throw new Error('No authenticated user.')
  const { data, error } = await supabase
    .from('company_profiles')
    .select('id')
    .eq('profile_id', userId)
    .maybeSingle()
  if (error) throw new Error(`Failed to load company profile: ${error.message}`)
  if (!data) throw new Error('Create your company profile before posting jobs.')
  return data.id
}

async function getWorkerIdForUser(userId) {
  if (!userId) throw new Error('No authenticated user.')
  const { data, error } = await supabase
    .from('worker_profiles')
    .select('id')
    .eq('profile_id', userId)
    .maybeSingle()
  if (error) throw new Error(`Failed to load worker profile: ${error.message}`)
  if (!data) throw new Error('Create your worker profile first.')
  return data.id
}

export async function getJobsByProjectId(projectId) {
  if (!projectId) return []

  let result = await supabase
    .from('job_posts')
    .select(`${JOB_FIELDS}, company:company_profiles(id, company_name)`)
    .eq('project_id', projectId)
    .ilike('status', 'open')
    .order('created_at', { ascending: false })
  if (isMissingStructuredJobColumn(result.error)) {
    result = await supabase
      .from('job_posts')
      .select(`${BASE_JOB_FIELDS}, company:company_profiles(id, company_name)`)
      .eq('project_id', projectId)
      .ilike('status', 'open')
      .order('created_at', { ascending: false })
  }
  if (result.error) throw new Error(`Failed to load jobs: ${result.error.message}`)

  return mapRows(result.data)
}

export async function getRecentOpenJobs(limit = 6) {
  let result = await supabase
    .from('job_posts')
    .select(`${JOB_FIELDS}, company:company_profiles(id, company_name), project:projects(id, project_name, city, province, display_address, stage)`)
    .ilike('status', 'open')
    .order('created_at', { ascending: false })
    .limit(limit)
  if (isMissingStructuredJobColumn(result.error)) {
    result = await supabase
      .from('job_posts')
      .select(`${BASE_JOB_FIELDS}, company:company_profiles(id, company_name), project:projects(id, project_name, city, province, display_address, stage)`)
      .ilike('status', 'open')
      .order('created_at', { ascending: false })
      .limit(limit)
  }
  if (result.error) throw new Error(`Failed to load recent jobs: ${result.error.message}`)
  return mapRows(result.data)
}

export async function getApprovedProjectsForUser(userId) {
  if (!userId) throw new Error('No authenticated user.')
  
  // Get current user's company profile
  const { data: companyProfile, error: companyError } = await supabase
    .from('company_profiles')
    .select('id, company_name')
    .eq('profile_id', userId)
    .maybeSingle()
  if (companyError) throw new Error(`Failed to load company profile: ${companyError.message}`)
  if (!companyProfile) throw new Error('Create your company profile first.')
  
  // Fetch approved claims with project details
  let result = await supabase
    .from('project_claims')
    .select('id, project_id, company_profile_id, status, company_role, trade_scope, is_primary_gc, projects!inner(id, project_name, latitude, longitude, stage, city, province, estimated_value, is_active, is_public_project)')
    .eq('company_profile_id', companyProfile.id)
    .eq('status', 'approved')
    .order('created_at', { ascending: false })
  if (isMissingProjectTeamColumn(result.error)) {
    result = await supabase
      .from('project_claims')
      .select('id, project_id, company_profile_id, status, claim_type, projects!inner(id, project_name, latitude, longitude, stage, city, province, estimated_value, is_active, is_public_project)')
      .eq('company_profile_id', companyProfile.id)
      .eq('status', 'approved')
      .order('created_at', { ascending: false })
  }
  if (result.error) throw new Error(`Failed to load approved projects: ${result.error.message}`)
  
  const claims = (result.data ?? []).filter((claim) => isMajorProject(claim.projects))
  const imagesByProject = await getProjectImagesForProjects(claims.map((claim) => claim.project_id))

  // Map to dropdown format: label = project_name, value = project_id
  const mapped = claims
    .map(claim => {
    const companyRole = claim.company_role || toCompanyRole(claim.claim_type)
    return {
      id: claim.id,
      project_id: claim.project_id,
      company_profile_id: claim.company_profile_id,
      project_name: claim.projects?.project_name || `Project ${claim.project_id}`,
      latitude: claim.projects?.latitude,
      longitude: claim.projects?.longitude,
      stage: claim.projects?.stage,
      city: claim.projects?.city,
      province: claim.projects?.province,
      company_role: companyRole,
      trade_scope: claim.trade_scope ?? null,
      is_primary_gc: claim.is_primary_gc ?? companyRole === 'gc',
    }
  })
  return attachProjectImages(mapped, imagesByProject)
}

export async function getApprovedGcProjectsForUser(userId) {
  const projects = await getApprovedProjectsForUser(userId)
  return projects.filter((project) => (
    project.company_role === 'gc' &&
    project.is_primary_gc !== false
  ))
}

export async function getMyCompanyJobs(userId) {
  const companyId = await getCompanyIdForUser(userId)
  let result = await supabase
    .from('job_posts')
    .select(JOB_FIELDS)
    .eq('company_profile_id', companyId)
    .order('created_at', { ascending: false })
  if (isMissingStructuredJobColumn(result.error)) {
    result = await supabase
      .from('job_posts')
      .select(BASE_JOB_FIELDS)
      .eq('company_profile_id', companyId)
      .order('created_at', { ascending: false })
  }
  if (result.error) throw new Error(`Failed to load company jobs: ${result.error.message}`)
  return withApplicantCounts(mapRows(result.data))
}

export async function createJobPost(userId, values) {
  const companyId = await getCompanyIdForUser(userId)
  if (!values?.project_id) throw new Error('project_id is required.')
  if (!values?.title) throw new Error('title is required.')

  const { data: project, error: projectError } = await supabase
    .from('projects')
    .select('id, estimated_value, is_active, is_public_project')
    .eq('id', Number(values.project_id))
    .maybeSingle()
  if (projectError) throw new Error(`Failed to verify project value: ${projectError.message}`)
  if (!isMajorProject(project)) throw new Error('Job posts can only be tied to active public major construction projects.')
  
  const row = {
    project_id: Number(values.project_id),
    company_profile_id: companyId,
    jobsite_id: null,
    title: values.title,
    trade: normalizeTradeForSave(values.trade),
    employment_type: values.employment_type ?? null,
    schedule: values.schedule ?? null,
    pay_range: values.pay_range ?? null,
    description: values.description ?? null,
    requirements: values.requirements ?? null,
    status: normalizeJobStatus(values.status),
    expires_at: values.expires_at ? new Date(values.expires_at).toISOString() : null,
    positions_count: values.positions_count ?? 1,
    experience_level: normalizeApprenticeshipLevel(values.experience_level),
    hiring_tags: normalizeHiringTags(values.hiring_tags),
    camp_available: values.camp_available ?? null,
    project_assignment: values.project_assignment ?? null,
    start_date: values.start_date || null,
    duration: values.duration ?? null,
    required_certifications: values.required_certifications ?? null,
  }

  let result = await supabase
    .from('job_posts')
    .insert(row)
    .select(JOB_FIELDS)
    .maybeSingle()
  if (isMissingStructuredJobColumn(result.error)) {
    const {
      hiring_tags,
      camp_available,
      project_assignment,
      start_date,
      duration,
      required_certifications,
      ...baseRow
    } = row
    result = await supabase
      .from('job_posts')
      .insert(baseRow)
      .select(BASE_JOB_FIELDS)
      .maybeSingle()
  }
  if (result.error) {
    console.error('[jobsService] Job post save error:', result.error.message)
    throw new Error(`Failed to create job post: ${result.error.message}`)
  }
  return mapRow(result.data)
}

export async function updateJobPost(jobId, userId, values) {
  const companyId = await getCompanyIdForUser(userId)
  const patch = {}
  if (values.title !== undefined) patch.title = values.title
  if (values.trade !== undefined) patch.trade = normalizeTradeForSave(values.trade)
  if (values.employment_type !== undefined) patch.employment_type = values.employment_type
  if (values.schedule !== undefined) patch.schedule = values.schedule
  if (values.pay_range !== undefined) patch.pay_range = values.pay_range
  if (values.description !== undefined) patch.description = values.description
  if (values.requirements !== undefined) patch.requirements = values.requirements
  if (values.status !== undefined) patch.status = normalizeJobStatus(values.status)
  if (values.positions_count !== undefined) patch.positions_count = values.positions_count
  if (values.experience_level !== undefined) patch.experience_level = normalizeApprenticeshipLevel(values.experience_level)
  if (values.hiring_tags !== undefined) patch.hiring_tags = normalizeHiringTags(values.hiring_tags)
  if (values.camp_available !== undefined) patch.camp_available = values.camp_available
  if (values.project_assignment !== undefined) patch.project_assignment = values.project_assignment
  if (values.start_date !== undefined) patch.start_date = values.start_date || null
  if (values.duration !== undefined) patch.duration = values.duration
  if (values.required_certifications !== undefined) patch.required_certifications = values.required_certifications
  if (values.expires_at !== undefined) {
    patch.expires_at = values.expires_at
      ? new Date(values.expires_at).toISOString()
      : null
  }

  let result = await supabase
    .from('job_posts')
    .update(patch)
    .eq('id', jobId)
    .eq('company_profile_id', companyId)
    .select(JOB_FIELDS)
    .maybeSingle()
  if (isMissingStructuredJobColumn(result.error)) {
    const {
      hiring_tags,
      camp_available,
      project_assignment,
      start_date,
      duration,
      required_certifications,
      ...basePatch
    } = patch
    result = await supabase
      .from('job_posts')
      .update(basePatch)
      .eq('id', jobId)
      .eq('company_profile_id', companyId)
      .select(BASE_JOB_FIELDS)
      .maybeSingle()
  }
  if (result.error) throw new Error(`Failed to update job post: ${result.error.message}`)
  return mapRow(result.data)
}

export async function getSavedJobs(userId) {
  const workerId = await getWorkerIdForUser(userId)
  const { data, error } = await supabase
    .from('saved_jobs')
    .select(`id, created_at, job_post:job_posts(${JOB_FIELDS})`)
    .eq('worker_profile_id', workerId)
    .order('created_at', { ascending: false })
  if (error) throw new Error(`Failed to load saved jobs: ${error.message}`)
  return (data ?? [])
    .map((row) => ({
    ...row,
    job_post: mapRow(row.job_post),
  }))
    .filter((row) => row.job_post?.status === 'open')
}

export async function getSavedJobIds(userId, jobPostIds = []) {
  const ids = [...new Set((jobPostIds || []).filter(Boolean))]
  if (ids.length === 0) return new Set()
  const workerId = await getWorkerIdForUser(userId)
  const { data, error } = await supabase
    .from('saved_jobs')
    .select('job_post_id')
    .eq('worker_profile_id', workerId)
    .in('job_post_id', ids)
  if (error) throw new Error(`Failed to load saved job state: ${error.message}`)
  return new Set((data ?? []).map((row) => row.job_post_id))
}

export async function deleteJobPost(jobId, userId) {
  const companyId = await getCompanyIdForUser(userId)
  const counts = await getApplicantCountsForJobIds([jobId])
  const applicantCount = counts.get(jobId) || 0

  if (applicantCount > 0) {
    const { data, error } = await supabase
      .from('job_posts')
      .update({ status: 'archived' })
      .eq('id', jobId)
      .eq('company_profile_id', companyId)
      .select(BASE_JOB_FIELDS)
      .maybeSingle()
    if (error) throw new Error(`Failed to archive job post: ${error.message}`)
    return { mode: 'archived', job: mapRow(data), applicantCount }
  }

  const { error } = await supabase
    .from('job_posts')
    .delete()
    .eq('id', jobId)
    .eq('company_profile_id', companyId)
  if (error) throw new Error(`Failed to delete job post: ${error.message}`)
  return { mode: 'deleted', applicantCount }
}

export async function toggleSavedJob(userId, jobPostId) {
  const workerId = await getWorkerIdForUser(userId)

  const { data: existing, error: findError } = await supabase
    .from('saved_jobs')
    .select('id')
    .eq('worker_profile_id', workerId)
    .eq('job_post_id', jobPostId)
    .maybeSingle()
  if (findError) throw new Error(`Failed to check saved job: ${findError.message}`)

  if (existing) {
    const { error } = await supabase
      .from('saved_jobs')
      .delete()
      .eq('id', existing.id)
    if (error) throw new Error(`Failed to remove saved job: ${error.message}`)
    return { saved: false }
  }

  const { error } = await supabase
    .from('saved_jobs')
    .insert({ worker_profile_id: workerId, job_post_id: jobPostId })
  if (error) throw new Error(`Failed to save job: ${error.message}`)
  return { saved: true }
}
