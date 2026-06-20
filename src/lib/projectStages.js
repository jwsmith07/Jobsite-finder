export const PUBLIC_STAGE_OPTIONS = [
  { key: 'active', label: 'Active', color: '#22c55e' },
  { key: 'upcoming', label: 'Upcoming', color: '#facc15' },
]

export const PUBLIC_STAGE_TONES = {
  active: 'border-green-600/50 bg-green-500/10 text-green-200',
  upcoming: 'border-yellow-400/40 bg-yellow-400/10 text-yellow-200',
}

export const HIRING_NOW_TONE = 'border-green-600/50 bg-green-500/15 text-green-200'

const PUBLIC_STAGE_BY_KEY = PUBLIC_STAGE_OPTIONS.reduce((acc, stage) => {
  acc[stage.key] = stage
  return acc
}, {})

export function getPublicStageKey(stage) {
  const s = String(stage || '').trim().toLowerCase()

  if (!s || s === 'unknown' || s === 'n/a' || s === 'na' || s === 'none') {
    return null
  }

  if (
    s === 'on_hold' ||
    s === 'on hold' ||
    s.includes('paused') ||
    s.includes('suspended') ||
    s.includes('deferred')
  ) {
    return null
  }

  if (
    s.includes('plan') ||
    s.includes('upcoming') ||
    s.includes('proposed') ||
    s.includes('design') ||
    s.includes('pre-construction') ||
    s.includes('pre construction') ||
    s.includes('preconstruction') ||
    s.includes('permit') ||
    s.includes('tender') ||
    s.includes('bid') ||
    s.includes('procurement') ||
    s.includes('mobilization') ||
    s.includes('mobilisation')
  ) {
    return 'upcoming'
  }

  if (
    s.includes('active') ||
    s.includes('live') ||
    s.includes('progress') ||
    s.includes('underway') ||
    s.includes('under way') ||
    s.includes('construction') ||
    s.includes('near complete') ||
    s.includes('near-complete') ||
    s.includes('near completion') ||
    s.includes('closeout') ||
    s.includes('close out') ||
    s.includes('commission') ||
    s.includes('final')
  ) {
    return 'active'
  }

  return null
}

function hasKnownPublicStage(stage) {
  return !!getPublicStageKey(stage)
}

export function isCompletedProject(stageOrProject) {
  const values =
    typeof stageOrProject === 'object' && stageOrProject !== null
      ? [stageOrProject.stage, stageOrProject.status]
      : [stageOrProject]
  return values.some((value) => {
    const s = String(value || '').trim().toLowerCase()
    return (
      s === 'complete' ||
      s === 'completed' ||
      s.includes('finished') ||
      s === 'done'
    )
  })
}

export function isCancelledProject(stageOrProject) {
  const values =
    typeof stageOrProject === 'object' && stageOrProject !== null
      ? [stageOrProject.stage, stageOrProject.status]
      : [stageOrProject]
  return values.some((value) => {
    const s = String(value || '').trim().toLowerCase()
    return s === 'cancelled' || s === 'canceled' || s.includes('cancelled') || s.includes('canceled')
  })
}

export function isOnHoldProject(stageOrProject) {
  const values =
    typeof stageOrProject === 'object' && stageOrProject !== null
      ? [stageOrProject.stage, stageOrProject.status]
      : [stageOrProject]
  return values.some((value) => {
    const s = String(value || '').trim().toLowerCase()
    return s === 'on_hold' || s === 'on hold' || s.includes('paused') || s.includes('suspended')
  })
}

export function isUnknownProject(stageOrProject) {
  if (typeof stageOrProject === 'object' && stageOrProject !== null) {
    const status = String(stageOrProject.status || '').trim().toLowerCase()
    return !hasKnownPublicStage(stageOrProject.stage) || status === 'unknown'
  }
  return !hasKnownPublicStage(stageOrProject)
}

export function isPublicProjectVisible(project) {
  return (
    project?.is_active !== false &&
    project?.is_public_project !== false &&
    (project?.review_status == null || project?.review_status === 'approved') &&
    project?.is_public !== false &&
    !isCompletedProject(project) &&
    !isCancelledProject(project) &&
    !isOnHoldProject(project)
  )
}

export function getPublicStageMeta(stage) {
  return PUBLIC_STAGE_BY_KEY[getPublicStageKey(stage)] || PUBLIC_STAGE_BY_KEY.upcoming
}

export function getPublicStageLabel(stage) {
  return getPublicStageMeta(stage).label
}

export function getPublicStageColor(stage) {
  return getPublicStageMeta(stage).color
}

export function projectHasHiringPulse(project) {
  if (!project) return false

  const openJobs = Array.isArray(project._openJobs) ? project._openJobs : []
  const enrichedOpenRoles = Number(project._openRolesCount)

  return (
    openJobs.length > 0 ||
    (Number.isFinite(enrichedOpenRoles) && enrichedOpenRoles > 0)
  )
}
