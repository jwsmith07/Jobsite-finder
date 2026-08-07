import { useEffect, useState } from 'react'
import { Bookmark } from 'lucide-react'
import { useAuth } from '../../hooks/useAuth'
import { getSavedJobIds, toggleSavedJob } from '../../services/jobsService'
import { normalizeRole } from '../../lib/utils'

export default function SaveJobButton({ jobPostId, initialSaved = false, onChanged }) {
  const { user, profile } = useAuth()
  const role = normalizeRole(profile?.role)
  const [saved, setSaved] = useState(initialSaved)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  useEffect(() => {
    setSaved(initialSaved)
  }, [initialSaved])

  useEffect(() => {
    if (!user?.id || role !== 'worker' || !jobPostId) return
    let mounted = true
    getSavedJobIds(user.id, [jobPostId])
      .then((ids) => {
        if (mounted) setSaved(ids.has(jobPostId))
      })
      .catch(() => {})
    return () => {
      mounted = false
    }
  }, [user?.id, role, jobPostId])

  if (!user || role !== 'worker') return null

  async function handleClick() {
    setLoading(true)
    setError(null)
    try {
      const result = await toggleSavedJob(user.id, jobPostId)
      setSaved(result.saved)
      onChanged?.(result.saved)
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-1">
      <button
        type="button"
        onClick={handleClick}
        disabled={loading}
        className={`inline-flex w-full items-center justify-center gap-2 rounded-xl border px-4 py-2 text-sm font-semibold transition disabled:opacity-60 sm:w-auto ${
          saved
            ? 'border-yellow-400/50 bg-yellow-400/10 text-yellow-200 hover:bg-yellow-400/20'
            : 'border-slate-700 bg-slate-950 text-slate-200 hover:border-yellow-400/50'
        }`}
      >
        <Bookmark size={16} fill={saved ? 'currentColor' : 'none'} aria-hidden="true" />
        {loading ? 'Saving...' : saved ? 'Saved' : 'Save Job'}
      </button>
      {error && <p className="text-xs text-red-300">{error}</p>}
    </div>
  )
}
