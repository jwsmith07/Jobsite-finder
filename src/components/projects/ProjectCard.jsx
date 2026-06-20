import { Link } from 'react-router-dom'
import { BriefcaseBusiness, DollarSign, MapPin, UsersRound } from 'lucide-react'
import {
  HIRING_NOW_TONE,
  PUBLIC_STAGE_TONES,
  getPublicStageMeta,
  projectHasHiringPulse,
} from '../../lib/projectStages'
import { formatCurrencyShort } from '../../lib/utils'
import { normalizeTrade } from '../../lib/trades'

function StageBadge({ stage }) {
  const meta = getPublicStageMeta(stage)
  return (
    <span className={`mt-2 inline-flex rounded-full border px-2 py-0.5 text-xs font-semibold ${PUBLIC_STAGE_TONES[meta.key]}`}>
      {meta.label}
    </span>
  )
}

function HiringBadge({ hiring }) {
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[11px] font-black uppercase tracking-wide ${
        hiring
          ? HIRING_NOW_TONE
          : 'border-slate-700 bg-slate-950 text-slate-300'
      }`}
    >
      {hiring && (
        <span className="relative flex h-2 w-2" aria-hidden="true">
          <span className="absolute inset-0 animate-ping rounded-full bg-green-500 opacity-45" />
          <span className="relative h-2 w-2 rounded-full bg-green-500" />
        </span>
      )}
      {hiring ? 'Hiring Now' : 'No Open Roles Yet'}
    </span>
  )
}

function SourceBadge({ project }) {
  const isContractorCreated = project?.source_type === 'contractor_created'
  const isVerified = project?.project_status_type === 'verified' || !!project?.claimed_by_company_id
  if (isVerified) {
    return (
      <span className="inline-flex rounded-full border border-emerald-500/40 bg-emerald-500/10 px-2 py-0.5 text-[11px] font-bold text-emerald-200">
        Contractor Verified
      </span>
    )
  }
  return (
    <span className={`inline-flex rounded-full border px-2 py-0.5 text-[11px] font-bold ${
      isContractorCreated
        ? 'border-blue-500/40 bg-blue-500/10 text-blue-200'
        : 'border-slate-700 bg-slate-950 text-slate-300'
    }`}>
      {isContractorCreated ? 'Contractor Created' : 'Public Project'}
    </span>
  )
}

function openingLabel(count) {
  return `${count} opening${count === 1 ? '' : 's'}`
}

export default function ProjectCard({ project }) {
  if (!project) return null
  const location = [project.city, project.province].filter(Boolean).join(', ')
  const hasEstimatedValue = project.estimated_value != null && project.estimated_value !== ''
  const openJobs = project._openJobs || []
  const isHiring = projectHasHiringPulse(project)
  const totalOpenings = project._openRolesCount || openJobs.length
  const primaryJob = openJobs[0]
  const companyLabel = primaryJob?.companyName || project.general_contractor || ''
  const primaryImage = project._primaryImage || (project.primary_image_url ? {
    image_url: project.primary_image_url,
    alt_text: `${project.project_name || 'Jobsite'} photo`,
  } : null)

  return (
    <Link
      to={`/projects/${project.id}`}
      className="block overflow-hidden rounded-2xl border border-slate-800 bg-slate-900 transition hover:border-yellow-400/50 hover:bg-slate-900/80"
    >
      {primaryImage && (
        <div className="aspect-[16/9] bg-slate-950">
          <img
            src={primaryImage.image_url}
            alt={primaryImage.alt_text || `${project.project_name || 'Jobsite'} photo`}
            className="h-full w-full object-cover"
          />
        </div>
      )}
      <div className="p-4">
      <div className="flex items-start justify-between gap-3">
        <HiringBadge hiring={isHiring} />
        <SourceBadge project={project} />
        {isHiring && totalOpenings > 0 && (
          <span className="inline-flex shrink-0 items-center gap-1 rounded-full border border-green-600/40 bg-green-500/10 px-2 py-0.5 text-[11px] font-bold text-green-200">
            <UsersRound size={11} aria-hidden="true" />
            {openingLabel(totalOpenings)}
          </span>
        )}
      </div>

      {isHiring ? (
        <div className="mt-3 rounded-xl border border-slate-800 bg-slate-950/70 p-3">
          <p className="text-sm font-bold text-white">
            {[primaryJob?.experienceLevel, normalizeTrade(primaryJob?.trade)].filter(Boolean).join(' ') || primaryJob?.title || 'Open roles'}
          </p>
          <p className="mt-1 text-xs text-slate-400">
            {primaryJob
              ? `${companyLabel || 'Hiring company'}${primaryJob.payRange ? ` - ${primaryJob.payRange}` : ''}`
              : 'Role details are coming soon'}
          </p>
        </div>
      ) : (
        <p className="mt-3 rounded-xl border border-slate-800 bg-slate-950/70 p-3 text-sm font-medium text-slate-300">
          No open roles yet - follow/check back soon
        </p>
      )}

      <p className="mt-3 min-w-0 text-base font-bold leading-snug text-white">
        {project.project_name || 'Project details'}
      </p>
      <div className="mt-3 flex flex-wrap items-center gap-2 text-sm text-slate-400">
        <span className="inline-flex items-center gap-1.5">
          <MapPin size={14} aria-hidden="true" />
          {location || 'Location not listed'}
        </span>
        {companyLabel && (
          <span className="inline-flex items-center gap-1.5">
            <BriefcaseBusiness size={14} aria-hidden="true" />
            {companyLabel}
          </span>
        )}
        {hasEstimatedValue && (
          <span className="inline-flex items-center gap-1.5 rounded-full border border-slate-700 bg-slate-950 px-2 py-0.5 text-xs font-semibold text-slate-300">
            <DollarSign size={12} aria-hidden="true" />
            {formatCurrencyShort(project.estimated_value)}
          </span>
        )}
      </div>
      <StageBadge stage={project.stage} />
      </div>
    </Link>
  )
}
