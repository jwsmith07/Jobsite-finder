import { Link } from 'react-router-dom'
import { ArrowRight, BriefcaseBusiness, CheckCircle2, Circle, HardHat, MapPin } from 'lucide-react'
import { getContractorDisplayLocation } from '../../lib/utils'
import {
  PUBLIC_STAGE_TONES,
  getPublicStageMeta,
  projectHasHiringPulse,
} from '../../lib/projectStages'

function StageBadge({ stage }) {
  const meta = getPublicStageMeta(stage)
  return (
    <span className={`inline-flex w-fit items-center rounded-full border px-2 py-0.5 text-[11px] font-bold uppercase ${PUBLIC_STAGE_TONES[meta.key]}`}>
      {meta.label}
    </span>
  )
}

function StatusPill({ children, tone = 'slate', icon: Icon }) {
  const tones = {
    slate: 'border-slate-700 bg-slate-900 text-slate-300',
    emerald: 'border-emerald-500/40 bg-emerald-500/10 text-emerald-200',
    amber: 'border-amber-400/40 bg-amber-400/10 text-amber-200',
  }

  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full border px-2 py-0.5 text-[11px] font-bold ${tones[tone]}`}>
      {Icon ? <Icon size={12} aria-hidden="true" /> : null}
      {children}
    </span>
  )
}

function hiringLabel(openings, hiring) {
  if (openings > 1) return `${openings} Open Positions`
  if (openings === 1 || hiring) return 'Hiring'
  return 'No Open Positions'
}

export default function SelectedProjectPanel({ project, onClose }) {
  if (!project) return null

  const location = getContractorDisplayLocation(project) || 'Location not listed'
  const isHiring = projectHasHiringPulse(project)
  const totalOpenings = Number(project._openRolesCount) || 0
  const claimed = !!project.claimed_by_company_id
  const primaryImage = project._primaryImage
  const primaryGc =
    project._openJobs?.[0]?.companyName ||
    project.general_contractor ||
    project.owner ||
    ''

  return (
    <div className="space-y-4">
      <button
        type="button"
        onClick={onClose}
        className="inline-flex items-center gap-1 text-xs font-semibold text-slate-400 hover:text-yellow-300"
      >
        Back to list
      </button>

      {primaryImage && (
        <div className="overflow-hidden rounded-xl border border-slate-800 bg-slate-900">
          <img
            src={primaryImage.image_url}
            alt={primaryImage.alt_text || `${project.project_name || 'Jobsite'} photo`}
            className="aspect-[16/9] w-full object-cover"
          />
        </div>
      )}

      <div>
        <h2 className="text-xl font-black leading-tight text-white">
          {project.project_name || 'Project preview'}
        </h2>
        <p className="mt-2 inline-flex items-start gap-1.5 text-sm font-semibold text-slate-300">
          <MapPin className="mt-0.5 shrink-0 text-yellow-300" size={15} aria-hidden="true" />
          <span className="break-words">{location}</span>
        </p>
      </div>

      <div className="flex flex-wrap gap-1.5">
        <StageBadge stage={project.stage} />
        <StatusPill tone={claimed ? 'emerald' : 'slate'} icon={claimed ? CheckCircle2 : Circle}>
          {claimed ? 'Claimed' : 'Unclaimed'}
        </StatusPill>
        <StatusPill tone={isHiring ? 'amber' : 'slate'} icon={HardHat}>
          {hiringLabel(totalOpenings, isHiring)}
        </StatusPill>
      </div>

      {primaryGc && (
        <p className="inline-flex max-w-full items-center gap-1.5 text-sm text-slate-400">
          <BriefcaseBusiness size={13} className="shrink-0 text-slate-500" aria-hidden="true" />
          <span className="truncate">{primaryGc}</span>
        </p>
      )}

      <Link
        to={`/projects/${project.id}`}
        className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-yellow-400 px-4 py-2.5 text-sm font-black text-black transition hover:bg-yellow-300"
      >
        View Project
        <ArrowRight size={15} aria-hidden="true" />
      </Link>
    </div>
  )
}
