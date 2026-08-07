import { supabase } from '../lib/supabase'

const RESUME_BUCKET = 'resumes'
const SIGNED_URL_TTL_SECONDS = 60

export function isLikelyPublicResumeUrl(value) {
  return /^https?:\/\//i.test(String(value || ''))
}

export function hasResumeReference(value) {
  return !!String(value || '').trim()
}

export async function createResumeSignedUrl(path) {
  const cleanPath = String(path || '').trim()
  if (!cleanPath) throw new Error('No resume is available.')

  if (isLikelyPublicResumeUrl(cleanPath)) {
    return cleanPath
  }

  const { data, error } = await supabase.storage
    .from(RESUME_BUCKET)
    .createSignedUrl(cleanPath, SIGNED_URL_TTL_SECONDS)

  if (error) throw new Error(`Unable to open resume: ${error.message}`)
  if (!data?.signedUrl) throw new Error('Unable to open resume.')
  return data.signedUrl
}
