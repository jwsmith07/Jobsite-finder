import { supabase } from '../lib/supabase'
import { getProjectImages } from './projectImagesService'
import { normalizeJobStatus } from './jobsService'
import { getWorkerJobMatch } from '../lib/workerCredentials'

const PROJECT_FIELDS = `
  id, project_name, project_type, sector, city, region, province, address,
  display_address, site_access_notes, gate_entrance, parking_instructions,
  muster_point, google_maps_url, hiring_status, project_value_display,
  primary_image_url, latitude, longitude, stage, status, estimated_value,
  owner, general_contractor, start_date, end_date, description, source_type,
  created_by, review_status, reviewed_at, rejection_reason, is_public,
  is_active, is_public_project, project_status_type, claimed_by_company_id,
  trades_needed, created_at
`

const JOB_FIELDS = `
  id, project_id, jobsite_id, company_profile_id, title, trade, employment_type,
  schedule, pay_range, description, requirements, status, created_at, expires_at,
  positions_count, experience_level, hiring_tags, camp_available,
  project_assignment, start_date, duration, required_certifications
`

const APPLICATION_FIELDS = `
  id, job_post_id, resume_url, worker_name, worker_trade, worker_experience, status,
  worker_profile_id, created_at,
  job_post:job_posts(id, title, trade, project_id, company_profile_id, experience_level,
    requirements, required_certifications, camp_available, project_assignment)
`

const ASSIGNMENT_FIELDS = `
  id, gc_company_id, subcontractor_company_id, jobsite_id, status, created_at,
  subcontractor:company_profiles(id, company_name, company_type, email, phone, website, trades_hired)
`

const PROJECT_UPDATE_FIELDS = `
  id, project_name, project_type, city, province, display_address,
  site_access_notes, gate_entrance, parking_instructions, muster_point,
  google_maps_url, hiring_status, stage, end_date, description,
  trades_needed, is_public
`

const CANDIDATE_FIELDS = `
  id, gc_company_id, project_id, worker_profile_id, stage, notes, saved_at, updated_at
`

export const CANDIDATE_STAGES = ['saved', 'reviewed', 'contacted', 'interview', 'offer', 'hired', 'rejected']

function toCompanyRole(claim) {
  const role = String(claim?.company_role || claim?.claim_type || '').toLowerCase()
  if (role === 'gc' || role === 'general_contractor' || role === 'general-contractor') return 'gc'
  if (role === 'sc' || role === 'subcontractor') return 'subcontractor'
  return role
}

function normalizeJob(row) {
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

function isSubcontractorCompany(company) {
  const type = String(company?.company_type || '').toLowerCase()
  const compact = type.replace(/[^a-z]/g, '')
  return type === 'sc' || type === 'subcontractor' || compact.includes('subcontractor')
}

async function getCompanyForUser(userId) {
  if (!userId) throw new Error('No authenticated user.')
  const { data, error } = await supabase
    .from('company_profiles')
    .select('id, company_name, company_type')
    .eq('profile_id', userId)
    .maybeSingle()
  if (error) throw new Error(`Failed to load company profile: ${error.message}`)
  if (!data) throw new Error('Create your company profile before managing this project.')
  return data
}

async function getAuthorizedProject(companyId, projectId) {
  const { data, error } = await supabase
    .from('project_claims')
    .select(`id, project_id, company_profile_id, status, company_role, claim_type, is_primary_gc, project:projects(${PROJECT_FIELDS})`)
    .eq('project_id', projectId)
    .eq('company_profile_id', companyId)
    .eq('status', 'approved')
    .maybeSingle()

  if (error) throw new Error(`Failed to verify project access: ${error.message}`)
  const role = toCompanyRole(data)
  if (!data || role !== 'gc' || data.is_primary_gc === false || !data.project) {
    return { authorized: false, project: null, claim: data || null }
  }

  return { authorized: true, project: data.project, claim: data }
}

async function getProjectJobs(companyId, projectId) {
  const { data, error } = await supabase
    .from('job_posts')
    .select(JOB_FIELDS)
    .eq('company_profile_id', companyId)
    .eq('project_id', projectId)
    .order('created_at', { ascending: false })
    .range(0, 9999)
  if (error) throw new Error(`Failed to load project jobs: ${error.message}`)
  return (data ?? []).map(normalizeJob)
}

async function getProjectApplications(companyId, projectId, jobIds = []) {
  const ids = [...new Set((jobIds || []).filter(Boolean))]
  if (ids.length === 0) return []

  const { data, error } = await supabase
    .from('applications')
    .select(APPLICATION_FIELDS)
    .in('job_post_id', ids)
    .order('created_at', { ascending: false })
    .range(0, 9999)
  if (error) {
    console.warn('[gcProjectWorkspaceService] Failed to load project applicants:', error.message)
    return []
  }
  return (data ?? []).filter((application) => (
    application.job_post?.project_id === Number(projectId) &&
    application.job_post?.company_profile_id === companyId
  ))
}

async function getWorkerCertifications(workerProfileIds = []) {
  const ids = [...new Set((workerProfileIds || []).filter(Boolean))]
  if (ids.length === 0) return new Map()
  const { data, error } = await supabase
    .from('worker_certifications')
    .select('id, worker_profile_id, certification_name, issuer, expires_at, created_at')
    .in('worker_profile_id', ids)
    .range(0, 9999)
  if (error) {
    console.warn('[gcProjectWorkspaceService] Failed to load worker certifications:', error.message)
    return new Map()
  }
  const map = new Map()
  for (const row of data ?? []) {
    const list = map.get(row.worker_profile_id) || []
    list.push(row)
    map.set(row.worker_profile_id, list)
  }
  return map
}

async function getWorkerProfilesByIds(workerProfileIds = []) {
  const ids = [...new Set((workerProfileIds || []).filter(Boolean))]
  if (ids.length === 0) return new Map()
  const { data, error } = await supabase
    .from('worker_profiles')
    .select('id, profile_id, headline, trade, secondary_trade, apprenticeship_level, trade_level, experience_years, city, province, availability_status, work_preferences, preferred_regions, camp_ready, willing_to_travel, resume_url, talent_visibility')
    .in('id', ids)
    .range(0, 9999)
  if (error) {
    console.warn('[gcProjectWorkspaceService] Failed to load worker profiles:', error.message)
    return new Map()
  }
  const certs = await getWorkerCertifications(ids)
  return new Map((data ?? []).map((profile) => [
    profile.id,
    { ...profile, certifications: certs.get(profile.id) || [] },
  ]))
}

function withApplicantMatches(applications, workerProfiles, project) {
  return (applications ?? []).map((application) => {
    const workerProfile = workerProfiles.get(application.worker_profile_id) || null
    const match = workerProfile
      ? getWorkerJobMatch(workerProfile, application.job_post || {}, project)
      : { indicators: [], matched: 0, total: 0, score: null }
    return { ...application, worker_profile: workerProfile, match }
  })
}

function bestProjectMatch(workerProfile, jobs, project) {
  const matches = (jobs || []).map((job) => ({
    job,
    match: getWorkerJobMatch(workerProfile, job, project),
  }))
  return matches.sort((a, b) => Number(b.match.score || 0) - Number(a.match.score || 0))[0] || {
    job: null,
    match: getWorkerJobMatch(workerProfile, {}, project),
  }
}

async function getProjectTalentPool(project, jobs, excludedWorkerProfileIds = []) {
  const excluded = new Set(excludedWorkerProfileIds.map(String))
  const { data, error } = await supabase
    .from('worker_profiles')
    .select('id, profile_id, headline, trade, secondary_trade, apprenticeship_level, trade_level, experience_years, city, province, availability_status, work_preferences, preferred_regions, camp_ready, willing_to_travel, resume_url, talent_visibility')
    .order('updated_at', { ascending: false, nullsFirst: false })
    .limit(80)
  if (error) {
    console.warn('[gcProjectWorkspaceService] Failed to load project talent pool:', error.message)
    return []
  }
  const profiles = (data ?? [])
    .filter((profile) => !excluded.has(String(profile.id)))
    .filter((profile) => String(profile.talent_visibility || 'approved_gcs') !== 'hidden')
  const certs = await getWorkerCertifications(profiles.map((profile) => profile.id))
  return profiles
    .map((profile) => {
      const enriched = { ...profile, certifications: certs.get(profile.id) || [] }
      const best = bestProjectMatch(enriched, jobs, project)
      return { worker_profile: enriched, job: best.job, match: best.match }
    })
    .filter((row) => Number(row.match.score || 0) >= 45)
    .sort((a, b) => Number(b.match.score || 0) - Number(a.match.score || 0))
    .slice(0, 20)
}

async function getCandidatePipeline(gcCompanyId, projectId) {
  const { data, error } = await supabase
    .from('gc_candidate_pipeline')
    .select(CANDIDATE_FIELDS)
    .eq('gc_company_id', gcCompanyId)
    .eq('project_id', projectId)
    .order('updated_at', { ascending: false })
    .range(0, 9999)
  if (error) {
    console.warn('[gcProjectWorkspaceService] Failed to load candidate pipeline:', error.message)
    return []
  }
  return data ?? []
}

function attachCandidateRecords(items, candidateMap) {
  return (items || []).map((item) => {
    const workerId = item.worker_profile_id || item.worker_profile?.id
    return { ...item, candidate: candidateMap.get(workerId) || null }
  })
}

function buildSavedCandidateRows(candidates, workerProfiles, jobs, project) {
  return (candidates || [])
    .map((candidate) => {
      const workerProfile = workerProfiles.get(candidate.worker_profile_id)
      if (!workerProfile) return null
      const best = bestProjectMatch(workerProfile, jobs, project)
      return {
        id: `candidate-${candidate.id}`,
        worker_profile_id: workerProfile.id,
        worker_profile: workerProfile,
        worker_name: workerProfile.headline || workerProfile.trade || 'Worker',
        worker_trade: workerProfile.trade,
        worker_experience: workerProfile.experience_years,
        resume_url: workerProfile.resume_url,
        job_post: best.job,
        match: best.match,
        status: candidate.stage,
        candidate,
      }
    })
    .filter(Boolean)
}

function buildJobsiteBridgeRow(project) {
  return {
    project_id: project.id,
    name: project.project_name || `Project ${project.id}`,
    address: project.display_address || project.address || null,
    city: project.city || null,
    latitude: project.latitude ?? null,
    longitude: project.longitude ?? null,
    status: project.is_active === false ? 'paused' : 'active',
    notes: 'Auto-created for GC project workspace subcontractor assignments.',
  }
}

async function resolveProjectJobsite(project) {
  const { data: existing, error: existingError } = await supabase
    .from('jobsites')
    .select('id, project_id, name, address, city, latitude, longitude, status, notes, created_at')
    .eq('project_id', project.id)
    .limit(1)
    .maybeSingle()
  if (existingError) throw new Error(`Failed to resolve project jobsite bridge: ${existingError.message}`)
  return { jobsite: existing || null, created: false }
}

async function getOrCreateProjectJobsite(project) {
  const existing = await resolveProjectJobsite(project)
  if (existing.jobsite) return existing

  const { data, error } = await supabase
    .from('jobsites')
    .insert(buildJobsiteBridgeRow(project))
    .select('id, project_id, name, address, city, latitude, longitude, status, notes, created_at')
    .maybeSingle()
  if (error) throw new Error(`Failed to create project jobsite bridge: ${error.message}`)
  return { jobsite: data, created: true }
}

async function getSubcontractorAssignments(gcCompanyId, jobsiteId) {
  if (!jobsiteId) return []
  const { data, error } = await supabase
    .from('gc_subcontractor_assignments')
    .select(ASSIGNMENT_FIELDS)
    .eq('gc_company_id', gcCompanyId)
    .eq('jobsite_id', jobsiteId)
    .order('created_at', { ascending: false })
    .range(0, 9999)
  if (error) throw new Error(`Failed to load subcontractor assignments: ${error.message}`)
  return data ?? []
}

async function getAvailableSubcontractors(gcCompanyId, assignedIds = []) {
  const { data, error } = await supabase
    .from('company_profiles')
    .select('id, company_name, company_type, email, phone, website, trades_hired, verified')
    .order('company_name', { ascending: true })
    .range(0, 9999)
  if (error) throw new Error(`Failed to load subcontractors: ${error.message}`)

  const assigned = new Set(assignedIds.map(String))
  return (data ?? [])
    .filter((company) => company.id !== gcCompanyId)
    .filter(isSubcontractorCompany)
    .filter((company) => !assigned.has(String(company.id)))
}

export async function getGcProjectWorkspaceData(userId, projectId) {
  const company = await getCompanyForUser(userId)
  const access = await getAuthorizedProject(company.id, Number(projectId))
  if (!access.authorized) {
    return { authorized: false, company, project: null }
  }

  const [images, jobs, bridge] = await Promise.all([
    getProjectImages(access.project.id),
    getProjectJobs(company.id, access.project.id),
    resolveProjectJobsite(access.project),
  ])
  const applications = await getProjectApplications(
    company.id,
    access.project.id,
    jobs.map((job) => job.id),
  )
  const workerProfiles = await getWorkerProfilesByIds(applications.map((application) => application.worker_profile_id))
  const matchedApplications = withApplicantMatches(applications, workerProfiles, access.project)
  const talentPool = await getProjectTalentPool(
    access.project,
    jobs.filter((job) => job.status === 'open'),
    applications.map((application) => application.worker_profile_id),
  )
  const candidates = await getCandidatePipeline(company.id, access.project.id)
  const candidateMap = new Map(candidates.map((candidate) => [candidate.worker_profile_id, candidate]))
  const savedCandidateProfiles = await getWorkerProfilesByIds(candidates.map((candidate) => candidate.worker_profile_id))
  const savedCandidates = buildSavedCandidateRows(candidates, savedCandidateProfiles, jobs, access.project)
  const assignments = await getSubcontractorAssignments(company.id, bridge.jobsite?.id)
  const availableSubcontractors = await getAvailableSubcontractors(
    company.id,
    assignments.map((assignment) => assignment.subcontractor_company_id),
  )

  return {
    authorized: true,
    company,
    claim: access.claim,
    project: access.project,
    images,
    jobs,
    applications: attachCandidateRecords(matchedApplications, candidateMap),
    talentPool: attachCandidateRecords(talentPool, candidateMap),
    candidates,
    savedCandidates,
    jobsiteBridge: bridge,
    subcontractorAssignments: assignments,
    availableSubcontractors,
    summary: {
      photoCount: images.length,
      openJobsCount: jobs.filter((job) => job.status === 'open').length,
      applicantCount: matchedApplications.length,
      reviewedCount: matchedApplications.filter((application) => ['shortlisted', 'reviewed'].includes(String(application.status || '').toLowerCase())).length,
      interviewCount: matchedApplications.filter((application) => String(application.status || '').toLowerCase() === 'interview').length,
      hiredCount: matchedApplications.filter((application) => String(application.status || '').toLowerCase() === 'hired').length,
      rejectedCount: matchedApplications.filter((application) => String(application.status || '').toLowerCase() === 'rejected').length,
      savedCandidateCount: candidates.length,
      candidateInterviewCount: candidates.filter((candidate) => candidate.stage === 'interview').length,
      candidateOfferCount: candidates.filter((candidate) => candidate.stage === 'offer').length,
      candidateHireCount: candidates.filter((candidate) => candidate.stage === 'hired').length,
      openPositionsCount: jobs
        .filter((job) => job.status === 'open')
        .reduce((total, job) => total + (Number(job.positions_count) || 1), 0),
      assignedSubcontractorCount: assignments.length,
    },
  }
}

export async function saveProjectCandidate(userId, projectId, workerProfileId, values = {}) {
  const company = await getCompanyForUser(userId)
  const access = await getAuthorizedProject(company.id, Number(projectId))
  if (!access.authorized) throw new Error('You do not have access to this project.')
  if (!workerProfileId) throw new Error('workerProfileId is required.')

  const row = {
    gc_company_id: company.id,
    project_id: Number(projectId),
    worker_profile_id: Number(workerProfileId),
    stage: CANDIDATE_STAGES.includes(values.stage) ? values.stage : 'saved',
  }
  if (values.notes !== undefined) row.notes = values.notes || null

  const { data, error } = await supabase
    .from('gc_candidate_pipeline')
    .upsert(row, { onConflict: 'gc_company_id,project_id,worker_profile_id' })
    .select(CANDIDATE_FIELDS)
    .maybeSingle()
  if (error) throw new Error(`Failed to save candidate: ${error.message}`)
  return data
}

export async function updateProjectCandidate(userId, projectId, candidateId, values = {}) {
  const company = await getCompanyForUser(userId)
  const access = await getAuthorizedProject(company.id, Number(projectId))
  if (!access.authorized) throw new Error('You do not have access to this project.')
  const patch = { updated_at: new Date().toISOString() }
  if (values.stage !== undefined) {
    if (!CANDIDATE_STAGES.includes(values.stage)) throw new Error(`Invalid candidate stage: ${values.stage}`)
    patch.stage = values.stage
  }
  if (values.notes !== undefined) patch.notes = values.notes || null

  const { data, error } = await supabase
    .from('gc_candidate_pipeline')
    .update(patch)
    .eq('id', candidateId)
    .eq('gc_company_id', company.id)
    .eq('project_id', Number(projectId))
    .select(CANDIDATE_FIELDS)
    .maybeSingle()
  if (error) throw new Error(`Failed to update candidate: ${error.message}`)
  return data
}

export async function removeProjectCandidate(userId, projectId, candidateId) {
  const company = await getCompanyForUser(userId)
  const access = await getAuthorizedProject(company.id, Number(projectId))
  if (!access.authorized) throw new Error('You do not have access to this project.')
  const { error } = await supabase
    .from('gc_candidate_pipeline')
    .delete()
    .eq('id', candidateId)
    .eq('gc_company_id', company.id)
    .eq('project_id', Number(projectId))
  if (error) throw new Error(`Failed to remove candidate: ${error.message}`)
  return true
}

export async function createProjectSubcontractorAssignment(userId, projectId, subcontractorCompanyId) {
  const company = await getCompanyForUser(userId)
  const access = await getAuthorizedProject(company.id, Number(projectId))
  if (!access.authorized) throw new Error('You do not have access to this project.')
  const bridge = await getOrCreateProjectJobsite(access.project)
  if (!bridge.jobsite?.id) throw new Error('Project jobsite bridge is not available.')

  const { data: assignment, error } = await supabase
    .from('gc_subcontractor_assignments')
    .insert({
      gc_company_id: company.id,
      subcontractor_company_id: subcontractorCompanyId,
      jobsite_id: bridge.jobsite.id,
      status: 'active',
    })
    .select(ASSIGNMENT_FIELDS)
    .maybeSingle()
  if (error) throw new Error(`Failed to assign subcontractor: ${error.message}`)
  return assignment
}

export async function updateGcProjectWorkspaceProject(userId, projectId, values = {}) {
  const company = await getCompanyForUser(userId)
  const access = await getAuthorizedProject(company.id, Number(projectId))
  if (!access.authorized) throw new Error('You do not have access to this project.')

  const patch = {}
  if (values.description !== undefined) patch.description = values.description || null
  if (values.stage !== undefined) patch.stage = values.stage || null
  if (values.hiring_status !== undefined) patch.hiring_status = values.hiring_status || null
  if (values.end_date !== undefined) patch.end_date = values.end_date || null
  if (values.site_access_notes !== undefined) patch.site_access_notes = values.site_access_notes || null
  if (values.trades_needed !== undefined) patch.trades_needed = values.trades_needed || null
  if (values.is_public !== undefined) patch.is_public = !!values.is_public
  if (values.display_address !== undefined) patch.display_address = values.display_address || null
  if (values.gate_entrance !== undefined) patch.gate_entrance = values.gate_entrance || null
  if (values.parking_instructions !== undefined) patch.parking_instructions = values.parking_instructions || null
  if (values.muster_point !== undefined) patch.muster_point = values.muster_point || null
  if (values.google_maps_url !== undefined) patch.google_maps_url = values.google_maps_url || null

  const { data, error } = await supabase
    .from('projects')
    .update(patch)
    .eq('id', Number(projectId))
    .select(PROJECT_UPDATE_FIELDS)
    .maybeSingle()
  if (error) throw new Error(`Failed to update project: ${error.message}`)
  return data
}

export async function updateProjectSubcontractorAssignment(userId, projectId, assignmentId, values = {}) {
  const company = await getCompanyForUser(userId)
  const access = await getAuthorizedProject(company.id, Number(projectId))
  if (!access.authorized) throw new Error('You do not have access to this project.')
  const bridge = await resolveProjectJobsite(access.project)
  if (!bridge.jobsite?.id) throw new Error('Project jobsite bridge is not available.')

  const patch = {}
  if (values.status !== undefined) patch.status = values.status || 'active'

  const { data, error } = await supabase
    .from('gc_subcontractor_assignments')
    .update(patch)
    .eq('id', assignmentId)
    .eq('gc_company_id', company.id)
    .eq('jobsite_id', bridge.jobsite.id)
    .select(ASSIGNMENT_FIELDS)
    .maybeSingle()
  if (error) throw new Error(`Failed to update subcontractor assignment: ${error.message}`)
  return data
}

export async function removeProjectSubcontractorAssignment(userId, projectId, assignmentId) {
  const company = await getCompanyForUser(userId)
  const access = await getAuthorizedProject(company.id, Number(projectId))
  if (!access.authorized) throw new Error('You do not have access to this project.')
  const bridge = await resolveProjectJobsite(access.project)
  if (!bridge.jobsite?.id) throw new Error('Project jobsite bridge is not available.')

  const { error } = await supabase
    .from('gc_subcontractor_assignments')
    .delete()
    .eq('id', assignmentId)
    .eq('gc_company_id', company.id)
    .eq('jobsite_id', bridge.jobsite.id)
  if (error) throw new Error(`Failed to remove subcontractor assignment: ${error.message}`)
  return true
}
