import { normalizeApprenticeshipLevel, normalizeTrade } from '../../lib/trades'
import StatusBadge from '../ui/StatusBadge'

export default function JobCard({ job, children }) {
  if (!job) return null

  const trade = normalizeTrade(job.trade)
  const experienceLevel = normalizeApprenticeshipLevel(job.experience_level)
  const roleTitle = [experienceLevel, trade].filter(Boolean).join(' ') || job.title || 'Job opening'
  const detailMeta = [
    job.schedule,
    job.camp_available,
    job.project_assignment,
    job.start_date ? `Starts ${new Date(job.start_date).toLocaleDateString()}` : '',
    job.duration,
  ]
    .filter(Boolean)
    .join(' | ')
  const hiringTags = Array.isArray(job.hiring_tags) ? job.hiring_tags.filter(Boolean) : []

  const companyName = job.company?.company_name
  const status = job.status || 'open'

  return (
    <div className="rounded-2xl border border-slate-800 bg-slate-950 p-5">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h3 className="text-lg font-semibold text-white">{roleTitle}</h3>
          {companyName && (
            <p className="mt-1 text-sm font-semibold text-yellow-300">{companyName}</p>
          )}
          {job.title && job.title !== roleTitle && (
            <p className="mt-1 text-sm text-slate-400">{job.title}</p>
          )}
          {detailMeta && <p className="mt-1 text-sm text-slate-400">{detailMeta}</p>}
          {hiringTags.length > 0 && (
            <div className="mt-3 flex flex-wrap gap-1.5">
              {hiringTags.map((tag) => (
                <span key={tag} className="rounded-full border border-yellow-400/30 bg-yellow-400/10 px-2.5 py-1 text-xs font-semibold text-yellow-200">
                  {tag}
                </span>
              ))}
            </div>
          )}
        </div>
        <StatusBadge status={status} size="sm" />
      </div>

      {(job.positions_count || job.pay_range || job.employment_type) && (
        <div className="mt-4 flex flex-wrap gap-3 text-sm">
          {job.positions_count && (
            <span className="font-semibold text-slate-100">
              {job.positions_count} Opening{job.positions_count > 1 ? 's' : ''}
            </span>
          )}
          {Number.isFinite(Number(job.applicants_count)) && (
            <span className="font-semibold text-slate-300">
              {Number(job.applicants_count)} Applicant{Number(job.applicants_count) === 1 ? '' : 's'}
            </span>
          )}
          {job.pay_range && (
            <span className="font-bold text-yellow-300">{job.pay_range}</span>
          )}
          {job.employment_type && (
            <span className="text-slate-300">{job.employment_type}</span>
          )}
        </div>
      )}

      {job.required_certifications && (
        <p className="mt-3 whitespace-pre-line text-sm text-slate-300">
          <span className="font-semibold text-slate-100">Tickets: </span>
          {job.required_certifications}
        </p>
      )}

      {job.description && (
        <p className="mt-3 whitespace-pre-line text-sm text-slate-300">
          {job.description}
        </p>
      )}

      {children && <div className="mt-4">{children}</div>}
    </div>
  )
}
