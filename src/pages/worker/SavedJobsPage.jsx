import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../../hooks/useAuth'
import { getSavedJobs, toggleSavedJob } from '../../services/jobsService'
import JobCard from '../../components/jobs/JobCard'
import BackButton from '../../components/ui/BackButton'

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
    return <div className="rounded-3xl border border-slate-800 bg-slate-900 p-6 text-slate-400">Loading...</div>
  }

  if (!user) {
    return (
      <div className="rounded-3xl border border-slate-800 bg-slate-900 p-6">
        <h1 className="text-2xl font-bold">Saved Jobs</h1>
        <p className="mt-2 text-slate-400">Please sign in to view your saved jobs.</p>
        <Link to="/signin" className="mt-6 inline-block rounded-xl bg-yellow-400 px-4 py-2 font-bold text-black">
          Sign in
        </Link>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <BackButton label="← Back" />
      <div className="rounded-3xl border border-slate-800 bg-slate-900 p-6">
        <h1 className="text-2xl font-bold">Saved Jobs</h1>
        <p className="mt-1 text-sm text-slate-400">Roles you bookmarked for later.</p>
      </div>

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
          <div className="rounded-2xl border border-slate-800 bg-slate-900 p-6 text-sm text-slate-400">
            You have no saved jobs yet.
          </div>
        )}

        {items.map((row) => {
          const job = row.job_post
          if (!job) return null
          return (
            <JobCard key={row.id} job={job}>
              <button
                type="button"
                onClick={() => handleRemove(job.id)}
                disabled={busyId === job.id}
                className="rounded-xl border border-slate-700 px-4 py-2 text-sm font-semibold text-slate-200 hover:border-red-500 hover:text-red-300 disabled:opacity-60"
              >
                {busyId === job.id ? 'Removing...' : 'Remove'}
              </button>
            </JobCard>
          )
        })}
      </div>
    </div>
  )
}
