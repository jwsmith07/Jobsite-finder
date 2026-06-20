import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../../hooks/useAuth'
import { applyToJob, getExistingApplicationForWorker, getWorkerForUser } from '../../services/applicationsService'
import { normalizeRole } from '../../lib/utils'

export default function ApplyButton({ jobPostId }) {
  const { user, profile } = useAuth()
  const [loading, setLoading] = useState(false)
  const [checkingApplied, setCheckingApplied] = useState(false)
  const [hasApplied, setHasApplied] = useState(false)
  const [workerResume, setWorkerResume] = useState(null)
  const [checkingResume, setCheckingResume] = useState(false)
  const [errorMessage, setErrorMessage] = useState(null)

  // Determine user role
  const role = normalizeRole(user?.user_metadata?.role || profile?.role)

  // Check if user has already applied and repair any missing snapshot fields
  useEffect(() => {
    if (!user || role !== 'worker') {
      setHasApplied(false)
      return
    }

    let mounted = true
    setCheckingApplied(true)
    setErrorMessage(null)

    getExistingApplicationForWorker(user.id, jobPostId)
      .then((application) => {
        if (mounted) {
          setHasApplied(!!application)
        }
      })
      .catch((err) => {
        console.error('[ApplyButton] Application check error:', err.message)
        if (mounted) {
          setHasApplied(false)
          setErrorMessage('Unable to verify your application status.')
        }
      })
      .finally(() => {
        if (mounted) setCheckingApplied(false)
      })

    return () => {
      mounted = false
    }
  }, [user, role, jobPostId])

  // Fetch worker profile to check for resume on mount
  useEffect(() => {
    if (!user || role !== 'worker') {
      setWorkerResume(null)
      return
    }

    let mounted = true
    setCheckingResume(true)

    getWorkerForUser(user.id)
      .then((worker) => {
        if (mounted) {
          setWorkerResume(worker.resume_url || null)
        }
      })
      .catch(() => {
        if (mounted) setWorkerResume(null)
      })
      .finally(() => {
        if (mounted) setCheckingResume(false)
      })

    return () => {
      mounted = false
    }
  }, [user, role])

  if (!user) {
    return (
      <Link
        to="/signin"
        className="inline-block rounded-xl bg-yellow-400 px-4 py-2 text-sm font-bold text-black hover:bg-yellow-300"
      >
        Sign in to apply
      </Link>
    )
  }

  const isWorker = role === 'worker'

  if (!isWorker) {
    return (
      <button
        type="button"
        disabled
        className="inline-block rounded-xl border border-slate-700 bg-slate-950 px-4 py-2 text-sm font-semibold text-slate-400 cursor-not-allowed"
      >
        Only worker accounts can apply
      </button>
    )
  }

  if (checkingApplied || checkingResume) {
    return (
      <button
        type="button"
        disabled
        className="inline-block rounded-xl border border-slate-700 bg-slate-950 px-4 py-2 text-sm font-semibold text-slate-400"
      >
        Loading…
      </button>
    )
  }

  if (hasApplied) {
    return (
      <div className="space-y-2">
        <button
          type="button"
          disabled
          className="inline-block rounded-xl border border-emerald-500/40 bg-emerald-500/10 px-4 py-2 text-sm font-semibold text-emerald-300 cursor-default"
        >
          Applied
        </button>
        <p className="text-sm text-slate-400">You already applied to this job.</p>
      </div>
    )
  }

  if (!workerResume) {
    return (
      <Link
        to="/worker/profile"
        className="inline-block rounded-xl border border-amber-500/40 bg-amber-500/10 px-4 py-2 text-sm font-semibold text-amber-300 hover:border-amber-500/60 hover:bg-amber-500/20"
      >
        Upload resume before applying
      </Link>
    )
  }

  async function handleApply() {
    setLoading(true)
    setErrorMessage(null)
    try {
      await applyToJob(user.id, jobPostId, {})
      setHasApplied(true)
    } catch (err) {
      console.error('ApplyButton: Apply error:', err.message)
      setErrorMessage(err.message || 'Could not apply to this job right now. Please try again later.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-2">
      <button
        type="button"
        onClick={handleApply}
        disabled={loading}
        className="rounded-xl bg-yellow-400 px-4 py-2 text-sm font-bold text-black hover:bg-yellow-300 disabled:opacity-60"
      >
        {loading ? 'Applying...' : 'Apply with my profile'}
      </button>
      <p className="text-xs text-slate-400">Your uploaded resume will be attached automatically.</p>
      {errorMessage && (
        <p className="text-sm text-red-300">{errorMessage}</p>
      )}
    </div>
  )
}
