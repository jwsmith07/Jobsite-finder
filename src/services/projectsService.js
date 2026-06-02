import { supabase } from '../lib/supabase'
import { normalizeApprenticeshipLevel, normalizeTrade } from '../lib/trades'
import { projectHasHiringPulse } from '../lib/projectStages'
import { attachProjectImages, getProjectImages, getProjectImagesForProjects } from './projectImagesService'

const PROJECT_FIELDS = `
  id,
  project_name,
  project_type,
  sector,
  city,
  region,
  province,
  address,
  display_address,
  site_access_notes,
  gate_entrance,
  parking_instructions,
  muster_point,
  google_maps_url,
  hiring_status,
  project_value_display,
  primary_image_url,
  contractor_location_updated_at,
  contractor_location_updated_by,
  latitude,
  longitude,
  stage,
  status,
  estimated_value,
  owner,
  general_contractor,
  start_date,
  end_date,
  description,
  source_url,
  is_active,
  is_public_project,
  is_featured,
  project_status_type,
  claimed_by_company_id,
  created_at
`

const PROJECT_REVIEW_FIELDS = `
  source_type,
  created_by,
  review_status,
  reviewed_by,
  reviewed_at,
  rejection_reason,
  is_public
`

const PROJECT_FIELDS_WITH_REVIEW = `${PROJECT_FIELDS},${PROJECT_REVIEW_FIELDS}`

const LEGACY_PROJECT_FIELDS = `
  id,
  project_name,
  project_type,
  sector,
  city,
  region,
  province,
  address,
  latitude,
  longitude,
  stage,
  status,
  estimated_value,
  owner,
  general_contractor,
  start_date,
  end_date,
  description,
  source_url,
  is_active,
  is_public_project,
  is_featured,
  created_at
`

function isMissingProjectColumn(error) {
  const message = String(error?.message || '')
  return [
    'display_address',
    'site_access_notes',
    'gate_entrance',
    'parking_instructions',
    'muster_point',
    'google_maps_url',
    'hiring_status',
    'project_value_display',
    'primary_image_url',
    'contractor_location_updated_at',
    'contractor_location_updated_by',
    'project_status_type',
    'claimed_by_company_id',
    'review_status',
    'is_public',
    'source_type',
    'created_by',
    'reviewed_by',
    'reviewed_at',
    'rejection_reason',
  ].some((column) => (
    message.includes(`'${column}' column`) ||
    message.includes(`column projects.${column} does not exist`) ||
    message.includes(`Could not find the '${column}' column`)
  ))
}

function isMissingStructuredJobColumn(error) {
  const message = String(error?.message || '')
  return [
    'hiring_tags',
    'experience_level',
  ].some((column) => (
    message.includes(`'${column}' column`) ||
    message.includes(`column job_posts.${column} does not exist`) ||
    message.includes(`Could not find the '${column}' column`)
  ))
}

function isMissingJobPublicColumn(error) {
  const message = String(error?.message || '')
  return (
    message.includes("'is_public' column") ||
    message.includes('column job_posts.is_public does not exist') ||
    message.includes("Could not find the 'is_public' column")
  )
}

function buildOpenJobsQuery(projectIds, { includeStructured = true, includeIsPublic = true } = {}) {
  const fields = [
    'id',
    'project_id',
    'title',
    'trade',
    includeStructured ? 'experience_level' : null,
    includeStructured ? 'hiring_tags' : null,
    includeIsPublic ? 'is_public' : null,
    'positions_count',
    'pay_range',
    'company:company_profiles(id, company_name)',
  ].filter(Boolean).join(', ')

  let query = supabase
    .from('job_posts')
    .select(fields)
    .in('project_id', projectIds)
    .eq('status', 'open')
    .order('created_at', { ascending: false })
    .range(0, 9999)

  if (includeIsPublic) query = query.eq('is_public', true)

  return query
}

async function getOpenJobsForProjects(projectIds) {
  const ids = [...new Set((projectIds || []).filter((id) => id != null))]
  if (ids.length === 0) return []

  let jobsResult = await buildOpenJobsQuery(ids, {
    includeStructured: true,
    includeIsPublic: true,
  })

  if (isMissingJobPublicColumn(jobsResult.error)) {
    jobsResult = await buildOpenJobsQuery(ids, {
      includeStructured: true,
      includeIsPublic: false,
    })
  }

  if (isMissingStructuredJobColumn(jobsResult.error)) {
    jobsResult = await buildOpenJobsQuery(ids, {
      includeStructured: false,
      includeIsPublic: !isMissingJobPublicColumn(jobsResult.error),
    })
  }

  if (isMissingJobPublicColumn(jobsResult.error)) {
    jobsResult = await buildOpenJobsQuery(ids, {
      includeStructured: false,
      includeIsPublic: false,
    })
  }

  if (jobsResult.error) {
    console.warn('[projectsService] Failed to load open role metadata:', jobsResult.error.message)
    return []
  }

  return jobsResult.data ?? []
}

export async function getProjects() {
  let projectsResult = await supabase
    .from('projects')
    .select(PROJECT_FIELDS_WITH_REVIEW)
    .eq('is_active', true)
    .eq('is_public_project', true)
    .eq('review_status', 'approved')
    .eq('is_public', true)
    .order('project_name', { ascending: true })
    .range(0, 9999)

  if (isMissingProjectColumn(projectsResult.error)) {
    projectsResult = await supabase
      .from('projects')
      .select(LEGACY_PROJECT_FIELDS)
      .eq('is_active', true)
      .eq('is_public_project', true)
      .order('project_name', { ascending: true })
      .range(0, 9999)
  }

  if (projectsResult.error) {
    throw new Error(`Failed to load projects: ${projectsResult.error.message}`)
  }
  const rows = projectsResult.data ?? []
  const openJobs = await getOpenJobsForProjects(rows.map((project) => project.id))

  const openRoleMetaByProject = new Map()
  for (const job of openJobs) {
    if (!job.project_id) continue
    const key = String(job.project_id)
    const meta = openRoleMetaByProject.get(key) || { count: 0, trades: new Set(), jobs: [] }
    const positions = Number(job.positions_count)
    const openings = Number.isFinite(positions) && positions > 0 ? positions : 1
    const trade = normalizeTrade(job.trade)
    const experienceLevel = normalizeApprenticeshipLevel(job.experience_level)
    const title = job.title ? String(job.title).trim() : ''
    meta.count += openings
    if (trade) meta.trades.add(trade)
    meta.jobs.push({
      id: job.id,
      title: title || trade || 'Open role',
      trade,
      experienceLevel,
      hiringTags: Array.isArray(job.hiring_tags) ? job.hiring_tags : [],
      openings,
      payRange: job.pay_range ? String(job.pay_range).trim() : '',
      companyName: job.company?.company_name || '',
    })
    openRoleMetaByProject.set(key, meta)
  }

  const imagesByProject = await getProjectImagesForProjects(rows.map((project) => project.id))
  const rowsWithImages = attachProjectImages(rows, imagesByProject)

  return rowsWithImages.map((project) => {
    const meta = openRoleMetaByProject.get(String(project.id))
    const enriched = {
      ...project,
      _openRolesCount: meta?.count || 0,
      _openRoleTrades: meta ? Array.from(meta.trades).sort((a, b) => a.localeCompare(b)) : [],
      _openJobs: meta?.jobs || [],
    }
    return {
      ...enriched,
      _isHiringNow: projectHasHiringPulse(enriched),
    }
  })
}

export async function getProjectById(id) {
  let projectResult = await supabase
    .from('projects')
    .select(PROJECT_FIELDS_WITH_REVIEW)
    .eq('id', id)
    .maybeSingle()

  if (isMissingProjectColumn(projectResult.error)) {
    projectResult = await supabase
      .from('projects')
      .select(LEGACY_PROJECT_FIELDS)
      .eq('id', id)
      .maybeSingle()
  }

  if (projectResult.error) {
    throw new Error(`Failed to load project: ${projectResult.error.message}`)
  }
  const data = projectResult.data
  if (!data) return data
  const images = await getProjectImages(data.id)
  return {
    ...data,
    _images: images,
    _primaryImage: images.find((image) => image.is_primary) || images[0] || null,
  }
}

function buildContractorLocationPatch(values = {}) {
  const patch = {}
  if (values.display_address !== undefined) patch.display_address = values.display_address || null
  if (values.site_access_notes !== undefined) patch.site_access_notes = values.site_access_notes || null
  if (values.gate_entrance !== undefined) patch.gate_entrance = values.gate_entrance || null
  if (values.parking_instructions !== undefined) patch.parking_instructions = values.parking_instructions || null
  if (values.muster_point !== undefined) patch.muster_point = values.muster_point || null
  if (values.google_maps_url !== undefined) patch.google_maps_url = values.google_maps_url || null
  return patch
}

export async function updateContractorProjectLocation(projectId, values) {
  const patch = buildContractorLocationPatch(values)
  const { data, error } = await supabase
    .from('projects')
    .update(patch)
    .eq('id', projectId)
    .select(PROJECT_FIELDS)
    .maybeSingle()

  if (error) {
    throw new Error(`Failed to update jobsite access details: ${error.message}`)
  }
  return data
}
