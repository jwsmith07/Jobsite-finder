import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { BriefcaseBusiness, Camera, ExternalLink, FilePenLine, Plus, ShieldCheck, Users } from 'lucide-react'
import DashboardShell from '../../components/layout/DashboardShell'
import { useAuth } from '../../hooks/useAuth'
import { formatDate } from '../../lib/utils'
import { getGcMyJobsitesPageData } from '../../services/gcJobsitesService'

const badgeBase = 'inline-flex rounded-full border px-2.5 py-1 text-xs font-semibold'

const reviewTone = {
  approved: 'border-emerald-900/60 bg-emerald-950/40 text-emerald-300',
  pending_review: 'border-yellow-900/60 bg-yellow-950/30 text-yellow-200',
  rejected: 'border-red-900/60 bg-red-950/40 text-red-300',
  hidden: 'border-slate-700 bg-slate-950 text-slate-300',
}

const reviewLabel = {
  approved: 'Approved',
  pending_review: 'Pending Review',
  rejected: 'Rejected',
  hidden: 'Hidden',
}

function locationLabel(project) {
  return [project.city, project.province].filter(Boolean).join(', ') || project.province || 'Location not listed'
}

function ReviewBadge({ status }) {
  const key = status || 'pending_review'
  return (
    <span className={`${badgeBase} ${reviewTone[key] || reviewTone.pending_review}`}>
      {reviewLabel[key] || 'Pending Review'}
    </span>
  )
}

function SummaryCard({ label, value }) {
  return (
    <div className="rounded-2xl border border-slate-800 bg-slate-900 p-4">
      <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">{label}</p>
      <p className="mt-2 text-2xl font-black text-white">{value}</p>
    </div>
  )
}

function ProjectActions({ project, canEdit }) {
  return (
    <div className="mt-4 flex flex-wrap gap-2">
      <Link
        to={`/gc/jobsites/${project.project_id}`}
        className="inline-flex items-center gap-2 rounded-xl border border-slate-700 px-3 py-2 text-sm font-semibold text-slate-100 hover:border-yellow-400/50"
      >
        <ExternalLink size={15} aria-hidden="true" />
        View
      </Link>
      <Link
        to="/gc/project-photos"
        className="inline-flex items-center gap-2 rounded-xl border border-slate-700 px-3 py-2 text-sm font-semibold text-slate-100 hover:border-yellow-400/50"
      >
        <Camera size={15} aria-hidden="true" />
        Photos
      </Link>
      <Link
        to="/gc/jobs"
        className="inline-flex items-center gap-2 rounded-xl border border-slate-700 px-3 py-2 text-sm font-semibold text-slate-100 hover:border-yellow-400/50"
      >
        <BriefcaseBusiness size={15} aria-hidden="true" />
        Jobs
      </Link>
      <Link
        to="/gc/subcontractors"
        className="inline-flex items-center gap-2 rounded-xl border border-slate-700 px-3 py-2 text-sm font-semibold text-slate-100 hover:border-yellow-400/50"
      >
        <Users size={15} aria-hidden="true" />
        Subcontractors
      </Link>
      {canEdit && (
        <Link
          to={`/gc/jobsites/${project.project_id}`}
          className="inline-flex items-center gap-2 rounded-xl border border-slate-700 px-3 py-2 text-sm font-semibold text-slate-100 hover:border-yellow-400/50"
        >
          <FilePenLine size={15} aria-hidden="true" />
          Edit
        </Link>
      )}
    </div>
  )
}

function SubmittedJobsiteCard({ project }) {
  const canUseProjectTools = project.review_status === 'approved' && project.isApprovedPrimaryGc
  return (
    <article className="rounded-2xl border border-slate-800 bg-slate-900 p-5">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start">
        {project._primaryImage && (
          <img
            src={project._primaryImage.image_url}
            alt={project._primaryImage.alt_text || `${project.project_name} photo`}
            className="aspect-[16/9] w-full rounded-xl object-cover sm:w-44"
          />
        )}
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <h3 className="text-lg font-bold text-white">{project.project_name}</h3>
              <p className="mt-1 text-sm text-slate-400">{locationLabel(project)}</p>
            </div>
            <ReviewBadge status={project.review_status} />
          </div>
          <div className="mt-3 flex flex-wrap gap-x-4 gap-y-1 text-sm text-slate-400">
            <span>Stage: <span className="text-slate-200">{project.stage || 'Not listed'}</span></span>
            <span>Created: <span className="text-slate-200">{formatDate(project.created_at)}</span></span>
          </div>
          {project.review_status === 'rejected' && project.rejection_reason && (
            <p className="mt-3 rounded-xl border border-red-900/60 bg-red-950/30 p-3 text-sm text-red-200">
              {project.rejection_reason}
            </p>
          )}
          {canUseProjectTools ? (
            <ProjectActions project={project} canEdit />
          ) : (
            <div className="mt-4 flex flex-wrap gap-2">
              <Link
                to={`/gc/jobsites/${project.project_id}`}
                className="inline-flex items-center gap-2 rounded-xl border border-slate-700 px-3 py-2 text-sm font-semibold text-slate-100 hover:border-yellow-400/50"
              >
                <ExternalLink size={15} aria-hidden="true" />
                View
              </Link>
            </div>
          )}
        </div>
      </div>
    </article>
  )
}

function ApprovedJobsiteCard({ project }) {
  return (
    <article className="rounded-2xl border border-slate-800 bg-slate-900 p-5">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start">
        {project._primaryImage && (
          <img
            src={project._primaryImage.image_url}
            alt={project._primaryImage.alt_text || `${project.project_name} photo`}
            className="aspect-[16/9] w-full rounded-xl object-cover sm:w-44"
          />
        )}
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <h3 className="text-lg font-bold text-white">{project.project_name}</h3>
              <p className="mt-1 text-sm text-slate-400">{locationLabel(project)}</p>
            </div>
            <span className={`${badgeBase} border-yellow-400/40 bg-yellow-400/10 text-yellow-300`}>
              Primary GC
            </span>
          </div>
          <div className="mt-3 flex flex-wrap gap-x-4 gap-y-1 text-sm text-slate-400">
            <span>{project.sourceLabel}</span>
            <span>Stage: <span className="text-slate-200">{project.stage || 'Not listed'}</span></span>
            <span>Hiring: <span className="text-slate-200">{project.hiring_status || 'Not listed'}</span></span>
            <span>Open roles: <span className="text-slate-200">{project._openJobCount || 0}</span></span>
          </div>
          <ProjectActions project={project} canEdit />
        </div>
      </div>
    </article>
  )
}

export default function GCMyJobsitesPage() {
  const { user, loading: authLoading } = useAuth()
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    if (authLoading) return
    if (!user?.id) {
      setLoading(false)
      return
    }
    let mounted = true
    setLoading(true)
    setError(null)
    getGcMyJobsitesPageData(user.id)
      .then((next) => { if (mounted) setData(next) })
      .catch((err) => { if (mounted) setError(err) })
      .finally(() => { if (mounted) setLoading(false) })
    return () => { mounted = false }
  }, [user?.id, authLoading])

  const submitted = data?.submittedProjects || []
  const approved = data?.approvedProjects || []
  const hasProjects = submitted.length > 0 || approved.length > 0
  const pending = useMemo(
    () => submitted.filter((project) => project.review_status === 'pending_review'),
    [submitted],
  )

  if (authLoading || loading) {
    return (
      <DashboardShell title="My Jobsites">
        <p className="rounded-2xl border border-slate-800 bg-slate-900 p-4 text-sm text-slate-400">
          Loading jobsites...
        </p>
      </DashboardShell>
    )
  }

  return (
    <DashboardShell
      title="My Jobsites"
      subtitle="Track contractor-created submissions and manage approved Primary GC jobsites."
      actions={
        <Link
          to="/gc/jobsites/create"
          className="inline-flex items-center gap-2 rounded-xl bg-yellow-400 px-4 py-2 text-sm font-bold text-black hover:bg-yellow-300"
        >
          <Plus size={16} aria-hidden="true" />
          Create Jobsite
        </Link>
      }
    >
      {error && (
        <div className="rounded-2xl border border-red-900/60 bg-red-950/40 p-4 text-sm text-red-300">
          {error.message}
        </div>
      )}

      {!error && (
        <>
          <section className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <SummaryCard label="Approved Jobsites" value={data?.summary?.approvedCount || 0} />
            <SummaryCard label="Pending Review" value={data?.summary?.pendingCount || 0} />
            <SummaryCard label="Open Job Postings" value={data?.summary?.openJobCount || 0} />
            <SummaryCard label="Project Photos" value={data?.summary?.photoCount || 0} />
          </section>

          {!hasProjects && (
            <section className="rounded-3xl border border-slate-800 bg-slate-900 p-6">
              <ShieldCheck size={24} className="text-yellow-300" aria-hidden="true" />
              <h2 className="mt-3 text-xl font-bold text-white">No approved jobsites yet.</h2>
              <p className="mt-2 text-sm text-slate-400">
                Create a jobsite or claim an Alberta project to start managing photos, job postings, and subcontractors.
              </p>
              <Link
                to="/gc/jobsites/create"
                className="mt-5 inline-flex items-center gap-2 rounded-xl bg-yellow-400 px-4 py-2 text-sm font-bold text-black hover:bg-yellow-300"
              >
                <Plus size={16} aria-hidden="true" />
                Create Jobsite
              </Link>
            </section>
          )}

          {pending.length > 0 && (
            <section className="rounded-3xl border border-yellow-900/50 bg-yellow-950/20 p-5">
              <h2 className="text-lg font-semibold text-yellow-100">Pending review</h2>
              <p className="mt-1 text-sm text-yellow-200/80">
                These contractor-created jobsites are waiting for admin approval before full management tools unlock.
              </p>
            </section>
          )}

          {submitted.length > 0 && (
            <section className="space-y-3">
              <div>
                <h2 className="text-xl font-bold text-white">Contractor-created jobsites</h2>
                <p className="mt-1 text-sm text-slate-400">Submissions created by your account.</p>
              </div>
              <div className="grid gap-3">
                {submitted.map((project) => (
                  <SubmittedJobsiteCard key={`submitted-${project.project_id}`} project={project} />
                ))}
              </div>
            </section>
          )}

          {approved.length > 0 && (
            <section className="space-y-3">
              <div>
                <h2 className="text-xl font-bold text-white">Approved Primary GC jobsites</h2>
                <p className="mt-1 text-sm text-slate-400">
                  Alberta imported and contractor-created projects where your company is the approved Primary GC.
                </p>
              </div>
              <div className="grid gap-3">
                {approved.map((project) => (
                  <ApprovedJobsiteCard key={`approved-${project.project_id}`} project={project} />
                ))}
              </div>
            </section>
          )}
        </>
      )}
    </DashboardShell>
  )
}
