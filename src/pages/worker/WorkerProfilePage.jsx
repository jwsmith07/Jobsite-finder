import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../../hooks/useAuth'
import {
  ensureProfile,
  getMyWorkerProfile,
  saveWorkerProfile,
} from '../../services/profilesService'
import WorkerProfileForm from '../../components/profile/WorkerProfileForm'
import GlobalCard, { CardHeader, CardContent } from '../../components/ui/GlobalCard'
import GlobalButton from '../../components/ui/GlobalButton'
import { PageTitle, PageSubtitle, CardTitle, SmallText, Caption } from '../../components/ui/Typography'
import StatusBadge, { Badge } from '../../components/ui/StatusBadge'
import { normalizeApprenticeshipLevel, normalizeTrade } from '../../lib/trades'
import {
  getAvailabilityLabel,
  getProfileCertifications,
  getProfileCompletion,
  getTalentVisibilityLabel,
  normalizeList,
} from '../../lib/workerCredentials'
import { launchFlags } from '../../config/launchMode'
import { createResumeSignedUrl, hasResumeReference } from '../../services/resumeAccessService'

export default function WorkerProfilePage() {
  const { user, loading: authLoading } = useAuth()
  const [initial, setInitial] = useState(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState(null)
  const [editing, setEditing] = useState(false)

  useEffect(() => {
    if (authLoading) return
    if (!user) {
      setLoading(false)
      return
    }
    let mounted = true
    setLoading(true)
    setMessage(null)
    ;(async () => {
      try {
        await ensureProfile(user)
        const wp = await getMyWorkerProfile(user.id)
        if (mounted) {
          if (wp) {
            setInitial(wp)
          } else {
            // No saved profile yet — pre-fill from signup metadata
            const meta = user.user_metadata || {}
            setInitial({
              trade: meta.trade ?? '',
              headline: meta.full_name ? `${meta.full_name}` : '',
            })
          }
        }
      } catch (err) {
        if (mounted) setMessage({ type: 'error', text: err.message })
      } finally {
        if (mounted) setLoading(false)
      }
    })()
    return () => {
      mounted = false
    }
  }, [user, authLoading])

  async function handleSubmit(values) {
    if (!user) return
    setSaving(true)
    setMessage(null)
    try {
      const saved = await saveWorkerProfile(user.id, values)
      setInitial(saved)
      setMessage({ type: 'success', text: 'Profile saved successfully.' })
    } catch (err) {
      setMessage({ type: 'error', text: err.message })
    } finally {
      setSaving(false)
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
        <PageTitle>Worker Profile</PageTitle>
        <PageSubtitle>Please sign in to manage your worker profile.</PageSubtitle>
        <div className="mt-6">
          <Link to="/signin">
            <GlobalButton>Sign in</GlobalButton>
          </Link>
        </div>
      </GlobalCard>
    )
  }

  if (editing) {
    return (
      <div className="space-y-4 sm:space-y-6">
        
        <GlobalCard padding="md">
          <CardHeader
            title="Edit Profile"
            subtitle="Update your trade info visible to GCs and subs hiring on active jobsites."
            actions={
              <GlobalButton
                variant="secondary"
                size="sm"
                onClick={() => setEditing(false)}
              >
                Cancel
              </GlobalButton>
            }
          />
        </GlobalCard>

        {message && (
          <GlobalCard padding="md" variant={message.type === 'error' ? 'outlined' : 'outlined'} className={`border ${message.type === 'error' ? 'border-red-500/40 bg-red-500/10' : 'border-emerald-500/40 bg-emerald-500/10'}`}>
            <p className={message.type === 'error' ? 'text-red-300' : 'text-emerald-300'}>
              {message.type === 'error' ? '⚠ ' : '✓ '}
              {message.text}
            </p>
          </GlobalCard>
        )}

        <GlobalCard padding="lg">
          {loading ? (
            <p className="text-slate-400">Loading your profile...</p>
          ) : (
            <WorkerProfileForm
              initialValues={initial}
              onSubmit={handleSubmit}
              loading={saving}
              userId={user.id}
            />
          )}
        </GlobalCard>
      </div>
    )
  }

  return (
    <div className="space-y-4 sm:space-y-6">
      
      <GlobalCard padding="md">
        <CardHeader
          title="My Profile"
          subtitle="Your trade info is visible to GCs and subs hiring on active jobsites."
          actions={
            <GlobalButton
              variant="primary"
              size="sm"
              onClick={() => setEditing(true)}
            >
              Edit Profile
            </GlobalButton>
          }
        />
      </GlobalCard>

      {message && (
        <GlobalCard padding="md" className={`border ${message.type === 'error' ? 'border-red-500/40 bg-red-500/10' : 'border-emerald-500/40 bg-emerald-500/10'}`}>
          <p className={message.type === 'error' ? 'text-red-300' : 'text-emerald-300'}>
            {message.type === 'error' ? '⚠ ' : '✓ '}
            {message.text}
          </p>
        </GlobalCard>
      )}

      {loading ? (
        <GlobalCard padding="lg" className="text-center">
          <p className="text-slate-400">Loading your profile...</p>
        </GlobalCard>
      ) : initial ? (
        <ProfileDisplay profile={initial} userId={user.id} onEdit={() => setEditing(true)} />
      ) : (
        <GlobalCard padding="lg">
          <p className="text-slate-400 mb-4">No profile data yet.</p>
          <GlobalButton onClick={() => setEditing(true)}>
            Create Profile
          </GlobalButton>
        </GlobalCard>
      )}
    </div>
  )
}

function ProfileDisplay({ profile, userId, onEdit }) {
  const location = [profile.city, profile.province].filter(Boolean).join(', ')
  const primaryTrade = normalizeTrade(profile.trade)
  const secondaryTrade = normalizeTrade(profile.secondary_trade)
  const apprenticeshipLevel = normalizeApprenticeshipLevel(profile.apprenticeship_level)
  const certifications = getProfileCertifications(profile)
  const workPreferences = normalizeList(profile.work_preferences)
  const preferredRegions = normalizeList(profile.preferred_regions)
  const completion = getProfileCompletion(profile)
  const [openingResume, setOpeningResume] = useState(false)

  async function openResume() {
    setOpeningResume(true)
    try {
      const url = await createResumeSignedUrl(profile.resume_url)
      window.open(url, '_blank', 'noopener,noreferrer')
    } finally {
      setOpeningResume(false)
    }
  }

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Header */}
      <GlobalCard padding="md">
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <Badge variant="accent">Worker</Badge>
          </div>
          <div>
            <CardTitle>{profile.headline || 'No headline'}</CardTitle>
            <SmallText className="mt-1">{primaryTrade || 'No primary trade specified'}</SmallText>
            {secondaryTrade && <SmallText className="mt-1">Secondary: {secondaryTrade}</SmallText>}
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-sm">
            {location && <Caption>{location}</Caption>}
            {profile.phone && <Caption>{profile.phone}</Caption>}
          </div>
        </div>
      </GlobalCard>

      <GlobalCard padding="md">
        <CardHeader
          title="Profile Completion"
          subtitle="A complete profile helps hiring companies evaluate you faster."
        />
        <CardContent className="mt-4">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="h-3 flex-1 overflow-hidden rounded-full bg-slate-800">
              <div
                className="h-full rounded-full bg-amber-400"
                style={{ width: `${completion.percent}%` }}
              />
            </div>
            <p className="text-sm font-bold text-amber-300">{completion.percent}% complete</p>
          </div>
          <div className="mt-4 grid gap-2 sm:grid-cols-2">
            {completion.items.map((item) => (
              <div key={item.label} className="flex items-center justify-between rounded-xl border border-slate-800 bg-slate-950 p-3">
                <SmallText>{item.label}</SmallText>
                <Badge variant={item.complete ? 'success' : 'warning'}>
                  {item.complete ? 'Done' : 'Needed'}
                </Badge>
              </div>
            ))}
          </div>
          {completion.items.some((item) => !item.complete) && (
            <div className="mt-4 rounded-xl border border-amber-500/30 bg-amber-500/10 p-3">
              <Caption>Recommended next steps</Caption>
              <ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-amber-100">
                {completion.items.filter((item) => !item.complete).slice(0, 3).map((item) => (
                  <li key={item.label}>{item.recommendation}</li>
                ))}
              </ul>
            </div>
          )}
        </CardContent>
      </GlobalCard>

      {/* Resume Card */}
      <GlobalCard padding="md">
        <CardHeader title="Resume" />
        <CardContent className="mt-3">
          {hasResumeReference(profile.resume_url) ? (
            <div className="flex flex-col gap-2 sm:flex-row sm:gap-3">
              <GlobalButton size="sm" onClick={openResume} disabled={openingResume}>
                {openingResume ? 'Opening...' : 'View Resume'}
              </GlobalButton>
              <GlobalButton
                variant="secondary"
                size="sm"
                onClick={() => {
                  // Trigger resume upload
                  onEdit?.()
                }}
              >
                Update Resume
              </GlobalButton>
            </div>
          ) : (
            <SmallText>No resume uploaded yet.</SmallText>
          )}
        </CardContent>
      </GlobalCard>

      {/* Experience Section */}
      <GlobalCard padding="md">
        <CardHeader title="Experience" />
        <CardContent className="mt-3">
          {apprenticeshipLevel && (
            <SmallText>{apprenticeshipLevel}</SmallText>
          )}
          {profile.trade_level && <SmallText>{profile.trade_level}</SmallText>}
          <SmallText>
            {profile.experience_years ? `${profile.experience_years} years` : 'Experience not specified'}
          </SmallText>
          {profile.bio && <SmallText className="mt-2">{profile.bio}</SmallText>}
        </CardContent>
      </GlobalCard>

      <GlobalCard padding="md">
        <CardHeader title="Resume Status" />
        <CardContent className="mt-3 grid gap-2 sm:grid-cols-2">
          <div className="rounded-xl border border-slate-800 bg-slate-950 p-3">
            <Caption>Trade</Caption>
            <SmallText>{primaryTrade || 'Not specified'}</SmallText>
          </div>
          <div className="rounded-xl border border-slate-800 bg-slate-950 p-3">
            <Caption>Years Experience</Caption>
            <SmallText>{profile.experience_years ? `${profile.experience_years} years` : 'Not specified'}</SmallText>
          </div>
          {launchFlags.SHOW_TALENT_POOL && (
            <div className="rounded-xl border border-slate-800 bg-slate-950 p-3">
              <Caption>Certifications</Caption>
              <SmallText>{certifications.length ? certifications.join(', ') : 'Not specified'}</SmallText>
            </div>
          )}
          <div className="rounded-xl border border-slate-800 bg-slate-950 p-3">
            <Caption>Resume</Caption>
            <SmallText>{hasResumeReference(profile.resume_url) ? 'Uploaded' : 'Not uploaded'}</SmallText>
          </div>
        </CardContent>
      </GlobalCard>

      <GlobalCard padding="md">
        <CardHeader title="Structured Availability & Preferences" />
        <CardContent className="mt-3 space-y-4">
          <div>
            <Caption>Availability</Caption>
            <SmallText>{getAvailabilityLabel(profile.availability_status)}</SmallText>
          </div>
          {launchFlags.SHOW_TALENT_POOL && (
            <div>
              <Caption>Talent Discovery Visibility</Caption>
              <SmallText>{getTalentVisibilityLabel(profile.talent_visibility)}</SmallText>
            </div>
          )}
          <div>
            <Caption>Work Preferences</Caption>
            <div className="mt-2 flex flex-wrap gap-2">
              {(workPreferences.length ? workPreferences : ['Not specified']).map((item) => (
                <Badge key={item} variant={workPreferences.length ? 'accent' : 'neutral'}>{item}</Badge>
              ))}
            </div>
          </div>
          <div>
            <Caption>Preferred Regions</Caption>
            <div className="mt-2 flex flex-wrap gap-2">
              {(preferredRegions.length ? preferredRegions : ['Not specified']).map((item) => (
                <Badge key={item} variant={preferredRegions.length ? 'accent' : 'neutral'}>{item}</Badge>
              ))}
            </div>
          </div>
        </CardContent>
      </GlobalCard>

      {/* Availability */}
      <GlobalCard padding="md">
        <CardHeader title="Availability" />
        <CardContent className="mt-3">
          <SmallText>{profile.availability || 'Not specified'}</SmallText>
          {profile.camp_ready && (
            <p className="mt-2 text-amber-400 text-sm">Camp ready</p>
          )}
          {profile.willing_to_travel && (
            <p className="mt-2 text-amber-400 text-sm">✓ Willing to travel for work</p>
          )}
        </CardContent>
      </GlobalCard>

      {/* My Applications Link */}
      <Link to="/worker/applications">
        <GlobalButton className="w-full">
          View My Applications →
        </GlobalButton>
      </Link>
    </div>
  )
}
