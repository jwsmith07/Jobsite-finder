import { supabase } from '../lib/supabase'

const CLAIM_FIELDS = `
  id, project_id, company_profile_id, claim_type, status, notes, admin_notes,
  company_role, trade_scope, is_primary_gc, approved_by,
  created_at, approved_at, revoked_at, updated_at
`

const LEGACY_CLAIM_FIELDS = `
  id, project_id, company_profile_id, claim_type, status, notes, admin_notes,
  created_at, approved_at, revoked_at, updated_at
`

function isMissingProjectTeamColumn(error) {
  const message = String(error?.message || '')
  return (
    message.includes("'company_role' column") ||
    message.includes("'trade_scope' column") ||
    message.includes("'is_primary_gc' column") ||
    message.includes("'approved_by' column") ||
    message.includes('column project_claims.company_role does not exist') ||
    message.includes('column project_claims.trade_scope does not exist') ||
    message.includes('column project_claims.is_primary_gc does not exist') ||
    message.includes('column project_claims.approved_by does not exist')
  )
}

function getMissingCompanyColumn(error) {
  const message = String(error?.message || '')
  const quotedMatch = /'([^']+)' column/i.exec(message)
  if (quotedMatch) return quotedMatch[1]
  const relationMatch = /column company_profiles(?:_\d+)?\.([a-z_]+) does not exist/i.exec(message)
  return relationMatch?.[1] || null
}

function normalizeClaim(row) {
  if (!row) return row
  const companyRole = row.company_role || toCompanyRole(row.claim_type)
  return {
    ...row,
    company_role: companyRole,
    trade_scope: row.trade_scope ?? null,
    is_primary_gc: row.is_primary_gc ?? companyRole === 'gc',
    approved_by: row.approved_by ?? null,
  }
}

function toCompanyRole(value) {
  if (value === 'sc' || value === 'subcontractor') return 'subcontractor'
  return 'gc'
}

function toClaimType(value) {
  return toCompanyRole(value) === 'subcontractor' ? 'sc' : 'gc'
}

async function getCompanyIdForUser(userId) {
  if (!userId) throw new Error('No authenticated user.')
  const { data, error } = await supabase
    .from('company_profiles')
    .select('id, company_type')
    .eq('profile_id', userId)
    .maybeSingle()
  if (error) throw new Error(`Failed to load company profile: ${error.message}`)
  if (!data) throw new Error('Create your company profile before claiming a project.')
  return data
}

export async function getMyClaimForProject(userId, projectId) {
  const company = await getCompanyIdForUser(userId)
  let result = await supabase
    .from('project_claims')
    .select(CLAIM_FIELDS)
    .eq('project_id', projectId)
    .eq('company_profile_id', company.id)
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle()
  if (isMissingProjectTeamColumn(result.error)) {
    result = await supabase
      .from('project_claims')
      .select(LEGACY_CLAIM_FIELDS)
      .eq('project_id', projectId)
      .eq('company_profile_id', company.id)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle()
  }
  if (result.error) throw new Error(`Failed to load claim: ${result.error.message}`)
  return normalizeClaim(result.data)
}

export async function createClaim(userId, projectId, values) {
  const company = await getCompanyIdForUser(userId)
  
  // Check for existing claim to prevent duplicates
  const { data: existingClaim, error: checkError } = await supabase
    .from('project_claims')
    .select('id')
    .eq('project_id', projectId)
    .eq('company_profile_id', company.id)
    .in('status', ['pending', 'approved'])
    .limit(1)
    .maybeSingle()
  
  if (checkError) throw new Error(`Failed to check existing claims: ${checkError.message}`)
  if (existingClaim) throw new Error('Claim already exists for this project')
  
  const companyRole = toCompanyRole(values?.company_role || values?.claim_type || company.company_type || 'gc')
  const row = {
    project_id: projectId,
    company_profile_id: company.id,
    claim_type: toClaimType(companyRole),
    company_role: companyRole,
    trade_scope: values?.trade_scope ?? null,
    is_primary_gc: companyRole === 'gc',
    status: 'pending',
    notes: values?.notes ?? null,
  }
  let result = await supabase
    .from('project_claims')
    .insert(row)
    .select(CLAIM_FIELDS)
    .maybeSingle()
  if (isMissingProjectTeamColumn(result.error)) {
    const legacyRow = {
      project_id: row.project_id,
      company_profile_id: row.company_profile_id,
      claim_type: row.claim_type,
      status: row.status,
      notes: row.notes,
    }
    result = await supabase
      .from('project_claims')
      .insert(legacyRow)
      .select(LEGACY_CLAIM_FIELDS)
      .maybeSingle()
  }
  if (result.error) throw new Error(`Failed to submit claim: ${result.error.message}`)

  await supabase
    .from('projects')
    .update({ project_status_type: 'claimed' })
    .eq('id', projectId)
    .eq('project_status_type', 'unverified')

  return normalizeClaim(result.data)
}

export async function getAllClaims() {
  let result = await supabase
    .from('project_claims')
    .select(`${CLAIM_FIELDS},
      project:projects(id, project_name, city),
      company:company_profiles(id, company_name, company_type, verified)
    `)
    .order('created_at', { ascending: false })
    .range(0, 9999)
  if (isMissingProjectTeamColumn(result.error)) {
    result = await supabase
      .from('project_claims')
      .select(`${LEGACY_CLAIM_FIELDS},
        project:projects(id, project_name, city),
        company:company_profiles(id, company_name, company_type, verified)
      `)
      .order('created_at', { ascending: false })
      .range(0, 9999)
  }
  if (result.error) throw new Error(`Failed to load claims: ${result.error.message}`)
  return (result.data ?? []).map(normalizeClaim)
}

async function getClaimById(claimId) {
  const { data, error } = await supabase
    .from('project_claims')
    .select(CLAIM_FIELDS)
    .eq('id', claimId)
    .maybeSingle()
  if (error) throw new Error(`Failed to load claim: ${error.message}`)
  if (!data) throw new Error('Claim not found.')
  return data
}

async function recomputeProjectClaimStatus(projectId) {
  if (!projectId) return

  const { data: approved, error: approvedError } = await supabase
    .from('project_claims')
    .select('id, company_profile_id')
    .eq('project_id', projectId)
    .eq('status', 'approved')
    .eq('company_role', 'gc')
    .eq('is_primary_gc', true)
    .order('approved_at', { ascending: false, nullsFirst: false })
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle()
  if (approvedError) throw new Error(`Failed to check approved claims: ${approvedError.message}`)

  if (approved) {
    const { error } = await supabase
      .from('projects')
      .update({
        project_status_type: 'verified',
        claimed_by_company_id: approved.company_profile_id,
      })
      .eq('id', projectId)
    if (error) throw new Error(`Failed to update project claim status: ${error.message}`)
    return
  }

  const { count: approvedCount, error: approvedCountError } = await supabase
    .from('project_claims')
    .select('id', { count: 'exact', head: true })
    .eq('project_id', projectId)
    .eq('status', 'approved')
  if (approvedCountError) throw new Error(`Failed to check approved claims: ${approvedCountError.message}`)

  if ((approvedCount ?? 0) > 0) {
    const { error } = await supabase
      .from('projects')
      .update({
        project_status_type: 'verified',
        claimed_by_company_id: null,
      })
      .eq('id', projectId)
    if (error) throw new Error(`Failed to update project claim status: ${error.message}`)
    return
  }

  const { count, error: pendingError } = await supabase
    .from('project_claims')
    .select('id', { count: 'exact', head: true })
    .eq('project_id', projectId)
    .eq('status', 'pending')
  if (pendingError) throw new Error(`Failed to check pending claims: ${pendingError.message}`)

  const { error } = await supabase
    .from('projects')
    .update({
      project_status_type: (count ?? 0) > 0 ? 'claimed' : 'unverified',
      claimed_by_company_id: null,
    })
    .eq('id', projectId)
  if (error) throw new Error(`Failed to update project claim status: ${error.message}`)
}

function buildClaimPatch(values = {}) {
  const patch = {}
  if (values.project_id !== undefined) patch.project_id = Number(values.project_id)
  if (values.company_profile_id !== undefined) patch.company_profile_id = Number(values.company_profile_id)
  if (values.claim_type !== undefined) patch.claim_type = toClaimType(values.claim_type)
  if (values.company_role !== undefined) {
    patch.company_role = toCompanyRole(values.company_role)
    patch.claim_type = toClaimType(values.company_role)
  }
  if (values.trade_scope !== undefined) patch.trade_scope = values.trade_scope || null
  if (values.is_primary_gc !== undefined) patch.is_primary_gc = !!values.is_primary_gc
  if (values.notes !== undefined) patch.notes = values.notes || null
  if (values.admin_notes !== undefined) patch.admin_notes = values.admin_notes || null
  return patch
}

async function clearOtherPrimaryGc(projectId, claimId) {
  if (!projectId) return
  const { error } = await supabase
    .from('project_claims')
    .update({ is_primary_gc: false })
    .eq('project_id', projectId)
    .neq('id', claimId)
    .eq('company_role', 'gc')
    .eq('is_primary_gc', true)
  if (error) throw new Error(`Failed to reassign primary General Contractor: ${error.message}`)
}

export async function updateClaimAdmin(claimId, values) {
  const before = await getClaimById(claimId)
  const patch = buildClaimPatch(values)

  if (values?.status !== undefined) {
    patch.status = values.status
    if (values.status === 'approved') {
      patch.approved_at = before.approved_at || new Date().toISOString()
      patch.revoked_at = null
      patch.approved_by = values.approved_by ?? before.approved_by ?? null
    }
    if (values.status === 'revoked') {
      patch.revoked_at = new Date().toISOString()
    }
    if (values.status === 'pending') {
      patch.approved_at = null
      patch.revoked_at = null
    }
  }

  const nextRole = patch.company_role || before.company_role || toCompanyRole(before.claim_type)
  const nextProjectId = patch.project_id || before.project_id
  const nextIsPrimaryGc =
    values?.is_primary_gc !== undefined
      ? !!values.is_primary_gc
      : before.is_primary_gc || nextRole === 'gc'

  if (values?.status === 'approved' && nextRole === 'gc' && nextIsPrimaryGc) {
    patch.is_primary_gc = true
    await clearOtherPrimaryGc(nextProjectId, claimId)
  }
  if (nextRole === 'subcontractor') {
    patch.is_primary_gc = false
  }

  const { data: claim, error } = await supabase
    .from('project_claims')
    .update(patch)
    .eq('id', claimId)
    .select(CLAIM_FIELDS)
    .maybeSingle()
  if (error) throw new Error(`Failed to update claim: ${error.message}`)
  if (!claim) throw new Error('Claim not found.')

  if (before.project_id !== claim.project_id) {
    await recomputeProjectClaimStatus(before.project_id)
  }
  await recomputeProjectClaimStatus(claim.project_id)
  return claim
}

export async function approveClaim(claimId, adminNotes) {
  const before = await getClaimById(claimId)
  const role = before.company_role || toCompanyRole(before.claim_type)
  const isPrimaryGc = role === 'gc'
  if (isPrimaryGc) await clearOtherPrimaryGc(before.project_id, claimId)

  const { data: claim, error: cErr } = await supabase
    .from('project_claims')
    .update({
      status: 'approved',
      approved_at: new Date().toISOString(),
      revoked_at: null,
      company_role: role,
      claim_type: toClaimType(role),
      is_primary_gc: isPrimaryGc,
      ...(adminNotes !== undefined ? { admin_notes: adminNotes || null } : {}),
    })
    .eq('id', claimId)
    .select(CLAIM_FIELDS)
    .maybeSingle()
  if (cErr) throw new Error(`Failed to approve claim: ${cErr.message}`)
  if (!claim) throw new Error('Claim not found.')

  await recomputeProjectClaimStatus(claim.project_id)
  return claim
}

export async function rejectClaim(claimId, adminNotes) {
  const { data: claim, error: cErr } = await supabase
    .from('project_claims')
    .update({
      status: 'rejected',
      revoked_at: null,
      ...(adminNotes !== undefined ? { admin_notes: adminNotes || null } : {}),
    })
    .eq('id', claimId)
    .select(CLAIM_FIELDS)
    .maybeSingle()
  if (cErr) throw new Error(`Failed to reject claim: ${cErr.message}`)
  if (!claim) return null

  await recomputeProjectClaimStatus(claim.project_id)
  return claim
}

export async function revokeClaim(claimId, adminNotes) {
  const claim = await updateClaimAdmin(claimId, {
    status: 'revoked',
    admin_notes: adminNotes,
  })
  return claim
}

async function getProjectCompanyExtras(companyIds) {
  const ids = [...new Set((companyIds ?? []).filter(Boolean))]
  if (ids.length === 0) return new Map()

  let fields = ['id', 'logo_url', 'website', 'verified']
  while (fields.length > 1) {
    const { data, error } = await supabase
      .from('company_profiles')
      .select(fields.join(', '))
      .in('id', ids)

    if (!error) {
      return new Map((data ?? []).map((company) => [company.id, company]))
    }

    const missingColumn = getMissingCompanyColumn(error)
    if (!missingColumn || missingColumn === 'id' || !fields.includes(missingColumn)) {
      if (typeof console !== 'undefined') {
        console.warn(`Project company extras skipped: ${error.message}`)
      }
      return new Map()
    }
    fields = fields.filter((field) => field !== missingColumn)
  }

  return new Map()
}

export async function getApprovedProjectCompanies(projectId) {
  if (!projectId) return []
  let claimFields = CLAIM_FIELDS
  let result = null

  for (let attempt = 0; attempt < 2; attempt += 1) {
    let query = supabase
      .from('project_claims')
      .select(`${claimFields},
        company:company_profiles(id, company_name, company_type)
      `)
      .eq('project_id', projectId)
      .eq('status', 'approved')

    if (claimFields === CLAIM_FIELDS) {
      query = query
        .order('is_primary_gc', { ascending: false })
        .order('approved_at', { ascending: true, nullsFirst: false })
    } else {
      query = query.order('approved_at', { ascending: true, nullsFirst: false })
    }
    result = await query.range(0, 9999)

    if (!result.error) break

    const nextClaimFields = isMissingProjectTeamColumn(result.error) ? LEGACY_CLAIM_FIELDS : claimFields
    if (nextClaimFields === claimFields) break
    claimFields = nextClaimFields
  }
  if (result.error) throw new Error(`Failed to load project companies: ${result.error.message}`)

  const claims = (result.data ?? []).map(normalizeClaim)
  const extrasByCompanyId = await getProjectCompanyExtras(
    claims.map((claim) => claim.company_profile_id || claim.company?.id),
  )

  return claims
    .map((claim) => {
      const companyId = claim.company_profile_id || claim.company?.id
      const extras = extrasByCompanyId.get(companyId)
      if (!extras) return claim
      return {
        ...claim,
        company: {
          ...claim.company,
          ...extras,
        },
      }
    })
}
