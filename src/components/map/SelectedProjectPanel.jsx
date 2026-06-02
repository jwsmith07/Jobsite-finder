import { Link } from 'react-router-dom'
import { ArrowRight, BriefcaseBusiness, DollarSign, MapPin, Navigation, UsersRound } from 'lucide-react'
import {
  formatCurrencyShort,
  formatDistanceKm,
  getContractorDisplayLocation,
  haversineKm,
} from '../../lib/utils'
import {
  HIRING_NOW_TONE,
  PUBLIC_STAGE_TONES,
  getPublicStageMeta,
  projectHasHiringPulse,
} from '../../lib/projectStages'
import { normalizeTrade } from '../../lib/trades'

function StageBadge({ stage }) {
  const meta = getPublicStageMeta(stage)
  return (
    <span className={`inline-flex w-fit items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold ${PUBLIC_STAGE_TONES[meta.key]}`}>
      {meta.label}
    </span>
  )
}

function HiringBadge({ hiring }) {
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-black uppercase tracking-wide ${
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

export default function SelectedProjectPanel({
  project,
  onClose,
  userLocation,
  onApplyNearbyShortcut,
  nearbyShortcutActive = false,
}) {
  if (!project) return null

  const lat = Number(project.latitude)
  const lng = Number(project.longitude)
  const hasCoords = Number.isFinite(lat) && Number.isFinite(lng)

  const location = getContractorDisplayLocation(project)
  const addressForMaps = [project.address, project.city, project.province]
    .filter(Boolean)
    .join(', ')
  const googleMapsUrl = project.google_maps_url || (hasCoords
    ? `https://www.google.com/maps/search/?api=1&query=${lat},${lng}`
    : addressForMaps
      ? `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(addressForMaps)}`
      : null)
  // Straight-line distance from the user to this project. Driving distance
  // is intentionally avoided (per Task #10 — would burn Directions API
  // quota when shown for every selected jobsite).
  const distanceKm =
    hasCoords && userLocation ? haversineKm(userLocation, { lat, lng }) : null
  const distanceLabel = distanceKm != null ? formatDistanceKm(distanceKm) : ''
  const openJobs = project._openJobs || []
  const hasJobs = openJobs.length > 0
  const isHiring = projectHasHiringPulse(project)
  const totalOpenings = project._openRolesCount || openJobs.length
  const primaryImage = project._primaryImage
  const hasEstimatedValue = project.estimated_value != null && project.estimated_value !== ''
  const projectCategory = [project.project_type, project.sector].filter(Boolean).join(' / ')

  return (
    <div className="space-y-4">
      <button
        type="button"
        onClick={onClose}
        className="inline-flex items-center gap-1 text-xs font-semibold text-slate-400 hover:text-yellow-300"
      >
        ← Back to list
      </button>

      <div>
        {primaryImage && (
          <div className="mb-4 overflow-hidden rounded-2xl border border-slate-800 bg-slate-900">
            <img
              src={primaryImage.image_url}
              alt={primaryImage.alt_text || `${project.project_name || 'Jobsite'} photo`}
              className="aspect-[16/9] w-full object-cover"
            />
          </div>
        )}
        <div className="flex flex-wrap items-start justify-between gap-2">
          <HiringBadge hiring={isHiring} />
          <StageBadge stage={project.stage} />
        </div>
        <h2 className="mt-3 text-xl font-bold leading-tight text-white">
          {project.project_name || 'Project details'}
        </h2>
        <p className="mt-2 inline-flex items-start gap-1.5 text-sm font-semibold text-slate-300">
          <MapPin className="mt-0.5 shrink-0 text-yellow-300" size={15} aria-hidden="true" />
          <span className="break-words">{location || 'Alberta'}</span>
        </p>
      </div>

      {isHiring ? (
        <div className="rounded-2xl border border-green-600/35 bg-green-500/10 p-4">
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-wider text-green-200/80">
                Open roles
              </p>
              <p className="mt-1 text-2xl font-black text-white">
                {totalOpenings > 0 ? openingLabel(totalOpenings) : 'Hiring now'}
              </p>
            </div>
            <UsersRound className="text-green-500" size={24} aria-hidden="true" />
          </div>
          <div className="mt-3 space-y-2">
            {openJobs.length > 0 ? openJobs.slice(0, 4).map((job) => (
              <div key={job.id} className="rounded-xl border border-slate-800 bg-slate-950/80 p-3">
                <div className="flex items-start justify-between gap-2">
                  <p className="min-w-0 text-sm font-bold leading-snug text-white">
                    {[job.experienceLevel, normalizeTrade(job.trade)].filter(Boolean).join(' ') || job.title}
                  </p>
                  <span className="shrink-0 rounded-full bg-green-500/15 px-2 py-0.5 text-[11px] font-bold text-green-200">
                    {openingLabel(job.openings)}
                  </span>
                </div>
                <p className="mt-1 inline-flex items-center gap-1.5 text-xs text-slate-400">
                  <BriefcaseBusiness size={12} aria-hidden="true" />
                  {job.companyName || 'Hiring company'}{job.payRange ? ` - ${job.payRange}` : ''}
                </p>
                {job.hiringTags?.length > 0 && (
                  <div className="mt-2 flex flex-wrap gap-1">
                    {job.hiringTags.slice(0, 3).map((tag) => (
                      <span key={tag} className="rounded-full bg-yellow-400/10 px-2 py-0.5 text-[10px] font-semibold text-yellow-200">
                        {tag}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            )) : (
              <p className="rounded-xl border border-slate-800 bg-slate-950/80 p-3 text-sm font-medium text-slate-300">
                Hiring is active; role details are coming soon.
              </p>
            )}
          </div>
        </div>
      ) : (
        <p className="rounded-2xl border border-slate-800 bg-slate-900/70 p-4 text-sm font-medium text-slate-300">
          No open roles yet - follow/check back soon
        </p>
      )}

      {(hasEstimatedValue || projectCategory) && (
        <div className="grid gap-3 sm:grid-cols-2">
          {hasEstimatedValue && (
            <div className="rounded-2xl border border-slate-800 bg-slate-900/70 p-4">
              <p className="inline-flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wider text-slate-500">
                <DollarSign size={12} aria-hidden="true" />
                Estimated Value
              </p>
              <p className="mt-1 text-sm font-bold text-white">
                {formatCurrencyShort(project.estimated_value)}
              </p>
            </div>
          )}
          {projectCategory && (
            <div className="rounded-2xl border border-slate-800 bg-slate-900/70 p-4">
              <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">Project Type</p>
              <p className="mt-1 text-sm font-bold text-white">{projectCategory}</p>
            </div>
          )}
        </div>
      )}

      {distanceLabel && (
        <div className="flex flex-wrap items-center gap-2">
          <div className="inline-flex items-baseline gap-2 rounded-xl border border-blue-500/40 bg-blue-500/10 px-3 py-1.5">
            <span className="text-[10px] uppercase tracking-wider text-blue-200/80">
              Straight-line
            </span>
            <span className="text-sm font-bold text-blue-200">
              {distanceLabel} from you
            </span>
          </div>
          {onApplyNearbyShortcut && (
            <button
              type="button"
              onClick={() => onApplyNearbyShortcut()}
              disabled={nearbyShortcutActive}
              title={
                nearbyShortcutActive
                  ? 'Already showing nearest within 25 km'
                  : 'Sort the list by nearest and limit it to 25 km from you'
              }
              className="inline-flex items-center gap-1 rounded-xl border border-blue-500/40 bg-blue-500/10 px-3 py-1.5 text-xs font-semibold text-blue-200 hover:border-blue-400 hover:bg-blue-500/20 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {nearbyShortcutActive
                ? 'Showing nearest within 25 km'
                : 'Find more like this within 25 km'}
            </button>
          )}
        </div>
      )}

      <div className="flex flex-col gap-2 pt-2">
        <Link
          to={hasJobs ? `/projects/${project.id}#project-open-jobs` : `/projects/${project.id}`}
          className="inline-flex items-center justify-center gap-2 rounded-xl bg-yellow-400 px-4 py-2 text-sm font-bold text-black hover:bg-yellow-300"
        >
          {hasJobs ? 'View Jobs / Apply' : 'View Full Project'}
          {hasJobs && <ArrowRight size={15} aria-hidden="true" />}
        </Link>
        {googleMapsUrl && (
          <a
            href={googleMapsUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center justify-center gap-2 rounded-xl border border-yellow-400/40 bg-yellow-400/10 px-4 py-2 text-sm font-semibold text-yellow-300 hover:border-yellow-400 hover:bg-yellow-400/20"
          >
            <Navigation size={15} aria-hidden="true" />
            Open in Google Maps
          </a>
        )}
      </div>
    </div>
  )
}
