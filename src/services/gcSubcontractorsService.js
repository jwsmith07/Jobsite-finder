import { supabase } from '../lib/supabase'

const COMPANY_BASE_FIELDS = ['id', 'company_name', 'company_type']
const COMPANY_OPTIONAL_FIELDS = ['email', 'phone', 'website', 'verified', 'trades_hired']
const JOBSITE_FIELDS = 'id, project_id'
const PROJECT_DISPLAY_FIELDS = 'id, project_name, city, province, display_address, address'
const LEGACY_PROJECT_DISPLAY_FIELDS = 'id, project_name, city, province, address'
const ASSIGNMENT_FIELDS = `
  id, gc_company_id, subcontractor_company_id, jobsite_id, status, created_at,
  jobsite:jobsites(id, project_id)
`
const CLAIM_FIELDS = 'id, project_id, company_profile_id, status, company_role, claim_type, is_primary_gc'
const LEGACY_CLAIM_FIELDS = 'id, project_id, company_profile_id, status, claim_type'
const REQUEST_FIELDS = `
  id, project_id, company_profile_id, status, company_role, claim_type, trade_scope, notes, created_at,
  company:company_profiles(id, company_name, company_type, email, phone, website, trades_hired, verified),
  project:projects(id, project_name, city, province, display_address, address)
`
const INVITATION_FIELDS = `
  id, gc_company_id, subcontractor_company_id, jobsite_id, status, created_at,
  gc_company:company_profiles!gc_subcontractor_assignments_gc_company_id_fkey(id, company_name, company_type, verified),
  jobsite:jobsites(id, project_id, project:projects(id, project_name, city, province, display_address, address))
`

function missingRelation(error) {
  const message = String(error?.message || '')
  return (
    message.includes('gc_subcontractor_assignments') ||
    message.includes('Could not find the table') ||
    message.includes('relation "public.gc_subcontractor_assignments" does not exist')
  )
}

function missingCompanyColumn(error) {
  const message = String(error?.message || '')
  const quoted = /'([^']+)' column/i.exec(message)
  if (quoted) return quoted[1]
  const relation = /column company_profiles(?:_\d+)?\.([a-z_]+) does not exist/i.exec(message)
  return relation?.[1] || null
}

function missingProjectTeamColumn(error) {
  const message = String(error?.message || '')
  return (
    message.includes("'company_role' column") ||
    message.includes("'is_primary_gc' column") ||
    message.includes('column project_claims.company_role does not exist') ||
    message.includes('column project_claims.is_primary_gc does not exist')
  )
}

function missingProjectDisplayColumn(error) {
  const message = String(error?.message || '')
  return (
    message.includes("'display_address' column") ||
    message.includes('column projects.display_address does not exist') ||
    message.includes("Could not find the 'display_address' column")
  )
}

function toCompanyRole(claim) {
  const role = String(claim?.company_role || claim?.claim_type || '').toLowerCase()
  if (role === 'sc' || role === 'subcontractor') return 'subcontractor'
  if (role === 'gc' || role === 'general_contractor' || role === 'general-contractor') return 'gc'
  return ''
}

function normalizeCompany(company) {
  return {
    id: company?.id ?? null,
    company_name: company?.company_name || 'Unnamed company',
    company_type: company?.company_type || 'Subcontractor',
    email: company?.email || '',
    phone: company?.phone || '',
    website: company?.website || '',
    verified: !!company?.verified,
    trades_hired: company?.trades_hired || '',
  }
}

function normalizeJobsite(jobsite) {
  const project = jobsite?.project
  return {
    id: jobsite?.id ?? null,
    project_id: jobsite?.project_id ?? project?.id ?? null,
    projectBacked: !!jobsite?.projectBacked,
    name: project?.project_name || 'Unnamed jobsite',
    location: [project?.display_address || project?.address, project?.city, project?.province]
      .filter(Boolean)
      .join(', ') || 'Location not listed',
  }
}

function normalizeAssignment(row) {
  return {
    id: row.id,
    gc_company_id: row.gc_company_id,
    subcontractor_company_id: row.subcontractor_company_id,
    jobsite_id: row.jobsite_id,
    status: row.status || 'active',
    created_at: row.created_at || null,
    jobsite: normalizeJobsite(row.jobsite),
    subcontractor: normalizeCompany(row.subcontractor),
  }
}

function normalizeParticipationRequest(row) {
  return {
    id: row.id,
    project_id: row.project_id,
    company_profile_id: row.company_profile_id,
    status: row.status || 'pending',
    trade_scope: row.trade_scope || '',
    notes: row.notes || '',
    created_at: row.created_at || null,
    company: normalizeCompany(row.company),
    project: row.project || null,
  }
}

function normalizeInvitation(row) {
  return {
    id: row.id,
    gc_company_id: row.gc_company_id,
    subcontractor_company_id: row.subcontractor_company_id,
    jobsite_id: row.jobsite_id,
    status: row.status || 'pending',
    created_at: row.created_at || null,
    gcCompany: normalizeCompany(row.gc_company),
    jobsite: normalizeJobsite(row.jobsite),
  }
}

async function getCompanyForUser(userId) {
  const { data, error } = await supabase
    .from('company_profiles')
    .select('id, company_name, company_type')
    .eq('profile_id', userId)
    .maybeSingle()
  if (error) throw new Error(`Failed to load company profile: ${error.message}`)
  if (!data) throw new Error('Create your company profile before managing subcontractors.')
  return data
}

async function selectCompaniesByIds(ids) {
  const companyIds = [...new Set((ids || []).filter(Boolean))]
  if (companyIds.length === 0) return new Map()

  let fields = [...COMPANY_BASE_FIELDS, ...COMPANY_OPTIONAL_FIELDS]
  while (fields.length >= COMPANY_BASE_FIELDS.length) {
    const { data, error } = await supabase
      .from('company_profiles')
      .select(fields.join(', '))
      .in('id', companyIds)

    if (!error) {
      return new Map((data ?? []).map((company) => [company.id, normalizeCompany(company)]))
    }

    const missing = missingCompanyColumn(error)
    if (!missing || !fields.includes(missing) || COMPANY_BASE_FIELDS.includes(missing)) {
      throw new Error(`Failed to load companies: ${error.message}`)
    }
    fields = fields.filter((field) => field !== missing)
  }

  return new Map()
}

async function selectProjectsByIds(ids) {
  const projectIds = [...new Set((ids || []).filter(Boolean))]
  if (projectIds.length === 0) return new Map()

  let result = await supabase
    .from('projects')
    .select(PROJECT_DISPLAY_FIELDS)
    .in('id', projectIds)

  if (missingProjectDisplayColumn(result.error)) {
    result = await supabase
      .from('projects')
      .select(LEGACY_PROJECT_DISPLAY_FIELDS)
      .in('id', projectIds)
  }

  if (result.error) throw new Error(`Failed to load jobsite project names: ${result.error.message}`)
  return new Map((result.data ?? []).map((project) => [project.id, project]))
}

function isSubcontractorCompany(company) {
  const type = String(company?.company_type || '').toLowerCase()
  const compact = type.replace(/[^a-z]/g, '')
  return (
    type === 'sc' ||
    type === 'subcontractor' ||
    compact === 'subcontractor' ||
    compact === 'subcontractors' ||
    compact.includes('subcontractor')
  )
}

async function selectAssignableSubcontractors(seedCompanies, gcCompanyId) {
  const byId = new Map((seedCompanies || []).filter(Boolean).map((company) => [company.id, company]))
  let fields = [...COMPANY_BASE_FIELDS, ...COMPANY_OPTIONAL_FIELDS]
  while (fields.length >= COMPANY_BASE_FIELDS.length) {
    const { data, error } = await supabase
      .from('company_profiles')
      .select(fields.join(', '))
      .order('company_name', { ascending: true })
      .range(0, 9999)

    if (!error) {
      for (const company of (data ?? []).map(normalizeCompany)) {
        if (company.id !== gcCompanyId && isSubcontractorCompany(company)) {
          byId.set(company.id, company)
        }
      }
      return [...byId.values()]
        .filter((company) => company.id !== gcCompanyId)
        .map(normalizeCompany)
        .sort((a, b) => a.company_name.localeCompare(b.company_name))
    }

    const missing = missingCompanyColumn(error)
    if (!missing || !fields.includes(missing) || COMPANY_BASE_FIELDS.includes(missing)) {
      throw new Error(`Failed to load subcontractors: ${error.message}`)
    }
    fields = fields.filter((field) => field !== missing)
  }

  return []
}

async function getApprovedSubcontractorClaims(projectIds, gcCompanyId) {
  if (!projectIds?.length) return []

  let scClaimsResult = await supabase
    .from('project_claims')
    .select('id, project_id, company_profile_id, company_role, claim_type, status, trade_scope, created_at')
    .in('project_id', projectIds)
    .eq('status', 'approved')
    .range(0, 9999)

  if (missingProjectTeamColumn(scClaimsResult.error)) {
    scClaimsResult = await supabase
      .from('project_claims')
      .select('id, project_id, company_profile_id, claim_type, status, created_at')
      .in('project_id', projectIds)
      .eq('status', 'approved')
      .range(0, 9999)
  }

  if (scClaimsResult.error) {
    throw new Error(`Failed to load connected subcontractors: ${scClaimsResult.error.message}`)
  }

  return (scClaimsResult.data ?? [])
    .filter((claim) => claim.company_profile_id !== gcCompanyId)
    .filter((claim) => toCompanyRole(claim) === 'subcontractor')
}

export async function getGcSubcontractorPageData(userId) {
  if (!userId) throw new Error('No authenticated user.')
  const gcCompany = await getCompanyForUser(userId)

  let claimsResult = await supabase
    .from('project_claims')
    .select(CLAIM_FIELDS)
    .eq('company_profile_id', gcCompany.id)
    .eq('status', 'approved')
    .order('created_at', { ascending: false })
    .range(0, 9999)
  if (missingProjectTeamColumn(claimsResult.error)) {
    claimsResult = await supabase
      .from('project_claims')
      .select(LEGACY_CLAIM_FIELDS)
      .eq('company_profile_id', gcCompany.id)
      .eq('status', 'approved')
      .order('created_at', { ascending: false })
      .range(0, 9999)
  }
  if (claimsResult.error) throw new Error(`Failed to load your jobsites: ${claimsResult.error.message}`)

  let gcClaims = (claimsResult.data ?? []).filter((claim) => {
    const role = toCompanyRole(claim)
    return role === 'gc' || claim.is_primary_gc === true
  })

  if (gcClaims.length === 0) {
    gcClaims = claimsResult.data ?? []
  }

  const projectIds = gcClaims.map((claim) => claim.project_id).filter(Boolean)
  if (projectIds.length === 0) {
    return { gcCompany, jobsites: [], assignments: [], availableSubcontractors: [], pendingRequests: [] }
  }

  const scClaims = await getApprovedSubcontractorClaims(projectIds, gcCompany.id)
  const scIds = scClaims.map((claim) => claim.company_profile_id)
  const connectedCompaniesById = await selectCompaniesByIds(scIds)
  const connectedSubcontractors = [...new Set(scIds)]
    .map((id) => {
      const company = connectedCompaniesById.get(id)
      if (company) return company
      const claim = scClaims.find((item) => item.company_profile_id === id)
      return normalizeCompany({
        id,
        company_name: claim?.trade_scope || `Approved subcontractor #${id}`,
        company_type: 'subcontractor',
      })
    })
  const availableSubcontractors = await selectAssignableSubcontractors(connectedSubcontractors, gcCompany.id)

  const { data: jobsiteRows, error: jobsitesError } = await supabase
    .from('jobsites')
    .select(JOBSITE_FIELDS)
    .in('project_id', projectIds)
    .range(0, 9999)
  if (jobsitesError) throw new Error(`Failed to load your jobsites: ${jobsitesError.message}`)

  const projectsById = await selectProjectsByIds(projectIds)
  let jobsites = (jobsiteRows ?? []).map((jobsite) => normalizeJobsite({
    ...jobsite,
    project: projectsById.get(jobsite.project_id),
  }))
  if (jobsites.length === 0) {
    jobsites = projectIds
      .map((projectId) => projectsById.get(projectId))
      .filter(Boolean)
      .map((project) => normalizeJobsite({
        id: `project:${project.id}`,
        project_id: project.id,
        projectBacked: true,
        project,
      }))
  }
  const jobsiteIds = jobsites.map((jobsite) => jobsite.id).filter(Boolean)
  if (jobsiteIds.length === 0) {
    return { gcCompany, jobsites: [], assignments: [], availableSubcontractors, pendingRequests: [] }
  }

  let assignments = []
  const persistedJobsiteIds = jobsiteIds.filter((id) => !String(id).startsWith('project:'))
  if (persistedJobsiteIds.length > 0) {
  const assignmentResult = await supabase
      .from('gc_subcontractor_assignments')
      .select(ASSIGNMENT_FIELDS)
      .eq('gc_company_id', gcCompany.id)
      .in('jobsite_id', persistedJobsiteIds)
      .order('created_at', { ascending: false })
      .range(0, 9999)

    if (assignmentResult.error) {
      if (!missingRelation(assignmentResult.error)) {
        throw new Error(`Failed to load subcontractor assignments: ${assignmentResult.error.message}`)
      }
    } else {
      assignments = (assignmentResult.data ?? []).map((assignment) => normalizeAssignment({
        ...assignment,
        jobsite: {
          ...assignment.jobsite,
          project: projectsById.get(assignment.jobsite?.project_id),
        },
      }))
    }
  }

  const assignedIds = assignments.map((assignment) => assignment.subcontractor_company_id)
  const companiesById = await selectCompaniesByIds([...scIds, ...assignedIds])
  const assignmentKeys = new Set(assignments.map((assignment) => (
    `${assignment.subcontractor_company_id}:${assignment.jobsite.project_id}`
  )))
  const virtualAssignments = scClaims
    .filter((claim) => !assignmentKeys.has(`${claim.company_profile_id}:${claim.project_id}`))
    .map((claim) => {
      const project = projectsById.get(claim.project_id)
      const jobsite = normalizeJobsite({
        id: `project:${claim.project_id}`,
        project_id: claim.project_id,
        projectBacked: true,
        project,
      })
      return {
        id: `claim:${claim.id}`,
        gc_company_id: gcCompany.id,
        subcontractor_company_id: claim.company_profile_id,
        jobsite_id: jobsite.id,
        status: 'active',
        created_at: claim.created_at || null,
        jobsite,
        subcontractor: companiesById.get(claim.company_profile_id) || normalizeCompany({
          id: claim.company_profile_id,
          company_name: claim.trade_scope || `Approved subcontractor #${claim.company_profile_id}`,
          company_type: 'subcontractor',
        }),
        virtual: true,
      }
    })

  const pendingRequests = await getPendingSubcontractorRequestsForProjects(projectIds, gcCompany.id)

  return {
    gcCompany,
    jobsites,
    assignments: assignments.map((assignment) => ({
      ...assignment,
      subcontractor: companiesById.get(assignment.subcontractor_company_id) || assignment.subcontractor,
    })).concat(virtualAssignments),
    availableSubcontractors,
    pendingRequests,
  }
}

async function getPendingSubcontractorRequestsForProjects(projectIds, gcCompanyId) {
  if (!projectIds?.length) return []
  let result = await supabase
    .from('project_claims')
    .select(REQUEST_FIELDS)
    .in('project_id', projectIds)
    .eq('status', 'pending')
    .neq('company_profile_id', gcCompanyId)
    .order('created_at', { ascending: false })
    .range(0, 9999)

  if (missingProjectTeamColumn(result.error)) {
    result = await supabase
      .from('project_claims')
      .select('id, project_id, company_profile_id, status, claim_type, notes, created_at, company:company_profiles(id, company_name, company_type), project:projects(id, project_name, city, province, address)')
      .in('project_id', projectIds)
      .eq('status', 'pending')
      .neq('company_profile_id', gcCompanyId)
      .order('created_at', { ascending: false })
      .range(0, 9999)
  }

  if (result.error) throw new Error(`Failed to load participation requests: ${result.error.message}`)
  return (result.data ?? [])
    .filter((claim) => toCompanyRole(claim) === 'subcontractor')
    .map(normalizeParticipationRequest)
}

export async function updateSubcontractorParticipationRequest(userId, claimId, status) {
  if (!userId) throw new Error('No authenticated user.')
  if (!['approved', 'rejected'].includes(status)) throw new Error('Invalid participation status.')
  const { data, error } = await supabase
    .from('project_claims')
    .update({
      status,
      approved_at: status === 'approved' ? new Date().toISOString() : null,
    })
    .eq('id', claimId)
    .select(REQUEST_FIELDS)
    .maybeSingle()

  if (error) throw new Error(`Failed to update participation request: ${error.message}`)
  return data ? normalizeParticipationRequest(data) : null
}

export async function getSubcontractorInvitationsForUser(userId) {
  if (!userId) throw new Error('No authenticated user.')
  const company = await getCompanyForUser(userId)
  const { data, error } = await supabase
    .from('gc_subcontractor_assignments')
    .select(INVITATION_FIELDS)
    .eq('subcontractor_company_id', company.id)
    .eq('status', 'pending')
    .order('created_at', { ascending: false })
    .range(0, 9999)

  if (error) {
    if (missingRelation(error)) return []
    throw new Error(`Failed to load project invitations: ${error.message}`)
  }
  return (data ?? []).map(normalizeInvitation)
}

export async function updateSubcontractorInvitation(userId, assignmentId, decision) {
  if (!userId) throw new Error('No authenticated user.')
  if (!['active', 'removed'].includes(decision)) throw new Error('Invalid invitation decision.')
  const company = await getCompanyForUser(userId)
  const { data, error } = await supabase
    .from('gc_subcontractor_assignments')
    .update({ status: decision })
    .eq('id', assignmentId)
    .eq('subcontractor_company_id', company.id)
    .select(INVITATION_FIELDS)
    .maybeSingle()

  if (error) throw new Error(`Failed to update invitation: ${error.message}`)
  return data ? normalizeInvitation(data) : null
}

export async function createGcSubcontractorAssignment(userId, values) {
  if (!userId) throw new Error('No authenticated user.')
  if (String(values.jobsite_id || '').startsWith('project:')) {
    return {
      id: `project-assignment:${values.jobsite_id}:${values.subcontractor_company_id}`,
      subcontractor_company_id: values.subcontractor_company_id,
      jobsite_id: values.jobsite_id,
      status: values.status || 'active',
      created_at: new Date().toISOString(),
      virtual: true,
    }
  }
  const gcCompany = await getCompanyForUser(userId)
  const row = {
    gc_company_id: gcCompany.id,
    subcontractor_company_id: values.subcontractor_company_id,
    jobsite_id: values.jobsite_id,
    status: values.status || 'active',
  }

  const { data, error } = await supabase
    .from('gc_subcontractor_assignments')
    .insert(row)
    .select(ASSIGNMENT_FIELDS)
    .maybeSingle()
  if (error) throw new Error(`Failed to assign subcontractor: ${error.message}`)
  return normalizeAssignment(data)
}

export async function updateGcSubcontractorAssignment(assignmentId, values) {
  const patch = {}
  if (values.status !== undefined) patch.status = values.status || 'active'
  const { data, error } = await supabase
    .from('gc_subcontractor_assignments')
    .update(patch)
    .eq('id', assignmentId)
    .select(ASSIGNMENT_FIELDS)
    .maybeSingle()
  if (error) throw new Error(`Failed to update subcontractor assignment: ${error.message}`)
  return normalizeAssignment(data)
}

export async function removeGcSubcontractorAssignment(assignmentId) {
  const { error } = await supabase
    .from('gc_subcontractor_assignments')
    .delete()
    .eq('id', assignmentId)
  if (error) throw new Error(`Failed to remove subcontractor assignment: ${error.message}`)
  return true
}
