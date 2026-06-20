export const CERTIFICATION_OPTIONS = [
  'CSTS',
  'WHMIS',
  'Fall Protection',
  'Confined Space',
  'First Aid',
  'H2S Alive',
  'Ground Disturbance',
  'TDG',
  'AWP',
  'OSSA',
]

export const AVAILABILITY_OPTIONS = [
  { value: 'available_now', label: 'Available Now' },
  { value: 'within_2_weeks', label: 'Available Within 2 Weeks' },
  { value: 'within_30_days', label: 'Available Within 30 Days' },
  { value: 'not_looking', label: 'Not Currently Looking' },
]

export const WORK_PREFERENCE_OPTIONS = [
  'Local Work',
  'Travel Work',
  'Camp Work',
  'Shutdown Work',
  'Fly-In Fly-Out',
  'Rotational Work',
]

export const WORK_REGION_OPTIONS = [
  'Alberta',
  'British Columbia',
  'Saskatchewan',
  'Manitoba',
  'Ontario',
  'Quebec',
  'Yukon',
  'Northwest Territories',
  'Nunavut',
  'Atlantic Canada',
]

export const TALENT_VISIBILITY_OPTIONS = [
  { value: 'hiring_companies', label: 'Visible To Hiring Companies' },
  { value: 'approved_gcs', label: 'Visible To Approved GCs' },
  { value: 'hidden', label: 'Hidden From Talent Discovery' },
]

export function getTalentVisibilityLabel(value) {
  return TALENT_VISIBILITY_OPTIONS.find((option) => option.value === value)?.label || 'Visible To Approved GCs'
}

export function normalizeList(value) {
  if (!value) return []
  if (Array.isArray(value)) {
    return value.map((item) => String(item || '').trim()).filter(Boolean)
  }
  if (typeof value === 'string') {
    try {
      const parsed = JSON.parse(value)
      if (Array.isArray(parsed)) return normalizeList(parsed)
    } catch {
    }
    return value.split(',').map((item) => item.trim()).filter(Boolean)
  }
  return []
}

export function getAvailabilityLabel(value) {
  return AVAILABILITY_OPTIONS.find((option) => option.value === value)?.label || value || 'Not specified'
}

export function getProfileCertifications(profile) {
  if (Array.isArray(profile?.certifications)) {
    return profile.certifications.map((cert) => (
      typeof cert === 'string' ? cert : cert.certification_name
    )).filter(Boolean)
  }
  return []
}

export function getProfileCompletion(profile) {
  const certifications = getProfileCertifications(profile)
  const workPreferences = normalizeList(profile?.work_preferences)
  const preferredRegions = normalizeList(profile?.preferred_regions)
  const items = [
    { label: 'Resume Uploaded', complete: !!profile?.resume_url, recommendation: 'Upload a current resume.' },
    { label: 'Trade Selected', complete: !!profile?.trade, recommendation: 'Select your primary trade.' },
    { label: 'Experience Added', complete: profile?.experience_years !== null && profile?.experience_years !== undefined && profile?.experience_years !== '', recommendation: 'Add years of experience.' },
    { label: 'Certifications Added', complete: certifications.length > 0, recommendation: 'Add tickets like CSTS, WHMIS, or Fall Protection.' },
    { label: 'Availability Set', complete: !!profile?.availability_status, recommendation: 'Set when you are available for work.' },
    { label: 'Work Preferences Set', complete: workPreferences.length > 0, recommendation: 'Choose local, travel, camp, or shutdown preferences.' },
    { label: 'Preferred Regions Set', complete: preferredRegions.length > 0, recommendation: 'Choose the provinces or regions where you want work.' },
  ]
  return {
    items,
    percent: Math.round((items.filter((item) => item.complete).length / items.length) * 100),
  }
}

function includesNormalized(list, target) {
  const normalized = String(target || '').trim().toLowerCase()
  if (!normalized) return false
  return normalizeList(list).some((item) => {
    const current = String(item).trim().toLowerCase()
    return current === normalized || current.includes(normalized) || normalized.includes(current)
  })
}

function splitRequirements(value) {
  return normalizeList(value)
    .flatMap((item) => String(item).split(/[,;|]/))
    .map((item) => item.trim())
    .filter(Boolean)
}

function scoreAvailability(status) {
  if (status === 'available_now') return 100
  if (status === 'within_2_weeks') return 85
  if (status === 'within_30_days') return 65
  if (status === 'not_looking') return 15
  return 40
}

function scoreTradeLevel(workerLevel, jobLevel) {
  if (!jobLevel) return null
  if (!workerLevel) return 0
  const worker = String(workerLevel).toLowerCase()
  const job = String(jobLevel).toLowerCase()
  if (worker === job) return 100
  if (worker.includes('red seal') && (job.includes('journey') || job.includes('apprentice') || job.includes('entry'))) return 90
  if (worker.includes('journey') && (job.includes('apprentice') || job.includes('entry'))) return 80
  return 35
}

export function getWorkerJobMatch(workerProfile, job = {}, project = {}) {
  const certifications = getProfileCertifications(workerProfile)
  const requiredCertifications = splitRequirements(job.required_certifications || job.requirements)
  const workPreferences = normalizeList(workerProfile?.work_preferences)
  const preferredRegions = normalizeList(workerProfile?.preferred_regions)
  const jobRegion = project.province || job.project?.province
  const jobNeedsCamp = !!job.camp_available || /camp/i.test(String(job.project_assignment || job.description || ''))
  const indicators = []

  if (job.trade) {
    const tradeMatch = includesNormalized([workerProfile?.trade, workerProfile?.secondary_trade], job.trade)
    indicators.push({ key: 'trade', label: 'Trade Match', matched: tradeMatch, score: tradeMatch ? 100 : 0 })
  }

  const levelScore = scoreTradeLevel(workerProfile?.trade_level || workerProfile?.apprenticeship_level, job.experience_level)
  if (levelScore !== null) {
    indicators.push({ key: 'level', label: 'Level Match', matched: levelScore >= 70, score: levelScore })
  }

  if (requiredCertifications.length > 0) {
    const matchedCerts = requiredCertifications.filter((cert) => includesNormalized(certifications, cert))
    const certScore = Math.round((matchedCerts.length / requiredCertifications.length) * 100)
    indicators.push({
      key: 'certifications',
      label: 'Required Certifications',
      matched: certScore === 100,
      score: certScore,
      matchedItems: matchedCerts,
      requiredItems: requiredCertifications,
    })
  }

  if (jobNeedsCamp) {
    const campMatch = includesNormalized(workPreferences, 'Camp Work') || !!workerProfile?.camp_ready
    indicators.push({
      key: 'camp',
      label: 'Camp Work',
      matched: campMatch,
      score: campMatch ? 100 : 0,
    })
  }

  if (jobRegion) {
    const regionMatch = includesNormalized(preferredRegions, jobRegion) || includesNormalized([workerProfile?.province], jobRegion)
    indicators.push({
      key: 'region',
      label: jobRegion,
      matched: regionMatch,
      score: regionMatch ? 100 : 0,
    })
  }

  const availability = scoreAvailability(workerProfile?.availability_status)
  indicators.push({
    key: 'availability',
    label: 'Availability',
    matched: availability >= 65,
    score: availability,
  })

  const matched = indicators.filter((indicator) => indicator.matched).length
  const score = indicators.length
    ? Math.round(indicators.reduce((sum, indicator) => sum + Number(indicator.score || 0), 0) / indicators.length)
    : null
  return {
    indicators,
    matched,
    total: indicators.length,
    score,
  }
}
