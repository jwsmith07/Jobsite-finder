import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { BriefcaseBusiness, ClipboardList, Map, Star } from 'lucide-react'
import { useAuth } from '../../hooks/useAuth'
import { getMyApplications } from '../../services/applicationsService'
import { getRecentOpenJobs, getSavedJobs } from '../../services/jobsService'
import JobCard from '../../components/jobs/JobCard'
import SaveJobButton from '../../components/jobs/SaveJobButton'
import GlobalCard, { CardHeader } from '../../components/ui/GlobalCard'
import GlobalButton from '../../components/ui/GlobalButton'
import StatusBadge from '../../components/ui/StatusBadge'

function MiniStat({ icon: Icon, label, value }) {
  return (
    <div className="rounded-2xl border border-slate-800 bg-slate-950 p-4">
      <div className="flex items-center gap-3">
        <span className="flex h-10 w-10 items-center justify-center rounded-xl border border-yellow-400/25 bg-yellow-400/10 text-yellow-300">
          <Icon size={18} aria-hidden="true" />
        </span>
        <div>
          <p className="text-2xl font-black text-white">{value}</p>
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">{label}</p>
        </div>
      </div>
    </div>
  )
}

export default function WorkerDashboardPage() {
  const { user, loading: authLoading } = useAuth()
  const [recentJobs, setRecentJobs] = useState([])
  const [savedJobs, setSavedJobs] = useState([])
  const [applications, setApplications] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    if (authLoading) return
    if (!user) {
      setLoading(false)
      return
    }
    let mounted = true
    setLoading(true)
    setError(null)
    Promise.all([
      getRecentOpenJobs(4),
      getSavedJobs(user.id).catch(() => []),
      getMyApplications(user.id).catch(() => []),
    ])
      .then(([jobs, saved, apps]) => {
        if (!mounted) return
        setRecentJobs(jobs)
        setSavedJobs(saved)
        setApplications(apps)
      })
      .catch((err) => {
        if (mounted) setError(err)
      })
      .finally(() => {
        if (mounted) setLoading(false)
      })
    return () => {
      mounted = false
    }
  }, [user, authLoading])

  if (authLoading) {
    return <GlobalCard padding="lg" className="text-center text-slate-400">Loading...</GlobalCard>
  }

  if (!user) {
    return (
      <GlobalCard padding="lg">
        <CardHeader title="Worker Home" subtitle="Sign in to track applications, saved jobs, and live jobsites." />
        <Link to="/signin" className="mt-6 inline-block">
          <GlobalButton>Sign in</GlobalButton>
        </Link>
      </GlobalCard>
    )
  }

  const activeApplications = applications.filter((app) => !['hired', 'rejected'].includes(String(app.status || '').toLowerCase()))
  const savedJobPosts = savedJobs.map((row) => row.job_post).filter(Boolean)

  return (
    <div className="space-y-5 sm:space-y-6">
      <GlobalCard padding="md">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <CardHeader
            title="Worker Home"
            subtitle="Start from the map, then keep tabs on saved jobs and applications."
          />
          <Link to="/jobsites">
            <GlobalButton className="w-full sm:w-auto">Open Jobsites Map</GlobalButton>
          </Link>
        </div>
      </GlobalCard>

      <div className="grid gap-3 sm:grid-cols-3">
        <MiniStat icon={BriefcaseBusiness} label="Recent Jobs" value={recentJobs.length} />
        <MiniStat icon={Star} label="Saved Jobs" value={savedJobs.length} />
        <MiniStat icon={ClipboardList} label="Active Applications" value={activeApplications.length} />
      </div>

      {error && (
        <GlobalCard padding="md" className="border-red-500/40 bg-red-500/10 text-red-300">
          {error.message}
        </GlobalCard>
      )}

      <section className="grid gap-5 lg:grid-cols-[minmax(0,1.4fr)_minmax(320px,0.8fr)]">
        <div className="space-y-3">
          <div className="flex items-center justify-between gap-3">
            <h2 className="text-lg font-bold text-white">Recent Jobs</h2>
            <Link to="/jobsites" className="text-sm font-semibold text-yellow-300 hover:text-yellow-200">View Map</Link>
          </div>
          {loading && <GlobalCard padding="md" className="text-slate-400">Loading recent jobs...</GlobalCard>}
          {!loading && recentJobs.length === 0 && (
            <GlobalCard padding="md" className="text-slate-400">No open jobs available yet.</GlobalCard>
          )}
          {recentJobs.map((job) => (
            <JobCard key={job.id} job={job}>
              <div className="flex flex-col gap-2 sm:flex-row">
                {job.project_id && (
                  <Link to={`/projects/${job.project_id}`} className="flex-1">
                    <GlobalButton size="sm" className="w-full">View Jobsite</GlobalButton>
                  </Link>
                )}
                <SaveJobButton jobPostId={job.id} />
              </div>
            </JobCard>
          ))}
        </div>

        <aside className="space-y-4">
          <GlobalCard padding="md">
            <CardHeader
              title="Saved Jobs"
              subtitle={savedJobPosts.length ? 'Your latest bookmarks.' : 'Save jobs from project pages to revisit them.'}
              actions={<Link to="/saved-jobs"><GlobalButton size="sm" variant="secondary">Open</GlobalButton></Link>}
            />
            <div className="mt-3 space-y-2">
              {savedJobPosts.slice(0, 3).map((job) => (
                <Link key={job.id} to={`/projects/${job.project_id}`} className="block rounded-xl border border-slate-800 bg-slate-950 p-3 hover:border-yellow-400/40">
                  <p className="font-semibold text-white">{job.title || job.trade || 'Job opening'}</p>
                  <p className="text-sm text-slate-400">{job.trade || 'Trade not listed'}</p>
                </Link>
              ))}
              {!loading && savedJobPosts.length === 0 && <p className="text-sm text-slate-400">No saved jobs yet.</p>}
            </div>
          </GlobalCard>

          <GlobalCard padding="md">
            <CardHeader
              title="Applications"
              subtitle="Current hiring status."
              actions={<Link to="/applications"><GlobalButton size="sm" variant="secondary">Open</GlobalButton></Link>}
            />
            <div className="mt-3 space-y-2">
              {applications.slice(0, 4).map((app) => (
                <Link key={app.id} to="/applications" className="block rounded-xl border border-slate-800 bg-slate-950 p-3 hover:border-yellow-400/40">
                  <div className="flex items-start justify-between gap-2">
                    <p className="font-semibold text-white">{app.job_post?.title || 'Job application'}</p>
                    <StatusBadge status={app.status} size="sm" />
                  </div>
                  <p className="mt-1 text-sm text-slate-400">{app.job_post?.project?.project_name || 'Project not listed'}</p>
                </Link>
              ))}
              {!loading && applications.length === 0 && <p className="text-sm text-slate-400">No applications yet.</p>}
            </div>
          </GlobalCard>

          <Link to="/jobsites" className="flex items-center justify-center gap-2 rounded-2xl border border-yellow-400/30 bg-yellow-400/10 p-4 text-sm font-bold text-yellow-200 hover:bg-yellow-400/20">
            <Map size={17} aria-hidden="true" />
            Explore recommended projects
          </Link>
        </aside>
      </section>
    </div>
  )
}
