import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { BriefcaseBusiness, Building2, HardHat, UsersRound } from 'lucide-react'
import { useAuth } from '../../hooks/useAuth'
import { getApplicantsForMyCompany } from '../../services/applicationsService'
import { getMyCompanyProfile } from '../../services/companiesService'
import { getSubcontractorInvitationsForUser, updateSubcontractorInvitation } from '../../services/gcSubcontractorsService'
import { getApprovedProjectsForUser, getMyCompanyJobs } from '../../services/jobsService'

function StatCard({ label, value, icon: Icon }) {
  return (
    <div className="rounded-2xl border border-slate-800 bg-slate-950 p-4">
      <div className="flex items-center justify-between gap-3">
        <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">{label}</p>
        <span className="flex h-9 w-9 items-center justify-center rounded-xl border border-yellow-400/25 bg-yellow-400/10 text-yellow-300">
          <Icon size={17} aria-hidden="true" />
        </span>
      </div>
      <p className="mt-3 text-3xl font-black text-white">{value}</p>
    </div>
  )
}

function QuickAction({ to, children, primary = false }) {
  return (
    <Link
      to={to}
      className={`inline-flex min-h-11 items-center justify-center rounded-xl px-4 py-2 text-sm font-bold transition ${
        primary
          ? 'bg-yellow-400 text-black hover:bg-yellow-300'
          : 'border border-slate-700 bg-slate-950 text-slate-100 hover:border-yellow-400/50'
      }`}
    >
      {children}
    </Link>
  )
}

function CompanyTrustPanel({ company }) {
  const missing = [
    !company?.logo_url ? 'Add company logo' : null,
    !company?.description ? 'Add crew description' : null,
    !company?.website ? 'Add website' : null,
    !company?.trades_hired ? 'Add trade specialties' : null,
    !company?.service_area ? 'Add service area' : null,
  ].filter(Boolean)

  return (
    <div className="rounded-3xl border border-slate-800 bg-slate-900 p-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-lg font-semibold text-white">Company identity</h2>
          <p className="mt-1 text-sm text-slate-400">Show GCs what your crew does and help workers recognize your job posts.</p>
        </div>
        <QuickAction to="/sc/company">Update Company Profile</QuickAction>
      </div>
      {missing.length === 0 ? (
        <p className="mt-4 rounded-2xl border border-emerald-900/50 bg-emerald-950/30 p-4 text-sm text-emerald-200">
          Your company profile has the core trust details GCs and workers expect.
        </p>
      ) : (
        <ul className="mt-4 grid gap-2 text-sm text-slate-300 sm:grid-cols-2">
          {missing.map((item) => (
            <li key={item} className="rounded-xl border border-slate-800 bg-slate-950 px-3 py-2">{item}</li>
          ))}
        </ul>
      )}
    </div>
  )
}

export default function SCDashboardPage() {
  const { user, loading } = useAuth()
  const [data, setData] = useState({ company: null, projects: [], jobs: [], applicants: [], invitations: [] })
  const [workspaceLoading, setWorkspaceLoading] = useState(false)
  const [workspaceError, setWorkspaceError] = useState(null)
  const [busyInvitationId, setBusyInvitationId] = useState(null)
  const [message, setMessage] = useState(null)

  useEffect(() => {
    if (loading || !user) return
    let mounted = true
    setWorkspaceLoading(true)
    setWorkspaceError(null)
    Promise.all([
      getMyCompanyProfile(user.id).catch(() => null),
      getApprovedProjectsForUser(user.id),
      getMyCompanyJobs(user.id).catch(() => []),
      getApplicantsForMyCompany(user.id).catch(() => []),
      getSubcontractorInvitationsForUser(user.id).catch(() => []),
    ])
      .then(([company, projects, jobs, applicants, invitations]) => {
        if (mounted) setData({ company, projects, jobs, applicants, invitations })
      })
      .catch((err) => { if (mounted) setWorkspaceError(err) })
      .finally(() => { if (mounted) setWorkspaceLoading(false) })
    return () => { mounted = false }
  }, [user, loading])

  if (loading) {
    return <div className="rounded-3xl border border-slate-800 bg-slate-900 p-6 text-slate-400">Loading...</div>
  }

  if (!user) {
    return (
      <div className="rounded-3xl border border-slate-800 bg-slate-900 p-6">
        <h1 className="text-2xl font-bold">Subcontractor workspace</h1>
        <p className="mt-2 text-slate-400">Please sign in to access your subcontractor workspace.</p>
        <Link to="/signin" className="mt-6 inline-block rounded-xl bg-yellow-400 px-4 py-2 font-bold text-black">
          Sign in
        </Link>
      </div>
    )
  }

  const companyName = data.company?.company_name || user.user_metadata?.company_name || user.user_metadata?.full_name || user.email
  const openJobs = data.jobs.filter((job) => String(job.status || '').toLowerCase() === 'open')

  async function handleInvitation(invitationId, decision) {
    if (!user?.id) return
    setBusyInvitationId(invitationId)
    setMessage(null)
    try {
      await updateSubcontractorInvitation(user.id, invitationId, decision)
      setData((current) => ({
        ...current,
        invitations: current.invitations.filter((invitation) => invitation.id !== invitationId),
      }))
      setMessage({
        type: 'success',
        text: decision === 'active' ? 'Project invitation accepted.' : 'Project invitation declined.',
      })
    } catch (err) {
      setMessage({ type: 'error', text: err.message })
    } finally {
      setBusyInvitationId(null)
    }
  }

  return (
    <div className="space-y-6">
      <div className="rounded-3xl border border-slate-800 bg-slate-900 p-6">
        <p className="text-sm font-semibold text-yellow-300">Subcontractor Workspace</p>
        <h1 className="mt-1 text-3xl font-black">Welcome, {companyName}</h1>
        <p className="mt-2 text-slate-400">Manage joined projects, crew job posts, and applicants from one place.</p>
      </div>

      {workspaceError && (
        <div className="rounded-2xl border border-red-900/60 bg-red-950/40 p-4 text-sm text-red-300">
          {workspaceError.message}
        </div>
      )}
      {message && (
        <div className={`rounded-2xl border p-4 text-sm ${
          message.type === 'error'
            ? 'border-red-900/60 bg-red-950/40 text-red-300'
            : 'border-emerald-900/60 bg-emerald-950/40 text-emerald-300'
        }`}>
          {message.text}
        </div>
      )}

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Joined Projects" value={workspaceLoading ? '...' : data.projects.length} icon={Building2} />
        <StatCard label="Open Jobs" value={workspaceLoading ? '...' : openJobs.length} icon={BriefcaseBusiness} />
        <StatCard label="Applicants" value={workspaceLoading ? '...' : data.applicants.length} icon={UsersRound} />
        <StatCard label="Invitations" value={workspaceLoading ? '...' : data.invitations.length} icon={HardHat} />
      </div>

      <div className="rounded-3xl border border-slate-800 bg-slate-900 p-6">
        <h2 className="text-lg font-semibold text-white">Quick actions</h2>
        <div className="mt-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          <QuickAction to="/jobsites" primary>Join Project</QuickAction>
          <QuickAction to="/sc/jobs">Post Job</QuickAction>
          <QuickAction to="/sc/applicants">Review Applicants</QuickAction>
          <QuickAction to="/sc/company">Update Company Profile</QuickAction>
        </div>
      </div>

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_380px]">
        <div className="rounded-3xl border border-slate-800 bg-slate-900 p-6">
          <h2 className="text-lg font-semibold text-white">Joined projects</h2>
          <p className="mt-1 text-sm text-slate-400">Approved projects where your company can hire workers.</p>
          {workspaceLoading && <p className="mt-4 text-sm text-slate-400">Loading workspace...</p>}
          {!workspaceLoading && data.projects.length === 0 && (
            <div className="mt-4 rounded-2xl border border-slate-800 bg-slate-950 p-4">
              <p className="text-sm font-semibold text-white">No joined projects yet</p>
              <p className="mt-2 text-sm leading-6 text-slate-400">
                Find a project and request participation. Once approved, you can post crew roles tied to that project.
              </p>
              <QuickAction to="/jobsites" primary>Find a project</QuickAction>
            </div>
          )}
          {data.projects.length > 0 && (
            <div className="mt-4 grid gap-3 sm:grid-cols-2">
              {data.projects.slice(0, 4).map((project) => (
                <Link
                  key={project.id}
                  to={`/projects/${project.project_id}`}
                  className="overflow-hidden rounded-2xl border border-slate-800 bg-slate-950 transition hover:border-yellow-400/50"
                >
                  {project._primaryImage && (
                    <img
                      src={project._primaryImage.image_url}
                      alt={project._primaryImage.alt_text || `${project.project_name || 'Jobsite'} photo`}
                      className="aspect-[16/9] w-full object-cover"
                    />
                  )}
                  <div className="p-4">
                    <h3 className="font-semibold text-white">{project.project_name}</h3>
                    <p className="mt-1 text-sm text-slate-400">
                      {[project.city, project.province].filter(Boolean).join(', ') || 'Location not listed'}
                    </p>
                    {project.trade_scope && <p className="mt-2 text-sm text-yellow-200">{project.trade_scope}</p>}
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>

        <div className="rounded-3xl border border-slate-800 bg-slate-900 p-6">
          <h2 className="text-lg font-semibold text-white">Hiring activity</h2>
          {data.jobs.length === 0 ? (
            <div className="mt-4 rounded-2xl border border-slate-800 bg-slate-950 p-4">
              <p className="text-sm font-semibold text-white">No jobs posted yet</p>
              <p className="mt-2 text-sm leading-6 text-slate-400">Post a role once your company has an approved project connection.</p>
              <QuickAction to="/sc/jobs">Post Job</QuickAction>
            </div>
          ) : (
            <div className="mt-4 space-y-3">
              {data.jobs.slice(0, 4).map((job) => (
                <Link key={job.id} to="/sc/jobs" className="block rounded-2xl border border-slate-800 bg-slate-950 p-4 hover:border-yellow-400/50">
                  <p className="font-semibold text-white">{job.title}</p>
                  <p className="mt-1 text-sm text-slate-400">{job.trade || 'Trade not listed'} · {job.status || 'open'}</p>
                </Link>
              ))}
            </div>
          )}
        </div>
      </div>

      <div className="rounded-3xl border border-slate-800 bg-slate-900 p-6">
        <h2 className="text-lg font-semibold text-white">Project invitations</h2>
        <p className="mt-1 text-sm text-slate-400">General Contractors can invite your company to participate on projects.</p>
        {data.invitations.length === 0 ? (
          <p className="mt-4 rounded-2xl border border-slate-800 bg-slate-950 p-4 text-sm text-slate-400">
            No invitations yet. You can still find a project and request participation from the project page.
          </p>
        ) : (
          <div className="mt-4 grid gap-3 lg:grid-cols-2">
            {data.invitations.map((invitation) => (
              <article key={invitation.id} className="rounded-2xl border border-slate-800 bg-slate-950 p-4">
                <h3 className="font-semibold text-white">{invitation.jobsite.name}</h3>
                <p className="mt-1 text-sm text-slate-400">
                  Invited by {invitation.gcCompany.company_name}
                </p>
                <div className="mt-4 flex flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={() => handleInvitation(invitation.id, 'active')}
                    disabled={busyInvitationId === invitation.id}
                    className="rounded-xl bg-yellow-400 px-4 py-2 text-sm font-bold text-black hover:bg-yellow-300 disabled:opacity-60"
                  >
                    Accept
                  </button>
                  <button
                    type="button"
                    onClick={() => handleInvitation(invitation.id, 'removed')}
                    disabled={busyInvitationId === invitation.id}
                    className="rounded-xl border border-slate-700 px-4 py-2 text-sm font-semibold text-slate-200 hover:border-red-400/60 hover:text-red-300 disabled:opacity-60"
                  >
                    Decline
                  </button>
                </div>
              </article>
            ))}
          </div>
        )}
      </div>

      <CompanyTrustPanel company={data.company} />
    </div>
  )
}
