import ProjectStatusBadge from './ProjectStatusBadge'

export default function ProjectDetailHeader({ project }) {
  if (!project) return null
  const location = [project.city, project.province].filter(Boolean).join(', ')
  return (
    <div className="rounded-3xl border border-slate-800 bg-slate-900 p-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <p className="text-sm text-yellow-300">{location || 'Location not listed'}</p>
        <ProjectStatusBadge status={project.project_status_type} />
      </div>
      <h1 className="mt-2 text-3xl font-black text-white sm:text-4xl">
        {project.project_name}
      </h1>
      {project.description && (
        <p className="mt-4 max-w-3xl text-slate-300">{project.description}</p>
      )}
    </div>
  )
}
