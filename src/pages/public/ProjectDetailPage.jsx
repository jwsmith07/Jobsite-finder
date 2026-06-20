import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { BadgeCheck, BriefcaseBusiness, Building2, CalendarDays, DollarSign, FileText, Image as ImageIcon, MapPin, Navigation, ShieldCheck, UsersRound } from 'lucide-react'
import { useProject } from '../../hooks/useProjects'
import { useAuth } from '../../hooks/useAuth'
import { getJobsByProjectId } from '../../services/jobsService'
import { updateContractorProjectLocation } from '../../services/projectsService'
import { createClaim, getApprovedProjectCompanies, getMyClaimForProject } from '../../services/claimsService'
import { getContractorDisplayLocation, getPublicDisplayLocation, hasContractorLocation, normalizeRole, formatCurrencyShort } from '../../lib/utils'
import { PUBLIC_STAGE_TONES, getPublicStageMeta } from '../../lib/projectStages'
import JobCard from '../../components/jobs/JobCard'
import ApplyButton from '../../components/jobs/ApplyButton'
import SaveJobButton from '../../components/jobs/SaveJobButton'
import ProjectImageManager from '../../components/projects/ProjectImageManager'
import PageMeta from '../../components/ui/PageMeta'
import { breadcrumbSchema, canonicalUrl } from '../../lib/seo'

function stripHtml(html) {
  return html ? html.replace(/<[^>]*>/g, '') : ''
}

const TRAVEL_MODES = [
  { key: 'DRIVING',   label: 'Drive',   icon: '🚗' },
  { key: 'WALKING',   label: 'Walk',    icon: '🚶' },
  { key: 'BICYCLING', label: 'Bike',    icon: '🚲' },
  { key: 'TRANSIT',   label: 'Transit', icon: '🚌' },
]

function Field({ label, value }) {
  return (
    <div className="rounded-2xl border border-slate-800 bg-black/25 p-4">
      <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">{label}</p>
      <p className="mt-1 text-sm font-medium text-slate-100">{value || 'Not available yet'}</p>
    </div>
  )
}

function DetailSection({ title, icon: Icon, children }) {
  return (
    <section className="rounded-3xl border border-slate-800 bg-slate-900 p-5 sm:p-6">
      <div className="mb-4 flex items-center gap-2">
        <span className="flex h-9 w-9 items-center justify-center rounded-xl border border-yellow-400/30 bg-yellow-400/10 text-yellow-300">
          <Icon size={18} aria-hidden="true" />
        </span>
        <h2 className="text-lg font-bold text-white">{title}</h2>
      </div>
      {children}
    </section>
  )
}

function extractSchedule(description) {
  const text = String(description || '').trim()
  if (!text) return null
  const schedule = text
    .split('|')
    .map((part) => part.trim().replace(/\s+\./g, '.'))
    .find((part) => /^schedule:/i.test(part))

  if (!schedule) return null
  return schedule
    .replace(/^schedule:\s*/i, '')
    .replace(/\bto\b/i, '\u2013')
    .trim()
}

function getYear(value) {
  if (!value) return null
  const date = new Date(value)
  if (!Number.isNaN(date.getTime())) return String(date.getFullYear())
  const match = String(value).match(/\b(20\d{2}|19\d{2})\b/)
  return match?.[1] || null
}

function getTimeline(project) {
  const startYear = getYear(project.start_date)
  const endYear = getYear(project.end_date)

  if (startYear && endYear) {
    return startYear === endYear ? startYear : `${startYear}\u2013${endYear}`
  }
  if (endYear) return `Expected ${endYear}`
  if (startYear) return startYear
  return extractSchedule(project.description) || 'Not available yet'
}

function OverviewItem({ label, value, icon: Icon, children }) {
  return (
    <div className="flex gap-3 rounded-2xl border border-slate-800 bg-black/25 p-4">
      <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-yellow-400/25 bg-yellow-400/10 text-yellow-300">
        <Icon size={17} aria-hidden="true" />
      </span>
      <div className="min-w-0">
        <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">{label}</p>
        {children || <p className="mt-1 text-sm font-semibold leading-6 text-slate-100">{value || 'Not available yet'}</p>}
      </div>
    </div>
  )
}

function getPrimaryGeneralContractor(companies) {
  const approvedGcs = (companies ?? []).filter((company) => (
    company?.status === 'approved' &&
    company.company_role === 'gc'
  ))

  return (
    approvedGcs.find((company) => company.is_primary_gc) ||
    approvedGcs[0] ||
    null
  )
}

function getMainContractorName(project, companies) {
  const primaryGc = getPrimaryGeneralContractor(companies)
  return (
    primaryGc?.company?.company_name ||
    project.general_contractor ||
    project.owner ||
    'Not available yet'
  )
}

function ProjectOverview({ project, jobs, jobsLoading, companies }) {
  const stageMeta = getPublicStageMeta(project.stage)
  const publicLocation = getContractorDisplayLocation(project)
  const openRoles =
    jobsLoading
      ? 'Not available yet'
      : jobs.length > 0
        ? `${jobs.length} Open ${jobs.length === 1 ? 'Role' : 'Roles'}`
        : 'No active hiring yet'

  return (
    <div className="mt-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
      <OverviewItem label="Stage" icon={FileText}>
        <span className={`mt-1 inline-flex rounded-full border px-2.5 py-1 text-xs font-bold ${PUBLIC_STAGE_TONES[stageMeta.key]}`}>
          {stageMeta.label}
        </span>
      </OverviewItem>
      <OverviewItem label="Estimated Value" value={project.estimated_value ? formatCurrencyShort(project.estimated_value) : 'Not available yet'} icon={DollarSign} />
      <OverviewItem label="Timeline" value={getTimeline(project)} icon={CalendarDays} />
      <OverviewItem label="Project Type" value={project.project_type} icon={Building2} />
      <OverviewItem label="Sector" value={project.sector} icon={BriefcaseBusiness} />
      <OverviewItem label="Location" value={publicLocation || 'Not available yet'} icon={MapPin} />
      <OverviewItem label="Main Contractor" value={getMainContractorName(project, companies)} icon={BriefcaseBusiness} />
      <OverviewItem label="Open Roles" value={openRoles} icon={UsersRound} />
    </div>
  )
}

const LOCATION_FIELDS = [
  { key: 'display_address', label: 'Display address', type: 'input' },
  { key: 'google_maps_url', label: 'External map URL', type: 'input' },
  { key: 'gate_entrance', label: 'Gate / entrance', type: 'input' },
  { key: 'muster_point', label: 'Muster point', type: 'input' },
  { key: 'parking_instructions', label: 'Parking instructions', type: 'textarea' },
  { key: 'site_access_notes', label: 'Site access notes', type: 'textarea' },
]

function JobsiteAccessDetails({ project, canEdit, onSaved }) {
  const [editing, setEditing] = useState(false)
  const [draft, setDraft] = useState({})
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState(null)
  const hasDetails = hasContractorLocation(project)
  const fallbackLocation = getPublicDisplayLocation(project)

  useEffect(() => {
    setDraft({
      display_address: project.display_address || '',
      site_access_notes: project.site_access_notes || '',
      gate_entrance: project.gate_entrance || '',
      parking_instructions: project.parking_instructions || '',
      muster_point: project.muster_point || '',
      google_maps_url: project.google_maps_url || '',
    })
    setEditing(false)
    setMessage(null)
  }, [project.id])

  function setField(field, value) {
    setDraft((current) => ({ ...current, [field]: value }))
  }

  async function handleSubmit(e) {
    e.preventDefault()
    setSaving(true)
    setMessage(null)
    try {
      const saved = await updateContractorProjectLocation(project.id, draft)
      onSaved?.(saved)
      setEditing(false)
      setMessage({ type: 'success', text: 'Jobsite access details saved.' })
    } catch (err) {
      setMessage({ type: 'error', text: err.message })
    } finally {
      setSaving(false)
    }
  }

  if (editing) {
    return (
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid gap-3 sm:grid-cols-2">
          {LOCATION_FIELDS.map((field) => (
            <div key={field.key}>
              <label className="mb-1 block text-xs font-semibold uppercase tracking-wider text-slate-500">
                {field.label}
              </label>
              {field.type === 'textarea' ? (
                <textarea
                  rows={3}
                  value={draft[field.key] || ''}
                  onChange={(e) => setField(field.key, e.target.value)}
                  className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-white outline-none focus:border-yellow-400"
                />
              ) : (
                <input
                  value={draft[field.key] || ''}
                  onChange={(e) => setField(field.key, e.target.value)}
                  className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-white outline-none focus:border-yellow-400"
                />
              )}
            </div>
          ))}
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <button
            type="submit"
            disabled={saving}
            className="rounded-xl bg-yellow-400 px-4 py-2 text-sm font-bold text-black hover:bg-yellow-300 disabled:opacity-60"
          >
            {saving ? 'Saving...' : 'Save access details'}
          </button>
          <button
            type="button"
            onClick={() => setEditing(false)}
            className="rounded-xl border border-slate-700 px-4 py-2 text-sm font-semibold text-slate-200 hover:border-yellow-400/50"
          >
            Cancel
          </button>
        </div>
        {message && (
          <p className={`text-sm ${message.type === 'error' ? 'text-red-300' : 'text-emerald-300'}`}>
            {message.text}
          </p>
        )}
      </form>
    )
  }

  return (
    <div className="space-y-4">
      {!hasDetails && (
        <div className="rounded-2xl border border-slate-800 bg-black/25 p-4">
          <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">Worker-facing location</p>
          <p className="mt-1 text-sm font-semibold text-slate-100">{fallbackLocation || 'Not available yet'}</p>
        </div>
      )}
      {hasDetails && (
        <div className="grid gap-3 sm:grid-cols-2">
          <Field label="Display address" value={project.display_address} />
          <Field label="Gate / entrance" value={project.gate_entrance} />
          <Field label="Parking instructions" value={project.parking_instructions} />
          <Field label="Muster point" value={project.muster_point} />
          <Field label="Site access notes" value={project.site_access_notes} />
        </div>
      )}
      {canEdit && (
        <button
          type="button"
          onClick={() => setEditing(true)}
          className="rounded-xl border border-yellow-400/40 bg-yellow-400/10 px-4 py-2 text-sm font-semibold text-yellow-300 transition hover:border-yellow-400 hover:bg-yellow-400/20"
        >
          {hasDetails ? 'Edit access details' : 'Add access details'}
        </button>
      )}
      {message && (
        <p className={`text-sm ${message.type === 'error' ? 'text-red-300' : 'text-emerald-300'}`}>
          {message.text}
        </p>
      )}
    </div>
  )
}

function getCompanyInitials(name) {
  const words = String(name || '')
    .trim()
    .split(/\s+/)
    .filter(Boolean)

  if (words.length === 0) return 'CO'
  return words
    .slice(0, 2)
    .map((word) => word[0])
    .join('')
    .toUpperCase()
}

function CompanyLogo({ company }) {
  const [imageFailed, setImageFailed] = useState(false)
  const name = company?.company_name || 'Company'
  const logoUrl = company?.logo_url

  return (
    <div className="flex h-14 w-14 shrink-0 items-center justify-center overflow-hidden rounded-2xl border border-yellow-400/25 bg-slate-950 text-base font-black text-yellow-300 shadow-inner shadow-yellow-400/5">
      {logoUrl && !imageFailed ? (
        <img
          src={logoUrl}
          alt={`${name} logo`}
          className="h-full w-full object-contain p-1.5"
          onError={() => setImageFailed(true)}
        />
      ) : (
        <span aria-hidden="true">{getCompanyInitials(name)}</span>
      )}
    </div>
  )
}

function getOpenRoleCount(jobs) {
  return (jobs ?? []).reduce((total, job) => {
    const positions = Number(job.positions_count)
    return total + (Number.isFinite(positions) && positions > 0 ? positions : 1)
  }, 0)
}

function buildJobsByCompany(jobs) {
  const map = new Map()
  for (const job of jobs ?? []) {
    if (!job.company_profile_id) continue
    const key = String(job.company_profile_id)
    const list = map.get(key) || []
    list.push(job)
    map.set(key, list)
  }
  return map
}

function formatCompanyRole(role) {
  return role === 'subcontractor' ? 'Subcontractor' : 'General Contractor'
}

function CompanyHiringStatus({ openRoleCount }) {
  const hasOpenRoles = openRoleCount > 0

  return (
    <div className="flex flex-wrap items-center gap-2">
      <span className={`inline-flex items-center rounded-full border px-2.5 py-1 text-[11px] font-bold uppercase tracking-wide ${
        hasOpenRoles
          ? 'border-green-600/50 bg-green-500/15 text-green-200'
          : 'border-slate-700 bg-slate-950 text-slate-400'
      }`}>
        {hasOpenRoles ? 'Hiring Now' : 'No open roles yet'}
      </span>
      {hasOpenRoles && (
        <span className="text-sm font-semibold text-slate-200">
          {openRoleCount} open {openRoleCount === 1 ? 'role' : 'roles'}
        </span>
      )}
    </div>
  )
}

function ProjectCompanyCard({ connection, jobs = [], fallbackName = 'Approved company', featured = false }) {
  const companyName = connection.company?.company_name || fallbackName
  const roleLabel = formatCompanyRole(connection.company_role)
  const openRoleCount = getOpenRoleCount(jobs)
  const hasOpenRoles = openRoleCount > 0

  return (
    <article className={`rounded-2xl border p-4 transition sm:p-5 ${
      featured
        ? 'border-yellow-400/35 bg-yellow-400/[0.07] shadow-lg shadow-yellow-400/5'
        : 'border-slate-800 bg-black/25'
    }`}>
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex min-w-0 gap-3">
          <CompanyLogo company={connection.company} />
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <h3 className="break-words text-base font-black text-white">{companyName}</h3>
              {connection.company?.verified && (
                <span className="inline-flex items-center gap-1 rounded-full border border-emerald-500/40 bg-emerald-500/10 px-2 py-0.5 text-[11px] font-semibold text-emerald-300">
                  <BadgeCheck size={12} aria-hidden="true" />
                  Verified
                </span>
              )}
            </div>
            <p className="mt-1 text-sm font-semibold text-yellow-200">{roleLabel}</p>
            {connection.trade_scope && (
              <p className="mt-2 text-sm leading-6 text-slate-300">{connection.trade_scope}</p>
            )}
          </div>
        </div>
        <div className="shrink-0 sm:text-right">
          <CompanyHiringStatus openRoleCount={openRoleCount} />
        </div>
      </div>
      <div className="mt-4 flex flex-col gap-2 border-t border-slate-800 pt-4 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-xs text-slate-500">
          {hasOpenRoles
            ? 'Open jobs are tied to this jobsite.'
            : 'This company is connected to the project, but has not posted live roles.'}
        </p>
        {hasOpenRoles && (
          <a
            href="#project-open-jobs"
            className="inline-flex items-center justify-center rounded-xl bg-yellow-400 px-4 py-2 text-sm font-black text-black transition hover:bg-yellow-300"
          >
            View Jobs / Apply
          </a>
        )}
      </div>
    </article>
  )
}

function ProjectTeamList({ companies, jobs, loading, error }) {
  const jobsByCompany = buildJobsByCompany(jobs)
  const primaryGc = getPrimaryGeneralContractor(companies)
  const subcontractors = companies.filter((c) => c.status === 'approved' && c.company_role === 'subcontractor')

  if (loading) return <p className="text-sm text-slate-400">Loading project team...</p>
  if (error) return <p className="text-sm text-red-300">{error.message}</p>

  return (
    <div className="space-y-5">
      <div>
        <p className="text-xs font-semibold uppercase tracking-wider text-yellow-300">
          Primary General Contractor
        </p>
        <div className="mt-2">
          {primaryGc ? (
            <ProjectCompanyCard
              connection={primaryGc}
              jobs={jobsByCompany.get(String(primaryGc.company_profile_id || primaryGc.company?.id)) || []}
              fallbackName="Approved general contractor"
              featured
            />
          ) : (
            <Field label="Primary General Contractor" value="Not approved yet" />
          )}
        </div>
      </div>
      <div>
        <p className="text-xs font-semibold uppercase tracking-wider text-yellow-300">
          Subcontractors on this jobsite
        </p>
        {subcontractors.length === 0 ? (
          <p className="mt-2 text-sm text-slate-400">No approved subcontractors listed yet.</p>
        ) : (
          <div className="mt-2 grid gap-3 lg:grid-cols-2">
            {subcontractors.map((connection) => (
              <ProjectCompanyCard
                key={connection.id}
                connection={connection}
                jobs={jobsByCompany.get(String(connection.company_profile_id || connection.company?.id)) || []}
                fallbackName="Approved subcontractor"
              />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

function PrimaryGeneralContractor({ companies, jobs, loading, error }) {
  const jobsByCompany = buildJobsByCompany(jobs)
  const primaryGc = getPrimaryGeneralContractor(companies)

  if (loading) return <p className="text-sm text-slate-400">Loading general contractor...</p>
  if (error) return <p className="text-sm text-red-300">{error.message}</p>

  return primaryGc ? (
    <ProjectCompanyCard
      connection={primaryGc}
      jobs={jobsByCompany.get(String(primaryGc.company_profile_id || primaryGc.company?.id)) || []}
      fallbackName="Approved general contractor"
      featured
    />
  ) : (
    <Field label="Primary General Contractor" value="Not listed yet" />
  )
}

function SubcontractorList({ companies, jobs, loading, error }) {
  const jobsByCompany = buildJobsByCompany(jobs)
  const subcontractors = companies.filter((c) => c.status === 'approved' && c.company_role === 'subcontractor')

  if (loading) return <p className="text-sm text-slate-400">Loading subcontractors...</p>
  if (error) return <p className="text-sm text-red-300">{error.message}</p>
  if (subcontractors.length === 0) return <p className="text-sm text-slate-400">No participating subcontractors listed yet.</p>

  return (
    <div className="grid gap-3 lg:grid-cols-2">
      {subcontractors.map((connection) => (
        <ProjectCompanyCard
          key={connection.id}
          connection={connection}
          jobs={jobsByCompany.get(String(connection.company_profile_id || connection.company?.id)) || []}
          fallbackName="Approved subcontractor"
        />
      ))}
    </div>
  )
}

function StatusBadge({ statusType }) {
  if (statusType === 'verified') {
    return (
      <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-500/40 bg-emerald-500/10 px-2.5 py-1 text-[11px] font-semibold text-emerald-300">
        <BadgeCheck size={12} aria-hidden="true" />
        Verified
      </span>
    )
  }
  if (statusType === 'claimed') {
    return (
      <span className="inline-flex items-center gap-1.5 rounded-full border border-yellow-500/40 bg-yellow-500/10 px-2.5 py-1 text-[11px] font-semibold text-yellow-300">
        <ShieldCheck size={12} aria-hidden="true" />
        Claim pending
      </span>
    )
  }
  return (
    <span className="inline-flex items-center gap-1.5 rounded-full border border-slate-700 bg-slate-800 px-2.5 py-1 text-[11px] font-semibold text-slate-300">
      <ShieldCheck size={12} aria-hidden="true" />
      Unverified
    </span>
  )
}

function ClaimPanel({ project, refreshKey, onClaimChanged }) {
  const { user, role: authRole } = useAuth()
  const role = normalizeRole(authRole)
  const isCompany = role === 'gc' || role === 'sc'

  const [claim, setClaim] = useState(null)
  const [loading, setLoading] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [notes, setNotes] = useState('')
  const [tradeScope, setTradeScope] = useState('')
  const [claimType, setClaimType] = useState(role === 'sc' ? 'sc' : 'gc')
  const [message, setMessage] = useState(null)

  useEffect(() => {
    if (!user || !isCompany || !project?.id) {
      setClaim(null)
      return
    }
    let mounted = true
    setLoading(true)
    getMyClaimForProject(user.id, project.id)
      .then((c) => { if (mounted) setClaim(c) })
      .catch(() => { if (mounted) setClaim(null) })
      .finally(() => { if (mounted) setLoading(false) })
    return () => { mounted = false }
  }, [user, isCompany, project?.id, refreshKey])

  async function handleClaim(e) {
    e.preventDefault()
    setSubmitting(true)
    setMessage(null)
    try {
      const created = await createClaim(user.id, project.id, {
        claim_type: claimType,
        trade_scope: claimType === 'sc' ? tradeScope : null,
        notes,
      })
      setClaim(created)
      setNotes('')
      setTradeScope('')
      setMessage({ type: 'success', text: 'Claim submitted. An admin will review it.' })
      onClaimChanged?.()
    } catch (err) {
      setMessage({ type: 'error', text: err.message })
    } finally {
      setSubmitting(false)
    }
  }

  if (!user) {
    return (
      <div className="rounded-2xl border border-slate-800 bg-slate-950 p-4 text-sm text-slate-400">
        Project listed from public data.{' '}
        <Link to="/signin" className="text-yellow-300 hover:underline">
          Sign in
        </Link>{' '}
        as a General Contractor or Subcontractor to claim it.
      </div>
    )
  }

  if (!isCompany) {
    return (
      <div className="rounded-2xl border border-slate-800 bg-slate-950 p-4 text-sm text-slate-400">
        Project listed from public data. Only General Contractor or Subcontractor accounts can claim a project.
      </div>
    )
  }

  if (loading) {
    return <p className="text-sm text-slate-400">Checking your claim...</p>
  }

  if (claim?.status === 'pending') {
    return (
      <div className="rounded-2xl border border-yellow-900/60 bg-yellow-950/30 p-4 text-sm text-yellow-200">
        Your claim ({claim.claim_type}) is pending admin review.
      </div>
    )
  }

  if (claim?.status === 'approved') {
    return (
      <div className="rounded-2xl border border-emerald-900/60 bg-emerald-950/40 p-4 text-sm text-emerald-300">
        You have an approved claim on this project.
      </div>
    )
  }

  return (
    <form onSubmit={handleClaim} className="space-y-3 rounded-2xl border border-slate-800 bg-slate-950 p-4">
      <div>
        <p className="text-sm font-semibold text-white">Claim this project</p>
        <p className="mt-1 text-xs text-slate-500">
          Project listed from public data. Submit a connection request and an admin will verify it.
        </p>
      </div>
      <div>
        <label className="block text-xs uppercase tracking-wider text-slate-500 mb-1">Role</label>
        <select
          value={claimType}
          onChange={(e) => setClaimType(e.target.value)}
          className="w-full rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-sm text-white outline-none focus:border-yellow-400"
        >
          <option value="gc">General Contractor</option>
          <option value="sc">Subcontractor</option>
        </select>
      </div>
      {claimType === 'sc' && (
        <div>
          <label className="block text-xs uppercase tracking-wider text-slate-500 mb-1">Trade / scope</label>
          <input
            value={tradeScope}
            onChange={(e) => setTradeScope(e.target.value)}
            placeholder="Electrical, concrete, framing..."
            className="w-full rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-sm text-white outline-none focus:border-yellow-400"
          />
        </div>
      )}
      <div>
        <label className="block text-xs uppercase tracking-wider text-slate-500 mb-1">Notes</label>
        <textarea
          rows={3}
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          placeholder="How are you involved with this project?"
          className="w-full rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-sm text-white outline-none focus:border-yellow-400"
        />
      </div>
      <button
        type="submit"
        disabled={submitting}
        className="rounded-xl bg-yellow-400 px-4 py-2 text-sm font-bold text-black hover:bg-yellow-300 disabled:opacity-60"
      >
        {submitting ? 'Submitting...' : 'Submit claim'}
      </button>
      {message && (
        <p className={`text-xs ${message.type === 'error' ? 'text-red-300' : 'text-emerald-300'}`}>
          {message.text}
        </p>
      )}
    </form>
  )
}

export default function ProjectDetailPage() {
  const { id } = useParams()
  const { project, loading, error } = useProject(id)
  const { user, role: authRole } = useAuth()

  const [jobs, setJobs] = useState([])
  const [jobsLoading, setJobsLoading] = useState(true)
  const [jobsError, setJobsError] = useState(null)
  const [projectCompanies, setProjectCompanies] = useState([])
  const [companiesLoading, setCompaniesLoading] = useState(true)
  const [companiesError, setCompaniesError] = useState(null)
  const [claimRefresh, setClaimRefresh] = useState(0)
  const [activeProject, setActiveProject] = useState(null)
  const [myClaim, setMyClaim] = useState(null)

  useEffect(() => {
    setActiveProject(project)
  }, [project])

  useEffect(() => {
    if (!project?.id) {
      setProjectCompanies([])
      setCompaniesLoading(false)
      return
    }
    let mounted = true
    setCompaniesLoading(true)
    setCompaniesError(null)
    getApprovedProjectCompanies(project.id)
      .then((data) => { if (mounted) setProjectCompanies(data) })
      .catch((err) => { if (mounted) setCompaniesError(err) })
      .finally(() => { if (mounted) setCompaniesLoading(false) })
    return () => { mounted = false }
  }, [project?.id, claimRefresh])

  useEffect(() => {
    const role = normalizeRole(authRole)
    if (!user?.id || !project?.id || (role !== 'gc' && role !== 'sc')) {
      setMyClaim(null)
      return
    }
    let mounted = true
    getMyClaimForProject(user.id, project.id)
      .then((claim) => { if (mounted) setMyClaim(claim) })
      .catch(() => { if (mounted) setMyClaim(null) })
    return () => { mounted = false }
  }, [user?.id, authRole, project?.id, claimRefresh])

  useEffect(() => {
    if (!project?.id) {
      setJobs([])
      setJobsLoading(false)
      return
    }
    let mounted = true
    setJobsLoading(true)
    setJobsError(null)
    getJobsByProjectId(project.id)
      .then((data) => { if (mounted) setJobs(data) })
      .catch((err) => { if (mounted) setJobsError(err) })
      .finally(() => { if (mounted) setJobsLoading(false) })
    return () => { mounted = false }
  }, [project?.id])

  if (loading) {
    return <div className="rounded-3xl border border-slate-800 bg-slate-900 p-6 text-slate-400">Loading project...</div>
  }
  if (error) {
    return <div className="rounded-3xl border border-red-900/60 bg-red-950/40 p-6 text-red-300">{error.message}</div>
  }
  if (!project) {
    return (
      <div className="rounded-3xl border border-slate-800 bg-slate-900 p-6">
        <h1 className="text-2xl font-bold text-white">Project not found</h1>
        <p className="mt-2 text-slate-400">That project may have been removed.</p>
        <Link to="/jobsites" className="mt-6 inline-block rounded-xl bg-yellow-400 px-4 py-2 font-bold text-black">
          Back to Jobsites Map
        </Link>
      </div>
    )
  }

  const displayedProject = activeProject || project
  const publicLocation = getContractorDisplayLocation(displayedProject)
  const canEditLocation =
    normalizeRole(authRole) === 'admin' ||
    (myClaim?.status === 'approved' && ['gc', 'sc'].includes(normalizeRole(authRole)))
  const isAdmin = normalizeRole(authRole) === 'admin'
  const canManageImages =
    isAdmin ||
    (
      normalizeRole(authRole) === 'gc' &&
      myClaim?.status === 'approved' &&
      myClaim?.company_role === 'gc' &&
      myClaim?.is_primary_gc !== false
    )
  const projectImages = displayedProject._images || []
  const primaryImage = displayedProject._primaryImage || projectImages.find((image) => image.is_primary) || projectImages[0] || null

  const lat = Number(displayedProject.latitude)
  const lng = Number(displayedProject.longitude)
  const hasCoords = Number.isFinite(lat) && Number.isFinite(lng)
  const openRoleCount = jobsLoading ? null : getOpenRoleCount(jobs)
  const isHiring = !jobsLoading && openRoleCount > 0
  const locationQuery = hasCoords
    ? `${lat},${lng}`
    : [displayedProject.display_address || displayedProject.address, displayedProject.city, displayedProject.province]
      .filter(Boolean)
      .join(', ')
  const mapsUrl = displayedProject.google_maps_url ||
    (locationQuery ? `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(locationQuery)}` : null)
  const metaLocation = [displayedProject.city, displayedProject.province].filter(Boolean).join(', ')
  const metaTitle = `${displayedProject.project_name || 'Project'} | Jobsite Finder`
  const metaDescription = [
    displayedProject.project_name,
    metaLocation,
    displayedProject.stage ? `Stage: ${displayedProject.stage}` : '',
    displayedProject.hiring_status ? `Hiring status: ${displayedProject.hiring_status}` : '',
  ].filter(Boolean).join('. ')
  const projectImage = primaryImage?.image_url || displayedProject.primary_image_url || undefined
  const jobStructuredData = (jobs || []).slice(0, 10).map((job) => ({
    '@context': 'https://schema.org',
    '@type': 'JobPosting',
    title: job.title || job.trade || 'Construction Job',
    description: stripHtml(job.description || job.requirements || `Construction role at ${displayedProject.project_name}`),
    datePosted: job.created_at || displayedProject.created_at || undefined,
    employmentType: job.employment_type || undefined,
    hiringOrganization: {
      '@type': 'Organization',
      name: job.company?.company_name || displayedProject.general_contractor || 'Hiring Contractor',
    },
    jobLocation: {
      '@type': 'Place',
      address: {
        '@type': 'PostalAddress',
        addressLocality: displayedProject.city || undefined,
        addressRegion: displayedProject.province || undefined,
        addressCountry: 'CA',
      },
    },
  }))
  const projectStructuredData = [
    breadcrumbSchema([
      { name: 'Home', path: '/' },
      { name: 'Jobsites', path: '/jobsites' },
      { name: displayedProject.project_name || 'Project', path: `/projects/${displayedProject.id}` },
    ]),
    {
      '@context': 'https://schema.org',
      '@type': 'Place',
      name: displayedProject.project_name,
      url: canonicalUrl(`/projects/${displayedProject.id}`),
      description: stripHtml(displayedProject.description) || metaDescription,
      address: {
        '@type': 'PostalAddress',
        addressLocality: displayedProject.city || undefined,
        addressRegion: displayedProject.province || undefined,
        streetAddress: displayedProject.display_address || displayedProject.address || undefined,
        addressCountry: 'CA',
      },
      image: projectImage,
    },
    ...jobStructuredData,
  ]

  return (
    <div className="space-y-6">
      <PageMeta
        title={metaTitle}
        description={metaDescription}
        path={`/projects/${displayedProject.id}`}
        image={projectImage}
        structuredData={projectStructuredData}
      />

      <div className="rounded-3xl border border-slate-800 bg-slate-950 p-5 sm:p-7">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="min-w-0">
            <p className="inline-flex items-center gap-1.5 text-sm font-semibold text-yellow-300">
              <MapPin size={16} aria-hidden="true" />
              {publicLocation || 'Location not listed'}
            </p>
            <h1 className="mt-2 text-3xl font-black leading-tight text-white sm:text-4xl">
              {displayedProject.project_name || 'Project details'}
            </h1>
          </div>
          <StatusBadge statusType={displayedProject.project_status_type || 'unverified'} />
        </div>
      </div>

      <section id="project-open-jobs" className="scroll-mt-24 rounded-3xl border border-yellow-400/30 bg-slate-900 p-5 shadow-lg shadow-yellow-400/5 sm:p-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <p className="text-xs font-black uppercase tracking-wider text-yellow-300">Hiring</p>
            <h2 className="mt-1 text-2xl font-black text-white">
              {jobsLoading
                ? 'Checking open positions...'
                : isHiring
                  ? `${openRoleCount} Open ${openRoleCount === 1 ? 'Position' : 'Positions'}`
                  : 'No Open Positions Currently'}
            </h2>
            <p className="mt-2 text-sm text-slate-400">
              {isHiring ? 'Apply to an active role tied to this jobsite.' : 'There are no live job posts for this project right now.'}
            </p>
          </div>
          <div className="shrink-0">
            {jobs[0] ? (
              <ApplyButton jobPostId={jobs[0].id} />
            ) : (
              <span className="inline-flex min-h-10 items-center justify-center rounded-xl border border-slate-700 bg-slate-950 px-4 py-2 text-sm font-bold text-slate-400">
                Apply Now
              </span>
            )}
          </div>
        </div>
        {jobsLoading && <p className="mt-4 text-sm text-slate-400">Loading jobs...</p>}
        {jobsError && !jobsLoading && (
          <p className="mt-4 text-sm text-red-300">{jobsError.message}</p>
        )}
        {jobs.length > 0 && (
          <div className="mt-4 space-y-3">
            {jobs.map((job) => (
              <JobCard key={job.id} job={job}>
                <div className="flex flex-col gap-2 sm:flex-row sm:items-start">
                  <ApplyButton jobPostId={job.id} />
                  <SaveJobButton jobPostId={job.id} />
                </div>
              </JobCard>
            ))}
          </div>
        )}
      </section>

      {(projectImages.length > 0 || canManageImages) && (
        <DetailSection title="Jobsite Photos" icon={ImageIcon}>
          <ProjectImageManager
            projectId={displayedProject.id}
            projectName={displayedProject.project_name}
            companyId={myClaim?.company_profile_id || null}
            userId={user?.id}
            canManage={canManageImages}
            initialImages={projectImages}
            onImagesChanged={(images) => {
              setActiveProject((current) => ({
                ...(current || displayedProject),
                _images: images,
                _primaryImage: images.find((image) => image.is_primary) || images[0] || null,
              }))
            }}
          />
        </DetailSection>
      )}

      {projectImages.length === 0 && !canManageImages && normalizeRole(authRole) === 'gc' && (
        <DetailSection title="Jobsite Photos" icon={ImageIcon}>
          <div className="rounded-2xl border border-slate-800 bg-black/25 p-4 text-sm text-slate-400">
            Project photos are available once your company is approved as the primary General Contractor on a jobsite.
          </div>
        </DetailSection>
      )}

      <DetailSection title="Project Information" icon={FileText}>
        <ProjectOverview
          project={displayedProject}
          jobs={jobs}
          jobsLoading={jobsLoading}
          companies={projectCompanies}
        />
      </DetailSection>

      <DetailSection title="Primary General Contractor" icon={BriefcaseBusiness}>
        <PrimaryGeneralContractor
          companies={projectCompanies}
          jobs={jobs}
          loading={companiesLoading}
          error={companiesError}
        />
      </DetailSection>

      <DetailSection title="Subcontractors" icon={UsersRound}>
        <SubcontractorList
          companies={projectCompanies}
          jobs={jobs}
          loading={companiesLoading}
          error={companiesError}
        />
      </DetailSection>

      <DetailSection title="Location" icon={MapPin}>
        <div className="grid gap-3 sm:grid-cols-2">
          <Field label="Jobsite Location" value={publicLocation || 'Location not listed'} />
          <Field label="City" value={displayedProject.city} />
          <Field label="Province" value={displayedProject.province} />
          <Field label="Address" value={displayedProject.display_address || displayedProject.address} />
        </div>
        {mapsUrl && (
          <a
            href={mapsUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-4 inline-flex items-center gap-2 rounded-xl border border-yellow-400/40 bg-yellow-400/10 px-4 py-2 text-sm font-semibold text-yellow-300 transition hover:border-yellow-400 hover:bg-yellow-400/20"
          >
            <Navigation size={15} aria-hidden="true" />
            Open in Maps
          </a>
        )}
      </DetailSection>

      <DetailSection title="Jobsite Access" icon={MapPin}>
        <JobsiteAccessDetails
          project={displayedProject}
          canEdit={canEditLocation}
          onSaved={setActiveProject}
        />
      </DetailSection>

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_420px]">
        <DetailSection title="Original Listing" icon={Navigation}>
          {project.source_url ? (
            <a
              href={project.source_url}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 text-sm font-semibold text-yellow-300 hover:text-yellow-200 hover:underline"
            >
              View original listing
              <Navigation size={14} aria-hidden="true" />
            </a>
          ) : (
            <p className="text-sm text-slate-400">Not available yet</p>
          )}
        </DetailSection>

        <aside className="rounded-3xl border border-slate-800 bg-slate-900 p-6">
          <ClaimPanel
            project={project}
            refreshKey={claimRefresh}
            onClaimChanged={() => setClaimRefresh((n) => n + 1)}
          />
        </aside>
      </div>
    </div>
  )
}
