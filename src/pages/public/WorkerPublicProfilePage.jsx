import { useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'
import { supabase } from '../../lib/supabase'
import BackButton from '../../components/ui/BackButton'
import { normalizeApprenticeshipLevel, normalizeTrade } from '../../lib/trades'

export default function WorkerPublicProfilePage() {
  const { id } = useParams()
  const [profile, setProfile] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    if (!id) {
      setError('Invalid worker ID')
      setLoading(false)
      return
    }

    let mounted = true
    setLoading(true)
    setError(null)

    ;(async () => {
      try {
        // Fetch worker profile
        const { data: workerData, error: workerError } = await supabase
          .from('worker_profiles')
          .select('*')
          .eq('id', id)
          .maybeSingle()

        if (workerError) throw new Error(`Failed to load worker profile: ${workerError.message}`)
        if (!workerData) throw new Error('Worker profile not found')

        console.log("workerProfile loaded", workerData)

        // Fetch profile for full name
        const { data: profileData, error: profileError } = await supabase
          .from('profiles')
          .select('full_name')
          .eq('id', workerData.profile_id)
          .maybeSingle()

        if (profileError) throw new Error(`Failed to load profile: ${profileError.message}`)

        // Fetch application snapshot for worker_name
        const { data: applicationData, error: appError } = await supabase
          .from('applications')
          .select('worker_name')
          .eq('worker_profile_id', id)
          .limit(1)
          .maybeSingle()

        if (appError) {
          // Log but don't throw - applications might not exist
          console.warn('Failed to load application data:', appError.message)
        }

        // Determine worker name with fallback order
        const workerName = 
          workerData.worker_name ||
          workerData.full_name ||
          workerData.name ||
          applicationData?.worker_name ||
          profileData?.full_name ||
          'Worker'

        if (mounted) {
          setProfile({
            ...workerData,
            full_name: workerName
          })
        }
      } catch (err) {
        if (mounted) setError(err.message)
      } finally {
        if (mounted) setLoading(false)
      }
    })()

    return () => {
      mounted = false
    }
  }, [id])

  if (loading) {
    return (
      <div className="rounded-3xl border border-slate-800 bg-slate-900 p-6 text-slate-400">
        Loading worker profile...
      </div>
    )
  }

  if (error) {
    return (
      <div className="rounded-3xl border border-red-900/60 bg-red-950/40 p-6 text-red-300">
        {error}
      </div>
    )
  }

  if (!profile) {
    return (
      <div className="rounded-3xl border border-slate-800 bg-slate-900 p-6">
        <h1 className="text-2xl font-bold text-white">Worker not found</h1>
        <p className="mt-2 text-slate-400">This worker profile may not exist or you may not have permission to view it.</p>
      </div>
    )
  }

  const location = [profile.city, profile.province].filter(Boolean).join(', ')
  const primaryTrade = normalizeTrade(profile.trade)
  const secondaryTrade = normalizeTrade(profile.secondary_trade)
  const apprenticeshipLevel = normalizeApprenticeshipLevel(profile.apprenticeship_level)

  return (
    <div className="space-y-6">
      <BackButton label="← Back" />
      
      <div className="rounded-3xl border border-slate-800 bg-slate-900 p-6">
        <h1 className="text-2xl font-bold">Worker Profile</h1>
        <p className="mt-1 text-sm text-slate-400">Public view for employers</p>
      </div>

      {/* Main Profile Card */}
      <div className="rounded-3xl border border-slate-800 bg-slate-900 p-6">
        <div className="space-y-4">
          {/* Name */}
          <h2 className="text-xl font-semibold text-white">{profile.full_name}</h2>

          {/* Trade */}
          <div>
            <span className="text-sm font-medium text-slate-400">Primary Trade:</span>
            <p className="mt-1 text-slate-300">{primaryTrade || 'Not specified'}</p>
            {secondaryTrade && (
              <p className="mt-1 text-sm text-slate-400">Secondary: {secondaryTrade}</p>
            )}
          </div>

          {/* Experience Level */}
          <div>
            <span className="text-sm font-medium text-slate-400">Experience:</span>
            {apprenticeshipLevel && (
              <p className="mt-1 text-slate-300">{apprenticeshipLevel}</p>
            )}
            <p className="mt-1 text-slate-300">
              {profile.experience_years ? `${profile.experience_years} years` : 'Not specified'}
            </p>
          </div>

          {(profile.camp_ready || profile.willing_to_travel) && (
            <div>
              <span className="text-sm font-medium text-slate-400">Availability:</span>
              {profile.camp_ready && <p className="mt-1 text-slate-300">Camp ready</p>}
              {profile.willing_to_travel && <p className="mt-1 text-slate-300">Willing to travel</p>}
            </div>
          )}

          {/* Location */}
          {location && (
            <div>
              <span className="text-sm font-medium text-slate-400">Location:</span>
              <p className="mt-1 text-slate-300">{location}</p>
            </div>
          )}

          {/* Resume */}
          {profile.resume_url && (
            <div>
              <span className="text-sm font-medium text-slate-400">Resume:</span>
              <div className="mt-2">
                <a
                  href={profile.resume_url}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-2 rounded-xl bg-amber-400 px-4 py-2 text-sm font-bold text-black hover:bg-amber-300"
                >
                  View Resume ↗
                </a>
              </div>
            </div>
          )}

          {/* Bio */}
          {profile.bio && (
            <div>
              <span className="text-sm font-medium text-slate-400">Bio:</span>
              <p className="mt-3 text-slate-300 whitespace-pre-line">{profile.bio}</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
