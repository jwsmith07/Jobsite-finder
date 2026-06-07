import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../../hooks/useAuth'
import { getApprovedProjectsForUser } from '../../services/jobsService'

export default function SCDashboardPage() {
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
        <h1 className="text-2xl font-bold">Subcontractor dashboard</h1>
        <p className="mt-2 text-slate-400">Please sign in to access your subcontractor dashboard.</p>
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
        <p className="text-sm text-yellow-300">Subcontractor</p>
        <h1 className="mt-1 text-3xl font-black">Welcome, {name}</h1>
        <p className="mt-2 text-slate-400">Manage your crew, jobs, and applicants.</p>
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
                <h3 className="font-semibold text-white">{project.project_name}</h3>
                <p className="mt-1 text-sm text-slate-400">
                  {[project.city, project.province].filter(Boolean).join(', ') || 'Location not listed'}
                </p>
                {project.trade_scope && (
                  <p className="mt-2 text-sm text-yellow-200">{project.trade_scope}</p>
                )}
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
