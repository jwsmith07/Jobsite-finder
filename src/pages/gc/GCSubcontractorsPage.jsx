import { useEffect, useMemo, useState } from 'react'
import DashboardShell from '../../components/layout/DashboardShell'
import { useAuth } from '../../hooks/useAuth'
import { formatDate } from '../../lib/utils'
import {
  createGcSubcontractorAssignment,
  getGcSubcontractorPageData,
  removeGcSubcontractorAssignment,
  updateSubcontractorParticipationRequest,
  updateGcSubcontractorAssignment,
} from '../../services/gcSubcontractorsService'

const STATUS_OPTIONS = ['pending', 'active', 'paused', 'removed']

function matches(value, query) {
  return String(value || '').toLowerCase().includes(query)
}

export default function GCSubcontractorsPage() {
  const { user } = useAuth()
  const [jobsites, setJobsites] = useState([])
  const [assignments, setAssignments] = useState([])
  const [availableSubcontractors, setAvailableSubcontractors] = useState([])
  const [pendingRequests, setPendingRequests] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [message, setMessage] = useState(null)
  const [busyId, setBusyId] = useState(null)
  const [filters, setFilters] = useState({
    search: '',
    jobsite: 'all',
    trade: 'all',
    status: 'all',
  })
  const [form, setForm] = useState({
    jobsite_id: '',
    subcontractor_company_id: '',
    status: 'pending',
  })

  async function load() {
    if (!user?.id) return
    setLoading(true)
    setError(null)
    try {
      const data = await getGcSubcontractorPageData(user.id)
      setJobsites(data.jobsites)
      setAssignments(data.assignments)
      setAvailableSubcontractors(data.availableSubcontractors)
      setPendingRequests(data.pendingRequests || [])
      setForm((current) => ({
        ...current,
        jobsite_id: current.jobsite_id || data.jobsites[0]?.id || '',
        subcontractor_company_id: current.subcontractor_company_id || data.availableSubcontractors[0]?.id || '',
      }))
    } catch (err) {
      setError(err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { load() }, [user?.id])

  const trades = useMemo(() => {
    const values = assignments
      .map((assignment) => assignment.subcontractor.trades_hired || assignment.subcontractor.company_type)
      .filter(Boolean)
    return [...new Set(values)].sort()
  }, [assignments])

  const filteredAssignments = useMemo(() => {
    const query = filters.search.trim().toLowerCase()
    return assignments.filter((assignment) => {
      const trade = assignment.subcontractor.trades_hired || assignment.subcontractor.company_type
      return (
        (!query || matches(assignment.subcontractor.company_name, query)) &&
        (filters.jobsite === 'all' || String(assignment.jobsite_id) === filters.jobsite) &&
        (filters.trade === 'all' || trade === filters.trade) &&
        (filters.status === 'all' || assignment.status === filters.status)
      )
    })
  }, [assignments, filters])

  const assignmentsByJobsite = useMemo(() => {
    const map = new Map(jobsites.map((jobsite) => [jobsite.id, []]))
    for (const assignment of filteredAssignments) {
      if (!map.has(assignment.jobsite_id)) map.set(assignment.jobsite_id, [])
      map.get(assignment.jobsite_id).push(assignment)
    }
    return map
  }, [filteredAssignments, jobsites])

  async function handleAssign(event) {
    event.preventDefault()
    if (!user?.id) return
    setBusyId('assign')
    setMessage(null)
    try {
      await createGcSubcontractorAssignment(user.id, form)
      setMessage({ type: 'success', text: form.status === 'pending' ? 'Subcontractor invitation sent.' : 'Subcontractor added to project team.' })
      await load()
    } catch (err) {
      setMessage({ type: 'error', text: err.message })
    } finally {
      setBusyId(null)
    }
  }

  async function handleStatusChange(assignmentId, status) {
    setBusyId(assignmentId)
    setMessage(null)
    try {
      await updateGcSubcontractorAssignment(assignmentId, { status })
      setAssignments((current) => current.map((assignment) => (
        assignment.id === assignmentId ? { ...assignment, status } : assignment
      )))
    } catch (err) {
      setMessage({ type: 'error', text: err.message })
    } finally {
      setBusyId(null)
    }
  }

  async function handleRemove(assignmentId) {
    setBusyId(assignmentId)
    setMessage(null)
    try {
      await removeGcSubcontractorAssignment(assignmentId)
      setAssignments((current) => current.filter((assignment) => assignment.id !== assignmentId))
      setMessage({ type: 'success', text: 'Subcontractor removed from jobsite.' })
    } catch (err) {
      setMessage({ type: 'error', text: err.message })
    } finally {
      setBusyId(null)
    }
  }

  async function handleRequestDecision(requestId, status) {
    if (!user?.id) return
    setBusyId(requestId)
    setMessage(null)
    try {
      await updateSubcontractorParticipationRequest(user.id, requestId, status)
      setPendingRequests((current) => current.filter((request) => request.id !== requestId))
      setMessage({
        type: 'success',
        text: status === 'approved' ? 'Subcontractor participation approved.' : 'Subcontractor request declined.',
      })
      await load()
    } catch (err) {
      setMessage({ type: 'error', text: err.message })
    } finally {
      setBusyId(null)
    }
  }

  return (
    <DashboardShell
      title="Project Team"
      subtitle="Invite subcontractors, review participation requests, and manage project teams."
    >
      {message && (
        <p className={`rounded-2xl border p-4 text-sm ${
          message.type === 'error'
            ? 'border-red-900/60 bg-red-950/40 text-red-300'
            : 'border-emerald-900/60 bg-emerald-950/40 text-emerald-300'
        }`}>
          {message.text}
        </p>
      )}

      <section className="rounded-3xl border border-slate-800 bg-slate-900 p-6">
        <h2 className="text-lg font-semibold text-white">Pending participation requests</h2>
        <p className="mt-1 text-sm text-slate-400">
          Subcontractors requesting to join your approved projects.
        </p>
        {pendingRequests.length === 0 ? (
          <p className="mt-4 rounded-2xl border border-slate-800 bg-slate-950 p-4 text-sm text-slate-400">
            No requests yet. Subcontractor requests from project pages will appear here.
          </p>
        ) : (
          <div className="mt-4 grid gap-3 lg:grid-cols-2">
            {pendingRequests.map((request) => (
              <article key={request.id} className="rounded-2xl border border-slate-800 bg-slate-950 p-4">
                <h3 className="font-semibold text-white">{request.company.company_name}</h3>
                <p className="mt-1 text-sm text-slate-400">
                  {request.project?.project_name || 'Project'} · {request.trade_scope || request.company.trades_hired || 'Trade not listed'}
                </p>
                {request.notes && <p className="mt-3 text-sm leading-6 text-slate-300">{request.notes}</p>}
                <div className="mt-4 flex flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={() => handleRequestDecision(request.id, 'approved')}
                    disabled={busyId === request.id}
                    className="rounded-xl bg-yellow-400 px-4 py-2 text-sm font-bold text-black hover:bg-yellow-300 disabled:opacity-60"
                  >
                    Approve
                  </button>
                  <button
                    type="button"
                    onClick={() => handleRequestDecision(request.id, 'rejected')}
                    disabled={busyId === request.id}
                    className="rounded-xl border border-slate-700 px-4 py-2 text-sm font-semibold text-slate-200 hover:border-red-400/60 hover:text-red-300 disabled:opacity-60"
                  >
                    Decline
                  </button>
                </div>
              </article>
            ))}
          </div>
        )}
      </section>

      <section className="rounded-3xl border border-slate-800 bg-slate-900 p-6">
        <h2 className="text-lg font-semibold text-white">Invite subcontractor</h2>
        <form onSubmit={handleAssign} className="mt-4 grid gap-3 md:grid-cols-[1fr_1fr_auto_auto]">
          <select
            value={form.jobsite_id}
            onChange={(event) => setForm((current) => ({ ...current, jobsite_id: event.target.value }))}
            disabled={jobsites.length === 0}
            required
          >
            {jobsites.length === 0 && <option value="">No jobsites available</option>}
            {jobsites.map((jobsite) => (
              <option key={jobsite.id} value={jobsite.id}>{jobsite.name}</option>
            ))}
          </select>
          <select
            value={form.subcontractor_company_id}
            onChange={(event) => setForm((current) => ({ ...current, subcontractor_company_id: event.target.value }))}
            disabled={availableSubcontractors.length === 0}
            required
          >
            {availableSubcontractors.length === 0 && <option value="">No subcontractors available</option>}
            {availableSubcontractors.map((company) => (
              <option key={company.id} value={company.id}>{company.company_name}</option>
            ))}
          </select>
          <select
            value={form.status}
            onChange={(event) => setForm((current) => ({ ...current, status: event.target.value }))}
          >
            {STATUS_OPTIONS.filter((status) => status !== 'removed').map((status) => (
              <option key={status} value={status}>{status}</option>
            ))}
          </select>
          <button
            type="submit"
            disabled={busyId === 'assign' || jobsites.length === 0 || availableSubcontractors.length === 0}
            className="rounded-xl bg-yellow-400 px-4 py-2 text-sm font-bold text-black hover:bg-yellow-300 disabled:opacity-60"
          >
            {busyId === 'assign' ? 'Sending...' : form.status === 'pending' ? 'Send Invitation' : 'Add'}
          </button>
        </form>
        {availableSubcontractors.length === 0 && !loading && (
          <p className="mt-3 text-sm text-slate-400">
            No approved subcontractor project connections are available to assign yet.
          </p>
        )}
        {availableSubcontractors.length > 0 && jobsites.length === 0 && !loading && (
          <p className="mt-3 text-sm text-slate-400">
            Approved subcontractors were found, but no jobsite rows are available to assign them to yet.
          </p>
        )}
      </section>

      <section className="rounded-3xl border border-slate-800 bg-slate-900 p-6">
        <div className="grid gap-3 md:grid-cols-4">
          <input
            value={filters.search}
            onChange={(event) => setFilters((current) => ({ ...current, search: event.target.value }))}
            placeholder="Search company..."
          />
          <select
            value={filters.jobsite}
            onChange={(event) => setFilters((current) => ({ ...current, jobsite: event.target.value }))}
          >
            <option value="all">All jobsites</option>
            {jobsites.map((jobsite) => (
              <option key={jobsite.id} value={jobsite.id}>{jobsite.name}</option>
            ))}
          </select>
          <select
            value={filters.trade}
            onChange={(event) => setFilters((current) => ({ ...current, trade: event.target.value }))}
          >
            <option value="all">All trades</option>
            {trades.map((trade) => (
              <option key={trade} value={trade}>{trade}</option>
            ))}
          </select>
          <select
            value={filters.status}
            onChange={(event) => setFilters((current) => ({ ...current, status: event.target.value }))}
          >
            <option value="all">All statuses</option>
            {STATUS_OPTIONS.map((status) => (
              <option key={status} value={status}>{status}</option>
            ))}
          </select>
        </div>
      </section>

      {loading && <p className="rounded-3xl border border-slate-800 bg-slate-900 p-6 text-sm text-slate-400">Loading subcontractors...</p>}
      {error && <p className="rounded-3xl border border-red-900/60 bg-red-950/40 p-6 text-sm text-red-300">{error.message}</p>}

      {!loading && !error && assignments.length === 0 && (
        <p className="rounded-3xl border border-slate-800 bg-slate-900 p-6 text-sm text-slate-400">
          No subcontractors connected yet. Invite subcontractors or approve participation requests as your project team grows.
        </p>
      )}

      {!loading && !error && assignments.length > 0 && (
        <div className="space-y-6">
          {jobsites.map((jobsite) => {
            const jobsiteAssignments = assignmentsByJobsite.get(jobsite.id) || []
            if (filters.jobsite !== 'all' && String(jobsite.id) !== filters.jobsite) return null
            return (
              <section key={jobsite.id} className="rounded-3xl border border-slate-800 bg-slate-900 p-6">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <h2 className="text-xl font-semibold text-white">{jobsite.name}</h2>
                    <p className="mt-1 text-sm text-slate-400">{jobsite.location}</p>
                  </div>
                  <span className="rounded-full border border-slate-700 bg-slate-950 px-3 py-1 text-xs font-bold text-slate-200">
                    {jobsiteAssignments.length} assigned
                  </span>
                </div>

                {jobsiteAssignments.length === 0 ? (
                  <p className="mt-4 text-sm text-slate-400">No subcontractors match the current filters for this jobsite.</p>
                ) : (
                  <div className="mt-4 space-y-3">
                    {jobsiteAssignments.map((assignment) => (
                      <article key={assignment.id} className="rounded-2xl border border-slate-800 bg-slate-950 p-4">
                        <div className="flex flex-wrap items-start justify-between gap-4">
                          <div>
                            <h3 className="text-lg font-semibold text-white">{assignment.subcontractor.company_name}</h3>
                            <p className="mt-1 text-sm text-slate-400">
                              {assignment.subcontractor.trades_hired || assignment.subcontractor.company_type || 'Trade not listed'}
                            </p>
                            <div className="mt-3 flex flex-wrap gap-x-4 gap-y-1 text-sm text-slate-400">
                              <span>{assignment.subcontractor.email || 'No email listed'}</span>
                              <span>{assignment.subcontractor.phone || 'No phone listed'}</span>
                              <span>Connected {formatDate(assignment.created_at)}</span>
                            </div>
                          </div>
                          <div className="flex flex-wrap items-center gap-2">
                            {assignment.subcontractor.website && (
                              <a
                                href={assignment.subcontractor.website}
                                target="_blank"
                                rel="noreferrer"
                                className="rounded-lg border border-slate-700 px-3 py-2 text-sm font-semibold text-slate-100 hover:border-yellow-400/50"
                              >
                                View company profile
                              </a>
                            )}
                            <select
                              value={assignment.status}
                              disabled={busyId === assignment.id || assignment.virtual}
                              onChange={(event) => handleStatusChange(assignment.id, event.target.value)}
                              className="w-auto"
                            >
                              {STATUS_OPTIONS.map((status) => (
                                <option key={status} value={status}>{status}</option>
                              ))}
                            </select>
                            <button
                              type="button"
                              onClick={() => handleRemove(assignment.id)}
                              disabled={busyId === assignment.id || assignment.virtual}
                              className="rounded-lg border border-red-900/60 px-3 py-2 text-sm font-semibold text-red-300 hover:bg-red-950/40 disabled:opacity-60"
                            >
                              Remove
                            </button>
                            {assignment.virtual && (
                              <span className="text-xs font-semibold text-slate-500">
                                Approved project connection
                              </span>
                            )}
                          </div>
                        </div>
                      </article>
                    ))}
                  </div>
                )}
              </section>
            )
          })}
        </div>
      )}
    </DashboardShell>
  )
}
