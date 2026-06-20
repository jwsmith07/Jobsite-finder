import { useEffect, useState } from 'react'
import DashboardShell from '../../components/layout/DashboardShell'
import {
  getAllCompanyProfiles,
  getAllProfiles,
  getPendingCompanyProfiles,
  updateCompanyAdmin,
  updateCompanyVerification,
} from '../../services/adminService'
import { formatDate, getRoleLabel } from '../../lib/utils'

const inputCls =
  'rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-sm text-white outline-none focus:border-yellow-400'

export default function AdminUsersPage() {
  const [profiles, setProfiles] = useState([])
  const [pending, setPending] = useState([])
  const [companies, setCompanies] = useState([])
  const [drafts, setDrafts] = useState({})
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [busyId, setBusyId] = useState(null)
  const [message, setMessage] = useState(null)

  async function load() {
    setLoading(true)
    setError(null)
    const [profilesResult, companiesResult] = await Promise.allSettled([
      getAllProfiles(),
      Promise.all([getPendingCompanyProfiles(), getAllCompanyProfiles()]),
    ])

    if (profilesResult.status === 'fulfilled') {
      setProfiles(profilesResult.value)
    } else {
      setProfiles([])
    }

    if (companiesResult.status === 'fulfilled') {
      const [pendingCompanies, allCompanies] = companiesResult.value
      setPending(pendingCompanies)
      setCompanies(allCompanies)
      setDrafts(Object.fromEntries(allCompanies.map((company) => [
        company.id,
        {
          company_name: company.company_name || '',
          company_type: company.company_type || '',
          website: company.website || '',
          phone: company.phone || '',
          email: company.email || '',
          service_area: company.service_area || '',
          trades_hired: company.trades_hired || '',
          verified: !!company.verified,
          is_hidden: !!company.is_hidden,
        },
      ])))
    } else {
      setPending([])
      setCompanies([])
      setDrafts({})
    }

    const failures = [profilesResult, companiesResult]
      .filter((result) => result.status === 'rejected')
      .map((result) => result.reason?.message || 'Admin data failed to load.')

    if (failures.length > 0) {
      setError(new Error(failures.join(' ')))
    }
    setLoading(false)
  }

  useEffect(() => { load() }, [])

  function setDraft(id, field, value) {
    setDrafts((current) => ({
      ...current,
      [id]: { ...current[id], [field]: value },
    }))
  }

  async function handleVerify(id) {
    setBusyId(id)
    setMessage(null)
    try {
      await updateCompanyVerification(id, true)
      setMessage({ type: 'success', text: 'Company verified.' })
      await load()
    } catch (err) {
      setMessage({ type: 'error', text: err.message })
    } finally {
      setBusyId(null)
    }
  }

  async function handleCompanySave(id) {
    const draft = drafts[id]
    if (!draft) return
    setBusyId(id)
    setMessage(null)
    try {
      await updateCompanyAdmin(id, draft)
      setMessage({ type: 'success', text: 'Company updated.' })
      await load()
    } catch (err) {
      setMessage({ type: 'error', text: err.message })
    } finally {
      setBusyId(null)
    }
  }

  return (
    <DashboardShell
      title="Admin - Users"
      subtitle="Browse user profiles and manage company accounts."
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

      {loading && (
        <div className="rounded-2xl border border-slate-800 bg-slate-900 p-4 text-sm text-slate-400">
          Loading...
        </div>
      )}
      {error && !loading && (
        <div className="rounded-2xl border border-red-900/60 bg-red-950/40 p-4 text-sm text-red-300">
          {error.message}
        </div>
      )}

      <section className="rounded-3xl border border-slate-800 bg-slate-900 p-6">
        <h2 className="text-lg font-semibold text-white">User profiles</h2>
        <p className="mt-1 text-xs text-slate-500">All registered Jobsite Finder accounts.</p>

        <div className="mt-4 space-y-2">
          {profiles.map((p) => (
            <div
              key={p.id}
              className="flex flex-wrap items-start justify-between gap-3 rounded-xl border border-slate-800 bg-slate-950 px-4 py-3"
            >
              <div>
                <p className="font-medium text-white">{p.full_name || 'Unnamed user'}</p>
                <p className="text-sm text-slate-400">{p.email || 'No email provided'}</p>
              </div>
              <div className="text-right text-xs text-slate-500">
                <p>Role: <span className="text-slate-200">{p.role ? getRoleLabel(p.role) : 'unset'}</span></p>
                <p className="mt-1">Joined {formatDate(p.created_at)}</p>
              </div>
            </div>
          ))}
          {!loading && profiles.length === 0 && (
            <p className="text-sm text-slate-400">No profiles yet.</p>
          )}
        </div>
      </section>

      <section className="rounded-3xl border border-slate-800 bg-slate-900 p-6">
        <h2 className="text-lg font-semibold text-white">Company management</h2>
        <p className="mt-1 text-xs text-slate-500">Edit, verify, or hide company profiles.</p>

        <div className="mt-4 space-y-3">
          {companies.map((c) => {
            const draft = drafts[c.id] || {}
            const isBusy = busyId === c.id
            return (
              <div key={c.id} className="rounded-xl border border-slate-800 bg-slate-950 p-4">
                <div className="grid gap-3 lg:grid-cols-4">
                  <input
                    value={draft.company_name || ''}
                    onChange={(e) => setDraft(c.id, 'company_name', e.target.value)}
                    className={inputCls}
                    placeholder="Company name"
                  />
                  <select
                    value={draft.company_type || ''}
                    onChange={(e) => setDraft(c.id, 'company_type', e.target.value)}
                    className={inputCls}
                  >
                    <option value="">Type</option>
                    <option value="gc">General Contractor</option>
                    <option value="sc">Subcontractor</option>
                    <option value="subcontractor">Subcontractor</option>
                  </select>
                  <input
                    value={draft.phone || ''}
                    onChange={(e) => setDraft(c.id, 'phone', e.target.value)}
                    className={inputCls}
                    placeholder="Phone"
                  />
                  <input
                    value={draft.email || ''}
                    onChange={(e) => setDraft(c.id, 'email', e.target.value)}
                    className={inputCls}
                    placeholder="Company email"
                  />
                  <input
                    value={draft.website || ''}
                    onChange={(e) => setDraft(c.id, 'website', e.target.value)}
                    className={`${inputCls} lg:col-span-2`}
                    placeholder="Website"
                  />
                  <input
                    value={draft.service_area || ''}
                    onChange={(e) => setDraft(c.id, 'service_area', e.target.value)}
                    className={inputCls}
                    placeholder="Service area"
                  />
                  <input
                    value={draft.trades_hired || ''}
                    onChange={(e) => setDraft(c.id, 'trades_hired', e.target.value)}
                    className={inputCls}
                    placeholder="Trades hired"
                  />
                </div>
                <div className="mt-3 flex flex-wrap items-center justify-between gap-3">
                  <p className="text-xs text-slate-500">
                    Account: {c.account_email || 'No account email'} - Submitted {formatDate(c.created_at)}
                  </p>
                  <div className="flex flex-wrap items-center gap-3">
                    <label className="flex items-center gap-2 text-sm text-slate-200">
                      <input
                        type="checkbox"
                        checked={!!draft.verified}
                        onChange={(e) => setDraft(c.id, 'verified', e.target.checked)}
                        className="h-4 w-4 accent-yellow-400"
                      />
                      Verified
                    </label>
                    <label className="flex items-center gap-2 text-sm text-slate-200">
                      <input
                        type="checkbox"
                        checked={!!draft.is_hidden}
                        onChange={(e) => setDraft(c.id, 'is_hidden', e.target.checked)}
                        className="h-4 w-4 accent-yellow-400"
                      />
                      Hidden
                    </label>
                    <button
                      type="button"
                      onClick={() => handleCompanySave(c.id)}
                      disabled={isBusy}
                      className="rounded-xl bg-yellow-400 px-4 py-2 text-sm font-bold text-black hover:bg-yellow-300 disabled:opacity-60"
                    >
                      {isBusy ? 'Saving...' : 'Save'}
                    </button>
                  </div>
                </div>
              </div>
            )
          })}
          {!loading && companies.length === 0 && (
            <p className="text-sm text-slate-400">No company profiles yet.</p>
          )}
        </div>
      </section>

      <section className="rounded-3xl border border-slate-800 bg-slate-900 p-6">
        <h2 className="text-lg font-semibold text-white">Pending companies</h2>
        <p className="mt-1 text-xs text-slate-500">
          Quick verification queue for unverified companies.
        </p>

        <div className="mt-4 space-y-2">
          {pending.map((c) => (
            <div
              key={c.id}
              className="flex flex-wrap items-start justify-between gap-3 rounded-xl border border-slate-800 bg-slate-950 px-4 py-3"
            >
              <div>
                <p className="font-medium text-white">{c.company_name || 'Unnamed company'}</p>
                <p className="text-sm text-slate-400">
                  {c.company_type ? getRoleLabel(c.company_type) : 'N/A'} - {c.account_email || c.email || 'No email provided'} - {c.phone || 'N/A'}
                </p>
                <p className="mt-1 text-xs text-slate-500">Submitted {formatDate(c.created_at)}</p>
              </div>
              <button
                type="button"
                onClick={() => handleVerify(c.id)}
                disabled={busyId === c.id}
                className="rounded-xl bg-yellow-400 px-4 py-2 text-sm font-bold text-black hover:bg-yellow-300 disabled:opacity-60"
              >
                {busyId === c.id ? 'Verifying...' : 'Verify'}
              </button>
            </div>
          ))}
          {!loading && pending.length === 0 && (
            <p className="text-sm text-slate-400">No pending company profiles.</p>
          )}
        </div>
      </section>
    </DashboardShell>
  )
}
