import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../../hooks/useAuth'
import { getMyApplications } from '../../services/applicationsService'
import BackButton from '../../components/ui/BackButton'
import GlobalCard, { CardHeader, CardContent } from '../../components/ui/GlobalCard'
import GlobalButton from '../../components/ui/GlobalButton'
import StatusBadge from '../../components/ui/StatusBadge'
import { PageTitle, PageSubtitle, CardTitle, SmallText, Caption } from '../../components/ui/Typography'
import { getContractorDisplayLocation } from '../../lib/utils'

function formatDate(iso) {
  if (!iso) return ''
  try { return new Date(iso).toLocaleDateString() } catch { return iso }
}

export default function ApplicationsPage() {
  const { user, loading: authLoading } = useAuth()
  const [apps, setApps] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [filter, setFilter] = useState('active') // active, submitted, closed

  useEffect(() => {
    if (authLoading) return
    if (!user) { setLoading(false); return }
    let mounted = true
    setLoading(true)
    setError(null)
    getMyApplications(user.id)
      .then((data) => { if (mounted) setApps(data) })
      .catch((err) => { if (mounted) setError(err) })
      .finally(() => { if (mounted) setLoading(false) })
    return () => { mounted = false }
  }, [user, authLoading])

  const filteredApps = apps.filter((a) => {
    const status = a.status?.toLowerCase()
    if (filter === 'active') return status === 'submitted' || status === 'applied' || status === 'shortlisted' || status === 'interview'
    if (filter === 'submitted') return status === 'submitted'
    if (filter === 'closed') return status === 'hired' || status === 'rejected'
    return true
  })

  if (authLoading) {
    return (
      <GlobalCard padding="lg" className="text-center">
        <p className="text-slate-400">Loading...</p>
      </GlobalCard>
    )
  }

  if (!user) {
    return (
      <GlobalCard padding="lg">
        <PageTitle>Applications</PageTitle>
        <PageSubtitle>Please sign in to view your applications.</PageSubtitle>
        <div className="mt-6">
          <Link to="/signin">
            <GlobalButton>Sign in</GlobalButton>
          </Link>
        </div>
      </GlobalCard>
    )
  }

  return (
    <div className="space-y-4 sm:space-y-6">
      <BackButton label="← Back" />
      
      <GlobalCard padding="md">
        <CardHeader
          title="Applications"
          subtitle="Jobs you have applied to."
        />
      </GlobalCard>

      {/* Filters */}
      <div className="flex flex-wrap gap-2">
        {[
          { key: 'active', label: 'Active' },
          { key: 'submitted', label: 'Submitted' },
          { key: 'closed', label: 'Closed' },
        ].map((f) => (
          <GlobalButton
            key={f.key}
            variant={filter === f.key ? 'primary' : 'secondary'}
            size="sm"
            onClick={() => setFilter(f.key)}
          >
            {f.label}
          </GlobalButton>
        ))}
      </div>

      <div className="space-y-3">
        {loading && (
          <GlobalCard padding="md" className="text-center">
            <p className="text-slate-400">Loading applications...</p>
          </GlobalCard>
        )}
        {error && !loading && (
          <GlobalCard padding="md" className="border-red-500/40 bg-red-500/10">
            <p className="text-red-300">{error.message}</p>
          </GlobalCard>
        )}
        {!loading && !error && filteredApps.length === 0 && (
          <GlobalCard padding="md" className="text-center">
            <p className="text-slate-400">No {filter} applications.</p>
          </GlobalCard>
        )}

        {filteredApps.map((a) => {
          const job = a.job_post || {}
          const companyName = job.company?.company_name
          const project = job.project || {}
          const projectLocation = getContractorDisplayLocation(project)
          const positionLabel = job.positions_count
            ? `${job.positions_count} Position${job.positions_count > 1 ? 's' : ''}`
            : null

          return (
            <GlobalCard key={a.id} padding="md">
              <div className="space-y-3">
                <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                  <div className="min-w-0 flex-1">
                    <CardTitle>{job.title || 'Job post'}</CardTitle>
                    <div className="mt-1">
                      <StatusBadge status={a.status} size="sm" />
                    </div>
                  </div>
                  <Caption className="text-right">Applied {formatDate(a.created_at)}</Caption>
                </div>

                {/* Job Details Grid */}
                <div className="space-y-2">
                  {companyName && <SmallText>Company: {companyName}</SmallText>}
                  {project.project_name && <SmallText>Project: {project.project_name}</SmallText>}
                  {projectLocation && <SmallText className="text-slate-500">{projectLocation}</SmallText>}
                </div>

                {/* Job Info Cards */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {job.pay_range && (
                    <div className="rounded-lg border border-slate-700 bg-slate-950 p-2">
                      <Caption>Pay range</Caption>
                      <p className="text-sm text-amber-300">{job.pay_range}</p>
                    </div>
                  )}
                  {job.schedule && (
                    <div className="rounded-lg border border-slate-700 bg-slate-950 p-2">
                      <Caption>Schedule</Caption>
                      <p className="text-sm text-slate-300">{job.schedule}</p>
                    </div>
                  )}
                  {positionLabel && (
                    <div className="rounded-lg border border-slate-700 bg-slate-950 p-2">
                      <Caption>Positions</Caption>
                      <p className="text-sm text-slate-300">{positionLabel}</p>
                    </div>
                  )}
                </div>

                {a.message && (
                  <p className="text-sm text-slate-300 whitespace-pre-line border-t border-slate-800 pt-3 mt-3">
                    {a.message}
                  </p>
                )}

                {/* Actions */}
                <div className="flex flex-col gap-2 sm:flex-row pt-3 border-t border-slate-800">
                  {project.id && (
                    <Link to={`/projects/${project.id}`} className="flex-1">
                      <GlobalButton size="sm" variant="primary" className="w-full">
                        View Project
                      </GlobalButton>
                    </Link>
                  )}
                  {a.resume_url && (
                    <a
                      href={a.resume_url}
                      target="_blank"
                      rel="noreferrer"
                      className="flex-1"
                    >
                      <GlobalButton size="sm" variant="secondary" className="w-full">
                        Resume Used
                      </GlobalButton>
                    </a>
                  )}
                </div>
              </div>
            </GlobalCard>
          )
        })}
      </div>
    </div>
  )
}
