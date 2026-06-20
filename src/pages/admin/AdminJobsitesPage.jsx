import { useEffect, useMemo, useState } from 'react'
import DashboardShell from '../../components/layout/DashboardShell'
import { useAuth } from '../../hooks/useAuth'
import {
  getAllJobsites,
  getProjectsForPicker,
  createJobsite,
  updateJobsite,
  deleteJobsite,
  getPendingContractorJobsites,
  reviewContractorJobsite,
} from '../../services/adminService'
import { formatDate } from '../../lib/utils'

const inputCls =
  'w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-white outline-none focus:border-yellow-400'
const labelCls = 'block text-xs uppercase tracking-wider text-slate-500 mb-1'

const EMPTY = {
  project_id: '',
  name: '',
  address: '',
  city: '',
  latitude: '',
  longitude: '',
  status: 'active',
  notes: '',
}

export default function AdminJobsitesPage() {
  const { user } = useAuth()
  const [jobsites, setJobsites] = useState([])
  const [pendingJobsites, setPendingJobsites] = useState([])
  const [projects, setProjects] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [form, setForm] = useState(EMPTY)
  const [creating, setCreating] = useState(false)
  const [message, setMessage] = useState(null)
  const [edits, setEdits] = useState({})
  const [busyId, setBusyId] = useState(null)
  const [search, setSearch] = useState('')

  async function load() {
    setLoading(true)
    setError(null)
    try {
      const [sites, projs, pending] = await Promise.all([
        getAllJobsites(),
        getProjectsForPicker(),
        getPendingContractorJobsites(),
      ])
      setJobsites(sites)
      setProjects(projs)
      setPendingJobsites(pending)
    } catch (err) {
      setError(err)
    } finally {
      setLoading(false)
    }
  }

  async function handleReview(projectId, action) {
    const reason = action === 'reject' ? prompt('Rejection reason') : ''
    if (action === 'reject' && reason == null) return
    setBusyId(projectId)
    setMessage(null)
    try {
      await reviewContractorJobsite(projectId, action, { adminId: user?.id, reason })
      setMessage({ type: 'success', text: 'Contractor-created jobsite updated.' })
      await load()
    } catch (err) {
      setMessage({ type: 'error', text: err.message })
    } finally {
      setBusyId(null)
    }
  }

  useEffect(() => { load() }, [])

  function setField(field, val) {
    setForm((f) => ({ ...f, [field]: val }))
  }

  async function handleCreate(e) {
    e.preventDefault()
    setCreating(true)
    setMessage(null)
    try {
      await createJobsite(form)
      setMessage({ type: 'success', text: 'Jobsite created.' })
      setForm(EMPTY)
      await load()
    } catch (err) {
      setMessage({ type: 'error', text: err.message })
    } finally {
      setCreating(false)
    }
  }

  function startEdit(site) {
    setEdits((e) => ({
      ...e,
      [site.id]: {
        project_id: site.project_id || '',
        name: site.name || '',
        address: site.address || '',
        city: site.city || '',
        latitude: site.latitude ?? '',
        longitude: site.longitude ?? '',
        status: site.status || 'active',
        notes: site.notes || '',
      },
    }))
  }

  function setEditField(id, field, val) {
    setEdits((e) => ({ ...e, [id]: { ...e[id], [field]: val } }))
  }

  function cancelEdit(id) {
    setEdits((e) => {
      const next = { ...e }
      delete next[id]
      return next
    })
  }

  async function saveEdit(id) {
    const draft = edits[id]
    if (!draft) return
    setBusyId(id)
    setMessage(null)
    try {
      await updateJobsite(id, draft)
      setMessage({ type: 'success', text: 'Jobsite updated.' })
      cancelEdit(id)
      await load()
    } catch (err) {
      setMessage({ type: 'error', text: err.message })
    } finally {
      setBusyId(null)
    }
  }

  async function handleDelete(id) {
    if (!confirm('Delete this jobsite? Linked job posts will fail to load.')) return
    setBusyId(id)
    setMessage(null)
    try {
      await deleteJobsite(id)
      setMessage({ type: 'success', text: 'Jobsite deleted.' })
      await load()
    } catch (err) {
      setMessage({ type: 'error', text: err.message })
    } finally {
      setBusyId(null)
    }
  }

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase()
    if (!q) return jobsites
    return jobsites.filter((s) => {
      const fields = [s.name, s.city, s.address, s.project?.project_name]
        .filter(Boolean)
        .join(' ')
        .toLowerCase()
      return fields.includes(q)
    })
  }, [jobsites, search])

  return (
    <DashboardShell
      title="Admin · Jobsites Map"
      subtitle="Add and manage jobsites tied to projects. General Contractor and Subcontractor users pick from this list when posting jobs."
    >
      {message && (
        <div
          className={`rounded-2xl border p-4 text-sm ${
            message.type === 'error'
              ? 'border-red-900/60 bg-red-950/40 text-red-300'
              : 'border-emerald-900/60 bg-emerald-950/40 text-emerald-300'
          }`}
        >
          {message.text}
        </div>
      )}

      <section className="rounded-3xl border border-slate-800 bg-slate-900 p-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="text-lg font-semibold text-white">Pending contractor-created jobsites</h2>
            <p className="mt-1 text-sm text-slate-400">Approve, reject, hide, or inspect V1 contractor submissions.</p>
          </div>
          <span className="rounded-full border border-yellow-400/30 bg-yellow-400/10 px-3 py-1 text-xs font-bold text-yellow-200">
            {pendingJobsites.length} pending
          </span>
        </div>

        <div className="mt-4 space-y-3">
          {pendingJobsites.map((site) => (
            <div key={site.id} className="rounded-2xl border border-slate-800 bg-slate-950 p-4">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <h3 className="font-semibold text-white">{site.project_name || 'Unnamed jobsite'}</h3>
                    <span className="rounded-full border border-blue-500/40 bg-blue-500/10 px-2 py-0.5 text-xs font-bold text-blue-200">
                      Contractor Created
                    </span>
                    <span className="rounded-full border border-yellow-400/40 bg-yellow-400/10 px-2 py-0.5 text-xs font-bold text-yellow-200">
                      Pending Review
                    </span>
                  </div>
                  <p className="mt-1 text-sm text-slate-400">
                    {site.display_address || site.address || 'Address not provided'}
                  </p>
                  <p className="mt-1 text-xs text-slate-500">
                    {[site.latitude, site.longitude].filter((v) => v != null).join(', ') || 'No coordinates'} · Created {formatDate(site.created_at)}
                  </p>
                  {(site.description || site.trades_needed || site.site_access_notes) && (
                    <div className="mt-3 grid gap-2 text-sm text-slate-300 md:grid-cols-3">
                      <p>{site.description || 'No description'}</p>
                      <p>{site.trades_needed || 'No trades listed'}</p>
                      <p>{site.site_access_notes || 'No access notes'}</p>
                    </div>
                  )}
                </div>
                <div className="flex flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={() => handleReview(site.id, 'approve')}
                    disabled={busyId === site.id}
                    className="rounded-lg bg-emerald-500 px-3 py-1 text-sm font-bold text-white disabled:opacity-60"
                  >
                    Approve
                  </button>
                  <button
                    type="button"
                    onClick={() => handleReview(site.id, 'reject')}
                    disabled={busyId === site.id}
                    className="rounded-lg border border-red-900/60 px-3 py-1 text-sm text-red-300 disabled:opacity-60"
                  >
                    Reject
                  </button>
                  <button
                    type="button"
                    onClick={() => handleReview(site.id, 'hide')}
                    disabled={busyId === site.id}
                    className="rounded-lg border border-slate-700 px-3 py-1 text-sm text-slate-200 disabled:opacity-60"
                  >
                    Hide
                  </button>
                </div>
              </div>
            </div>
          ))}
          {!loading && pendingJobsites.length === 0 && (
            <p className="text-sm text-slate-400">No contractor-created jobsites are waiting for review.</p>
          )}
        </div>
      </section>

      <section className="rounded-3xl border border-slate-800 bg-slate-900 p-6">
        <h2 className="text-lg font-semibold text-white">Add a jobsite</h2>
        <form onSubmit={handleCreate} className="mt-4 grid gap-3 sm:grid-cols-2">
          <div className="sm:col-span-2">
            <label className={labelCls}>Project</label>
            <select
              className={inputCls}
              value={form.project_id}
              onChange={(e) => setField('project_id', e.target.value)}
              required
            >
              <option value="">Select a project...</option>
              {projects.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.project_name}
                  {p.city ? ` — ${p.city}` : ''}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className={labelCls}>Jobsite name</label>
            <input
              className={inputCls}
              value={form.name}
              onChange={(e) => setField('name', e.target.value)}
              required
              placeholder="North Yard, Tower B, etc."
            />
          </div>
          <div>
            <label className={labelCls}>City</label>
            <input
              className={inputCls}
              value={form.city}
              onChange={(e) => setField('city', e.target.value)}
            />
          </div>
          <div className="sm:col-span-2">
            <label className={labelCls}>Address</label>
            <input
              className={inputCls}
              value={form.address}
              onChange={(e) => setField('address', e.target.value)}
            />
          </div>
          <div>
            <label className={labelCls}>Latitude</label>
            <input
              className={inputCls}
              type="number"
              step="any"
              value={form.latitude}
              onChange={(e) => setField('latitude', e.target.value)}
            />
          </div>
          <div>
            <label className={labelCls}>Longitude</label>
            <input
              className={inputCls}
              type="number"
              step="any"
              value={form.longitude}
              onChange={(e) => setField('longitude', e.target.value)}
            />
          </div>
          <div>
            <label className={labelCls}>Status</label>
            <select
              className={inputCls}
              value={form.status}
              onChange={(e) => setField('status', e.target.value)}
            >
              <option value="active">Active</option>
              <option value="paused">Paused</option>
              <option value="closed">Closed</option>
            </select>
          </div>
          <div className="sm:col-span-2">
            <label className={labelCls}>Notes</label>
            <textarea
              rows={2}
              className={inputCls}
              value={form.notes}
              onChange={(e) => setField('notes', e.target.value)}
            />
          </div>
          <div className="sm:col-span-2">
            <button
              type="submit"
              disabled={creating}
              className="rounded-xl bg-yellow-400 px-4 py-2 text-sm font-bold text-black hover:bg-yellow-300 disabled:opacity-60"
            >
              {creating ? 'Creating...' : 'Create jobsite'}
            </button>
          </div>
        </form>
      </section>

      <section className="rounded-3xl border border-slate-800 bg-slate-900 p-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h2 className="text-lg font-semibold text-white">Existing jobsites ({jobsites.length})</h2>
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search name, city, project..."
            className="rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-white outline-none focus:border-yellow-400"
          />
        </div>

        {loading && (
          <p className="mt-4 text-sm text-slate-400">Loading jobsites...</p>
        )}
        {error && !loading && (
          <p className="mt-4 text-sm text-red-300">{error.message}</p>
        )}

        <div className="mt-4 space-y-3">
          {filtered.map((site) => {
            const ed = edits[site.id]
            return (
              <div key={site.id} className="rounded-xl border border-slate-800 bg-slate-950 p-4">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <p className="font-semibold text-white">{site.name || 'Unnamed jobsite'}</p>
                    <p className="text-sm text-slate-400">
                      {site.project?.project_name || `Project ${site.project_id || '—'}`}
                      {site.city ? ` · ${site.city}` : ''}
                    </p>
                    <p className="mt-1 text-xs text-slate-500">
                      Status: <span className="text-slate-200">{site.status || '—'}</span> ·
                      ID {site.id} · Created {formatDate(site.created_at)}
                    </p>
                    {(site.latitude != null && site.longitude != null) && (
                      <p className="text-xs text-slate-500">
                        {site.latitude}, {site.longitude}
                      </p>
                    )}
                  </div>
                  <div className="flex gap-2">
                    {!ed ? (
                      <>
                        <button
                          type="button"
                          onClick={() => startEdit(site)}
                          className="rounded-lg border border-slate-700 px-3 py-1 text-sm text-slate-200 hover:border-yellow-400/50"
                        >
                          Edit
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDelete(site.id)}
                          disabled={busyId === site.id}
                          className="rounded-lg border border-red-900/60 px-3 py-1 text-sm text-red-300 hover:bg-red-950/40 disabled:opacity-60"
                        >
                          Delete
                        </button>
                      </>
                    ) : (
                      <>
                        <button
                          type="button"
                          onClick={() => saveEdit(site.id)}
                          disabled={busyId === site.id}
                          className="rounded-lg bg-yellow-400 px-3 py-1 text-sm font-bold text-black hover:bg-yellow-300 disabled:opacity-60"
                        >
                          {busyId === site.id ? 'Saving...' : 'Save'}
                        </button>
                        <button
                          type="button"
                          onClick={() => cancelEdit(site.id)}
                          className="rounded-lg border border-slate-700 px-3 py-1 text-sm text-slate-300"
                        >
                          Cancel
                        </button>
                      </>
                    )}
                  </div>
                </div>

                {ed && (
                  <div className="mt-4 grid gap-3 sm:grid-cols-2">
                    <div className="sm:col-span-2">
                      <label className={labelCls}>Project</label>
                      <select
                        className={inputCls}
                        value={ed.project_id}
                        onChange={(e) => setEditField(site.id, 'project_id', e.target.value)}
                      >
                        <option value="">Select a project...</option>
                        {projects.map((p) => (
                          <option key={p.id} value={p.id}>
                            {p.project_name}{p.city ? ` — ${p.city}` : ''}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className={labelCls}>Name</label>
                      <input className={inputCls} value={ed.name} onChange={(e) => setEditField(site.id, 'name', e.target.value)} />
                    </div>
                    <div>
                      <label className={labelCls}>City</label>
                      <input className={inputCls} value={ed.city} onChange={(e) => setEditField(site.id, 'city', e.target.value)} />
                    </div>
                    <div className="sm:col-span-2">
                      <label className={labelCls}>Address</label>
                      <input className={inputCls} value={ed.address} onChange={(e) => setEditField(site.id, 'address', e.target.value)} />
                    </div>
                    <div>
                      <label className={labelCls}>Latitude</label>
                      <input type="number" step="any" className={inputCls} value={ed.latitude} onChange={(e) => setEditField(site.id, 'latitude', e.target.value)} />
                    </div>
                    <div>
                      <label className={labelCls}>Longitude</label>
                      <input type="number" step="any" className={inputCls} value={ed.longitude} onChange={(e) => setEditField(site.id, 'longitude', e.target.value)} />
                    </div>
                    <div>
                      <label className={labelCls}>Status</label>
                      <select className={inputCls} value={ed.status} onChange={(e) => setEditField(site.id, 'status', e.target.value)}>
                        <option value="active">Active</option>
                        <option value="paused">Paused</option>
                        <option value="closed">Closed</option>
                      </select>
                    </div>
                    <div className="sm:col-span-2">
                      <label className={labelCls}>Notes</label>
                      <textarea rows={2} className={inputCls} value={ed.notes} onChange={(e) => setEditField(site.id, 'notes', e.target.value)} />
                    </div>
                  </div>
                )}
              </div>
            )
          })}

          {!loading && !error && filtered.length === 0 && (
            <p className="text-sm text-slate-400">No jobsites yet.</p>
          )}
        </div>
      </section>
    </DashboardShell>
  )
}
