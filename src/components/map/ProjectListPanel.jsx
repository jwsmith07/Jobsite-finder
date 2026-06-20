import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import {
  ArrowRight,
  CheckCircle2,
  Circle,
  HardHat,
  MapPin,
} from 'lucide-react'
import { getContractorDisplayLocation } from '../../lib/utils'
import {
  PUBLIC_STAGE_TONES,
  getPublicStageMeta,
  projectHasHiringPulse,
} from '../../lib/projectStages'

const PAGE_SIZE = 30

function openingLabel(count) {
  if (count > 1) return `${count} Open Positions`
  if (count === 1) return 'Hiring'
  return 'No Open Positions'
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

function StagePill({ stage }) {
  const meta = getPublicStageMeta(stage)
  return (
    <span className={`inline-flex items-center rounded-full border px-2 py-0.5 text-[11px] font-bold uppercase ${PUBLIC_STAGE_TONES[meta.key]}`}>
      {meta.label}
    </span>
  )
}

export default function ProjectListPanel({ projects = [] }) {
  const [visible, setVisible] = useState(PAGE_SIZE)

  useEffect(() => {
    setVisible(PAGE_SIZE)
  }, [projects])

  if (!projects || projects.length === 0) return null

  const shown = projects.slice(0, visible)
  const remaining = projects.length - shown.length

  return (
    <div className="space-y-2">
      <div className="grid gap-2">
        {shown.map((project) => {
          const isHiring = projectHasHiringPulse(project)
          const totalOpenings = Number(project._openRolesCount) || 0
          const claimed = !!project.claimed_by_company_id
          const location = getContractorDisplayLocation(project) || 'Location not listed'

          return (
            <article
              key={project.id}
              className="group relative overflow-hidden rounded-xl border border-slate-800 bg-slate-950 p-3 transition hover:border-amber-400/40 hover:bg-slate-900/70"
            >
              <Link
                to={`/projects/${project.id}`}
                className="absolute inset-0 z-20 rounded-xl focus:outline-none focus-visible:ring-2 focus-visible:ring-amber-400"
                aria-label={`Open ${project.project_name}`}
              />

              <div className="relative z-10 min-w-0">
                <h3 className="line-clamp-2 text-base font-bold leading-snug text-white group-hover:text-amber-100">
                  {project.project_name || 'Untitled project'}
                </h3>

                <p className="mt-1 inline-flex max-w-full items-center gap-1.5 text-sm text-slate-400">
                  <MapPin size={13} className="shrink-0 text-slate-500" aria-hidden="true" />
                  <span className="truncate">{location}</span>
                </p>
              </div>

              <div className="relative z-10 mt-2 flex flex-wrap gap-1.5">
                <StagePill stage={project.stage} />
                <StatusPill tone={claimed ? 'emerald' : 'slate'} icon={claimed ? CheckCircle2 : Circle}>
                  {claimed ? 'Claimed' : 'Unclaimed'}
                </StatusPill>
                <StatusPill tone={isHiring ? 'amber' : 'slate'} icon={HardHat}>
                  {openingLabel(totalOpenings)}
                </StatusPill>
              </div>

              <span
                aria-hidden="true"
                className="absolute right-3 top-3 z-10 text-slate-600 transition group-hover:text-amber-200"
              >
                <ArrowRight size={15} />
              </span>
            </article>
          )
        })}
      </div>

      {remaining > 0 && (
        <button
          type="button"
          onClick={() => setVisible((v) => v + PAGE_SIZE)}
          className="w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-2.5 text-sm font-semibold text-slate-200 transition hover:border-amber-400/40 hover:text-amber-100"
        >
          Load {Math.min(PAGE_SIZE, remaining)} more
        </button>
      )}
    </div>
  )
}
