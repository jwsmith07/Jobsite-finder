import { useEffect, useMemo, useState } from 'react'
import DashboardShell from '../../components/layout/DashboardShell'
import { getAllJobPosts } from '../../services/adminService'
import { formatDate } from '../../lib/utils'

export default function AdminJobPostingsPage() {
  const [jobs, setJobs] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    let mounted = true
    getAllJobPosts()
      .then((rows) => { if (mounted) setJobs(rows) })
      .catch((err) => { if (mounted) setError(err) })
      .finally(() => { if (mounted) setLoading(false) })
    return () => { mounted = false }
  }, [])

  const openCount = useMemo(() => jobs.filter((job) => String(job.status || '').toLowerCase() === 'open').length, [jobs])

  return (
    <DashboardShell title="Job Postings" subtitle="Monitor all job posts across companies and projects.">
      <div className="grid gap-3 sm:grid-cols-2">
        <div className="rounded-2xl border border-slate-800 bg-slate-900 p-4">
          <p className="text-xs uppercase tracking-[0.14em] text-slate-500">Total posts</p>
          <p className="mt-1 text-2xl font-black text-white">{jobs.length}</p>
        </div>
        <div className="rounded-2xl border border-slate-800 bg-slate-900 p-4">
          <p className="text-xs uppercase tracking-[0.14em] text-slate-500">Open posts</p>
          <p className="mt-1 text-2xl font-black text-white">{openCount}</p>
        </div>
      </div>

      {loading && <p className="rounded-3xl border border-slate-800 bg-slate-900 p-6 text-sm text-slate-400">Loading job postings...</p>}
      {error && <p className="rounded-3xl border border-red-900/60 bg-red-950/40 p-6 text-sm text-red-300">{error.message}</p>}
      {!loading && !error && (
        <div className="space-y-3">
          {jobs.map((job) => (
            <article key={job.id} className="rounded-2xl border border-slate-800 bg-slate-900 p-5">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <h2 className="text-lg font-semibold text-white">{job.title || 'Untitled job'}</h2>
                  <p className="mt-1 text-sm text-slate-400">
                    {[job.company?.company_name, job.project?.project_name].filter(Boolean).join(' - ') || 'Company or project not listed'}
                  </p>
                </div>
                <span className="rounded-full border border-slate-700 bg-slate-950 px-3 py-1 text-xs font-bold text-slate-200">
                  {job.status || 'open'}
                </span>
              </div>
              <p className="mt-3 text-xs text-slate-500">
                {job.trade || 'Trade not set'} - Created {formatDate(job.created_at)}
              </p>
            </article>
          ))}
          {jobs.length === 0 && <p className="text-sm text-slate-400">No job postings yet.</p>}
        </div>
      )}
    </DashboardShell>
  )
}
