import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../../hooks/useAuth'
import {
  getApplicantsForMyCompany,
  updateApplication,
} from '../../services/applicationsService'
import BackButton from '../../components/ui/BackButton'
import GlobalCard, { CardHeader, CardContent, CardFooter } from '../../components/ui/GlobalCard'
import GlobalButton from '../../components/ui/GlobalButton'
import StatusBadge from '../../components/ui/StatusBadge'
import { PageTitle, PageSubtitle, CardTitle, SmallText, Caption, Label } from '../../components/ui/Typography'
import { normalizeTrade } from '../../lib/trades'

const STATUS_ACTIONS = [
  { value: 'submitted', label: 'Submitted' },
  { value: 'applied', label: 'Applied' },
  { value: 'shortlisted', label: 'Shortlisted' },
  { value: 'interview', label: 'Interview' },
  { value: 'rejected', label: 'Rejected' },
  { value: 'hired', label: 'Hired' },
]

function formatDate(iso) {
  if (!iso) return ''
  try { return new Date(iso).toLocaleDateString() } catch { return iso }
}

export function ApplicantsManager({ roleLabel = 'General Contractor' }) {
  const { user, loading: authLoading } = useAuth()
  const [items, setItems] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [busyId, setBusyId] = useState(null)
  const [notes, setNotes] = useState({})

  async function load() {
    if (!user) return
    setLoading(true)
    setError(null)
    console.log('[GCApplicantsPage] Loading applicants for user:', user)
    try {
      const data = await getApplicantsForMyCompany(user.id)
      console.log('[GCApplicantsPage] Loaded applicants:', data)
      setItems(data)
      if (!data || data.length === 0) {
        console.log('[GCApplicantsPage] No applicant rows returned for current company jobs')
      }
      const notesObj = {}
      data.forEach(a => {
        notesObj[a.id] = a.company_notes || ''
      })
      setNotes(notesObj)
    } catch (err) {
      console.error('[GCApplicantsPage] Load error:', err)
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

  async function handleSave(id, status, company_notes) {
    if (!user) return
    setBusyId(id)
    console.log('[GCApplicantsPage] Updating application:', { id, status, company_notes })
    try {
      await updateApplication(id, user.id, { status, company_notes })
      console.log('[GCApplicantsPage] Application updated successfully')
      await load()
    } catch (err) {
      console.error('[GCApplicantsPage] Update error:', err.message)
      setError(err)
    } finally {
      setBusyId(null)
    }
  }

  if (authLoading) {
    return (
      <GlobalCard padding="lg" className="text-center">
        <p className="text-slate-400">Loading...</p>
      </GlobalCard>
    )
  }

  if (!user) {
    return (
      <GlobalCard padding="lg">
        <PageTitle>{roleLabel} Applicants</PageTitle>
        <PageSubtitle>Please sign in to review applicants.</PageSubtitle>
        <div className="mt-6">
          <Link to="/signin">
            <GlobalButton>Sign in</GlobalButton>
          </Link>
        </div>
      </GlobalCard>
    )
  }

  return (
    <div className="space-y-4 sm:space-y-6">
      <BackButton label="← Back" />
      
      <GlobalCard padding="md">
        <CardHeader
          title={`${roleLabel} Applicants`}
          subtitle="Trades who applied to your job posts."
        />
      </GlobalCard>

      <div className="space-y-3">
        {loading && (
          <GlobalCard padding="md" className="text-center">
            <p className="text-slate-400">Loading applicants...</p>
          </GlobalCard>
        )}
        {error && !loading && (
          <GlobalCard padding="md" className="border-red-500/40 bg-red-500/10">
            <p className="text-red-300">{error.message}</p>
          </GlobalCard>
        )}
        {!loading && !error && items.length === 0 && (
          <GlobalCard padding="md" className="text-center">
            <p className="text-slate-400">No applicants yet.</p>
          </GlobalCard>
        )}

        {items.map((a) => {
          const name = a.worker_name || 'Applicant'
          const trade = normalizeTrade(a.worker_trade || a.job_post?.trade) || 'Trade not specified'
          const experience = a.worker_experience ? `${a.worker_experience} years` : null
          const currentNotes = notes[a.id] || ''

          return (
            <GlobalCard key={a.id} padding="md">
              <div className="space-y-3">
                {/* Header */}
                <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                  <div className="flex-1">
                    <CardTitle>{name}</CardTitle>
                    <SmallText className="mt-1">{trade}</SmallText>
                  </div>
                  <Caption className="text-right">{formatDate(a.created_at)}</Caption>
                </div>

                {/* Details */}
                <div className="space-y-1">
                  {experience && <SmallText>{experience} experience</SmallText>}
                  <SmallText>Applied to: <span className="text-slate-200">{a.job_post?.title || 'Job post'}</span></SmallText>
                </div>

                {/* Message */}
                {a.message && (
                  <p className="text-sm text-slate-300 border-t border-slate-800 pt-3 mt-3 whitespace-pre-line">{a.message}</p>
                )}

                {/* Status */}
                <div className="flex gap-2 pt-3 border-t border-slate-800">
                  <div className="flex-1">
                    <Label>Status</Label>
                    <select
                      value={a.status}
                      onChange={(e) => {
                        const newItems = items.map(item =>
                          item.id === a.id ? { ...item, status: e.target.value } : item
                        )
                        setItems(newItems)
                      }}
                      className="w-full rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-sm text-slate-200 focus:border-amber-400 focus:outline-none focus:ring-2 focus:ring-amber-400/20 mt-1"
                    >
                      {STATUS_ACTIONS.map((s) => (
                        <option key={s.value} value={s.value}>{s.label}</option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Company Notes */}
                <div>
                  <Label>Company Notes</Label>
                  <textarea
                    value={currentNotes}
                    onChange={(e) => setNotes({ ...notes, [a.id]: e.target.value })}
                    placeholder="Add notes about this applicant..."
                    rows={3}
                    className="w-full rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-sm text-slate-200 focus:border-amber-400 focus:outline-none focus:ring-2 focus:ring-amber-400/20 mt-1"
                  />
                </div>

                {/* Actions */}
                <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between pt-3 border-t border-slate-800">
                  <div className="flex gap-2">
                    {a.resume_url && (
                      <a
                        href={a.resume_url}
                        target="_blank"
                        rel="noreferrer"
                      >
                        <GlobalButton size="sm" variant="secondary">
                          View Resume
                        </GlobalButton>
                      </a>
                    )}
                    {a.worker_profile_id && (
                      <Link to={`/worker/${a.worker_profile_id}`}>
                        <GlobalButton size="sm" variant="secondary">
                          Worker Profile
                        </GlobalButton>
                      </Link>
                    )}
                  </div>
                  <GlobalButton
                    size="sm"
                    variant="primary"
                    isLoading={busyId === a.id}
                    disabled={busyId === a.id}
                    onClick={() => handleSave(a.id, a.status, currentNotes)}
                  >
                    Save
                  </GlobalButton>
                </div>
              </div>
            </GlobalCard>
          )
        })}
      </div>
    </div>
  )
}

export default function GCApplicantsPage() {
  return <ApplicantsManager roleLabel="General Contractor" />
}
