import { supabase } from '../lib/supabase'
import { attachProjectImages, getProjectImagesForProjects } from './projectImagesService'

const PROJECT_FIELDS = `
  id, project_name, province, city, stage, hiring_status, source_type,
  created_by, review_status, rejection_reason, is_public, is_active,
  is_public_project, created_at
`

const CLAIM_FIELDS = `
  id, project_id, company_profile_id, status, company_role, claim_type,
  is_primary_gc, created_at,
  project:projects(${PROJECT_FIELDS})
`

function toCompanyRole(claim) {
  const role = String(claim?.company_role || claim?.claim_type || '').toLowerCase()
  if (role === 'sc' || role === 'subcontractor') return 'subcontractor'
  return 'gc'
}

function normalizeReviewStatus(status) {
  const value = String(status || '').toLowerCase()
  if (value === 'approved') return 'approved'
  if (value === 'rejected') return 'rejected'
  if (value === 'hidden') return 'hidden'
  return 'pending_review'
}

async function getCompanyForUser(userId) {
  if (!userId) throw new Error('No authenticated user.')
  const { data, error } = await supabase
    .from('company_profiles')
    .select('id, company_name, company_type')
    .eq('profile_id', userId)
    .maybeSingle()
  if (error) throw new Error(`Failed to load company profile: ${error.message}`)
  if (!data) throw new Error('Create your company profile before managing jobsites.')
  return data
}

async function getContractorCreatedProjects(userId) {
  const { data, error } = await supabase
    .from('projects')
    .select(PROJECT_FIELDS)
    .eq('source_type', 'contractor_created')
    .eq('created_by', userId)
    .order('created_at', { ascending: false })
    .range(0, 9999)
  if (error) throw new Error(`Failed to load contractor-created jobsites: ${error.message}`)
  return data ?? []
}

async function getApprovedPrimaryGcClaims(companyId) {
  const { data, error } = await supabase
    .from('project_claims')
    .select(CLAIM_FIELDS)
    .eq('company_profile_id', companyId)
    .eq('status', 'approved')
    .eq('company_role', 'gc')
    .eq('is_primary_gc', true)
    .order('created_at', { ascending: false })
    .range(0, 9999)
  if (error) throw new Error(`Failed to load approved jobsites: ${error.message}`)
  return data ?? []
}

async function getOpenJobCounts(companyId, projectIds) {
  const ids = [...new Set((projectIds || []).filter(Boolean))]
  if (ids.length === 0) return new Map()

  const { data, error } = await supabase
    .from('job_posts')
    .select('project_id, positions_count')
    .eq('company_profile_id', companyId)
    .eq('status', 'open')
    .in('project_id', ids)
    .range(0, 9999)
  if (error) {
    console.warn('[gcJobsitesService] Failed to load open job counts:', error.message)
    return new Map()
  }

  const counts = new Map()
  for (const row of data ?? []) {
    const key = String(row.project_id)
    const positions = Number(row.positions_count)
    counts.set(key, (counts.get(key) || 0) + (Number.isFinite(positions) && positions > 0 ? positions : 1))
  }
  return counts
}

function normalizeSubmittedProject(project) {
  return {
    ...project,
    project_id: project.id,
    project_name: project.project_name || `Project ${project.id}`,
    review_status: normalizeReviewStatus(project.review_status),
    sourceLabel: 'Contractor-created',
    isSubmittedByUser: true,
  }
}

function normalizeApprovedClaim(claim) {
  const project = claim.project || {}
  const role = toCompanyRole(claim)
  return {
    ...project,
    id: project.id,
    project_id: claim.project_id,
    claim_id: claim.id,
    company_profile_id: claim.company_profile_id,
    project_name: project.project_name || `Project ${claim.project_id}`,
    review_status: normalizeReviewStatus(project.review_status),
    company_role: role,
    is_primary_gc: claim.is_primary_gc ?? role === 'gc',
    sourceLabel: project.source_type === 'contractor_created' ? 'Contractor-created' : 'Alberta imported',
    isApprovedPrimaryGc: true,
  }
}

export async function getGcMyJobsitesPageData(userId) {
  const company = await getCompanyForUser(userId)
  const [submittedProjects, approvedClaims] = await Promise.all([
    getContractorCreatedProjects(userId),
    getApprovedPrimaryGcClaims(company.id),
  ])

  const approvedProjects = approvedClaims
    .map(normalizeApprovedClaim)
    .filter((project) => project.project_id)
  const submitted = submittedProjects.map(normalizeSubmittedProject)
  const projectIds = [...new Set([
    ...approvedProjects.map((project) => project.project_id),
    ...submitted.map((project) => project.project_id),
  ].filter(Boolean))]
  const [imagesByProject, openJobCounts] = await Promise.all([
    getProjectImagesForProjects(projectIds),
    getOpenJobCounts(company.id, projectIds),
  ])

  const submittedById = new Map(submitted.map((project) => [String(project.project_id), project]))
  const approvedWithImages = attachProjectImages(approvedProjects, imagesByProject)
    .map((project) => ({
      ...project,
      _openJobCount: openJobCounts.get(String(project.project_id)) || 0,
      isSubmittedByUser: submittedById.has(String(project.project_id)),
    }))
  const approvedIds = new Set(approvedWithImages.map((project) => String(project.project_id)))
  const submittedWithImages = attachProjectImages(submitted, imagesByProject)
    .map((project) => ({
      ...project,
      _openJobCount: openJobCounts.get(String(project.project_id)) || 0,
      isApprovedPrimaryGc: approvedIds.has(String(project.project_id)),
    }))

  return {
    company,
    submittedProjects: submittedWithImages,
    approvedProjects: approvedWithImages,
    summary: {
      approvedCount: approvedWithImages.length,
      pendingCount: submittedWithImages.filter((project) => project.review_status === 'pending_review').length,
      openJobCount: [...openJobCounts.values()].reduce((total, count) => total + count, 0),
      photoCount: [...imagesByProject.values()].reduce((total, images) => total + images.length, 0),
    },
  }
}
