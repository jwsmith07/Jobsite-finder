import { useEffect, useMemo, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { BriefcaseBusiness, Camera, ExternalLink, FilePenLine, Save, Users } from 'lucide-react'
import DashboardShell from '../../components/layout/DashboardShell'
import ProjectImageManager from '../../components/projects/ProjectImageManager'
import JobCard from '../../components/jobs/JobCard'
import { useAuth } from '../../hooks/useAuth'
import { formatDate } from '../../lib/utils'
import { getAvailabilityLabel, getProfileCertifications, normalizeList } from '../../lib/workerCredentials'
import { createJobPost, deleteJobPost, updateJobPost } from '../../services/jobsService'
import { updateApplication } from '../../services/applicationsService'
import {
  CANDIDATE_STAGES,
  createProjectSubcontractorAssignment,
  getGcProjectWorkspaceData,
  removeProjectSubcontractorAssignment,
  removeProjectCandidate,
  saveProjectCandidate,
  updateGcProjectWorkspaceProject,
  updateProjectCandidate,
  updateProjectSubcontractorAssignment,
} from '../../services/gcProjectWorkspaceService'

const tabs = ['overview', 'photos', 'jobs', 'applicants', 'talent', 'candidates', 'subcontractors']
const emptyJob = {
  title: '',
  trade: '',
  positions_count: 1,
  status: 'open',
  schedule: '',
  pay_range: '',
  description: '',
  requirements: '',
}
const applicantStatuses = [
  { value: 'submitted', label: 'Applied' },
  { value: 'shortlisted', label: 'Reviewed' },
  { value: 'interview', label: 'Interview' },
  { value: 'hired', label: 'Hired' },
  { value: 'rejected', label: 'Rejected' },
]

const badgeBase = 'inline-flex rounded-full border px-2.5 py-1 text-xs font-semibold'

function label(value) {
  return value || 'Not listed'
}

function StatusBadge({ children, tone = 'slate' }) {
  const tones = {
    yellow: 'border-yellow-400/40 bg-yellow-400/10 text-yellow-300',
    green: 'border-emerald-900/60 bg-emerald-950/40 text-emerald-300',
    red: 'border-red-900/60 bg-red-950/40 text-red-300',
    slate: 'border-slate-700 bg-slate-950 text-slate-300',
  }
  return <span className={`${badgeBase} ${tones[tone] || tones.slate}`}>{children}</span>
}

function SummaryCard({ label: title, value }) {
  return (
    <div className="rounded-2xl border border-slate-800 bg-slate-900 p-4">
      <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">{title}</p>
      <p className="mt-2 text-2xl font-black text-white">{value}</p>
    </div>
  )
}

const emptyApplicantFilters = {
  trade: '',
  tradeLevel: '',
  availability: '',
  certification: '',
  region: '',
  status: '',
}

function fieldValue(project, key) {
  return project?.[key] || ''
}

function buildActivity(data) {
  if (!data?.authorized) return []
  const jobs = (data.jobs || []).map((job) => ({
    id: job.id,
    type: 'job',
    date: job.created_at,
    label: `Job ${job.status === 'open' ? 'created' : 'updated'}: ${job.title || job.trade || 'Job post'}`,
  }))
  const applications = (data.applications || []).map((application) => ({
    id: application.id,
    type: 'application',
    date: application.created_at,
    label: `Applicant added: ${application.worker_name || 'Applicant'}`,
  }))
  const assignments = (data.subcontractorAssignments || []).map((assignment) => ({
    id: assignment.id,
    type: 'subcontractor',
    date: assignment.created_at,
    label: `Subcontractor assigned: ${assignment.subcontractor?.company_name || 'Company'}`,
  }))
  const images = (data.images || []).map((image) => ({
    id: image.id,
    type: 'photo',
    date: image.created_at,
    label: `Photo uploaded${image.caption ? `: ${image.caption}` : ''}`,
  }))
  return [...jobs, ...applications, ...assignments, ...images]
    .filter((item) => item.date)
    .sort((a, b) => new Date(b.date || 0) - new Date(a.date || 0))
    .slice(0, 8)
}

export default function GCProjectWorkspacePage() {
  const { projectId } = useParams()
  const { user, loading: authLoading } = useAuth()
  const [activeTab, setActiveTab] = useState('overview')
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [message, setMessage] = useState(null)
  const [editMode, setEditMode] = useState(false)
  const [draft, setDraft] = useState({})
  const [saving, setSaving] = useState(false)
  const [busyJobId, setBusyJobId] = useState(null)
  const [jobFormOpen, setJobFormOpen] = useState(false)
  const [jobForm, setJobForm] = useState(emptyJob)
  const [editingJobId, setEditingJobId] = useState(null)
  const [savingJob, setSavingJob] = useState(false)
  const [busyApplicationId, setBusyApplicationId] = useState(null)
  const [busyCandidateKey, setBusyCandidateKey] = useState(null)
  const [applicantFilters, setApplicantFilters] = useState(emptyApplicantFilters)
  const [candidateFilters, setCandidateFilters] = useState(emptyApplicantFilters)
  const [expandedWorkerId, setExpandedWorkerId] = useState(null)
  const [busyAssignmentId, setBusyAssignmentId] = useState(null)
  const [subcontractorId, setSubcontractorId] = useState('')
  const [assigning, setAssigning] = useState(false)

  async function load() {
    if (!user?.id || !projectId) return
    setLoading(true)
    setError(null)
    try {
      const next = await getGcProjectWorkspaceData(user.id, projectId)
      setData(next)
      setDraft({
        display_address: fieldValue(next.project, 'display_address'),
        site_access_notes: fieldValue(next.project, 'site_access_notes'),
        gate_entrance: fieldValue(next.project, 'gate_entrance'),
        parking_instructions: fieldValue(next.project, 'parking_instructions'),
        muster_point: fieldValue(next.project, 'muster_point'),
        google_maps_url: fieldValue(next.project, 'google_maps_url'),
        description: fieldValue(next.project, 'description'),
        stage: fieldValue(next.project, 'stage'),
        hiring_status: fieldValue(next.project, 'hiring_status'),
        end_date: fieldValue(next.project, 'end_date')?.slice(0, 10),
        trades_needed: fieldValue(next.project, 'trades_needed'),
        is_public: next.project?.is_public !== false,
      })
      setSubcontractorId(next.availableSubcontractors?.[0]?.id || '')
    } catch (err) {
      setError(err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (authLoading) return
    load()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [authLoading, user?.id, projectId])

  const project = data?.project
  const jobs = data?.jobs || []
  const openJobs = useMemo(() => jobs.filter((job) => job.status === 'open'), [jobs])
  const closedJobs = useMemo(() => jobs.filter((job) => job.status !== 'open'), [jobs])
  const activity = useMemo(() => buildActivity(data), [data])
  const applicants = data?.applications || []
  const filterOptions = useMemo(() => buildApplicantFilterOptions(applicants), [applicants])
  const filteredApplicants = useMemo(
    () => applicants.filter((application) => applicantMatchesFilters(application, applicantFilters)),
    [applicants, applicantFilters],
  )
  const savedCandidateRows = useMemo(() => buildSavedCandidateRows(data), [data])
  const candidateFilterOptions = useMemo(() => buildApplicantFilterOptions(savedCandidateRows), [savedCandidateRows])
  const filteredSavedCandidates = useMemo(
    () => savedCandidateRows.filter((row) => applicantMatchesFilters(row, candidateFilters)),
    [savedCandidateRows, candidateFilters],
  )
  const hiringSummary = data?.summary || {}

  function setDraftField(field, value) {
    setDraft((current) => ({ ...current, [field]: value }))
  }

  async function saveProjectDetails() {
    if (!project?.id) return
    setSaving(true)
      setMessage(null)
    try {
      await updateGcProjectWorkspaceProject(user.id, project.id, draft)
      await load()
      setEditMode(false)
      setMessage({ type: 'success', text: 'Project details updated.' })
    } catch (err) {
      setMessage({ type: 'error', text: err.message })
    } finally {
      setSaving(false)
    }
  }

  function startCreateJob() {
    setEditingJobId(null)
    setJobForm({ ...emptyJob })
    setJobFormOpen(true)
  }

  function startEditJob(job) {
    setEditingJobId(job.id)
    setJobForm({
      title: job.title || '',
      trade: job.trade || '',
      positions_count: job.positions_count || 1,
      status: job.status || 'open',
      schedule: job.schedule || '',
      pay_range: job.pay_range || '',
      description: job.description || '',
      requirements: job.requirements || '',
    })
    setJobFormOpen(true)
  }

  function setJobField(field, value) {
    setJobForm((current) => ({ ...current, [field]: value }))
  }

  async function saveJob(event) {
    event.preventDefault()
    if (!user?.id || !project?.id) return
    setSavingJob(true)
    setMessage(null)
    try {
      if (editingJobId) {
        await updateJobPost(editingJobId, user.id, jobForm)
        setMessage({ type: 'success', text: 'Job updated.' })
      } else {
        await createJobPost(user.id, { ...jobForm, project_id: project.id })
        setMessage({ type: 'success', text: 'Job created.' })
      }
      setJobFormOpen(false)
      setEditingJobId(null)
      setJobForm({ ...emptyJob })
      await load()
    } catch (err) {
      setMessage({ type: 'error', text: err.message })
    } finally {
      setSavingJob(false)
    }
  }

  async function closeJob(job) {
    if (!user?.id || !job?.id) return
    setBusyJobId(job.id)
    setMessage(null)
    try {
      await updateJobPost(job.id, user.id, { status: 'closed' })
      await load()
      setMessage({ type: 'success', text: 'Job closed.' })
    } catch (err) {
      setMessage({ type: 'error', text: err.message })
    } finally {
      setBusyJobId(null)
    }
  }

  async function setJobStatus(job, status) {
    if (!user?.id || !job?.id) return
    setBusyJobId(job.id)
    setMessage(null)
    try {
      await updateJobPost(job.id, user.id, { status })
      await load()
      setMessage({ type: 'success', text: `Job marked ${status}.` })
    } catch (err) {
      setMessage({ type: 'error', text: err.message })
    } finally {
      setBusyJobId(null)
    }
  }

  async function removeJob(job) {
    if (!user?.id || !job?.id) return
    const ok = window.confirm('Delete this job? Jobs with applicants will be archived.')
    if (!ok) return
    setBusyJobId(job.id)
    setMessage(null)
    try {
      await deleteJobPost(job.id, user.id)
      await load()
      setMessage({ type: 'success', text: 'Job removed.' })
    } catch (err) {
      setMessage({ type: 'error', text: err.message })
    } finally {
      setBusyJobId(null)
    }
  }

  async function changeApplicationStatus(application, status) {
    if (!user?.id || !application?.id) return
    setBusyApplicationId(application.id)
    setMessage(null)
    try {
      await updateApplication(application.id, user.id, { status })
      await load()
      setMessage({ type: 'success', text: 'Applicant status updated.' })
    } catch (err) {
      setMessage({ type: 'error', text: err.message })
    } finally {
      setBusyApplicationId(null)
    }
  }

  async function saveCandidate(workerProfileId, values = {}) {
    if (!user?.id || !project?.id || !workerProfileId) return
    setBusyCandidateKey(workerProfileId)
    setMessage(null)
    try {
      await saveProjectCandidate(user.id, project.id, workerProfileId, values)
      await load()
      setMessage({ type: 'success', text: 'Candidate saved.' })
    } catch (err) {
      setMessage({ type: 'error', text: err.message })
    } finally {
      setBusyCandidateKey(null)
    }
  }

  async function updateCandidate(candidate, values) {
    if (!user?.id || !project?.id || !candidate?.id) return
    setBusyCandidateKey(candidate.worker_profile_id)
    setMessage(null)
    try {
      await updateProjectCandidate(user.id, project.id, candidate.id, values)
      await load()
      setMessage({ type: 'success', text: 'Candidate updated.' })
    } catch (err) {
      setMessage({ type: 'error', text: err.message })
    } finally {
      setBusyCandidateKey(null)
    }
  }

  async function removeCandidate(candidate) {
    if (!user?.id || !project?.id || !candidate?.id) return
    setBusyCandidateKey(candidate.worker_profile_id)
    setMessage(null)
    try {
      await removeProjectCandidate(user.id, project.id, candidate.id)
      await load()
      setMessage({ type: 'success', text: 'Candidate removed.' })
    } catch (err) {
      setMessage({ type: 'error', text: err.message })
    } finally {
      setBusyCandidateKey(null)
    }
  }

  async function assignSubcontractor(event) {
    event.preventDefault()
    if (!user?.id || !project?.id || !subcontractorId) return
    setAssigning(true)
    setMessage(null)
    try {
      await createProjectSubcontractorAssignment(user.id, project.id, subcontractorId)
      await load()
      setMessage({ type: 'success', text: 'Subcontractor assigned.' })
    } catch (err) {
      setMessage({ type: 'error', text: err.message })
    } finally {
      setAssigning(false)
    }
  }

  async function setAssignmentStatus(assignment, status) {
    if (!user?.id || !project?.id || !assignment?.id) return
    setBusyAssignmentId(assignment.id)
    setMessage(null)
    try {
      await updateProjectSubcontractorAssignment(user.id, project.id, assignment.id, { status })
      await load()
      setMessage({ type: 'success', text: 'Subcontractor status updated.' })
    } catch (err) {
      setMessage({ type: 'error', text: err.message })
    } finally {
      setBusyAssignmentId(null)
    }
  }

  async function removeAssignment(assignment) {
    if (!user?.id || !project?.id || !assignment?.id) return
    const ok = window.confirm('Remove this subcontractor assignment?')
    if (!ok) return
    setBusyAssignmentId(assignment.id)
    setMessage(null)
    try {
      await removeProjectSubcontractorAssignment(user.id, project.id, assignment.id)
      await load()
      setMessage({ type: 'success', text: 'Subcontractor removed.' })
    } catch (err) {
      setMessage({ type: 'error', text: err.message })
    } finally {
      setBusyAssignmentId(null)
    }
  }

  if (authLoading || loading) {
    return (
      <DashboardShell title="Project Workspace">
        <p className="rounded-2xl border border-slate-800 bg-slate-900 p-4 text-sm text-slate-400">
          Loading project workspace...
        </p>
      </DashboardShell>
    )
  }

  if (error) {
    return (
      <DashboardShell title="Project Workspace">
        <div className="rounded-2xl border border-red-900/60 bg-red-950/40 p-4 text-sm text-red-300">
          {error.message}
        </div>
      </DashboardShell>
    )
  }

  if (!data?.authorized) {
    return (
      <DashboardShell title="Access Denied">
        <div className="rounded-2xl border border-red-900/60 bg-red-950/40 p-5 text-sm text-red-200">
          You need an approved Primary GC claim to manage this project.
        </div>
      </DashboardShell>
    )
  }

  return (
    <DashboardShell
      title={project.project_name || 'Project Workspace'}
      subtitle={[project.city, project.province].filter(Boolean).join(', ') || 'Location not listed'}
      actions={
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => setEditMode((current) => !current)}
            className="inline-flex items-center gap-2 rounded-xl border border-slate-700 px-4 py-2 text-sm font-semibold text-slate-100 hover:border-yellow-400/50"
          >
            <FilePenLine size={16} aria-hidden="true" />
            Edit Project
          </button>
          <Link
            to={`/projects/${project.id}`}
            className="inline-flex items-center gap-2 rounded-xl bg-yellow-400 px-4 py-2 text-sm font-bold text-black hover:bg-yellow-300"
          >
            <ExternalLink size={16} aria-hidden="true" />
            View Public Project
          </Link>
        </div>
      }
    >
      {message && (
        <div className={`rounded-2xl border p-4 text-sm ${
          message.type === 'error'
            ? 'border-red-900/60 bg-red-950/40 text-red-300'
            : 'border-emerald-900/60 bg-emerald-950/40 text-emerald-300'
        }`}>
          {message.text}
        </div>
      )}

      <section className="rounded-3xl border border-slate-800 bg-slate-900 p-5">
        <div className="flex flex-wrap gap-2">
          <StatusBadge tone="yellow">Primary GC</StatusBadge>
          <StatusBadge>{label(project.stage)}</StatusBadge>
          <StatusBadge>{label(project.hiring_status)}</StatusBadge>
          <StatusBadge tone={project.review_status === 'approved' ? 'green' : 'slate'}>
            {label(project.review_status)}
          </StatusBadge>
          <StatusBadge>{label(project.project_type)}</StatusBadge>
        </div>
      </section>

      <section className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <SummaryCard label="Project Photos" value={data.summary.photoCount} />
        <SummaryCard label="Open Jobs" value={data.summary.openJobsCount} />
        <SummaryCard label="Applicants" value={data.summary.applicantCount} />
        <SummaryCard label="Subcontractors" value={data.summary.assignedSubcontractorCount} />
      </section>

      <section className="grid gap-3 sm:grid-cols-2 lg:grid-cols-6">
        <SummaryCard label="Reviewed" value={hiringSummary.reviewedCount || 0} />
        <SummaryCard label="Interview" value={hiringSummary.interviewCount || 0} />
        <SummaryCard label="Hired" value={hiringSummary.hiredCount || 0} />
        <SummaryCard label="Rejected" value={hiringSummary.rejectedCount || 0} />
        <SummaryCard label="Open Positions" value={hiringSummary.openPositionsCount || 0} />
        <SummaryCard label="Talent Pool" value={data.talentPool?.length || 0} />
      </section>

      <section className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <SummaryCard label="Saved Candidates" value={hiringSummary.savedCandidateCount || 0} />
        <SummaryCard label="Interviews" value={hiringSummary.candidateInterviewCount || 0} />
        <SummaryCard label="Offers" value={hiringSummary.candidateOfferCount || 0} />
        <SummaryCard label="Hires" value={hiringSummary.candidateHireCount || 0} />
      </section>

      <section className="rounded-3xl border border-slate-800 bg-slate-900 p-5">
        <h2 className="text-lg font-semibold text-white">Recent Activity</h2>
        <div className="mt-3 grid gap-2">
          {activity.map((item) => (
            <div key={`${item.type}-${item.id}`} className="flex items-center justify-between gap-3 rounded-xl border border-slate-800 bg-slate-950 px-3 py-2 text-sm">
              <span className="text-slate-200">{item.label}</span>
              <span className="text-xs text-slate-500">{formatDate(item.date)}</span>
            </div>
          ))}
          {activity.length === 0 && <p className="text-sm text-slate-400">No recent project activity yet.</p>}
        </div>
      </section>

      <nav className="flex flex-wrap gap-2 rounded-2xl border border-slate-800 bg-slate-900 p-2">
        {tabs.map((tab) => (
          <button
            key={tab}
            type="button"
            onClick={() => setActiveTab(tab)}
            className={`rounded-xl px-4 py-2 text-sm font-semibold capitalize ${
              activeTab === tab
                ? 'bg-yellow-400 text-black'
                : 'text-slate-300 hover:bg-slate-800 hover:text-white'
            }`}
          >
            {tab}
          </button>
        ))}
      </nav>

      {activeTab === 'overview' && (
        <section className="rounded-3xl border border-slate-800 bg-slate-900 p-6">
          <div className="grid gap-4 lg:grid-cols-2">
            <Info label="Description" value={project.description} wide />
            <Info label="Stage" value={project.stage} />
            <Info label="Hiring Status" value={project.hiring_status} />
            <Info label="Start Date" value={formatDate(project.start_date)} />
            <Info label="Completion Date" value={formatDate(project.end_date)} />
            <Info label="Trades Needed" value={project.trades_needed} wide />
            <Info label="Address" value={project.display_address || project.address} />
            <Info label="Gate / Entrance" value={project.gate_entrance} />
            <Info label="Muster Point" value={project.muster_point} />
            <Info label="Parking Instructions" value={project.parking_instructions} wide />
            <Info label="Site Access Notes" value={project.site_access_notes} wide />
          </div>

          {editMode && (
            <div className="mt-6 rounded-2xl border border-slate-800 bg-slate-950 p-4">
              <h2 className="text-lg font-semibold text-white">Edit GC-managed fields</h2>
              <div className="mt-4 grid gap-3 sm:grid-cols-2">
                <Field label="Display Address" value={draft.display_address} onChange={(v) => setDraftField('display_address', v)} />
                <Field label="Stage" value={draft.stage} onChange={(v) => setDraftField('stage', v)} />
                <Field label="Hiring Status" value={draft.hiring_status} onChange={(v) => setDraftField('hiring_status', v)} />
                <Field label="Estimated Completion Date" type="date" value={draft.end_date} onChange={(v) => setDraftField('end_date', v)} />
                <Field label="Google Maps URL" value={draft.google_maps_url} onChange={(v) => setDraftField('google_maps_url', v)} />
                <Field label="Gate / Entrance" value={draft.gate_entrance} onChange={(v) => setDraftField('gate_entrance', v)} />
                <Field label="Muster Point" value={draft.muster_point} onChange={(v) => setDraftField('muster_point', v)} />
                <Field label="Description" value={draft.description} onChange={(v) => setDraftField('description', v)} multiline />
                <Field label="Trades Needed" value={draft.trades_needed} onChange={(v) => setDraftField('trades_needed', v)} multiline />
                <Field label="Parking Instructions" value={draft.parking_instructions} onChange={(v) => setDraftField('parking_instructions', v)} multiline />
                <Field label="Site Access Notes" value={draft.site_access_notes} onChange={(v) => setDraftField('site_access_notes', v)} multiline />
              </div>
              <label className="mt-4 flex items-center gap-2 text-sm text-slate-200">
                <input
                  type="checkbox"
                  checked={!!draft.is_public}
                  onChange={(event) => setDraftField('is_public', event.target.checked)}
                  className="h-4 w-4 accent-yellow-400"
                />
                Public hiring visibility
              </label>
              <button
                type="button"
                onClick={saveProjectDetails}
                disabled={saving}
                className="mt-4 inline-flex items-center gap-2 rounded-xl bg-yellow-400 px-4 py-2 text-sm font-bold text-black hover:bg-yellow-300 disabled:opacity-60"
              >
                <Save size={16} aria-hidden="true" />
                {saving ? 'Saving...' : 'Save Project'}
              </button>
            </div>
          )}
        </section>
      )}

      {activeTab === 'photos' && (
        <section className="rounded-3xl border border-slate-800 bg-slate-900 p-6">
          <div className="mb-4 flex items-center gap-2 text-lg font-semibold text-white">
            <Camera size={18} aria-hidden="true" />
            Photos ({data.images.length})
          </div>
          <ProjectImageManager
            projectId={project.id}
            projectName={project.project_name}
            companyId={data.company.id}
            userId={user?.id}
            canManage
            initialImages={data.images}
            onImagesChanged={load}
          />
        </section>
      )}

      {activeTab === 'jobs' && (
        <section className="space-y-4">
          <div className="rounded-3xl border border-slate-800 bg-slate-900 p-6">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <h2 className="text-lg font-semibold text-white">Project Jobs</h2>
                <p className="mt-1 text-sm text-slate-400">Showing job posts for this project only.</p>
              </div>
              <button type="button" onClick={startCreateJob} className="inline-flex items-center gap-2 rounded-xl bg-yellow-400 px-4 py-2 text-sm font-bold text-black hover:bg-yellow-300">
                <BriefcaseBusiness size={16} aria-hidden="true" />
                Create Job
              </button>
            </div>
            {jobFormOpen && (
              <form onSubmit={saveJob} className="mt-5 grid gap-3 sm:grid-cols-2">
                <Field label="Job Title" value={jobForm.title} onChange={(v) => setJobField('title', v)} />
                <Field label="Trade" value={jobForm.trade} onChange={(v) => setJobField('trade', v)} />
                <Field label="Openings" type="number" value={jobForm.positions_count} onChange={(v) => setJobField('positions_count', Number(v))} />
                <label className="block">
                  <span className="block text-xs font-semibold uppercase tracking-wider text-slate-500">Status</span>
                  <select value={jobForm.status} onChange={(event) => setJobField('status', event.target.value)} className="mt-1 w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 text-sm text-white outline-none focus:border-yellow-400">
                    <option value="open">Open</option>
                    <option value="paused">Paused</option>
                    <option value="closed">Closed</option>
                    <option value="filled">Filled</option>
                  </select>
                </label>
                <Field label="Schedule" value={jobForm.schedule} onChange={(v) => setJobField('schedule', v)} />
                <Field label="Pay Range" value={jobForm.pay_range} onChange={(v) => setJobField('pay_range', v)} />
                <Field label="Description" value={jobForm.description} onChange={(v) => setJobField('description', v)} multiline />
                <Field label="Requirements" value={jobForm.requirements} onChange={(v) => setJobField('requirements', v)} multiline />
                <div className="flex flex-wrap gap-2 sm:col-span-2">
                  <button type="submit" disabled={savingJob} className="rounded-xl bg-yellow-400 px-4 py-2 text-sm font-bold text-black hover:bg-yellow-300 disabled:opacity-60">
                    {savingJob ? 'Saving...' : editingJobId ? 'Save Job' : 'Create Job'}
                  </button>
                  <button type="button" onClick={() => setJobFormOpen(false)} className="rounded-xl border border-slate-700 px-4 py-2 text-sm font-semibold text-slate-200">Cancel</button>
                </div>
              </form>
            )}
          </div>
          {[...openJobs, ...closedJobs].map((job) => (
            <JobCard key={job.id} job={job}>
              <div className="flex flex-wrap gap-2">
                <button type="button" onClick={() => startEditJob(job)} className="rounded-xl border border-slate-700 px-4 py-2 text-sm font-semibold text-slate-200 hover:border-yellow-400/50">
                  Edit Job
                </button>
                {job.status === 'open' && (
                  <button
                    type="button"
                    onClick={() => closeJob(job)}
                    disabled={busyJobId === job.id}
                    className="rounded-xl border border-slate-700 px-4 py-2 text-sm font-semibold text-slate-200 hover:border-yellow-400/50 disabled:opacity-60"
                  >
                    {busyJobId === job.id ? 'Closing...' : 'Close Job'}
                  </button>
                )}
                {job.status !== 'open' && (
                  <button type="button" onClick={() => setJobStatus(job, 'open')} disabled={busyJobId === job.id} className="rounded-xl border border-slate-700 px-4 py-2 text-sm font-semibold text-slate-200 hover:border-yellow-400/50 disabled:opacity-60">
                    Reopen Job
                  </button>
                )}
                <button type="button" onClick={() => removeJob(job)} disabled={busyJobId === job.id} className="rounded-xl border border-red-900/70 px-4 py-2 text-sm font-semibold text-red-300 hover:border-red-500 disabled:opacity-60">
                  Delete Job
                </button>
              </div>
            </JobCard>
          ))}
          {jobs.length === 0 && <Empty text="No jobs posted for this project yet." />}
        </section>
      )}

      {activeTab === 'applicants' && (
        <section className="rounded-3xl border border-slate-800 bg-slate-900 p-6">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <h2 className="text-lg font-semibold text-white">Applicants</h2>
              <p className="mt-1 text-sm text-slate-400">Filter and review workers using structured credentials.</p>
            </div>
            <button
              type="button"
              onClick={() => setApplicantFilters(emptyApplicantFilters)}
              className="rounded-xl border border-slate-700 px-3 py-2 text-sm font-semibold text-slate-200 hover:border-yellow-400/50"
            >
              Clear Filters
            </button>
          </div>

          <ApplicantFilters
            filters={applicantFilters}
            options={filterOptions}
            onChange={(field, value) => setApplicantFilters((current) => ({ ...current, [field]: value }))}
          />

          <div className="mt-4 space-y-3">
            {filteredApplicants.map((application) => (
              <ApplicantCard
                key={application.id}
                application={application}
                expanded={expandedWorkerId === application.worker_profile_id}
                busy={busyApplicationId === application.id}
                onTogglePreview={() => setExpandedWorkerId((current) => (
                  current === application.worker_profile_id ? null : application.worker_profile_id
                ))}
                onStatusChange={(status) => changeApplicationStatus(application, status)}
                onSaveCandidate={(values) => saveCandidate(application.worker_profile_id, values)}
                onUpdateCandidate={(values) => updateCandidate(application.candidate, values)}
                onRemoveCandidate={() => removeCandidate(application.candidate)}
                candidateBusy={busyCandidateKey === application.worker_profile_id}
              />
            ))}
            {applicants.length === 0 && <Empty text="No applicants for this project yet." />}
            {applicants.length > 0 && filteredApplicants.length === 0 && <Empty text="No applicants match the current filters." />}
          </div>
        </section>
      )}

      {activeTab === 'talent' && (
        <section className="rounded-3xl border border-slate-800 bg-slate-900 p-6">
          <h2 className="text-lg font-semibold text-white">Talent Pool</h2>
          <p className="mt-1 text-sm text-slate-400">
            Workers with structured profiles that match this project's open jobs. Display only; no notifications are sent.
          </p>
          <div className="mt-4 grid gap-3">
            {(data.talentPool || []).map((item) => (
              <TalentPoolCard
                key={item.worker_profile.id}
                item={item}
                busy={busyCandidateKey === item.worker_profile.id}
                onSaveCandidate={(values) => saveCandidate(item.worker_profile.id, values)}
                onUpdateCandidate={(values) => updateCandidate(item.candidate, values)}
                onRemoveCandidate={() => removeCandidate(item.candidate)}
              />
            ))}
            {(data.talentPool || []).length === 0 && <Empty text="No matching workers are visible yet." />}
          </div>
        </section>
      )}

      {activeTab === 'candidates' && (
        <section className="rounded-3xl border border-slate-800 bg-slate-900 p-6">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <h2 className="text-lg font-semibold text-white">Saved Candidates</h2>
              <p className="mt-1 text-sm text-slate-400">Private GC company pipeline and notes for this project.</p>
            </div>
            <button
              type="button"
              onClick={() => setCandidateFilters(emptyApplicantFilters)}
              className="rounded-xl border border-slate-700 px-3 py-2 text-sm font-semibold text-slate-200 hover:border-yellow-400/50"
            >
              Clear Filters
            </button>
          </div>
          <ApplicantFilters
            filters={candidateFilters}
            options={candidateFilterOptions}
            onChange={(field, value) => setCandidateFilters((current) => ({ ...current, [field]: value }))}
            stageMode
          />
          <div className="mt-4 space-y-3">
            {filteredSavedCandidates.map((candidateRow) => (
              <ApplicantCard
                key={candidateRow.candidate.id}
                application={candidateRow}
                expanded={expandedWorkerId === candidateRow.worker_profile_id}
                busy={false}
                onTogglePreview={() => setExpandedWorkerId((current) => (
                  current === candidateRow.worker_profile_id ? null : candidateRow.worker_profile_id
                ))}
                onStatusChange={() => {}}
                onSaveCandidate={(values) => saveCandidate(candidateRow.worker_profile_id, values)}
                onUpdateCandidate={(values) => updateCandidate(candidateRow.candidate, values)}
                onRemoveCandidate={() => removeCandidate(candidateRow.candidate)}
                candidateBusy={busyCandidateKey === candidateRow.worker_profile_id}
                hideApplicationStatus
              />
            ))}
            {savedCandidateRows.length === 0 && <Empty text="No saved candidates yet." />}
            {savedCandidateRows.length > 0 && filteredSavedCandidates.length === 0 && <Empty text="No saved candidates match the current filters." />}
          </div>
        </section>
      )}

      {activeTab === 'subcontractors' && (
        <section className="rounded-3xl border border-slate-800 bg-slate-900 p-6">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h2 className="text-lg font-semibold text-white">Subcontractors</h2>
              <p className="mt-1 text-sm text-slate-400">
                Jobsite bridge: {data.jobsiteBridge?.jobsite ? 'resolved' : 'will be created when assigning'}.
              </p>
            </div>
            <Users size={20} className="text-yellow-300" aria-hidden="true" />
          </div>
          <form onSubmit={assignSubcontractor} className="mt-4 flex flex-col gap-3 sm:flex-row">
            <select
              value={subcontractorId}
              onChange={(event) => setSubcontractorId(event.target.value)}
              disabled={data.availableSubcontractors.length === 0}
              className="rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 text-white"
            >
              {data.availableSubcontractors.length === 0 && <option value="">No subcontractors available</option>}
              {data.availableSubcontractors.map((company) => (
                <option key={company.id} value={company.id}>{company.company_name}</option>
              ))}
            </select>
            <button
              type="submit"
              disabled={assigning || !subcontractorId}
              className="rounded-xl bg-yellow-400 px-4 py-2 text-sm font-bold text-black hover:bg-yellow-300 disabled:opacity-60"
            >
              {assigning ? 'Assigning...' : 'Assign'}
            </button>
          </form>
          <div className="mt-4 space-y-3">
            {data.subcontractorAssignments.map((assignment) => (
              <article key={assignment.id} className="rounded-2xl border border-slate-800 bg-slate-950 p-4">
                <h3 className="font-semibold text-white">{assignment.subcontractor?.company_name || 'Subcontractor'}</h3>
                <p className="mt-1 text-sm text-slate-400">
                  {assignment.subcontractor?.trades_hired || assignment.subcontractor?.company_type || 'Trade not listed'}
                </p>
                <p className="mt-1 text-xs text-slate-500">Assigned {formatDate(assignment.created_at)}</p>
                <div className="mt-3 flex flex-wrap gap-2">
                  <select
                    value={assignment.status || 'active'}
                    disabled={busyAssignmentId === assignment.id}
                    onChange={(event) => setAssignmentStatus(assignment, event.target.value)}
                    className="rounded-xl border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-white"
                  >
                    <option value="active">Active</option>
                    <option value="inactive">Inactive</option>
                    <option value="paused">Paused</option>
                  </select>
                  <button type="button" onClick={() => removeAssignment(assignment)} disabled={busyAssignmentId === assignment.id} className="rounded-xl border border-red-900/70 px-4 py-2 text-sm font-semibold text-red-300 hover:border-red-500 disabled:opacity-60">
                    Remove
                  </button>
                </div>
              </article>
            ))}
            {data.subcontractorAssignments.length === 0 && <Empty text="No subcontractors assigned to this project yet." />}
          </div>
        </section>
      )}
    </DashboardShell>
  )
}

function Info({ label: title, value, wide = false }) {
  const displayValue = value === 0 ? '0' : value
  return (
    <div className={`rounded-2xl border border-slate-800 bg-slate-950 p-4 ${wide ? 'lg:col-span-2' : ''}`}>
      <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">{title}</p>
      <p className="mt-2 whitespace-pre-line text-sm text-slate-200">{displayValue || 'Not listed'}</p>
    </div>
  )
}

function Field({ label: title, value, onChange, multiline = false, type = 'text' }) {
  return (
    <label className="block">
      <span className="block text-xs font-semibold uppercase tracking-wider text-slate-500">{title}</span>
      {multiline ? (
        <textarea
          rows={3}
          value={value || ''}
          onChange={(event) => onChange(event.target.value)}
          className="mt-1 w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 text-sm text-white outline-none focus:border-yellow-400"
        />
      ) : (
        <input
          type={type}
          value={value || ''}
          onChange={(event) => onChange(event.target.value)}
          className="mt-1 w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 text-sm text-white outline-none focus:border-yellow-400"
        />
      )}
    </label>
  )
}

function Empty({ text }) {
  return (
    <div className="rounded-2xl border border-slate-800 bg-slate-900 p-5 text-sm text-slate-400">
      {text}
    </div>
  )
}

function uniqueSorted(values) {
  return [...new Set((values || []).filter(Boolean).map(String))].sort((a, b) => a.localeCompare(b))
}

function buildApplicantFilterOptions(applications) {
  const profiles = (applications || []).map((application) => application.worker_profile).filter(Boolean)
  return {
    trades: uniqueSorted(profiles.flatMap((profile) => [profile.trade, profile.secondary_trade])),
    tradeLevels: uniqueSorted(profiles.flatMap((profile) => [profile.trade_level, profile.apprenticeship_level])),
    availability: uniqueSorted(profiles.map((profile) => profile.availability_status)),
    certifications: uniqueSorted(profiles.flatMap((profile) => getProfileCertifications(profile))),
    regions: uniqueSorted(profiles.flatMap((profile) => normalizeList(profile.preferred_regions))),
    statuses: applicantStatuses,
  }
}

function applicantMatchesFilters(application, filters) {
  const profile = application.worker_profile || {}
  const certifications = getProfileCertifications(profile)
  const regions = normalizeList(profile.preferred_regions)
  const tradeValues = [profile.trade, profile.secondary_trade, application.worker_trade].filter(Boolean)
  const levelValues = [profile.trade_level, profile.apprenticeship_level].filter(Boolean)

  if (filters.trade && !tradeValues.includes(filters.trade)) return false
  if (filters.tradeLevel && !levelValues.includes(filters.tradeLevel)) return false
  if (filters.availability && profile.availability_status !== filters.availability) return false
  if (filters.certification && !certifications.includes(filters.certification)) return false
  if (filters.region && !regions.includes(filters.region)) return false
  if (filters.status && String(application.candidate?.stage || application.status || '') !== filters.status) return false
  return true
}

function ApplicantFilters({ filters, options, onChange, stageMode = false }) {
  return (
    <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
      <FilterSelect label="Trade" value={filters.trade} options={options.trades} onChange={(value) => onChange('trade', value)} />
      <FilterSelect label="Trade Level" value={filters.tradeLevel} options={options.tradeLevels} onChange={(value) => onChange('tradeLevel', value)} />
      <FilterSelect
        label="Availability"
        value={filters.availability}
        options={options.availability}
        getLabel={getAvailabilityLabel}
        onChange={(value) => onChange('availability', value)}
      />
      <FilterSelect label="Certification" value={filters.certification} options={options.certifications} onChange={(value) => onChange('certification', value)} />
      <FilterSelect label="Region" value={filters.region} options={options.regions} onChange={(value) => onChange('region', value)} />
      <label className="block">
        <span className="block text-xs font-semibold uppercase tracking-wider text-slate-500">{stageMode ? 'Pipeline Stage' : 'Application Status'}</span>
        <select value={filters.status} onChange={(event) => onChange('status', event.target.value)} className="mt-1 w-full rounded-xl border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-white">
          <option value="">All</option>
          {(stageMode ? CANDIDATE_STAGES.map((stage) => ({ value: stage, label: stageLabel(stage) })) : applicantStatuses).map((status) => (
            <option key={status.value} value={status.value}>{status.label}</option>
          ))}
        </select>
      </label>
    </div>
  )
}

function FilterSelect({ label: title, value, options = [], onChange, getLabel = (item) => item }) {
  return (
    <label className="block">
      <span className="block text-xs font-semibold uppercase tracking-wider text-slate-500">{title}</span>
      <select value={value} onChange={(event) => onChange(event.target.value)} className="mt-1 w-full rounded-xl border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-white">
        <option value="">All</option>
        {options.map((option) => (
          <option key={option} value={option}>{getLabel(option)}</option>
        ))}
      </select>
    </label>
  )
}

function MatchBadge({ score }) {
  const numeric = Number(score)
  const tone = numeric >= 80 ? 'green' : numeric >= 60 ? 'yellow' : 'slate'
  return <StatusBadge tone={tone}>{Number.isFinite(numeric) ? `${numeric}% Match` : 'Match pending'}</StatusBadge>
}

function stageLabel(stage) {
  return String(stage || 'saved').replace(/_/g, ' ').replace(/\b\w/g, (letter) => letter.toUpperCase())
}

function ProfileBadges({ profile }) {
  const certifications = getProfileCertifications(profile)
  const badges = []
  if (profile?.availability_status === 'available_now') badges.push('Available Now')
  if (profile?.camp_ready) badges.push('Camp Ready')
  if (profile?.willing_to_travel || normalizeList(profile?.work_preferences).includes('Travel Work')) badges.push('Travel Ready')
  if (certifications.length > 0) badges.push('Certified')
  if (profile?.resume_url) badges.push('Resume Uploaded')
  return (
    <div className="mt-3 flex flex-wrap gap-2">
      {badges.map((badge) => <StatusBadge key={badge} tone="yellow">{badge}</StatusBadge>)}
    </div>
  )
}

function CandidateControls({ candidate, workerProfileId, busy, onSaveCandidate, onUpdateCandidate, onRemoveCandidate }) {
  const [noteDraft, setNoteDraft] = useState(candidate?.notes || '')

  useEffect(() => {
    setNoteDraft(candidate?.notes || '')
  }, [candidate?.id, candidate?.notes])

  if (!candidate) {
    return (
      <button
        type="button"
        disabled={busy}
        onClick={() => onSaveCandidate?.({ stage: 'saved' })}
        className="rounded-xl bg-yellow-400 px-3 py-2 text-sm font-bold text-black hover:bg-yellow-300 disabled:opacity-60"
      >
        {busy ? 'Saving...' : 'Save Candidate'}
      </button>
    )
  }

  return (
    <div className="mt-4 grid gap-3 border-t border-slate-800 pt-4 lg:grid-cols-[220px_minmax(0,1fr)_auto]">
      <label className="block">
        <span className="block text-xs font-semibold uppercase tracking-wider text-slate-500">Pipeline Stage</span>
        <select
          value={candidate.stage || 'saved'}
          disabled={busy}
          onChange={(event) => onUpdateCandidate?.({ stage: event.target.value })}
          className="mt-1 w-full rounded-xl border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-white"
        >
          {CANDIDATE_STAGES.map((stage) => (
            <option key={stage} value={stage}>{stageLabel(stage)}</option>
          ))}
        </select>
      </label>
      <label className="block">
        <span className="block text-xs font-semibold uppercase tracking-wider text-slate-500">Private GC Notes</span>
        <textarea
          rows={2}
          value={noteDraft}
          onChange={(event) => setNoteDraft(event.target.value)}
          className="mt-1 w-full rounded-xl border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-white"
          placeholder="Strong resume, call next week..."
        />
      </label>
      <div className="flex flex-col justify-end gap-2">
        <button
          type="button"
          disabled={busy}
          onClick={() => onUpdateCandidate?.({ notes: noteDraft })}
          className="rounded-xl border border-slate-700 px-3 py-2 text-sm font-semibold text-slate-200 hover:border-yellow-400/50 disabled:opacity-60"
        >
          Save Notes
        </button>
        <button
          type="button"
          disabled={busy}
          onClick={onRemoveCandidate}
          className="rounded-xl border border-red-900/70 px-3 py-2 text-sm font-semibold text-red-300 hover:border-red-500 disabled:opacity-60"
        >
          Remove
        </button>
      </div>
    </div>
  )
}

function CredentialPreview({ profile, match }) {
  const certifications = getProfileCertifications(profile)
  const regions = normalizeList(profile?.preferred_regions)
  const preferences = normalizeList(profile?.work_preferences)
  return (
    <div className="mt-4 grid gap-3 border-t border-slate-800 pt-4 lg:grid-cols-2">
      <Info label="Certifications" value={certifications.join(', ') || 'Not listed'} />
      <Info label="Availability" value={getAvailabilityLabel(profile?.availability_status)} />
      <Info label="Preferred Regions" value={regions.join(', ') || 'Not listed'} />
      <Info label="Work Preferences" value={preferences.join(', ') || 'Not listed'} />
      <div className="rounded-2xl border border-slate-800 bg-slate-950 p-4 lg:col-span-2">
        <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">Match Indicators</p>
        <div className="mt-3 flex flex-wrap gap-2">
          {(match?.indicators || []).map((indicator) => (
            <StatusBadge key={indicator.key} tone={indicator.matched ? 'green' : 'slate'}>
              {indicator.label}: {indicator.score ?? 0}%
            </StatusBadge>
          ))}
        </div>
      </div>
    </div>
  )
}

function ApplicantCard({
  application,
  expanded,
  busy,
  onTogglePreview,
  onStatusChange,
  onSaveCandidate,
  onUpdateCandidate,
  onRemoveCandidate,
  candidateBusy,
  hideApplicationStatus = false,
}) {
  const profile = application.worker_profile || {}
  const certifications = getProfileCertifications(profile)
  return (
    <article className="rounded-2xl border border-slate-800 bg-slate-950 p-4">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <h3 className="font-semibold text-white">{application.worker_name || profile.headline || 'Applicant'}</h3>
            <MatchBadge score={application.match?.score} />
          </div>
          <p className="mt-1 text-sm text-slate-400">
            {[profile.trade || application.worker_trade, profile.trade_level || profile.apprenticeship_level, application.job_post?.title].filter(Boolean).join(' | ') || 'Trade not listed'}
          </p>
          <ProfileBadges profile={{ ...profile, resume_url: profile.resume_url || application.resume_url }} />
          <div className="mt-3 grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
            <Info label="Years Experience" value={profile.experience_years ?? application.worker_experience} />
            <Info label="Availability" value={getAvailabilityLabel(profile.availability_status)} />
            <Info label="Certifications" value={certifications.length} />
            <Info label="Resume" value={application.resume_url || profile.resume_url ? 'Available' : 'Not uploaded'} />
          </div>
          <p className="mt-3 text-xs text-slate-500">Applied {formatDate(application.created_at)}</p>
        </div>
        <div className="flex shrink-0 flex-col gap-2 sm:flex-row lg:flex-col">
          {!hideApplicationStatus && (
            <select
              value={application.status || 'submitted'}
              disabled={busy}
              onChange={(event) => onStatusChange(event.target.value)}
              className="rounded-xl border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-white"
            >
              {applicantStatuses.map((status) => (
                <option key={status.value} value={status.value}>{status.label}</option>
              ))}
            </select>
          )}
          <button type="button" onClick={onTogglePreview} className="rounded-xl border border-slate-700 px-3 py-2 text-sm font-semibold text-slate-200 hover:border-yellow-400/50">
            {expanded ? 'Hide Preview' : 'Preview Credentials'}
          </button>
        </div>
      </div>
      {expanded && <CredentialPreview profile={profile} match={application.match} />}
      <CandidateControls
        candidate={application.candidate}
        workerProfileId={application.worker_profile_id}
        busy={candidateBusy}
        onSaveCandidate={onSaveCandidate}
        onUpdateCandidate={onUpdateCandidate}
        onRemoveCandidate={onRemoveCandidate}
      />
    </article>
  )
}

function TalentPoolCard({ item, busy, onSaveCandidate, onUpdateCandidate, onRemoveCandidate }) {
  const profile = item.worker_profile || {}
  const certifications = getProfileCertifications(profile)
  return (
    <article className="rounded-2xl border border-slate-800 bg-slate-950 p-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <h3 className="font-semibold text-white">{profile.headline || profile.trade || 'Worker'}</h3>
            <MatchBadge score={item.match?.score} />
          </div>
          <p className="mt-1 text-sm text-slate-400">
            {[profile.trade, profile.trade_level || profile.apprenticeship_level, profile.experience_years ? `${profile.experience_years} years` : null].filter(Boolean).join(' | ') || 'Trade not listed'}
          </p>
          <ProfileBadges profile={profile} />
          <p className="mt-1 text-xs text-slate-500">
            Best fit: {item.job?.title || item.job?.trade || 'Project requirements'}
          </p>
        </div>
        <StatusBadge>{getAvailabilityLabel(profile.availability_status)}</StatusBadge>
      </div>
      <div className="mt-3 grid gap-2 sm:grid-cols-3">
        <Info label="Certifications" value={certifications.join(', ') || 'Not listed'} />
        <Info label="Regions" value={normalizeList(profile.preferred_regions).join(', ') || 'Not listed'} />
        <Info label="Preferences" value={normalizeList(profile.work_preferences).join(', ') || 'Not listed'} />
      </div>
      <CandidateControls
        candidate={item.candidate}
        workerProfileId={profile.id}
        busy={busy}
        onSaveCandidate={onSaveCandidate}
        onUpdateCandidate={onUpdateCandidate}
        onRemoveCandidate={onRemoveCandidate}
      />
    </article>
  )
}

function buildSavedCandidateRows(data) {
  if (data?.savedCandidates?.length) return data.savedCandidates
  if (!data?.candidates?.length) return []
  const byWorker = new Map()
  for (const application of data.applications || []) {
    if (application.worker_profile_id) byWorker.set(application.worker_profile_id, application)
  }
  for (const item of data.talentPool || []) {
    if (item.worker_profile?.id && !byWorker.has(item.worker_profile.id)) {
      byWorker.set(item.worker_profile.id, {
        id: `talent-${item.worker_profile.id}`,
        worker_profile_id: item.worker_profile.id,
        worker_profile: item.worker_profile,
        worker_name: item.worker_profile.headline || item.worker_profile.trade || 'Worker',
        worker_trade: item.worker_profile.trade,
        worker_experience: item.worker_profile.experience_years,
        resume_url: item.worker_profile.resume_url,
        job_post: item.job,
        match: item.match,
        status: item.candidate?.stage || 'saved',
        candidate: item.candidate,
      })
    }
  }
  return data.candidates
    .map((candidate) => {
      const row = byWorker.get(candidate.worker_profile_id)
      return row ? { ...row, candidate, status: candidate.stage } : null
    })
    .filter(Boolean)
}
