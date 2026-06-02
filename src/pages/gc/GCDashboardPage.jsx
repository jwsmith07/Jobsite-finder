import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../../hooks/useAuth'
import { getApprovedProjectsForUser } from '../../services/jobsService'

const links = [
  { to: '/gc/company', label: 'Company profile', desc: 'Logo, website, contact info' },
  { to: '/gc/jobs', label: 'Jobs', desc: 'Roles tied to your projects' },
  { to: '/gc/jobsites/create', label: 'Create Jobsite', desc: 'Submit a missing jobsite for admin review' },
  { to: '/gc/applicants', label: 'Applicants', desc: 'Trades who applied' },
  { to: '/jobsites', label: 'Browse Jobsites Map', desc: 'Map of public Alberta projects' },
]

export default function GCDashboardPage() {
  const { user, loading } = useAuth()
  const [projects, setProjects] = useState([])
  const [projectsLoading, setProjectsLoading] = useState(false)
  const [projectsError, setProjectsError] = useState(null)

  useEffect(() => {
    if (loading || !user) return
    let mounted = true
    setProjectsLoading(true)
    setProjectsError(null)
    getApprovedProjectsForUser(user.id)
      .then((data) => { if (mounted) setProjects(data) })
      .catch((err) => { if (mounted) setProjectsError(err) })
      .finally(() => { if (mounted) setProjectsLoading(false) })
    return () => { mounted = false }
  }, [user, loading])

  if (loading) {
    return <div className="rounded-3xl border border-slate-800 bg-slate-900 p-6 text-slate-400">Loading...</div>
  }

  if (!user) {
    return (
      <div className="rounded-3xl border border-slate-800 bg-slate-900 p-6">
        <h1 className="text-2xl font-bold">General Contractor dashboard</h1>
        <p className="mt-2 text-slate-400">Please sign in to access your General Contractor dashboard.</p>
        <Link to="/signin" className="mt-6 inline-block rounded-xl bg-yellow-400 px-4 py-2 font-bold text-black">
          Sign in
        </Link>
      </div>
    )
  }

  const name = user.user_metadata?.full_name || user.email

  return (
    <div className="space-y-6">
      <div className="rounded-3xl border border-slate-800 bg-slate-900 p-6">
        <p className="text-sm text-yellow-300">General Contractor</p>
        <h1 className="mt-1 text-3xl font-black">Welcome, {name}</h1>
        <p className="mt-2 text-slate-400">Manage your company, jobs, and applicants.</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        {links.map((l) => (
          <Link
            key={l.to}
            to={l.to}
            className="rounded-3xl border border-slate-800 bg-slate-900 p-6 transition hover:border-yellow-400/50"
          >
            <h2 className="text-lg font-semibold text-white">{l.label}</h2>
            <p className="mt-1 text-sm text-slate-400">{l.desc}</p>
          </Link>
        ))}
      </div>

      <div className="rounded-3xl border border-slate-800 bg-slate-900 p-6">
        <h2 className="text-lg font-semibold text-white">Connected projects</h2>
        <p className="mt-1 text-sm text-slate-400">Approved jobsites your company is connected to.</p>
        {projectsLoading && <p className="mt-4 text-sm text-slate-400">Loading projects...</p>}
        {projectsError && !projectsLoading && (
          <p className="mt-4 text-sm text-red-300">{projectsError.message}</p>
        )}
        {!projectsLoading && !projectsError && projects.length === 0 && (
          <p className="mt-4 text-sm text-slate-400">No approved project connections yet.</p>
        )}
        {projects.length > 0 && (
          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            {projects.map((project) => (
              <Link
                key={project.id}
                to={`/projects/${project.project_id}`}
                className="overflow-hidden rounded-2xl border border-slate-800 bg-slate-950 transition hover:border-yellow-400/50"
              >
                {project._primaryImage && (
                  <img
                    src={project._primaryImage.image_url}
                    alt={project._primaryImage.alt_text || `${project.project_name || 'Jobsite'} photo`}
                    className="aspect-[16/9] w-full object-cover"
                  />
                )}
                <div className="p-4">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <h3 className="font-semibold text-white">{project.project_name}</h3>
                    <p className="mt-1 text-sm text-slate-400">
                      {[project.city, project.province].filter(Boolean).join(', ') || 'Location not listed'}
                    </p>
                  </div>
                  {project.is_primary_gc && (
                    <span className="rounded-full border border-yellow-400/40 bg-yellow-400/10 px-2.5 py-1 text-xs font-semibold text-yellow-300">
                      Primary General Contractor
                    </span>
                  )}
                </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
