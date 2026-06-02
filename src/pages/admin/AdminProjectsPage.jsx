import { useEffect, useState } from 'react'
import DashboardShell from '../../components/layout/DashboardShell'
import BackButton from '../../components/ui/BackButton'
import ProjectImageManager from '../../components/projects/ProjectImageManager'
import { useAuth } from '../../hooks/useAuth'
import { getAllProjects, updateProject } from '../../services/adminService'
import { formatDate, formatCurrencyShort } from '../../lib/utils'

const inputCls =
  'w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-white outline-none focus:border-yellow-400'
const labelCls = 'block text-xs uppercase tracking-wider text-slate-500 mb-1'

export default function AdminProjectsPage() {
  const { user } = useAuth()
  const [projects, setProjects] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [drafts, setDrafts] = useState({})
  const [savingId, setSavingId] = useState(null)
  const [message, setMessage] = useState(null)

  async function load() {
    setLoading(true)
    setError(null)
    try {
      const data = await getAllProjects()
      setProjects(data)
      const next = {}
      data.forEach((p) => {
        next[p.id] = {
          stage: p.stage || '',
          status: p.status || '',
          is_active: !!p.is_active,
          is_public_project: !!p.is_public_project,
          display_address: p.display_address || '',
          site_access_notes: p.site_access_notes || '',
          gate_entrance: p.gate_entrance || '',
          parking_instructions: p.parking_instructions || '',
          muster_point: p.muster_point || '',
          google_maps_url: p.google_maps_url || '',
        }
      })
      setDrafts(next)
    } catch (err) {
      setError(err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { load() }, [])

  function setDraft(id, field, val) {
    setDrafts((d) => ({ ...d, [id]: { ...d[id], [field]: val } }))
  }

  async function handleSave(id) {
    const draft = drafts[id]
    if (!draft) return
    setSavingId(id)
    setMessage(null)
    try {
      await updateProject(id, draft)
      setMessage({ type: 'success', text: `Project ${id} saved.` })
      await load()
    } catch (err) {
      setMessage({ type: 'error', text: err.message })
    } finally {
      setSavingId(null)
    }
  }

  return (
    <DashboardShell
      title="Admin · Projects"
      subtitle="Edit visibility and lifecycle for projects shown on the map."
    >
      <BackButton label="← Back" />
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

      {loading && (
        <div className="rounded-2xl border border-slate-800 bg-slate-900 p-4 text-sm text-slate-400">
          Loading projects...
        </div>
      )}
      {error && !loading && (
        <div className="rounded-2xl border border-red-900/60 bg-red-950/40 p-4 text-sm text-red-300">
          {error.message}
        </div>
      )}

      <div className="space-y-3">
        {projects.map((p) => {
          const d = drafts[p.id] || {}
          return (
            <div key={p.id} className="rounded-2xl border border-slate-800 bg-slate-900 p-5">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <h3 className="text-lg font-semibold text-white">{p.project_name}</h3>
                  <p className="mt-1 text-sm text-slate-400">
                    {[p.city, p.province].filter(Boolean).join(', ') || '—'}
                  </p>
                  {p.estimated_value != null && p.estimated_value !== '' && (
                    <p className="mt-2 inline-flex items-center rounded-md bg-yellow-400/10 px-2 py-0.5 text-xs font-bold text-yellow-300">
                      {formatCurrencyShort(p.estimated_value)}
                    </p>
                  )}
                </div>
                <div className="text-right text-xs text-slate-500">
                  <p>Created {formatDate(p.created_at)}</p>
                  <p className="mt-1">ID {p.id}</p>
                </div>
              </div>

              <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                <div>
                  <label className={labelCls}>Stage</label>
                  <input
                    className={inputCls}
                    value={d.stage || ''}
                    onChange={(e) => setDraft(p.id, 'stage', e.target.value)}
                  />
                </div>
                <div>
                  <label className={labelCls}>Status</label>
                  <input
                    className={inputCls}
                    value={d.status || ''}
                    onChange={(e) => setDraft(p.id, 'status', e.target.value)}
                  />
                </div>
                <label className="flex items-center gap-2 text-sm text-slate-200">
                  <input
                    type="checkbox"
                    checked={!!d.is_active}
                    onChange={(e) => setDraft(p.id, 'is_active', e.target.checked)}
                    className="h-4 w-4 rounded border-slate-600 bg-slate-950 accent-yellow-400"
                  />
                  Active
                </label>
                <label className="flex items-center gap-2 text-sm text-slate-200">
                  <input
                    type="checkbox"
                    checked={!!d.is_public_project}
                    onChange={(e) => setDraft(p.id, 'is_public_project', e.target.checked)}
                    className="h-4 w-4 rounded border-slate-600 bg-slate-950 accent-yellow-400"
                  />
                  Public
                </label>
              </div>

              <div className="mt-4 rounded-2xl border border-slate-800 bg-slate-950 p-4">
                <ProjectImageManager
                  projectId={p.id}
                  projectName={p.project_name}
                  userId={user?.id}
                  canManage
                  initialImages={p._images || []}
                  onImagesChanged={(images) => {
                    setProjects((current) => current.map((project) => (
                      project.id === p.id
                        ? {
                            ...project,
                            _images: images,
                            _primaryImage: images.find((image) => image.is_primary) || images[0] || null,
                          }
                        : project
                    )))
                  }}
                />
              </div>

              <div className="mt-4 rounded-2xl border border-slate-800 bg-slate-950 p-4">
                <p className="text-sm font-semibold text-white">Contractor jobsite access</p>
                <p className="mt-1 text-xs text-slate-500">
                  Worker-facing access details. Imported location and map coordinates stay separate.
                </p>
                <div className="mt-3 grid gap-3 sm:grid-cols-2">
                  <div>
                    <label className={labelCls}>Display address</label>
                    <input
                      className={inputCls}
                      value={d.display_address || ''}
                      onChange={(e) => setDraft(p.id, 'display_address', e.target.value)}
                    />
                  </div>
                  <div>
                    <label className={labelCls}>Google Maps URL</label>
                    <input
                      className={inputCls}
                      value={d.google_maps_url || ''}
                      onChange={(e) => setDraft(p.id, 'google_maps_url', e.target.value)}
                    />
                  </div>
                  <div>
                    <label className={labelCls}>Gate / entrance</label>
                    <input
                      className={inputCls}
                      value={d.gate_entrance || ''}
                      onChange={(e) => setDraft(p.id, 'gate_entrance', e.target.value)}
                    />
                  </div>
                  <div>
                    <label className={labelCls}>Muster point</label>
                    <input
                      className={inputCls}
                      value={d.muster_point || ''}
                      onChange={(e) => setDraft(p.id, 'muster_point', e.target.value)}
                    />
                  </div>
                  <div>
                    <label className={labelCls}>Parking instructions</label>
                    <textarea
                      rows={3}
                      className={inputCls}
                      value={d.parking_instructions || ''}
                      onChange={(e) => setDraft(p.id, 'parking_instructions', e.target.value)}
                    />
                  </div>
                  <div>
                    <label className={labelCls}>Site access notes</label>
                    <textarea
                      rows={3}
                      className={inputCls}
                      value={d.site_access_notes || ''}
                      onChange={(e) => setDraft(p.id, 'site_access_notes', e.target.value)}
                    />
                  </div>
                </div>
              </div>

              <div className="mt-4">
                <button
                  type="button"
                  onClick={() => handleSave(p.id)}
                  disabled={savingId === p.id}
                  className="rounded-xl bg-yellow-400 px-4 py-2 text-sm font-bold text-black hover:bg-yellow-300 disabled:opacity-60"
                >
                  {savingId === p.id ? 'Saving...' : 'Save changes'}
                </button>
              </div>
            </div>
          )
        })}

        {!loading && !error && projects.length === 0 && (
          <div className="rounded-2xl border border-slate-800 bg-slate-900 p-6 text-sm text-slate-400">
            No projects yet.
          </div>
        )}
      </div>
    </DashboardShell>
  )
}
