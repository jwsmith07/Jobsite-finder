import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import DashboardShell from '../../components/layout/DashboardShell'
import BackButton from '../../components/ui/BackButton'
import {
  getAllClaims,
  rejectClaim,
  revokeClaim,
  updateClaimAdmin,
} from '../../services/claimsService'
import { getCompaniesForPicker, getProjectsForPicker } from '../../services/adminService'
import { formatDate, getRoleLabel } from '../../lib/utils'
import { useAuth } from '../../hooks/useAuth'

const inputCls =
  'w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-white outline-none focus:border-yellow-400'
const labelCls = 'block text-xs uppercase tracking-wider text-slate-500 mb-1'
const STATUSES = ['pending', 'approved', 'rejected', 'revoked']

function statusTone(status) {
  switch (status) {
    case 'approved':
      return 'border-emerald-900/60 bg-emerald-950/40 text-emerald-300'
    case 'rejected':
      return 'border-red-900/60 bg-red-950/40 text-red-300'
    case 'revoked':
      return 'border-orange-900/60 bg-orange-950/40 text-orange-300'
    default:
      return 'border-yellow-900/60 bg-yellow-950/30 text-yellow-200'
  }
}

function companyLabel(company) {
  if (!company) return 'Unknown company'
  return `${company.company_name || `Company ${company.id}`} (${getRoleLabel(company.company_type || 'company')})`
}

export default function AdminClaimsPage() {
  const { user: adminUser } = useAuth()
  const [claims, setClaims] = useState([])
  const [projects, setProjects] = useState([])
  const [companies, setCompanies] = useState([])
  const [drafts, setDrafts] = useState({})
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [busyId, setBusyId] = useState(null)
  const [filter, setFilter] = useState('pending')
  const [message, setMessage] = useState(null)

  function seedDrafts(rows) {
    const next = {}
    rows.forEach((c) => {
      next[c.id] = {
        project_id: c.project_id || '',
        company_profile_id: c.company_profile_id || '',
        company_role: c.company_role || (c.claim_type === 'sc' ? 'subcontractor' : 'gc'),
        trade_scope: c.trade_scope || '',
        is_primary_gc: !!c.is_primary_gc,
        admin_notes: c.admin_notes || '',
      }
    })
    setDrafts(next)
  }

  async function load() {
    setLoading(true)
    setError(null)
    try {
      const [claimsData, projectsData, companiesData] = await Promise.all([
        getAllClaims(),
        getProjectsForPicker(),
        getCompaniesForPicker(),
      ])
      setClaims(claimsData)
      setProjects(projectsData)
      setCompanies(companiesData)
      seedDrafts(claimsData)
    } catch (err) {
      setError(err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { load() }, [])

  function setDraft(id, field, value) {
    setDrafts((d) => ({ ...d, [id]: { ...d[id], [field]: value } }))
  }

  async function runAction(id, action, successText) {
    const draft = drafts[id] || {}
    setBusyId(id)
    setMessage(null)
    try {
      await action(draft)
      setMessage({ type: 'success', text: successText })
      await load()
    } catch (err) {
      setMessage({ type: 'error', text: err.message })
    } finally {
      setBusyId(null)
    }
  }

  async function handleSave(c) {
    const draft = drafts[c.id]
    if (!draft) return
    await runAction(
      c.id,
      () => updateClaimAdmin(c.id, {
        project_id: draft.project_id,
        company_profile_id: draft.company_profile_id,
        company_role: draft.company_role,
        trade_scope: draft.trade_scope,
        is_primary_gc: draft.company_role === 'gc' && draft.is_primary_gc,
        admin_notes: draft.admin_notes,
      }),
      'Claim updated.',
    )
  }

  const filtered = useMemo(
    () => claims.filter((c) => filter === 'all' || c.status === filter),
    [claims, filter],
  )

  return (
    <DashboardShell
      title="Admin - Claims"
      subtitle="Manage project claim approvals, revocations, reassignment, and admin notes."
      actions={
        <select
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
          className={inputCls}
        >
          <option value="pending">Pending</option>
          <option value="approved">Approved</option>
          <option value="rejected">Rejected</option>
          <option value="revoked">Revoked</option>
          <option value="all">All</option>
        </select>
      }
    >
      <BackButton label="Back" />

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

      {loading && <p className="text-sm text-slate-400">Loading claims...</p>}
      {error && !loading && <p className="text-sm text-red-300">{error.message}</p>}

      <div className="space-y-3">
        {filtered.map((c) => {
          const draft = drafts[c.id] || {}
          const isBusy = busyId === c.id
          return (
            <div key={c.id} className="rounded-2xl border border-slate-800 bg-slate-900 p-5">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <h2 className="text-lg font-semibold text-white">
                      {c.project?.project_name || `Project ${c.project_id}`}
                    </h2>
                    <span className={`rounded-full border px-2.5 py-1 text-xs font-semibold ${statusTone(c.status)}`}>
                      {c.status}
                    </span>
                  </div>
                  <p className="mt-1 text-sm text-slate-400">
                    {companyLabel(c.company)}
                  </p>
                  <p className="mt-1 text-xs text-slate-500">
                    Submitted {formatDate(c.created_at)} · Approved {formatDate(c.approved_at)}
                  </p>
                  {c.notes && (
                    <p className="mt-3 max-w-2xl rounded-lg border border-slate-800 bg-slate-950 p-3 text-sm text-slate-300">
                      {c.notes}
                    </p>
                  )}
                  {c.project?.id && (
                    <Link
                      to={`/projects/${c.project.id}`}
                      className="mt-3 inline-block text-xs text-yellow-300 hover:underline"
                    >
                      View project
                    </Link>
                  )}
                </div>
              </div>

              <div className="mt-4 grid gap-3 lg:grid-cols-4">
                <div>
                  <label className={labelCls}>Project / jobsite</label>
                  <select
                    className={inputCls}
                    value={draft.project_id || ''}
                    onChange={(e) => setDraft(c.id, 'project_id', e.target.value)}
                  >
                    <option value="">Select project...</option>
                    {projects.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.project_name || `Project ${p.id}`}
                        {p.city ? ` - ${p.city}` : ''}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className={labelCls}>Company</label>
                  <select
                    className={inputCls}
                    value={draft.company_profile_id || ''}
                    onChange={(e) => setDraft(c.id, 'company_profile_id', e.target.value)}
                  >
                    <option value="">Select company...</option>
                    {companies.map((company) => (
                      <option key={company.id} value={company.id}>
                        {companyLabel(company)}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className={labelCls}>Project role</label>
                  <select
                    className={inputCls}
                    value={draft.company_role || ''}
                    onChange={(e) => {
                      setDraft(c.id, 'company_role', e.target.value)
                      if (e.target.value === 'subcontractor') {
                        setDraft(c.id, 'is_primary_gc', false)
                      }
                    }}
                  >
                    <option value="gc">Primary / connected General Contractor</option>
                    <option value="subcontractor">Subcontractor</option>
                  </select>
                </div>
                <div>
                  <label className={labelCls}>Claim ID</label>
                  <input className={inputCls} value={c.id} readOnly />
                </div>
              </div>

              <div className="mt-3 grid gap-3 lg:grid-cols-[minmax(0,1fr)_220px]">
                <div>
                  <label className={labelCls}>Trade / scope</label>
                  <input
                    className={inputCls}
                    value={draft.trade_scope || ''}
                    onChange={(e) => setDraft(c.id, 'trade_scope', e.target.value)}
                    placeholder="Electrical, concrete, framing, site services..."
                  />
                </div>
                <label className="flex items-center gap-3 rounded-lg border border-slate-800 bg-slate-950 px-3 py-2 text-sm text-slate-200">
                  <input
                    type="checkbox"
                    checked={!!draft.is_primary_gc}
                    disabled={draft.company_role === 'subcontractor'}
                    onChange={(e) => setDraft(c.id, 'is_primary_gc', e.target.checked)}
                    className="h-4 w-4 accent-yellow-400"
                  />
                  Primary General Contractor
                </label>
              </div>

              <div className="mt-3">
                <label className={labelCls}>Admin note / reason</label>
                <textarea
                  rows={3}
                  className={inputCls}
                  value={draft.admin_notes || ''}
                  onChange={(e) => setDraft(c.id, 'admin_notes', e.target.value)}
                  placeholder="Reason for approval, rejection, revocation, reassignment, or company correction."
                />
              </div>

              <div className="mt-4 flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={() => runAction(c.id, (d) => updateClaimAdmin(c.id, {
                    project_id: d.project_id,
                    company_profile_id: d.company_profile_id,
                    company_role: d.company_role,
                    trade_scope: d.trade_scope,
                    is_primary_gc: d.company_role === 'gc' && d.is_primary_gc,
                    admin_notes: d.admin_notes,
                    approved_by: adminUser?.id,
                    status: 'approved',
                  }), 'Claim approved.')}
                  disabled={isBusy}
                  className="rounded-xl bg-yellow-400 px-4 py-2 text-sm font-bold text-black hover:bg-yellow-300 disabled:opacity-60"
                >
                  Approve
                </button>
                <button
                  type="button"
                  onClick={() => runAction(c.id, (d) => rejectClaim(c.id, d.admin_notes), 'Claim rejected.')}
                  disabled={isBusy}
                  className="rounded-xl border border-red-900/60 px-4 py-2 text-sm text-red-300 hover:bg-red-950/40 disabled:opacity-60"
                >
                  Reject
                </button>
                <button
                  type="button"
                  onClick={() => runAction(c.id, (d) => revokeClaim(c.id, d.admin_notes), 'Claim revoked.')}
                  disabled={isBusy || c.status !== 'approved'}
                  className="rounded-xl border border-orange-900/60 px-4 py-2 text-sm text-orange-300 hover:bg-orange-950/40 disabled:opacity-50"
                >
                  Revoke approved
                </button>
                <button
                  type="button"
                  onClick={() => handleSave(c)}
                  disabled={isBusy}
                  className="rounded-xl border border-slate-700 px-4 py-2 text-sm font-semibold text-slate-200 hover:border-yellow-400/50 disabled:opacity-60"
                >
                  Save reassignment / note
                </button>
              </div>
            </div>
          )
        })}

        {!loading && filtered.length === 0 && (
          <p className="text-sm text-slate-400">No claims to show.</p>
        )}
      </div>
    </DashboardShell>
  )
}
