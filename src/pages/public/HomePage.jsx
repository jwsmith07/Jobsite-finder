import { useMemo } from 'react'
import { Link } from 'react-router-dom'
import {
  ArrowDown,
  ArrowRight,
  BriefcaseBusiness,
  Building2,
  FileText,
  HardHat,
  MapPin,
  Search,
  UsersRound,
  Wrench,
} from 'lucide-react'
import { useProjects } from '../../hooks/useProjects'
import ProjectMap from '../../components/map/UnifiedProjectMap'
import { formatCurrencyShort } from '../../lib/utils'
import { isPublicProjectVisible } from '../../lib/projectStages'
import { MAJOR_PROJECT_MESSAGE } from '../../lib/projectValue'

const HOMEPAGE_MAP_CENTER = { lat: 55.0, lng: -112.0 }
const HOMEPAGE_MAP_PADDING = {
  top: 24,
  right: 24,
  bottom: 78,
  left: 150,
}

function CTAButton({ to, children, variant = 'primary' }) {
  const classes = variant === 'primary'
    ? 'bg-amber-400 text-slate-950 shadow-lg shadow-amber-400/20 hover:bg-amber-300'
    : 'border border-slate-600 bg-slate-950/40 text-white hover:border-amber-300 hover:text-amber-200'

  return (
    <Link
      to={to}
      className={`inline-flex min-h-12 items-center justify-center gap-2 rounded-lg px-6 py-3 text-sm font-black transition sm:text-base ${classes}`}
    >
      {children}
      <ArrowRight size={16} aria-hidden="true" />
    </Link>
  )
}

function Benefit({ icon: Icon, text }) {
  return (
    <div className="flex items-center gap-3 rounded-2xl border border-slate-800 bg-slate-950 p-4">
      <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-amber-400/25 bg-amber-400/10 text-amber-300">
        <Icon size={20} aria-hidden="true" />
      </span>
      <p className="font-semibold text-white">{text}</p>
    </div>
  )
}

function FlowItem({ icon: Icon, label }) {
  return (
    <div className="flex flex-col items-center gap-2 text-center">
      <span className="flex h-14 w-14 items-center justify-center rounded-2xl border border-amber-400/30 bg-amber-400/10 text-amber-300">
        <Icon size={25} aria-hidden="true" />
      </span>
      <p className="text-sm font-black text-white">{label}</p>
    </div>
  )
}

export default function HomePage() {
  const { projects, loading } = useProjects()

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
      <section className="relative left-1/2 w-screen -translate-x-1/2 overflow-hidden bg-slate-950">
        <div
          className="absolute inset-0 bg-[linear-gradient(120deg,rgba(15,18,22,0.96),rgba(15,18,22,0.76)),url('https://images.unsplash.com/photo-1503387762-592deb58ef4e?auto=format&fit=crop&w=1800&q=80')] bg-cover bg-center"
          aria-hidden="true"
        />
        <div className="relative mx-auto max-w-7xl px-4 py-16 sm:px-6 sm:py-20 lg:px-8">
          <div className="max-w-4xl">
            <h1 className="text-4xl font-black leading-tight text-white sm:text-6xl lg:text-7xl">
              Built for the Trades. Powered by Real Jobsites.
            </h1>
            <p className="mt-6 max-w-2xl text-lg leading-8 text-slate-200 sm:text-xl">
              Find active construction projects across Canada. Connect with the companies building them. Discover real opportunities where the work is actually happening.
            </p>
            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <CTAButton to="/jobsites">Explore Projects</CTAButton>
              <CTAButton to="/signup" variant="secondary">Create Company Account</CTAButton>
            </div>
          </div>
        </div>
      </section>

      <section className="rounded-3xl border border-slate-800 bg-slate-900 p-6 text-center sm:p-8">
        <h2 className="text-2xl font-black text-white sm:text-3xl">
          One Platform Connecting Construction Teams
        </h2>
        <p className="mt-2 text-sm text-slate-400">Construction hiring starts with the project.</p>
        <div className="mt-8 grid gap-4 sm:grid-cols-[1fr_auto_1fr_auto_1fr_auto_1fr] sm:items-center">
          <FlowItem icon={HardHat} label="Projects" />
          <ArrowDown className="mx-auto rotate-0 text-slate-500 sm:rotate-[-90deg]" aria-hidden="true" />
          <FlowItem icon={Building2} label="General Contractors" />
          <ArrowDown className="mx-auto rotate-0 text-slate-500 sm:rotate-[-90deg]" aria-hidden="true" />
          <FlowItem icon={Wrench} label="Subcontractors" />
          <ArrowDown className="mx-auto rotate-0 text-slate-500 sm:rotate-[-90deg]" aria-hidden="true" />
          <FlowItem icon={UsersRound} label="Workers" />
        </div>
      </section>

      <section className="grid gap-6 lg:grid-cols-2">
        <div className="rounded-3xl border border-slate-800 bg-slate-900 p-6 sm:p-8">
          <h2 className="text-2xl font-black text-white">For Workers</h2>
          <div className="mt-5 grid gap-3">
            <Benefit icon={HardHat} text="Find active projects" />
            <Benefit icon={Search} text="See who's hiring" />
            <Benefit icon={FileText} text="Apply for jobs" />
          </div>
        </div>

        <div className="rounded-3xl border border-slate-800 bg-slate-900 p-6 sm:p-8">
          <h2 className="text-2xl font-black text-white">For Companies</h2>
          <div className="mt-5 grid gap-3">
            <Benefit icon={Building2} text="Claim projects" />
            <Benefit icon={Wrench} text="Join projects" />
            <Benefit icon={BriefcaseBusiness} text="Post jobs" />
            <Benefit icon={UsersRound} text="Hire workers" />
          </div>
        </div>
      </section>

      <section className="space-y-4">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="inline-flex rounded-full border border-amber-400/30 bg-amber-400/10 px-3 py-1 text-xs font-bold uppercase tracking-wide text-amber-200">
              {MAJOR_PROJECT_MESSAGE}
            </p>
            <h2 className="mt-3 text-2xl font-black text-white">Explore real projects</h2>
            {!loading && (
              <p className="mt-1 text-sm text-slate-400">
                {projectsWithCoords.length} active jobsites mapped across Canada.
              </p>
            )}
          </div>
          <CTAButton to="/jobsites">Explore Projects</CTAButton>
        </div>

        <div className="rounded-3xl border border-slate-800 bg-slate-900 p-3 shadow-2xl">
          <div className="relative h-[380px] overflow-hidden rounded-2xl">
            <ProjectMap
              projects={projectsWithCoords}
              mappedCount={projectsWithCoords.length}
              initialCenter={HOMEPAGE_MAP_CENTER}
              initialZoom={4}
              mapPadding={HOMEPAGE_MAP_PADDING}
              interactive={false}
              showPopups={false}
            />
            <div
              className="absolute inset-0 z-[5] cursor-default bg-gradient-to-t from-slate-950/28 via-transparent to-slate-950/10"
              aria-hidden="true"
            />
            <Link
              to="/jobsites"
              className="absolute bottom-4 right-4 z-10 inline-flex items-center gap-2 rounded-xl bg-amber-400 px-4 py-2.5 text-sm font-extrabold tracking-tight text-black shadow-lg shadow-amber-500/20 ring-1 ring-amber-300 transition hover:bg-amber-300"
            >
              Open Full Map
              <ArrowRight size={14} aria-hidden="true" />
            </Link>
          </div>
        </div>

        <div className="space-y-3">
          <div className="flex items-end justify-between gap-3">
            <h3 className="text-xl font-bold text-white">Recent projects</h3>
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
                <div key={i} className="rounded-2xl border border-slate-800 bg-slate-950 p-4">
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
                const location = [project.city, project.province].filter(Boolean).join(', ')
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
                        <MapPin size={12} className="text-slate-500" aria-hidden="true" />
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
                      <ArrowRight size={14} className="text-slate-500 transition group-hover:text-amber-300" />
                    </div>
                  </Link>
                )
              })}
            </div>
          )}
        </div>
      </section>

      <section className="rounded-3xl border border-amber-400/25 bg-amber-400/[0.07] p-6 text-center sm:p-10">
        <h2 className="text-3xl font-black text-white sm:text-4xl">
          Real Projects. Real Companies. Real Opportunities.
        </h2>
        <p className="mx-auto mt-3 max-w-2xl text-sm leading-6 text-slate-300 sm:text-base">
          Built for the Trades. Powered by Real Jobsites.
        </p>
        <div className="mt-7 flex flex-col justify-center gap-3 sm:flex-row">
          <CTAButton to="/jobsites">Explore Projects</CTAButton>
          <CTAButton to="/signup" variant="secondary">Create Company Account</CTAButton>
        </div>
      </section>
    </div>
  )
}
