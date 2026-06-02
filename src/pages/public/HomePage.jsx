import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import {
  ArrowRight,
  HardHat,
  Building2,
  Wrench,
  MapPin,
} from 'lucide-react'
import { useProjects } from '../../hooks/useProjects'
import ProjectMap from '../../components/map/ProjectMap'
import { formatCurrencyShort } from '../../lib/utils'
import { PUBLIC_STAGE_OPTIONS, isPublicProjectVisible } from '../../lib/projectStages'
import { MAJOR_PROJECT_MESSAGE } from '../../lib/projectValue'

const ROLE_PANELS = [
  {
    icon: HardHat,
    title: 'For Workers',
    body: 'Create a trade profile, upload your resume, and apply to real jobs tied to real jobsites.',
    cta: { to: '/signup', label: 'Create profile' },
  },
  {
    icon: Building2,
    title: 'For General Contractors',
    body: 'Connect your company to active jobsites and post openings where the work actually is.',
    cta: { to: '/signup', label: 'Get started' },
  },
  {
    icon: Wrench,
    title: 'For Sub Contractors',
    body: 'Show where you are hiring, connect to public projects, and reach trades faster.',
    cta: { to: '/signup', label: 'Get started' },
  },
]

const HOMEPAGE_MAP_CENTER = { lat: 55.0, lng: -112.0 }
const HOMEPAGE_MAP_PADDING = {
  top: 24,
  right: 24,
  bottom: 78,
  left: 150,
}
const HERO_LOGO_SRC = '/JobsiteFinderHeroLogo.png'

function getHomepagePreviewZoom() {
  return 4
}

export default function HomePage() {
  const { projects, loading } = useProjects()
  const [previewZoom, setPreviewZoom] = useState(() => getHomepagePreviewZoom())

  useEffect(() => {
    if (typeof window === 'undefined') return
    const media = window.matchMedia('(max-width: 767px)')
    const handleChange = () => setPreviewZoom(getHomepagePreviewZoom())
    handleChange()
    media.addEventListener?.('change', handleChange)
    return () => {
      media.removeEventListener?.('change', handleChange)
    }
  }, [])

  const publicProjects = useMemo(
    () => projects.filter(isPublicProjectVisible),
    [projects],
  )

  const projectsWithCoords = useMemo(
    () =>
      publicProjects.filter(
        (p) =>
          Number.isFinite(Number(p.latitude)) &&
          Number.isFinite(Number(p.longitude)),
      ),
    [publicProjects],
  )

  // Top 4 most-recently-added projects to surface below the role panels.
  // If `created_at` is missing on every row, fall back to the first 4
  // projects with valid coords so the strip never disappears.
  const recentProjects = useMemo(() => {
    const withDate = publicProjects.filter((p) => p.created_at)
    if (withDate.length > 0) {
      return [...withDate]
        .sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
        .slice(0, 4)
    }
    return projectsWithCoords.slice(0, 4)
  }, [publicProjects, projectsWithCoords])

  return (
    <div className="space-y-12">
      <section className="relative left-1/2 w-screen -translate-x-1/2 bg-black">
        <img
          src={HERO_LOGO_SRC}
          alt="Jobsite Finder"
          className="h-auto w-full object-contain"
        />
      </section>

      {/* Hero */}
      <section className="grid gap-8 lg:grid-cols-2 lg:items-center">
        <div className="space-y-5">
          <h1 className="text-4xl font-black leading-[1.05] tracking-tight text-white sm:text-5xl">
            Built for the Trades.{' '}
            <span className="text-amber-400">
              Powered by Large-Scale Projects.
            </span>
          </h1>
          <p className="max-w-xl text-base text-slate-300 sm:text-lg">
            Discover public construction jobsites across Alberta, explore active
            projects on a map, and connect workers with hiring contractors
            faster.
          </p>
          <p className="inline-flex rounded-full border border-amber-400/30 bg-amber-400/10 px-3 py-1 text-xs font-bold uppercase tracking-wide text-amber-200">
            {MAJOR_PROJECT_MESSAGE}
          </p>
          <div className="flex flex-wrap gap-3">
            <Link
              to="/jobsites"
              className="inline-flex items-center gap-2 rounded-2xl bg-amber-400 px-5 py-3 text-sm font-extrabold tracking-tight text-black shadow-lg shadow-amber-500/20 ring-1 ring-amber-300 transition hover:bg-amber-300"
            >
              Explore Jobsites Map
              <ArrowRight size={16} />
            </Link>
            <Link
              to="/signup"
              className="inline-flex items-center gap-2 rounded-2xl border border-slate-700 bg-slate-900 px-5 py-3 text-sm font-bold text-white transition hover:border-amber-400/50 hover:bg-slate-800"
            >
              Create Profile
            </Link>
          </div>
          {!loading && projectsWithCoords.length > 0 && (
            <p className="text-sm text-slate-400">
              <span className="font-semibold text-amber-300">
                {projectsWithCoords.length}
              </span>{' '}
              major projects mapped across Alberta.
            </p>
          )}
        </div>

        <div className="rounded-3xl border border-slate-800 bg-slate-900 p-3 shadow-2xl">
          <div className="relative h-[380px] overflow-hidden rounded-2xl">
            <ProjectMap
              projects={projectsWithCoords}
              mappedCount={projectsWithCoords.length}
              initialCenter={HOMEPAGE_MAP_CENTER}
              initialZoom={previewZoom}
              mapPadding={HOMEPAGE_MAP_PADDING}
              interactive={false}
              showPopups={false}
            />
            <div
              className="absolute inset-0 z-[5] cursor-default bg-gradient-to-t from-slate-950/28 via-transparent to-slate-950/10"
              aria-hidden="true"
            />
            {/* Stage colour legend */}
            <div className="absolute bottom-3 left-3 z-10 rounded-xl border border-slate-700/60 bg-slate-950/80 px-3 py-2 backdrop-blur-sm">
              <p className="mb-1.5 text-[10px] font-semibold uppercase tracking-wider text-slate-400">Stage</p>
              <div className="flex flex-col gap-1">
                {[
                  ...PUBLIC_STAGE_OPTIONS,
                ].map(({ label, color }) => (
                  <div key={label} className="flex items-center gap-1.5">
                    <svg width="11" height="14" viewBox="0 0 28 36" aria-hidden="true">
                      <path d="M14 1 C 6.8 1 1 6.8 1 14 C 1 23.5 14 35 14 35 C 14 35 27 23.5 27 14 C 27 6.8 21.2 1 14 1 Z"
                        fill={color} stroke="#0f172a" strokeWidth="1.5"/>
                      <circle cx="14" cy="14" r="4.5" fill="#0f172a"/>
                    </svg>
                    <span className="text-[11px] text-slate-300">{label}</span>
                  </div>
                ))}
              </div>
            </div>
            <Link
              to="/jobsites"
              className="absolute bottom-4 right-4 z-10 inline-flex items-center gap-2 rounded-xl bg-amber-400 px-4 py-2.5 text-sm font-extrabold tracking-tight text-black shadow-lg shadow-amber-500/20 ring-1 ring-amber-300 transition hover:bg-amber-300"
            >
              Open Full Map
              <ArrowRight size={14} />
            </Link>
          </div>
        </div>
      </section>

      {/* Role panels */}
      <section className="grid gap-4 md:grid-cols-3">
        {ROLE_PANELS.map(({ icon: Icon, title, body, cta }) => (
          <div
            key={title}
            className="group flex flex-col gap-3 rounded-2xl border border-slate-800 bg-slate-950 p-5 transition duration-200 hover:-translate-y-0.5 hover:border-amber-400/40 hover:shadow-lg hover:shadow-amber-500/5"
          >
            <span className="flex h-10 w-10 items-center justify-center rounded-xl border border-amber-400/30 bg-amber-400/10 text-amber-300">
              <Icon size={18} aria-hidden="true" />
            </span>
            <h3 className="text-lg font-bold text-white">{title}</h3>
            <p className="text-sm text-slate-400">{body}</p>
            <Link
              to={cta.to}
              className="mt-auto inline-flex items-center gap-1 text-sm font-semibold text-amber-300 transition group-hover:text-amber-200"
            >
              {cta.label}
              <ArrowRight size={14} />
            </Link>
          </div>
        ))}
      </section>

      {/* Recently added projects */}
      <section className="space-y-3">
        <div className="flex items-end justify-between gap-3">
          <div>
            <h2 className="text-xl font-bold text-white">
              Recently added projects
            </h2>
            <p className="text-xs text-slate-400">
              Fresh jobsites added to the platform. {MAJOR_PROJECT_MESSAGE}.
            </p>
          </div>
          <Link
            to="/jobsites"
            className="inline-flex items-center gap-1 text-xs font-semibold text-slate-300 transition hover:text-amber-200"
          >
            See all
            <ArrowRight size={12} />
          </Link>
        </div>

        {loading ? (
          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
            {[0, 1, 2, 3].map((i) => (
              <div
                key={i}
                className="rounded-2xl border border-slate-800 bg-slate-950 p-4"
              >
                <div className="space-y-2">
                  <div className="h-4 w-3/4 animate-pulse rounded bg-slate-800/80" />
                  <div className="h-3 w-1/2 animate-pulse rounded bg-slate-800/60" />
                  <div className="h-5 w-16 animate-pulse rounded bg-slate-800/60" />
                </div>
              </div>
            ))}
          </div>
        ) : recentProjects.length === 0 ? (
          <p className="rounded-2xl border border-dashed border-slate-800 bg-slate-950 p-6 text-center text-sm text-slate-400">
            No projects to show yet.
          </p>
        ) : (
          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
            {recentProjects.map((project) => {
              const location = [project.city, project.province]
                .filter(Boolean)
                .join(', ')
              const valueLabel =
                project.estimated_value != null && project.estimated_value !== ''
                  ? formatCurrencyShort(project.estimated_value)
                  : null
              return (
                <Link
                  key={project.id}
                  to={`/projects/${project.id}`}
                  className="group flex flex-col gap-2 rounded-2xl border border-slate-800 bg-slate-950 p-4 transition duration-200 hover:-translate-y-0.5 hover:border-amber-400/40 hover:shadow-lg hover:shadow-amber-500/5"
                >
                  <h3 className="line-clamp-2 text-sm font-semibold leading-snug text-white group-hover:text-amber-100">
                    {project.project_name || 'Untitled project'}
                  </h3>
                  {location && (
                    <p className="inline-flex items-center gap-1 text-xs text-slate-400">
                      <MapPin
                        size={12}
                        className="text-slate-500"
                        aria-hidden="true"
                      />
                      {location}
                    </p>
                  )}
                  <div className="mt-auto flex items-center justify-between gap-2 pt-1">
                    {valueLabel ? (
                      <span className="rounded-md bg-amber-400/10 px-1.5 py-0.5 text-[11px] font-bold text-amber-300">
                        {valueLabel}
                      </span>
                    ) : (
                      <span />
                    )}
                    <ArrowRight
                      size={14}
                      className="text-slate-500 transition group-hover:text-amber-300"
                    />
                  </div>
                </Link>
              )
            })}
          </div>
        )}
      </section>
    </div>
  )
}
