import { supabase } from '../lib/supabase'
import { normalizeTradeForSave } from '../lib/trades'

const APP_FIELDS = `
  id,
  job_post_id,
  worker_profile_id,
  resume_url,
  message,
  status,
  company_notes,
  created_at,
  worker_name,
  worker_trade,
  worker_experience
`

const VALID_STATUSES = ['applied', 'submitted', 'shortlisted', 'interview', 'rejected', 'hired']

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

async function getCompanyIdForUser(userId) {
  if (!userId) throw new Error('No authenticated user.')
  const { data, error } = await supabase
    .from('company_profiles')
    .select('id')
    .eq('profile_id', userId)
    .maybeSingle()
  if (error) throw new Error(`Failed to load company profile: ${error.message}`)
  if (!data) throw new Error('You need a company profile first.')
  return data.id
}

async function getCompanyProfileForUser(userId) {
  if (!userId) {
    const errorMsg = 'No authenticated user.'
    console.error('[applicationsService] getCompanyProfileForUser error:', errorMsg)
    throw new Error(errorMsg)
  }
  const { data, error } = await supabase
    .from('company_profiles')
    .select('*')
    .eq('profile_id', userId)
    .maybeSingle()
  if (error) {
    console.error('[applicationsService] getCompanyProfileForUser database error:', error.message)
    throw new Error(`Failed to load company profile: ${error.message}`)
  }
  if (!data) {
    const errorMsg = 'You need a company profile first.'
    console.error('[applicationsService] getCompanyProfileForUser no data:', errorMsg)
    throw new Error(errorMsg)
  }
  return data
}

export async function getWorkerForUser(userId) {
  if (!userId) throw new Error('No authenticated user.')
  const { data: workerProfile, error: workerError } = await supabase
    .from('worker_profiles')
    .select('id, resume_url, trade, experience_years')
    .eq('profile_id', userId)
    .maybeSingle()
  if (workerError) throw new Error(`Failed to load worker profile: ${workerError.message}`)
  if (!workerProfile) throw new Error('Create your worker profile before applying.')
  
  // Get the worker's full name from profiles table
  const { data: profile, error: profileError } = await supabase
    .from('profiles')
    .select('full_name')
    .eq('id', userId)
    .maybeSingle()
  if (profileError) throw new Error(`Failed to load profile: ${profileError.message}`)
  
  return {
    id: workerProfile.id,
    resume_url: workerProfile.resume_url,
    trade: workerProfile.trade,
    experience_years: workerProfile.experience_years,
    full_name: profile?.full_name || null,
  }
}

export async function getExistingApplicationForWorker(userId, jobPostId) {
  const worker = await getWorkerForUser(userId)
  const { data, error } = await supabase
    .from('applications')
    .select('id, resume_url, worker_name, worker_trade, worker_experience')
    .eq('worker_profile_id', worker.id)
    .eq('job_post_id', jobPostId)
    .maybeSingle()
  if (error) throw new Error(`Failed to load application: ${error.message}`)
  if (!data) return null

  const update = {}
  if (!data.resume_url && worker.resume_url) update.resume_url = worker.resume_url
  if (!data.worker_name && worker.full_name) update.worker_name = worker.full_name
  if (!data.worker_trade && worker.trade) update.worker_trade = normalizeTradeForSave(worker.trade)
  if ((data.worker_experience === null || data.worker_experience === undefined) && worker.experience_years != null) {
    update.worker_experience = worker.experience_years
  }

  if (Object.keys(update).length > 0) {
    const { error: updateError } = await supabase
      .from('applications')
      .update(update)
      .eq('id', data.id)
    if (updateError) throw new Error(`Failed to repair application: ${updateError.message}`)
    return { ...data, ...update }
  }

  return data
}

export async function applyToJob(userId, jobPostId, values = {}) {
  const worker = await getWorkerForUser(userId)
  if (!jobPostId) throw new Error('jobPostId is required.')

  const { data: job, error: jobError } = await supabase
    .from('job_posts')
    .select('id, status')
    .eq('id', jobPostId)
    .maybeSingle()
  if (jobError) throw new Error(`Failed to verify job status: ${jobError.message}`)
  if (!job || String(job.status || 'open').toLowerCase() !== 'open') {
    throw new Error('This job is no longer accepting applications.')
  }

  const resumeUrl = values.resume_url || worker.resume_url || null
  if (!resumeUrl) {
    throw new Error('Upload a resume to your worker profile before applying.')
  }

  // Check if applications table exists first
  const { error: tableCheckError } = await supabase
    .from('applications')
    .select('id')
    .limit(1)
  if (!(tableCheckError && tableCheckError.message.includes('relation "public.applications" does not exist'))) {
    const { data: existing, error: existingError } = await supabase
      .from('applications')
      .select('id')
      .eq('worker_profile_id', worker.id)
      .eq('job_post_id', jobPostId)
      .maybeSingle()
    if (existingError) {
      console.error('[applicationsService] Duplicate check error:', existingError.message)
      throw new Error(`Failed to check application: ${existingError.message}`)
    }
    if (existing) {
      throw new Error('You have already applied to this job.')
    }
  }

  const row = {
    job_post_id: jobPostId,
    worker_profile_id: worker.id,
    resume_url: resumeUrl,
    message: values.message ?? null,
    status: 'submitted',
    worker_name: worker.full_name || null,
    worker_trade: normalizeTradeForSave(worker.trade),
    worker_experience: worker.experience_years || null,
  }

  const { data, error } = await supabase
    .from('applications')
    .insert(row)
    .select(APP_FIELDS)
    .maybeSingle()
  if (error) {
    console.error('[applicationsService] Application insert error:', error.message)
    throw new Error(`Failed to apply: ${error.message}`)
  }
  return data
}

export async function getMyApplications(userId) {
  const worker = await getWorkerForUser(userId)
  let result = await supabase
    .from('applications')
    .select(
      `id, resume_url, message, status, created_at,
       job_post:job_posts(id, title, trade, employment_type, schedule, pay_range, status, experience_level, positions_count, hiring_tags, camp_available, project_assignment, start_date, duration, required_certifications, company_profile_id, project_id,
         company:company_profiles(id, company_name),
         project:projects(id, project_name, address, city, province, display_address)
       )`,
    )
    .eq('worker_profile_id', worker.id)
    .order('created_at', { ascending: false })
  if (isMissingStructuredJobColumn(result.error)) {
    result = await supabase
      .from('applications')
      .select(
        `id, resume_url, message, status, created_at,
         job_post:job_posts(id, title, trade, employment_type, schedule, pay_range, status, experience_level, positions_count, company_profile_id, project_id,
           company:company_profiles(id, company_name),
           project:projects(id, project_name, address, city, province, display_address)
         )`,
      )
      .eq('worker_profile_id', worker.id)
      .order('created_at', { ascending: false })
  }
  if (result.error) throw new Error(`Failed to load applications: ${result.error.message}`)
  return (result.data ?? []).map((application) => ({
    ...application,
    job_post: application.job_post
      ? {
          ...application.job_post,
          hiring_tags: Array.isArray(application.job_post.hiring_tags) ? application.job_post.hiring_tags : [],
          camp_available: application.job_post.camp_available ?? null,
          project_assignment: application.job_post.project_assignment ?? null,
          start_date: application.job_post.start_date ?? null,
          duration: application.job_post.duration ?? null,
          required_certifications: application.job_post.required_certifications ?? null,
        }
      : application.job_post,
  }))
}

export async function getApplicantsForMyCompany(userId) {
  let companyProfile
  try {
    companyProfile = await getCompanyProfileForUser(userId)
  } catch (error) {
    console.error('[applicationsService] Error getting companyProfile:', error.message)
    throw error
  }

  const companyId = companyProfile.id

  let jobs
  try {
    const { data, error: jobsError } = await supabase
      .from('job_posts')
      .select('id')
      .eq('company_profile_id', companyId)
    if (jobsError) {
      console.error('[applicationsService] Error loading company jobs:', jobsError.message)
      throw new Error(`Failed to load company jobs: ${jobsError.message}`)
    }
    jobs = data ?? []
  } catch (error) {
    console.error('[applicationsService] Error in job posts query:', error.message)
    throw error
  }

  const jobIds = jobs.map((j) => j.id)
  if (jobIds.length === 0) {
    return []
  }

  // First check if applications table exists
  try {
    const { data: tableCheck, error: tableError } = await supabase
      .from('applications')
      .select('id')
      .limit(1)
    if (tableError) {
      console.error('[applicationsService] Applications table check error:', tableError)
      if (tableError.message.includes('relation "public.applications" does not exist')) {
        return []
      }
      throw tableError
    }
  } catch (error) {
    console.error('[applicationsService] Error checking applications table:', error.message)
    throw error
  }

  let applications
  try {
    const { data, error } = await supabase
      .from('applications')
      .select(
        `id, resume_url, message, status, company_notes, created_at, job_post_id, worker_profile_id,
         worker_name, worker_trade, worker_experience,
         job_post:job_posts(id, title, trade)`,
      )
      .in('job_post_id', jobIds)
      .order('created_at', { ascending: false })
    if (error) {
      console.error('[applicationsService] Error loading applications:', error.message)
      throw new Error(`Failed to load applicants: ${error.message}`)
    }
    applications = data ?? []
  } catch (error) {
    console.error('[applicationsService] Error in applications query:', error.message)
    throw error
  }

  return applications
}

export async function updateApplication(applicationId, userId, updates) {
  const { status, company_notes } = updates
  if (status && !VALID_STATUSES.includes(status)) {
    throw new Error(`Invalid status: ${status}`)
  }
  const companyId = await getCompanyIdForUser(userId)

  const { data: app, error: appError } = await supabase
    .from('applications')
    .select('id, job_post:job_posts(id, company_profile_id)')
    .eq('id', applicationId)
    .maybeSingle()
  if (appError) throw new Error(`Failed to load application: ${appError.message}`)
  if (!app) throw new Error('Application not found.')
  if (app.job_post?.company_profile_id !== companyId) {
    throw new Error('You do not own this job post.')
  }

  const updateData = {}
  if (status !== undefined) updateData.status = status
  if (company_notes !== undefined) updateData.company_notes = company_notes

  const { data, error } = await supabase
    .from('applications')
    .update(updateData)
    .eq('id', applicationId)
    .select(APP_FIELDS)
    .maybeSingle()
  if (error) throw new Error(`Failed to update application: ${error.message}`)
  return data
}
