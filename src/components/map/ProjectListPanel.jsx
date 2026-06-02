import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import {
  MapPin,
  Activity,
  ArrowRight,
  DollarSign,
  BriefcaseBusiness,
  UsersRound,
} from 'lucide-react'
import { formatCurrencyShort, formatDistanceKm, getContractorDisplayLocation } from '../../lib/utils'
import {
  HIRING_NOW_TONE,
  PUBLIC_STAGE_TONES,
  getPublicStageMeta,
  projectHasHiringPulse,
} from '../../lib/projectStages'
import { normalizeTrade } from '../../lib/trades'

const PAGE_SIZE = 30

function MetaPill({ icon: Icon, children, tone = 'slate' }) {
  if (!children) return null
  const tones = {
    slate: 'border-slate-800 bg-slate-900 text-slate-300',
    amber: 'border-amber-400/30 bg-amber-400/10 text-amber-200',
    emerald: 'border-green-600/40 bg-green-500/10 text-green-200',
  }
  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[11px] font-semibold ${tones[tone]}`}
    >
      {Icon ? <Icon size={11} aria-hidden="true" /> : null}
      <span className="truncate">{children}</span>
    </span>
  )
}

function StagePill({ stage }) {
  const meta = getPublicStageMeta(stage)
  return (
    <MetaPill icon={Activity} tone="slate">
      <span className={`-my-0.5 -mx-2 inline-flex rounded-full border px-2 py-0.5 ${PUBLIC_STAGE_TONES[meta.key]}`}>
        {meta.label}
      </span>
    </MetaPill>
  )
}

function HiringBadge({ hiring }) {
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[11px] font-black uppercase tracking-wide ${
        hiring
          ? HIRING_NOW_TONE
          : 'border-slate-700 bg-slate-900 text-slate-300'
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

function openingLabel(count) {
  return `${count} opening${count === 1 ? '' : 's'}`
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
    <div className="space-y-3">
      <div className="grid gap-3">
        {shown.map((project) => {
          const openJobs = project._openJobs || []
          const isHiring = projectHasHiringPulse(project)
          const totalOpenings = project._openRolesCount || openJobs.length
          const primaryJob = openJobs[0]
          const extraJobsCount = Math.max(0, openJobs.length - 2)
          const distanceLabel =
            project._distanceKm != null
              ? formatDistanceKm(project._distanceKm)
              : ''
          const location = getContractorDisplayLocation(project)
          const valueLabel =
            project.estimated_value != null && project.estimated_value !== ''
              ? formatCurrencyShort(project.estimated_value)
              : null
          const companyLabel =
            primaryJob?.companyName ||
            project.general_contractor ||
            project.owner ||
            ''
          const primaryImage = project._primaryImage

          return (
            <article
              key={project.id}
              className="group relative flex flex-col overflow-hidden rounded-2xl border border-slate-800 bg-slate-950 transition duration-200 hover:-translate-y-0.5 hover:border-amber-400/40 hover:shadow-lg hover:shadow-amber-500/5"
            >
              <Link
                to={`/projects/${project.id}`}
                className="absolute inset-0 z-20 rounded-2xl focus:outline-none focus-visible:ring-2 focus-visible:ring-amber-400"
                aria-label={`Open ${project.project_name}`}
              />

              {primaryImage && (
                <div className="relative z-10 aspect-[16/9] bg-slate-900">
                  <img
                    src={primaryImage.image_url}
                    alt={primaryImage.alt_text || `${project.project_name || 'Jobsite'} photo`}
                    className="h-full w-full object-cover"
                  />
                </div>
              )}

              <div className="flex flex-1 flex-col gap-3 p-4">
              <div className="relative z-10 flex items-start justify-between gap-2">
                <HiringBadge hiring={isHiring} />
                {distanceLabel && (
                  <span
                    className="inline-flex shrink-0 items-center gap-1 rounded-full border border-blue-500/30 bg-blue-500/10 px-2 py-0.5 text-[11px] font-semibold text-blue-200"
                    title="Straight-line distance from your location"
                  >
                    <MapPin size={11} aria-hidden="true" />
                    {distanceLabel}
                  </span>
                )}
              </div>

              {isHiring ? (
                <div className="relative z-10 space-y-2">
                  <div className="flex items-baseline gap-2">
                    <p className="text-2xl font-black leading-none text-white">
                      {totalOpenings > 0 ? totalOpenings : 'Now'}
                    </p>
                    <p className="text-sm font-semibold text-green-200">
                      {totalOpenings > 0 ? `open ${totalOpenings === 1 ? 'opening' : 'openings'}` : 'hiring'}
                    </p>
                  </div>
                  <div className="space-y-2">
                    {openJobs.length > 0 ? openJobs.slice(0, 2).map((job) => (
                      <div
                        key={job.id}
                        className="rounded-xl border border-slate-800 bg-slate-900/70 p-3"
                      >
                        <div className="flex items-start justify-between gap-2">
                          <p className="min-w-0 text-sm font-bold leading-snug text-white">
                            {[job.experienceLevel, normalizeTrade(job.trade)].filter(Boolean).join(' ') || job.title}
                          </p>
                          <span className="shrink-0 rounded-full bg-green-500/15 px-2 py-0.5 text-[11px] font-bold text-green-200">
                            {openingLabel(job.openings)}
                          </span>
                        </div>
                        <p className="mt-1 text-xs text-slate-400">
                          {job.companyName || 'Hiring company'}{job.payRange ? ` - ${job.payRange}` : ''}
                        </p>
                        {job.hiringTags?.length > 0 && (
                          <div className="mt-2 flex flex-wrap gap-1">
                            {job.hiringTags.slice(0, 2).map((tag) => (
                              <span key={tag} className="rounded-full bg-yellow-400/10 px-2 py-0.5 text-[10px] font-semibold text-yellow-200">
                                {tag}
                              </span>
                            ))}
                          </div>
                        )}
                      </div>
                    )) : (
                      <p className="rounded-xl border border-slate-800 bg-slate-900/70 p-3 text-sm font-medium text-slate-300">
                        Hiring is active; role details are coming soon.
                      </p>
                    )}
                    {extraJobsCount > 0 && (
                      <p className="text-xs font-semibold text-slate-400">
                        +{extraJobsCount} more open role{extraJobsCount === 1 ? '' : 's'}
                      </p>
                    )}
                  </div>
                </div>
              ) : (
                <p className="relative z-10 rounded-xl border border-slate-800 bg-slate-900/60 p-3 text-sm font-medium text-slate-300">
                  No open roles yet - follow/check back soon
                </p>
              )}

              <div className="relative z-10 space-y-1">
                <h3 className="line-clamp-2 text-base font-semibold leading-snug text-white group-hover:text-amber-100">
                  {project.project_name || 'Untitled project'}
                </h3>
                {companyLabel && (
                  <p className="inline-flex items-center gap-1.5 text-xs text-slate-400">
                    <BriefcaseBusiness size={12} className="text-slate-500" aria-hidden="true" />
                    {companyLabel}
                  </p>
                )}
              </div>

              {location && (
                <p className="relative z-10 -mt-1 inline-flex items-center gap-1.5 text-sm text-slate-400">
                  <MapPin size={13} className="text-slate-500" aria-hidden="true" />
                  {location}
                </p>
              )}

              <div className="relative z-10 flex flex-wrap gap-1.5">
                <StagePill stage={project.stage} />
                {totalOpenings > 0 && (
                  <MetaPill icon={UsersRound} tone="amber">
                    {openingLabel(totalOpenings)}
                  </MetaPill>
                )}
              </div>

              <div className="relative z-10 mt-auto flex items-center justify-between gap-2 pt-1">
                {valueLabel ? (
                  <span className="inline-flex items-center gap-1 rounded-md bg-slate-900 px-2 py-1 text-xs font-semibold text-slate-300">
                    <DollarSign size={12} aria-hidden="true" />
                    {valueLabel}
                  </span>
                ) : (
                  <span />
                )}
                <span
                  aria-hidden="true"
                  className={`inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-bold transition ${
                    isHiring
                      ? 'border border-amber-300 bg-amber-300 text-black group-hover:bg-amber-200'
                      : 'border border-slate-700 bg-slate-900 text-slate-200 group-hover:border-amber-400/50 group-hover:text-amber-200'
                  }`}
                >
                  {isHiring ? 'View Open Roles' : 'View Jobsite'}
                  <ArrowRight size={12} />
                </span>
              </div>
              </div>
            </article>
          )
        })}
      </div>

      {remaining > 0 && (
        <button
          type="button"
          onClick={() => setVisible((v) => v + PAGE_SIZE)}
          className="w-full rounded-2xl border border-slate-700 bg-slate-950 px-4 py-3 text-sm font-semibold text-slate-200 transition hover:border-amber-400/40 hover:text-amber-100"
        >
          Load {Math.min(PAGE_SIZE, remaining)} more
        </button>
      )}
    </div>
  )
}
