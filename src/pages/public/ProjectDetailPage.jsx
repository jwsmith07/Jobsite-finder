import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { BadgeCheck, BriefcaseBusiness, Building2, CalendarDays, DollarSign, FileText, MapPin, Navigation, ShieldCheck, UsersRound } from 'lucide-react'
import { useProject } from '../../hooks/useProjects'
import { useAuth } from '../../hooks/useAuth'
import { getJobsByProjectId } from '../../services/jobsService'
import { updateContractorProjectLocation } from '../../services/projectsService'
import { createClaim, getApprovedProjectCompanies, getMyClaimForProject } from '../../services/claimsService'
import { getContractorDisplayLocation, getPublicDisplayLocation, hasContractorLocation, normalizeRole, formatCurrencyShort } from '../../lib/utils'
import JobCard from '../../components/jobs/JobCard'
import ApplyButton from '../../components/jobs/ApplyButton'
import SaveJobButton from '../../components/jobs/SaveJobButton'
import { launchFlags } from '../../config/launchMode'
import ProjectImageManager from '../../components/projects/ProjectImageManager'
import PageMeta from '../../components/ui/PageMeta'
import { breadcrumbSchema, canonicalUrl } from '../../lib/seo'

function stripHtml(html) {
  return html ? html.replace(/<[^>]*>/g, '') : ''
}

function cleanText(value) {
  return String(value || '').replace(/\s+/g, ' ').trim()
}

function parseMetadataDescription(description) {
  const text = cleanText(stripHtml(description))
  if (!text) return { description: '', facts: [] }

  const parts = text
    .split('|')
    .map((part) => part.trim())
    .filter(Boolean)

  const colonFacts = parts
    .map((part) => {
      const match = /^([^:]{2,40}):\s*(.+)$/i.exec(part)
      if (!match) return null
      return { label: match[1].trim(), value: match[2].trim() }
    })
    .filter(Boolean)

  const looksLikeMetadata =
    parts.length > 1 &&
    (
      colonFacts.length >= 1 ||
      text.length < 180 ||
      !/[.!?]\s/.test(text)
    )

  if (!looksLikeMetadata) return { description: text, facts: [] }

  const facts = []
  parts.forEach((part, index) => {
    const match = /^([^:]{2,40}):\s*(.+)$/i.exec(part)
    if (match) {
      facts.push({ label: match[1].trim(), value: match[2].trim() })
    } else if (index === 0) {
      facts.push({ label: 'Imported Summary', value: part })
    }
  })

  return { description: '', facts }
}

const TRAVEL_MODES = [
  { key: 'DRIVING',   label: 'Drive',   icon: '🚗' },
  { key: 'WALKING',   label: 'Walk',    icon: '🚶' },
  { key: 'BICYCLING', label: 'Bike',    icon: '🚲' },
  { key: 'TRANSIT',   label: 'Transit', icon: '🚌' },
]

const CONSTRUCTION_PLACEHOLDER_IMAGE =
  'https://images.unsplash.com/photo-1503387762-592deb58ef4e?auto=format&fit=crop&w=1600&q=80'

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

function getProjectStatusLabel(stage) {
  const normalized = String(stage || '').toLowerCase()
  if (normalized.includes('complete') || normalized.includes('close')) return 'Complete'
  if (normalized.includes('planning') || normalized.includes('proposed') || normalized.includes('pre')) return 'Planning'
  return 'Active Construction'
}

function getClaimStatusLabel(primaryGc) {
  return primaryGc ? 'General Contractor Claimed' : 'General Contractor Not Yet Claimed'
}

function HeroImage({ imageUrl, projectName }) {
  const [imageFailed, setImageFailed] = useState(false)
  const src = !imageFailed ? (imageUrl || CONSTRUCTION_PLACEHOLDER_IMAGE) : null

  if (!src) {
    return (
      <div className="flex h-full min-h-[240px] items-center justify-center bg-slate-800 text-sm font-semibold uppercase tracking-wider text-slate-400">
        Construction Project
      </div>
    )
  }

  return (
    <img
      src={src}
      alt={`${projectName || 'Construction project'} hero`}
      className="h-full w-full object-cover"
      onError={() => setImageFailed(true)}
    />
  )
}

function ProjectHero({ project, imageUrl, location, primaryGc, isHiring }) {
  const projectStatus = getProjectStatusLabel(project.stage)
  const contractorName = primaryGc?.company?.company_name || 'General Contractor Not Yet Claimed'

  return (
    <section className="overflow-hidden rounded-3xl border border-slate-800 bg-slate-950">
      <div className="aspect-[16/10] bg-slate-900 sm:aspect-[16/7]">
        <HeroImage imageUrl={imageUrl} projectName={project.project_name} />
      </div>
      <div className="p-5 sm:p-7">
        <h1 className="text-3xl font-black leading-tight text-white sm:text-5xl">
          {project.project_name || 'Project details'}
        </h1>
        <div className="mt-4 flex flex-wrap gap-2">
          <InlineBadge tone="slate">
            <MapPin size={13} aria-hidden="true" />
            {location || 'Location not listed'}
          </InlineBadge>
          <InlineBadge tone="emerald">{projectStatus}</InlineBadge>
          <InlineBadge tone={primaryGc ? 'emerald' : 'slate'}>
            {getClaimStatusLabel(primaryGc)}
          </InlineBadge>
          <InlineBadge tone={isHiring ? 'amber' : 'slate'}>
            {isHiring ? 'Hiring' : 'No Open Positions'}
          </InlineBadge>
        </div>
        <p className="mt-4 text-sm font-semibold text-slate-300 sm:text-base">
          {contractorName}
        </p>
      </div>
    </section>
  )
}

function ProjectOverview({ project, jobs, jobsLoading }) {
  const parsedDescription = parseMetadataDescription(project.description)
  const openRoleCount = jobsLoading ? null : getOpenRoleCount(jobs)
  const campJobCount = (jobs ?? []).filter((job) => job.camp_available === true).length
  const unionJobCount = (jobs ?? []).filter((job) => (
    Array.isArray(job.hiring_tags) &&
    job.hiring_tags.some((tag) => String(tag).toLowerCase().includes('union'))
  )).length
  const factItems = [
    { label: 'Sector', value: project.sector || project.project_type || 'Not available yet', icon: BriefcaseBusiness },
    { label: 'Estimated Completion', value: project.end_date ? getYear(project.end_date) : 'Not available yet', icon: CalendarDays },
    { label: 'Project Value', value: project.estimated_value ? formatCurrencyShort(project.estimated_value) : 'Not available yet', icon: DollarSign },
    {
      label: 'Open Jobs',
      value: jobsLoading ? 'Checking...' : `${openRoleCount} open ${openRoleCount === 1 ? 'role' : 'roles'}`,
      icon: UsersRound,
    },
    { label: 'Camp Jobs', value: campJobCount > 0 ? `${campJobCount} available` : 'Not listed', icon: Building2 },
    { label: 'Union', value: unionJobCount > 0 ? 'Union roles listed' : 'Not listed', icon: ShieldCheck },
  ]

  return (
    <div className="space-y-4">
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
        {factItems.map(({ label, value, icon: Icon }) => (
          <OverviewItem key={`${label}-${value}`} label={label} value={value} icon={Icon} />
        ))}
      </div>
      <div className="rounded-2xl border border-slate-800 bg-black/25 p-4">
        <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">Project Description</p>
        <p className="mt-2 whitespace-pre-line text-sm leading-6 text-slate-200">
          {parsedDescription.description || 'No detailed project description has been provided yet.'}
        </p>
      </div>
      {parsedDescription.facts.length > 0 && (
        <div className="rounded-2xl border border-slate-800 bg-black/25 p-4">
          <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">Project Facts</p>
          <div className="mt-3 grid gap-3 sm:grid-cols-2">
            {parsedDescription.facts.map((fact) => (
              <Field key={`${fact.label}-${fact.value}`} label={fact.label} value={fact.value} />
            ))}
          </div>
        </div>
      )}
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

function formatCompanyRole(role) {
  return role === 'subcontractor' ? 'Subcontractor' : 'General Contractor'
}

function TeamCompanyRow({ connection, fallbackName, roleLabel, featured = false }) {
  const company = connection?.company
  const companyName = company?.company_name || fallbackName

  return (
    <article className={`rounded-2xl border p-4 ${
      featured
        ? 'border-yellow-400/35 bg-yellow-400/[0.07]'
        : 'border-slate-800 bg-black/25'
    }`}>
      <div className="flex min-w-0 gap-3">
        <CompanyLogo company={company} />
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <h3 className="break-words text-base font-black text-white">{companyName}</h3>
            {company?.verified && (
              <span className="inline-flex items-center gap-1 rounded-full border border-emerald-500/40 bg-emerald-500/10 px-2 py-0.5 text-[11px] font-semibold text-emerald-300">
                <BadgeCheck size={12} aria-hidden="true" />
                Verified
              </span>
            )}
          </div>
          <p className="mt-1 text-sm font-semibold text-yellow-200">{roleLabel}</p>
          {connection?.trade_scope && (
            <p className="mt-2 text-sm leading-6 text-slate-300">{connection.trade_scope}</p>
          )}
        </div>
      </div>
    </article>
  )
}

function ProjectTeamList({ project, companies, loading, error }) {
  const primaryGc = getPrimaryGeneralContractor(companies)
  const subcontractors = companies.filter((c) => c.status === 'approved' && c.company_role === 'subcontractor')

  if (loading) return <p className="text-sm text-slate-400">Loading project team...</p>
  if (error) return <p className="text-sm text-red-300">{error.message}</p>

  return (
    <div className="space-y-5">
      <div className="grid gap-3 lg:grid-cols-2">
        <article className="rounded-2xl border border-slate-800 bg-black/25 p-4">
          <div className="flex gap-3">
            <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl border border-slate-700 bg-slate-950 text-slate-300">
              <Building2 size={18} aria-hidden="true" />
            </span>
            <div className="min-w-0">
              <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">Owner</p>
              <h3 className="mt-1 break-words text-base font-black text-white">
                {project.owner || 'Owner not listed'}
              </h3>
            </div>
          </div>
        </article>
        <div>
          {primaryGc ? (
            <TeamCompanyRow
              connection={primaryGc}
              fallbackName="Approved general contractor"
              roleLabel="General Contractor"
              featured
            />
          ) : (
            <article className="rounded-2xl border border-slate-800 bg-black/25 p-4">
              <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">General Contractor</p>
              <h3 className="mt-1 text-base font-black text-white">Not Yet Claimed</h3>
              <p className="mt-2 text-sm leading-6 text-slate-400">
                Claim this project to verify the lead contractor and start hiring from this page.
              </p>
              <a
                href="#claim-project"
                className="mt-4 inline-flex rounded-xl bg-yellow-400 px-4 py-2 text-sm font-black text-black transition hover:bg-yellow-300"
              >
                Claim Project
              </a>
            </article>
          )}
        </div>
      </div>
      <div>
        <p className="text-xs font-semibold uppercase tracking-wider text-yellow-300">
          Subcontractors
        </p>
        {subcontractors.length === 0 ? (
          <p className="mt-2 rounded-2xl border border-slate-800 bg-black/25 p-4 text-sm text-slate-400">
            No subcontractors listed yet.
          </p>
        ) : (
          <div className="mt-2 grid gap-3 lg:grid-cols-2">
            {subcontractors.map((connection) => (
              <TeamCompanyRow
                key={connection.id}
                connection={connection}
                fallbackName="Approved subcontractor"
                roleLabel="Subcontractor"
              />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

function buildHiringCompanies(jobs, companies) {
  const claimsByCompanyId = new Map()
  for (const connection of companies ?? []) {
    if (connection.company_profile_id) claimsByCompanyId.set(String(connection.company_profile_id), connection)
    if (connection.company?.id) claimsByCompanyId.set(String(connection.company.id), connection)
  }

  const map = new Map()
  for (const job of jobs ?? []) {
    const companyId = job.company_profile_id || job.company?.id
    const key = companyId ? String(companyId) : job.company?.company_name || 'unknown'
    const existing = map.get(key) || {
      company: job.company || null,
      connection: companyId ? claimsByCompanyId.get(String(companyId)) : null,
      jobs: [],
    }
    existing.jobs.push(job)
    map.set(key, existing)
  }

  return Array.from(map.values())
}

function HiringCompaniesList({ jobs, companies }) {
  const hiringCompanies = buildHiringCompanies(jobs, companies)

  if (hiringCompanies.length === 0) {
    return <p className="text-sm text-slate-400">No hiring companies have open roles on this project yet.</p>
  }

  return (
    <div className="grid gap-3 lg:grid-cols-2">
      {hiringCompanies.map(({ company, connection, jobs: companyJobs }) => {
        const companyName = company?.company_name || connection?.company?.company_name || 'Hiring company'
        const roleLabel = connection?.company_role ? formatCompanyRole(connection.company_role) : 'Hiring Company'
        const openRoleCount = getOpenRoleCount(companyJobs)

        return (
          <article key={`${companyName}-${companyJobs[0]?.id || 'jobs'}`} className="rounded-2xl border border-slate-800 bg-black/25 p-4">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
              <div className="flex min-w-0 gap-3">
                <CompanyLogo company={company || connection?.company} />
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <h3 className="break-words text-base font-black text-white">{companyName}</h3>
                    {(company?.verified || connection?.company?.verified) && (
                      <span className="inline-flex items-center gap-1 rounded-full border border-emerald-500/40 bg-emerald-500/10 px-2 py-0.5 text-[11px] font-semibold text-emerald-300">
                        <BadgeCheck size={12} aria-hidden="true" />
                        Verified
                      </span>
                    )}
                  </div>
                  <p className="mt-1 text-sm font-semibold text-yellow-200">{roleLabel}</p>
                  <p className="mt-2 text-sm text-slate-400">
                    {openRoleCount} open {openRoleCount === 1 ? 'role' : 'roles'}
                  </p>
                </div>
              </div>
              <a
                href="#project-open-jobs"
                className="inline-flex shrink-0 items-center justify-center rounded-xl bg-yellow-400 px-4 py-2 text-sm font-black text-black transition hover:bg-yellow-300"
              >
                View Jobs
              </a>
            </div>
            <div className="mt-4 border-t border-slate-800 pt-3">
              <ul className="space-y-1 text-sm text-slate-300">
                {companyJobs.slice(0, 3).map((job) => (
                  <li key={job.id}>{job.title}</li>
                ))}
              </ul>
            </div>
          </article>
        )
      })}
    </div>
  )
}

function ProjectLocation({ location, mapsUrl }) {
  return (
    <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
      <p className="inline-flex items-center gap-2 text-base font-bold text-white">
        <MapPin size={18} aria-hidden="true" />
        {location || 'Location not listed'}
      </p>
      {mapsUrl && (
        <a
          href={mapsUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center justify-center gap-2 rounded-xl border border-yellow-400/40 bg-yellow-400/10 px-4 py-2 text-sm font-semibold text-yellow-300 transition hover:border-yellow-400 hover:bg-yellow-400/20"
        >
          <Navigation size={15} aria-hidden="true" />
          Open in Maps
        </a>
      )}
    </div>
  )
}

function InlineBadge({ children, tone = 'slate' }) {
  const tones = {
    amber: 'border-yellow-400/40 bg-yellow-400/10 text-yellow-200',
    emerald: 'border-emerald-500/40 bg-emerald-500/10 text-emerald-200',
    slate: 'border-slate-700 bg-slate-800 text-slate-300',
  }

  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-bold ${tones[tone] || tones.slate}`}>
      {children}
    </span>
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

function ClaimValueCard({ primaryGc }) {
  if (primaryGc) {
    return (
      <div className="rounded-2xl border border-emerald-900/50 bg-emerald-950/30 p-4">
        <p className="text-sm font-bold text-emerald-200">General Contractor Claimed</p>
        <p className="mt-2 text-sm leading-6 text-emerald-100">
          This project has a verified lead contractor. Approved companies can post jobs and keep the project page current.
        </p>
      </div>
    )
  }

  const benefits = [
    'Post jobs tied to this project',
    'Upload the hero image',
    'Manage project information',
    'Prepare subcontractor participation',
    'Connect with trades workers',
  ]

  return (
    <div className="rounded-2xl border border-yellow-400/30 bg-yellow-400/[0.07] p-4">
      <p className="text-sm font-black text-white">Take control of this project page</p>
      <p className="mt-2 text-sm leading-6 text-slate-300">
        Claiming verifies your company as the General Contractor and unlocks the tools to start hiring.
      </p>
      <ul className="mt-3 space-y-2 text-sm text-slate-200">
        {benefits.map((benefit) => (
          <li key={benefit} className="flex gap-2">
            <span className="text-yellow-300">-</span>
            <span>{benefit}</span>
          </li>
        ))}
      </ul>
      <a
        href="#claim-project"
        className="mt-4 inline-flex rounded-xl bg-yellow-400 px-4 py-2 text-sm font-black text-black transition hover:bg-yellow-300"
      >
        Claim Project
      </a>
    </div>
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
      setMessage({ type: 'success', text: 'Claim submitted. Admin review comes next; approval unlocks project management and job posting.' })
      onClaimChanged?.()
    } catch (err) {
      setMessage({ type: 'error', text: err.message || 'Could not submit this claim. Please check your company profile and try again.' })
    } finally {
      setSubmitting(false)
    }
  }

  if (!user) {
    return (
      <div className="rounded-2xl border border-slate-800 bg-slate-950 p-4 text-sm text-slate-400">
        Own or manage this project?{' '}
        <Link to="/signin" className="text-yellow-300 hover:underline">
          Sign in
        </Link>{' '}
        with a company account to start a claim.
      </div>
    )
  }

  if (!isCompany) {
    return (
      <div className="rounded-2xl border border-slate-800 bg-slate-950 p-4 text-sm text-slate-400">
        Only company accounts can claim a project.
      </div>
    )
  }

  if (loading) {
    return <p className="text-sm text-slate-400">Checking your claim...</p>
  }

  if (claim?.status === 'pending') {
    return (
      <div className="rounded-2xl border border-yellow-900/60 bg-yellow-950/30 p-4 text-sm text-yellow-200">
        Your claim is pending admin review. Approval unlocks project management and job posting.
      </div>
    )
  }

  if (claim?.status === 'approved') {
    return (
      <div className="rounded-2xl border border-emerald-900/60 bg-emerald-950/40 p-4 text-sm text-emerald-300">
        Your company is approved on this project. You can manage the project page and post jobs from your company tools.
      </div>
    )
  }

  return (
    <form onSubmit={handleClaim} className="space-y-3 rounded-2xl border border-slate-800 bg-slate-950 p-4">
      <div>
        <p className="text-sm font-semibold text-white">Claim this project</p>
        <p className="mt-1 text-xs text-slate-500">
          Claim Project, Admin Review, Approval, Manage Project, Post Jobs.
        </p>
      </div>
      <div>
        <label className="block text-xs uppercase tracking-wider text-slate-500 mb-1">Role</label>
        <select
          value={claimType}
          onChange={(e) => setClaimType(e.target.value)}
          className="w-full rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-sm text-white outline-none focus:border-yellow-400"
        >
          <option value="gc">General Contractor (project lead)</option>
          <option value="sc">Subcontractor (request participation)</option>
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
  const isApprovedPrimaryGc =
    normalizeRole(authRole) === 'gc' &&
    myClaim?.status === 'approved' &&
    myClaim?.company_role === 'gc' &&
    myClaim?.is_primary_gc !== false
  const canEditLocation =
    normalizeRole(authRole) === 'admin' ||
    isApprovedPrimaryGc
  const isAdmin = normalizeRole(authRole) === 'admin'
  const canManageImages =
    isAdmin ||
    isApprovedPrimaryGc
  const projectImages = displayedProject._images || []
  const primaryImage = displayedProject._primaryImage || projectImages.find((image) => image.is_primary) || projectImages[0] || null
  const primaryGc = getPrimaryGeneralContractor(projectCompanies)

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

      <ProjectHero
        project={displayedProject}
        imageUrl={projectImage}
        location={publicLocation || metaLocation}
        primaryGc={primaryGc}
        isHiring={isHiring}
      />

      {canManageImages && (
        <DetailSection title="Hero Image" icon={FileText}>
          <ProjectImageManager
            projectId={displayedProject.id}
            projectName={displayedProject.project_name}
            companyId={myClaim?.company_profile_id || null}
            userId={user?.id}
            canManage={canManageImages}
            initialImages={projectImages}
            variant="hero"
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
              <span className="inline-flex min-h-11 w-full items-center justify-center rounded-xl border border-slate-700 bg-slate-950 px-4 py-2 text-sm font-bold text-slate-400 sm:w-auto">
                No jobs to apply for yet
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
              <JobCard key={job.id} job={job} location={publicLocation || metaLocation}>
                <div className="flex flex-col gap-2 sm:flex-row sm:items-start">
                  <ApplyButton jobPostId={job.id} />
                  {launchFlags.SHOW_SAVED_JOBS && <SaveJobButton jobPostId={job.id} />}
                </div>
              </JobCard>
            ))}
          </div>
        )}
      </section>

      <aside id="claim-project" className="scroll-mt-24 rounded-3xl border border-slate-800 bg-slate-900 p-5 sm:p-6">
        <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_360px]">
          <ClaimValueCard primaryGc={primaryGc} />
          <ClaimPanel
            project={project}
            refreshKey={claimRefresh}
            onClaimChanged={() => setClaimRefresh((n) => n + 1)}
          />
        </div>
      </aside>

      <DetailSection title="Quick Info" icon={FileText}>
        <ProjectOverview
          project={displayedProject}
          jobs={jobs}
          jobsLoading={jobsLoading}
        />
      </DetailSection>

      <DetailSection title="Project Team" icon={UsersRound}>
        <ProjectTeamList
          project={displayedProject}
          companies={projectCompanies}
          loading={companiesLoading}
          error={companiesError}
        />
      </DetailSection>

      <DetailSection title="Hiring Companies" icon={BriefcaseBusiness}>
        <HiringCompaniesList
          jobs={jobs}
          companies={projectCompanies}
        />
      </DetailSection>

      <DetailSection title="Location" icon={MapPin}>
        <ProjectLocation
          location={publicLocation || metaLocation}
          mapsUrl={mapsUrl}
        />
      </DetailSection>

    </div>
  )
}
