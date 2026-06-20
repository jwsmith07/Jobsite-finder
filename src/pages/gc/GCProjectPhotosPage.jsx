import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { ImagePlus } from 'lucide-react'
import ProjectImageManager from '../../components/projects/ProjectImageManager'
import { useAuth } from '../../hooks/useAuth'
import { getApprovedGcProjectsForUser } from '../../services/jobsService'

export default function GCProjectPhotosPage() {
  const { user, loading: authLoading } = useAuth()
  const [projects, setProjects] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  async function load() {
    if (!user?.id) return
    setLoading(true)
    setError(null)
    try {
      const data = await getApprovedGcProjectsForUser(user.id)
      setProjects(data)
    } catch (err) {
      setError(err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (authLoading) return
    if (!user?.id) {
      setLoading(false)
      return
    }
    load()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id, authLoading])

  if (authLoading || loading) {
    return (
      <div className="rounded-3xl border border-slate-800 bg-slate-900 p-6 text-slate-400">
        Loading project photos...
      </div>
    )
  }

  return (
    <div className="space-y-6">

      <section className="rounded-3xl border border-slate-800 bg-slate-900 p-6">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <p className="text-sm font-semibold text-yellow-300">General Contractor</p>
            <h1 className="mt-1 text-3xl font-black text-white">Project Photos</h1>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-400">
              Upload and manage photos for jobsites where your company is approved as the primary General Contractor.
            </p>
          </div>
          <span className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-yellow-400/30 bg-yellow-400/10 text-yellow-300">
            <ImagePlus size={20} aria-hidden="true" />
          </span>
        </div>
      </section>

      {error && (
        <div className="rounded-2xl border border-red-900/60 bg-red-950/40 p-4 text-sm text-red-300">
          {error.message}
        </div>
      )}

      {!error && projects.length === 0 && (
        <div className="rounded-3xl border border-slate-800 bg-slate-900 p-6">
          <h2 className="text-lg font-semibold text-white">No primary GC projects yet</h2>
          <p className="mt-2 text-sm text-slate-400">
            Project photos are available once your company is approved as the primary General Contractor on a jobsite.
          </p>
          <Link
            to="/jobsites"
            className="mt-5 inline-flex rounded-xl bg-yellow-400 px-4 py-2 text-sm font-bold text-black transition hover:bg-yellow-300"
          >
            Find Jobsites
          </Link>
        </div>
      )}

      {projects.length > 0 && (
        <div className="space-y-4">
          {projects.map((project) => (
            <section key={project.id} className="rounded-3xl border border-slate-800 bg-slate-900 p-5 sm:p-6">
              <div className="mb-4 flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                <div>
                  <h2 className="text-xl font-bold text-white">{project.project_name}</h2>
                  <p className="mt-1 text-sm text-slate-400">
                    {[project.city, project.province].filter(Boolean).join(', ') || 'Location not listed'}
                  </p>
                </div>
                {project.is_primary_gc && (
                  <span className="inline-flex rounded-full border border-yellow-400/40 bg-yellow-400/10 px-3 py-1 text-xs font-semibold text-yellow-300">
                    Primary General Contractor
                  </span>
                )}
              </div>
              <ProjectImageManager
                projectId={project.project_id}
                projectName={project.project_name}
                companyId={project.company_profile_id}
                userId={user?.id}
                canManage
                initialImages={project._images || []}
                onImagesChanged={(images) => {
                  setProjects((current) => current.map((item) => (
                    item.id === project.id
                      ? {
                          ...item,
                          _images: images,
                          _primaryImage: images.find((image) => image.is_primary) || images[0] || null,
                        }
                      : item
                  )))
                }}
              />
            </section>
          ))}
        </div>
      )}
    </div>
  )
}
