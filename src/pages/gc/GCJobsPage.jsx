import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../../hooks/useAuth'
import {
  createJobPost,
  deleteJobPost,
  getMyCompanyJobs,
  getApprovedProjectsForUser,
  JOB_STATUSES,
  normalizeJobStatus,
  updateJobPost,
} from '../../services/jobsService'
import JobCard from '../../components/jobs/JobCard'
import {
  HIRING_TAGS,
  apprenticeshipSelectValue,
  normalizeApprenticeshipLevel,
  normalizeTrade,
  renderApprenticeshipLevelOptions,
  renderTradeOptions,
  tradeSelectValue,
} from '../../lib/trades'

const EMPTY = {
  project_id: '',
  title: '',
  trade: '',
  employment_type: '',
  schedule: '',
  pay_range: '',
  camp_available: '',
  project_assignment: '',
  start_date: '',
  duration: '',
  required_certifications: '',
  hiring_tags: [],
  description: '',
  requirements: '',
  status: 'open',
  expires_at: '',
  positions_count: 1,
  experience_level: '',
}

const inputCls =
  'w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 text-white outline-none focus:border-yellow-400'
const labelCls = 'block text-xs uppercase tracking-wider text-slate-500 mb-1'

const STATUS_LABELS = {
  open: 'Open',
  filled: 'Filled',
  paused: 'Paused',
  closed: 'Closed',
  archived: 'Archived',
}

const QUICK_ACTIONS = [
  { status: 'filled', label: 'Mark Filled' },
  { status: 'paused', label: 'Pause hiring' },
  { status: 'open', label: 'Reopen job' },
  { status: 'archived', label: 'Archive job' },
]

export function JobsManager({ roleLabel = 'General Contractor' }) {
  const { user, loading: authLoading } = useAuth()
  const [jobs, setJobs] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [creating, setCreating] = useState(false)
  const [form, setForm] = useState(EMPTY)
  const [message, setMessage] = useState(null)
  const [editing, setEditing] = useState({})
  const [projects, setProjects] = useState([])
  const [busyJobId, setBusyJobId] = useState(null)
  const [deleteTarget, setDeleteTarget] = useState(null)

  async function load() {
    if (!user) return
    setLoading(true)
    setError(null)
    try {
      const [jobsData, projectsData] = await Promise.all([
        getMyCompanyJobs(user.id),
        getApprovedProjectsForUser(user.id).catch((err) => {
          console.error('[GCJobsPage] Error loading approved projects:', err.message)
          return []
        }),
      ])
      setJobs(jobsData)
      setProjects(projectsData)
    } catch (err) {
      console.error('[GCJobsPage] Load error:', err.message)
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

  function set(field, val) {
    setForm((f) => ({ ...f, [field]: val }))
  }

  function toggleFormTag(tag) {
    setForm((f) => ({
      ...f,
      hiring_tags: f.hiring_tags?.includes(tag)
        ? f.hiring_tags.filter((item) => item !== tag)
        : [...(f.hiring_tags || []), tag],
    }))
  }

  async function handleCreate(e) {
    e.preventDefault()
    if (!user) return
    setCreating(true)
    setMessage(null)
    try {
      await createJobPost(user.id, form)
      setMessage({ type: 'success', text: 'Job posted.' })
      setForm(EMPTY)
      await load()
    } catch (err) {
      console.error('[GCJobsPage] Create error:', err.message)
      setMessage({ type: 'error', text: err.message })
    } finally {
      setCreating(false)
    }
  }

  function startEdit(job) {
    setEditing((e) => ({
      ...e,
      [job.id]: {
        title: job.title || '',
        trade: normalizeTrade(job.trade || ''),
        employment_type: job.employment_type || '',
        schedule: job.schedule || '',
        pay_range: job.pay_range || '',
        camp_available: job.camp_available || '',
        project_assignment: job.project_assignment || '',
        start_date: job.start_date ? job.start_date.slice(0, 10) : '',
        duration: job.duration || '',
        required_certifications: job.required_certifications || '',
        hiring_tags: Array.isArray(job.hiring_tags) ? job.hiring_tags : [],
        description: job.description || '',
        requirements: job.requirements || '',
        status: normalizeJobStatus(job.status),
        positions_count: job.positions_count || 1,
        experience_level: normalizeApprenticeshipLevel(job.experience_level || ''),
        expires_at: job.expires_at ? job.expires_at.slice(0, 10) : '',
        saving: false,
        message: null,
      },
    }))
  }

  function setEditField(jobId, field, val) {
    setEditing((e) => ({ ...e, [jobId]: { ...e[jobId], [field]: val } }))
  }

  function toggleEditTag(jobId, tag) {
    setEditing((e) => {
      const current = e[jobId] || {}
      const tags = current.hiring_tags || []
      return {
        ...e,
        [jobId]: {
          ...current,
          hiring_tags: tags.includes(tag)
            ? tags.filter((item) => item !== tag)
            : [...tags, tag],
        },
      }
    })
  }

  function cancelEdit(jobId) {
    setEditing((e) => {
      const next = { ...e }
      delete next[jobId]
      return next
    })
  }

  async function saveEdit(jobId) {
    const cur = editing[jobId]
    if (!cur || !user) return
    setEditing((e) => ({ ...e, [jobId]: { ...cur, saving: true, message: null } }))
    try {
      await updateJobPost(jobId, user.id, {
        title: cur.title,
        trade: normalizeTrade(cur.trade),
        employment_type: cur.employment_type,
        schedule: cur.schedule,
        pay_range: cur.pay_range,
        camp_available: cur.camp_available,
        project_assignment: cur.project_assignment,
        start_date: cur.start_date || null,
        duration: cur.duration,
        required_certifications: cur.required_certifications,
        hiring_tags: cur.hiring_tags,
        description: cur.description,
        requirements: cur.requirements,
        status: cur.status,
        positions_count: cur.positions_count,
        experience_level: normalizeApprenticeshipLevel(cur.experience_level),
        expires_at: cur.expires_at || null,
      })
      await load()
      cancelEdit(jobId)
    } catch (err) {
      setEditing((e) => ({
        ...e,
        [jobId]: { ...cur, saving: false, message: { type: 'error', text: err.message } },
      }))
    }
  }

  async function setJobStatus(job, status) {
    if (!user || !job?.id) return
    setBusyJobId(job.id)
    setMessage(null)
    try {
      await updateJobPost(job.id, user.id, { status })
      await load()
      setMessage({ type: 'success', text: `Job marked ${STATUS_LABELS[status] || status}.` })
    } catch (err) {
      setMessage({ type: 'error', text: err.message })
    } finally {
      setBusyJobId(null)
    }
  }

  async function confirmDeleteJob() {
    if (!user || !deleteTarget?.id) return
    setBusyJobId(deleteTarget.id)
    setMessage(null)
    try {
      const result = await deleteJobPost(deleteTarget.id, user.id)
      await load()
      setDeleteTarget(null)
      setMessage({
        type: 'success',
        text: result.mode === 'archived'
          ? 'Job archived to preserve hiring history and applications.'
          : 'Job permanently deleted.',
      })
    } catch (err) {
      setMessage({ type: 'error', text: err.message })
    } finally {
      setBusyJobId(null)
    }
  }

  if (authLoading) {
    return <div className="rounded-3xl border border-slate-800 bg-slate-900 p-6 text-slate-400">Loading...</div>
  }

  if (!user) {
    return (
      <div className="rounded-3xl border border-slate-800 bg-slate-900 p-6">
        <h1 className="text-2xl font-bold">{roleLabel} Jobs</h1>
        <p className="mt-2 text-slate-400">Please sign in to manage your job posts.</p>
        <Link to="/signin" className="mt-6 inline-block rounded-xl bg-yellow-400 px-4 py-2 font-bold text-black">
          Sign in
        </Link>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="rounded-3xl border border-slate-800 bg-slate-900 p-6">
        <h1 className="text-2xl font-bold">{roleLabel} Jobs</h1>
        <p className="mt-1 text-sm text-slate-400">
          Post trade roles tied to your approved projects.
        </p>
      </div>

      <div className="rounded-3xl border border-slate-800 bg-slate-900 p-6">
        <h2 className="text-lg font-semibold">Post a new job</h2>
        <form onSubmit={handleCreate} className="mt-4 space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="sm:col-span-2">
              <label className={labelCls}>Project</label>
              <select
                className={inputCls}
                value={form.project_id}
                onChange={(e) => set('project_id', e.target.value)}
                required
              >
                <option value="">Select a project...</option>
                {projects.map((p) => (
                  <option key={p.id} value={p.project_id}>
                    {p.project_name}
                  </option>
                ))}
              </select>
              {projects.length === 0 && (
                <p className="mt-1 text-xs text-slate-500">
                  No approved projects yet. Claim a project from the map first; once an admin approves it, you can post jobs here.
                </p>
              )}
            </div>
            <div>
              <label className={labelCls}>Primary Trade</label>
              <select className={inputCls} value={tradeSelectValue(form.trade)} onChange={(e) => set('trade', e.target.value)} required>
                {renderTradeOptions({ placeholder: form.trade ? `Legacy: ${normalizeTrade(form.trade)}` : 'Select primary trade' })}
              </select>
            </div>
            <div>
              <label className={labelCls}>Experience Level</label>
              <select className={inputCls} value={apprenticeshipSelectValue(form.experience_level)} onChange={(e) => set('experience_level', e.target.value)} required>
                {renderApprenticeshipLevelOptions({ includeAny: false })}
              </select>
            </div>
            <div>
              <label className={labelCls}>Job Title</label>
              <input className={inputCls} value={form.title} onChange={(e) => set('title', e.target.value)} placeholder="Plumber, Welder, Lead Hand..." required />
            </div>
            <div>
              <label className={labelCls}>Number of Openings</label>
              <input type="number" className={inputCls} value={form.positions_count} onChange={(e) => set('positions_count', Number(e.target.value))} min="1" required />
            </div>
          </div>

          <div>
            <label className={labelCls}>Description</label>
            <textarea rows={4} className={inputCls} value={form.description} onChange={(e) => set('description', e.target.value)} placeholder="What work needs to be done?" />
          </div>

          <details className="rounded-2xl border border-slate-800 bg-slate-950 p-4">
            <summary className="cursor-pointer text-sm font-bold text-white">More Details</summary>
            <div className="mt-5 grid gap-4 sm:grid-cols-2">
              <div>
              <label className={labelCls}>Shift / Rotation</label>
              <input className={inputCls} value={form.schedule} onChange={(e) => set('schedule', e.target.value)} placeholder="Days, Nights, 4x10..." />
            </div>
            <div>
              <label className={labelCls}>Wage / Rate</label>
              <input className={inputCls} value={form.pay_range} onChange={(e) => set('pay_range', e.target.value)} placeholder="$40-$55/hr" />
            </div>
            <div>
              <label className={labelCls}>Camp Availability</label>
              <select className={inputCls} value={form.camp_available} onChange={(e) => set('camp_available', e.target.value)}>
                <option value="">Not specified</option>
                <option value="Camp available">Camp available</option>
                <option value="No camp">No camp</option>
                <option value="LOA available">LOA available</option>
              </select>
            </div>
            <div>
              <label className={labelCls}>Project Assignment</label>
              <input className={inputCls} value={form.project_assignment} onChange={(e) => set('project_assignment', e.target.value)} placeholder="Site, area, crew, package..." />
            </div>
            <div>
              <label className={labelCls}>Start Date</label>
              <input type="date" className={inputCls} value={form.start_date} onChange={(e) => set('start_date', e.target.value)} />
            </div>
            <div>
              <label className={labelCls}>Duration</label>
              <input className={inputCls} value={form.duration} onChange={(e) => set('duration', e.target.value)} placeholder="2 weeks, 6 months, ongoing..." />
            </div>
            <div>
              <label className={labelCls}>Employment type</label>
              <input className={inputCls} value={form.employment_type} onChange={(e) => set('employment_type', e.target.value)} placeholder="Full-time, Contract..." />
            </div>
            <div>
              <label className={labelCls}>Status</label>
              <select className={inputCls} value={form.status} onChange={(e) => set('status', e.target.value)}>
                {JOB_STATUSES.map((status) => (
                  <option key={status} value={status}>{STATUS_LABELS[status]}</option>
                ))}
              </select>
            </div>
            <div>
              <label className={labelCls}>Expires at</label>
              <input type="date" className={inputCls} value={form.expires_at} onChange={(e) => set('expires_at', e.target.value)} />
            </div>
            </div>

          <div className="mt-5">
            <label className={labelCls}>Hiring Tags</label>
            <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
              {HIRING_TAGS.map((tag) => (
                <label key={tag} className="flex items-center gap-2 rounded-xl border border-slate-800 bg-slate-950 px-3 py-2 text-sm text-slate-200">
                  <input
                    type="checkbox"
                    checked={form.hiring_tags.includes(tag)}
                    onChange={() => toggleFormTag(tag)}
                    className="h-4 w-4 rounded border-slate-700 bg-slate-900 accent-yellow-400"
                  />
                  {tag}
                </label>
              ))}
            </div>
          </div>

          <div className="mt-5">
            <label className={labelCls}>Required Tickets / Certifications</label>
            <textarea rows={2} className={inputCls} value={form.required_certifications} onChange={(e) => set('required_certifications', e.target.value)} placeholder="CSTS, WHMIS, Fall Pro, H2S..." />
          </div>
          <div className="mt-5">
            <label className={labelCls}>Other Requirements</label>
            <textarea rows={2} className={inputCls} value={form.requirements} onChange={(e) => set('requirements', e.target.value)} />
          </div>
          </details>

          <button
            type="submit"
            disabled={creating}
            className="rounded-xl bg-yellow-400 px-6 py-3 font-bold text-black hover:bg-yellow-300 disabled:opacity-60"
          >
            {creating ? 'Posting...' : 'Post job'}
          </button>
          {message && (
            <p className={`text-sm ${message.type === 'error' ? 'text-red-300' : 'text-emerald-300'}`}>
              {message.text}
            </p>
          )}
        </form>
      </div>

      <div className="space-y-3">
        <h2 className="text-lg font-semibold">Your job posts</h2>
        {message && (
          <p className={`rounded-2xl border p-3 text-sm ${
            message.type === 'error'
              ? 'border-red-900/60 bg-red-950/40 text-red-300'
              : 'border-emerald-900/60 bg-emerald-950/40 text-emerald-300'
          }`}>
            {message.text}
          </p>
        )}

        {loading && (
          <div className="rounded-2xl border border-slate-800 bg-slate-900 p-4 text-sm text-slate-400">
            Loading jobs...
          </div>
        )}
        {error && !loading && (
          <div className="rounded-2xl border border-red-900/60 bg-red-950/40 p-4 text-sm text-red-300">
            {error.message}
          </div>
        )}
        {!loading && !error && jobs.length === 0 && (
          <div className="rounded-2xl border border-slate-800 bg-slate-900 p-6">
            <h3 className="text-lg font-bold text-white">No jobs posted yet</h3>
            <p className="mt-2 text-sm text-slate-400">
              Post your first trade role once you have an approved claimed project. Workers will see it on the project page.
            </p>
            {projects.length === 0 ? (
              <Link to="/jobsites" className="mt-4 inline-flex rounded-xl bg-yellow-400 px-4 py-2 text-sm font-bold text-black hover:bg-yellow-300">
                Find a project to claim
              </Link>
            ) : null}
          </div>
        )}

        {jobs.map((job) => {
          const ed = editing[job.id]
          const status = normalizeJobStatus(job.status)
          const visibleActions = QUICK_ACTIONS.filter((action) => action.status !== status)
          return (
            <JobCard key={job.id} job={job}>
              {!ed ? (
                <div className="flex flex-wrap items-center gap-2">
                  <button
                    type="button"
                    onClick={() => startEdit(job)}
                    className="rounded-xl border border-slate-700 px-4 py-2 text-sm font-semibold text-slate-200 hover:border-yellow-400/50"
                  >
                    Edit
                  </button>
                  {visibleActions.map((action) => (
                    <button
                      key={action.status}
                      type="button"
                      onClick={() => setJobStatus(job, action.status)}
                      disabled={busyJobId === job.id}
                      className="rounded-xl border border-slate-700 px-4 py-2 text-sm font-semibold text-slate-200 hover:border-yellow-400/50 disabled:opacity-60"
                    >
                      {action.label}
                    </button>
                  ))}
                  <button
                    type="button"
                    onClick={() => setDeleteTarget(job)}
                    disabled={busyJobId === job.id}
                    className="rounded-xl border border-red-900/70 px-4 py-2 text-sm font-semibold text-red-300 hover:border-red-500 disabled:opacity-60"
                  >
                    Delete
                  </button>
                </div>
              ) : (
                <div className="space-y-3 rounded-xl border border-slate-800 bg-slate-950 p-4">
                  <div className="grid gap-3 sm:grid-cols-2">
                    <div>
                      <label className={labelCls}>Job Title</label>
                      <input
                        className={inputCls}
                        value={ed.title}
                        onChange={(e) => setEditField(job.id, 'title', e.target.value)}
                      />
                    </div>
                    <div>
                      <label className={labelCls}>Primary Trade</label>
                      <select
                        className={inputCls}
                        value={tradeSelectValue(ed.trade)}
                        onChange={(e) => setEditField(job.id, 'trade', e.target.value)}
                      >
                        {renderTradeOptions({ placeholder: ed.trade ? `Legacy: ${normalizeTrade(ed.trade)}` : 'Select trade' })}
                      </select>
                    </div>
                    <div>
                      <label className={labelCls}>Experience Level</label>
                      <select
                        className={inputCls}
                        value={apprenticeshipSelectValue(ed.experience_level)}
                        onChange={(e) => setEditField(job.id, 'experience_level', e.target.value)}
                      >
                        {renderApprenticeshipLevelOptions({ includeAny: false })}
                      </select>
                    </div>
                    <div>
                      <label className={labelCls}>Employment Type</label>
                      <input
                        className={inputCls}
                        value={ed.employment_type}
                        onChange={(e) => setEditField(job.id, 'employment_type', e.target.value)}
                        placeholder="Full-time, Contract..."
                      />
                    </div>
                    <div>
                      <label className={labelCls}>Shift / Rotation</label>
                      <input
                        className={inputCls}
                        value={ed.schedule}
                        onChange={(e) => setEditField(job.id, 'schedule', e.target.value)}
                        placeholder="Days, Nights, 4x10..."
                      />
                    </div>
                    <div>
                      <label className={labelCls}>Wage / Rate</label>
                      <input
                        className={inputCls}
                        value={ed.pay_range}
                        onChange={(e) => setEditField(job.id, 'pay_range', e.target.value)}
                        placeholder="$40-$55/hr"
                      />
                    </div>
                    <div>
                      <label className={labelCls}>Number of Openings</label>
                      <input
                        type="number"
                        className={inputCls}
                        value={ed.positions_count}
                        onChange={(e) => setEditField(job.id, 'positions_count', Number(e.target.value))}
                        min="1"
                      />
                    </div>
                    <div>
                      <label className={labelCls}>Camp Availability</label>
                      <select
                        className={inputCls}
                        value={ed.camp_available}
                        onChange={(e) => setEditField(job.id, 'camp_available', e.target.value)}
                      >
                        <option value="">Not specified</option>
                        <option value="Camp available">Camp available</option>
                        <option value="No camp">No camp</option>
                        <option value="LOA available">LOA available</option>
                      </select>
                    </div>
                    <div>
                      <label className={labelCls}>Project Assignment</label>
                      <input
                        className={inputCls}
                        value={ed.project_assignment}
                        onChange={(e) => setEditField(job.id, 'project_assignment', e.target.value)}
                        placeholder="Site, area, crew, package..."
                      />
                    </div>
                    <div>
                      <label className={labelCls}>Start Date</label>
                      <input
                        type="date"
                        className={inputCls}
                        value={ed.start_date}
                        onChange={(e) => setEditField(job.id, 'start_date', e.target.value)}
                      />
                    </div>
                    <div>
                      <label className={labelCls}>Duration</label>
                      <input
                        className={inputCls}
                        value={ed.duration}
                        onChange={(e) => setEditField(job.id, 'duration', e.target.value)}
                        placeholder="2 weeks, 6 months, ongoing..."
                      />
                    </div>
                    <div>
                      <label className={labelCls}>Status</label>
                      <select
                        className={inputCls}
                        value={ed.status}
                        onChange={(e) => setEditField(job.id, 'status', e.target.value)}
                      >
                        {JOB_STATUSES.map((statusOption) => (
                          <option key={statusOption} value={statusOption}>{STATUS_LABELS[statusOption]}</option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className={labelCls}>Expires At</label>
                      <input
                        type="date"
                        className={inputCls}
                        value={ed.expires_at}
                        onChange={(e) => setEditField(job.id, 'expires_at', e.target.value)}
                      />
                    </div>
                  </div>
                  <div>
                    <label className={labelCls}>Hiring Tags</label>
                    <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
                      {HIRING_TAGS.map((tag) => (
                        <label key={tag} className="flex items-center gap-2 rounded-xl border border-slate-800 bg-slate-950 px-3 py-2 text-sm text-slate-200">
                          <input
                            type="checkbox"
                            checked={(ed.hiring_tags || []).includes(tag)}
                            onChange={() => toggleEditTag(job.id, tag)}
                            className="h-4 w-4 rounded border-slate-700 bg-slate-900 accent-yellow-400"
                          />
                          {tag}
                        </label>
                      ))}
                    </div>
                  </div>
                  <div>
                    <label className={labelCls}>Description</label>
                    <textarea
                      rows={3}
                      className={inputCls}
                      value={ed.description}
                      onChange={(e) => setEditField(job.id, 'description', e.target.value)}
                    />
                  </div>
                  <div>
                    <label className={labelCls}>Required Tickets / Certifications</label>
                    <textarea
                      rows={2}
                      className={inputCls}
                      value={ed.required_certifications}
                      onChange={(e) => setEditField(job.id, 'required_certifications', e.target.value)}
                    />
                  </div>
                  <div>
                    <label className={labelCls}>Other Requirements</label>
                    <textarea
                      rows={2}
                      className={inputCls}
                      value={ed.requirements}
                      onChange={(e) => setEditField(job.id, 'requirements', e.target.value)}
                    />
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => saveEdit(job.id)}
                      disabled={ed.saving}
                      className="rounded-xl bg-yellow-400 px-4 py-2 text-sm font-bold text-black hover:bg-yellow-300 disabled:opacity-60"
                    >
                      {ed.saving ? 'Saving...' : 'Save'}
                    </button>
                    <button
                      type="button"
                      onClick={() => cancelEdit(job.id)}
                      className="rounded-xl border border-slate-700 px-4 py-2 text-sm font-semibold text-slate-300"
                    >
                      Cancel
                    </button>
                  </div>
                  {ed.message && (
                    <p className={`text-xs ${ed.message.type === 'error' ? 'text-red-300' : 'text-emerald-300'}`}>
                      {ed.message.text}
                    </p>
                  )}
                </div>
              )}
            </JobCard>
          )
        })}
      </div>

      {deleteTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4">
          <div className="w-full max-w-md rounded-2xl border border-slate-800 bg-slate-950 p-5 shadow-2xl">
            <h2 className="text-lg font-bold text-white">Delete job</h2>
            <p className="mt-2 text-sm leading-6 text-slate-300">
              Are you sure you want to permanently delete this job?
            </p>
            {Number(deleteTarget.applicants_count) > 0 && (
              <p className="mt-2 rounded-xl border border-yellow-900/60 bg-yellow-950/30 p-3 text-xs text-yellow-200">
                This job has applications, so Jobsite Finder will archive it instead to preserve hiring history.
              </p>
            )}
            <div className="mt-5 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
              <button
                type="button"
                onClick={() => setDeleteTarget(null)}
                disabled={busyJobId === deleteTarget.id}
                className="rounded-xl border border-slate-700 px-4 py-2 text-sm font-semibold text-slate-200"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={confirmDeleteJob}
                disabled={busyJobId === deleteTarget.id}
                className="rounded-xl bg-red-500 px-4 py-2 text-sm font-bold text-white hover:bg-red-400 disabled:opacity-60"
              >
                {busyJobId === deleteTarget.id ? 'Deleting...' : 'Delete job'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default function GCJobsPage() {
  return <JobsManager roleLabel="General Contractor" />
}
