import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../../hooks/useAuth'
import { getSavedJobs, toggleSavedJob } from '../../services/jobsService'
import JobCard from '../../components/jobs/JobCard'
import GlobalCard, { CardHeader } from '../../components/ui/GlobalCard'
import GlobalButton from '../../components/ui/GlobalButton'

export default function SavedJobsPage() {
  const { user, loading: authLoading } = useAuth()
  const [items, setItems] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [busyId, setBusyId] = useState(null)

  async function load() {
    if (!user) return
    setLoading(true)
    setError(null)
    try {
      const data = await getSavedJobs(user.id)
      setItems(data)
    } catch (err) {
      setError(err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (authLoading) return
    if (!user) { setLoading(false); return }
    load()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, authLoading])

  async function handleRemove(jobPostId) {
    if (!user) return
    setBusyId(jobPostId)
    try {
      await toggleSavedJob(user.id, jobPostId)
      await load()
    } catch (err) {
      setError(err)
    } finally {
      setBusyId(null)
    }
  }

  if (authLoading) {
    return <GlobalCard padding="lg" className="text-slate-400">Loading...</GlobalCard>
  }

  if (!user) {
    return (
      <GlobalCard padding="lg">
        <CardHeader title="Saved Jobs" subtitle="Please sign in to view your saved jobs." />
        <Link to="/signin" className="mt-6 inline-block">
          <GlobalButton>Sign in</GlobalButton>
        </Link>
      </GlobalCard>
    )
  }

  return (
    <div className="space-y-6">
      <GlobalCard padding="md">
        <CardHeader
          title="Saved Jobs"
          subtitle="Roles you bookmarked for later."
          actions={<Link to="/jobsites"><GlobalButton size="sm" variant="secondary">Find More Jobs</GlobalButton></Link>}
        />
      </GlobalCard>

      <div className="space-y-3">
        {loading && (
          <div className="rounded-2xl border border-slate-800 bg-slate-900 p-4 text-sm text-slate-400">
            Loading saved jobs...
          </div>
        )}
        {error && !loading && (
          <div className="rounded-2xl border border-red-900/60 bg-red-950/40 p-4 text-sm text-red-300">
            {error.message}
          </div>
        )}
        {!loading && !error && items.length === 0 && (
          <GlobalCard padding="lg" className="text-center">
            <p className="text-sm text-slate-400">You have no saved jobs yet.</p>
            <Link to="/jobsites" className="mt-4 inline-block">
              <GlobalButton size="sm">Browse Jobsites</GlobalButton>
            </Link>
          </GlobalCard>
        )}

        {items.map((row) => {
          const job = row.job_post
          if (!job) return null
          return (
            <JobCard key={row.id} job={job}>
              <div className="flex flex-col gap-2 sm:flex-row">
                {job.project_id && (
                  <Link to={`/projects/${job.project_id}`} className="flex-1">
                    <GlobalButton size="sm" className="w-full">View Jobsite</GlobalButton>
                  </Link>
                )}
                <button
                  type="button"
                  onClick={() => handleRemove(job.id)}
                  disabled={busyId === job.id}
                  className="rounded-xl border border-slate-700 px-4 py-2 text-sm font-semibold text-slate-200 hover:border-red-500 hover:text-red-300 disabled:opacity-60"
                >
                  {busyId === job.id ? 'Removing...' : 'Remove'}
                </button>
              </div>
            </JobCard>
          )
        })}
      </div>
    </div>
  )
}
