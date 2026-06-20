import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../../hooks/useAuth'
import { getMyApplications } from '../../services/applicationsService'
import GlobalCard, { CardHeader } from '../../components/ui/GlobalCard'
import GlobalButton from '../../components/ui/GlobalButton'
import StatusBadge, { Badge } from '../../components/ui/StatusBadge'
import { PageTitle, PageSubtitle, CardTitle, SmallText, Caption } from '../../components/ui/Typography'
import { getContractorDisplayLocation } from '../../lib/utils'

function formatDate(iso) {
  if (!iso) return ''
  try { return new Date(iso).toLocaleDateString() } catch { return iso }
}

const STATUS_STEPS = [
  { key: 'applied', label: 'Applied' },
  { key: 'reviewed', label: 'Reviewed' },
  { key: 'interview', label: 'Interview' },
  { key: 'hired', label: 'Hired' },
  { key: 'rejected', label: 'Rejected' },
]

function normalizeApplicationStatus(status) {
  const value = String(status || '').toLowerCase()
  if (value === 'submitted' || value === 'applied') return 'applied'
  if (value === 'shortlisted' || value === 'reviewed') return 'reviewed'
  if (value === 'interview') return 'interview'
  if (value === 'hired') return 'hired'
  if (value === 'rejected') return 'rejected'
  return 'applied'
}

function ApplicationTimeline({ application }) {
  const current = normalizeApplicationStatus(application.status)
  const currentIndex = STATUS_STEPS.findIndex((step) => step.key === current)
  const terminalRejected = current === 'rejected'

  return (
    <div className="grid grid-cols-2 gap-2 sm:grid-cols-5">
      {STATUS_STEPS.map((step, index) => {
        const active = step.key === current
        const complete = !terminalRejected && index <= currentIndex
        const rejected = terminalRejected && step.key === 'rejected'
        return (
          <div
            key={step.key}
            className={`rounded-xl border p-3 ${
              active || rejected || complete
                ? 'border-yellow-400/35 bg-yellow-400/10 text-yellow-100'
                : 'border-slate-800 bg-slate-950 text-slate-500'
            }`}
          >
            <p className="text-xs font-bold uppercase tracking-wide">{step.label}</p>
            {step.key === 'applied' && (
              <p className="mt-1 text-xs text-slate-400">{formatDate(application.created_at)}</p>
            )}
            {active && step.key !== 'applied' && (
              <p className="mt-1 text-xs text-slate-400">Current</p>
            )}
          </div>
        )
      })}
    </div>
  )
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
      
      <GlobalCard padding="md">
        <CardHeader
          title="My Applications"
          subtitle="Track every job you have applied to, from submitted to hired."
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
            <Link to="/jobsites" className="mt-4 inline-block">
              <GlobalButton size="sm">Find Jobsites</GlobalButton>
            </Link>
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
                    <div className="mt-2 flex flex-wrap items-center gap-2">
                      <StatusBadge status={a.status} size="sm" />
                      {a.resume_url ? <Badge variant="success">Resume Attached</Badge> : <Badge variant="warning">No Resume</Badge>}
                    </div>
                  </div>
                  <Caption className="text-right">Applied {formatDate(a.created_at)}</Caption>
                </div>

                {/* Job Details Grid */}
                <div className="space-y-2">
                  {companyName && <SmallText>Company: {companyName}</SmallText>}
                  {project.project_name && <SmallText>Project: {project.project_name}</SmallText>}
                  {job.trade && <SmallText>Trade: {job.trade}</SmallText>}
                  {projectLocation && <SmallText className="text-slate-500">{projectLocation}</SmallText>}
                </div>

                <ApplicationTimeline application={a} />

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
