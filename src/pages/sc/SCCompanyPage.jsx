import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../../hooks/useAuth'
import { ensureProfile } from '../../services/profilesService'
import {
  getMyCompanyProfile,
  saveCompanyProfile,
} from '../../services/companiesService'
import CompanyProfileForm from '../../components/profile/CompanyProfileForm'

export default function SCCompanyPage() {
  const { user, loading: authLoading } = useAuth()
  const [initial, setInitial] = useState(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState(null)

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
        const cp = await getMyCompanyProfile(user.id)
        if (mounted) setInitial(cp || {})
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
      const saved = await saveCompanyProfile(user.id, {
        ...values,
        company_type: 'sc',
      })
      setInitial(saved)
      setMessage({ type: 'success', text: 'Company profile saved. Next: find a project, request participation, then post jobs after approval.' })
    } catch (err) {
      setMessage({ type: 'error', text: err.message || 'Could not save your company profile. Please check the form and try again.' })
    } finally {
      setSaving(false)
    }
  }

  if (authLoading) {
    return (
      <div className="rounded-3xl border border-slate-800 bg-slate-900 p-6 text-slate-400">
        Loading...
      </div>
    )
  }

  if (!user) {
    return (
      <div className="rounded-3xl border border-slate-800 bg-slate-900 p-6">
        <h1 className="text-2xl font-bold">Company profile</h1>
        <p className="mt-2 text-slate-400">
          Please sign in to manage your company profile.
        </p>
        <Link
          to="/signin"
          className="mt-6 inline-block rounded-xl bg-amber-400 px-4 py-2 font-bold text-black"
        >
          Sign in
        </Link>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="rounded-3xl border border-slate-800 bg-slate-900 p-6">
        <span className="inline-block rounded-full bg-amber-400/10 px-3 py-1 text-xs font-semibold text-amber-400">
          Subcontractor
        </span>
        <h1 className="mt-3 text-2xl font-bold">Company profile</h1>
        <p className="mt-1 text-sm text-slate-400">
          Tell GCs what your crew specializes in and help workers recognize your job posts.
        </p>
      </div>

      {message && (
        <div
          className={`rounded-2xl border px-5 py-4 text-sm font-medium ${
            message.type === 'error'
              ? 'border-red-500/40 bg-red-500/10 text-red-300'
              : 'border-emerald-500/40 bg-emerald-500/10 text-emerald-300'
          }`}
        >
          {message.type === 'error' ? '⚠ ' : '✓ '}
          {message.text}
        </div>
      )}

      <div className="rounded-3xl border border-slate-800 bg-slate-900 p-6">
        {loading ? (
          <p className="text-slate-400">Loading company profile...</p>
        ) : (
          <CompanyProfileForm
            initialValues={initial}
            onSubmit={handleSubmit}
            loading={saving}
            userId={user.id}
          />
        )}
      </div>
    </div>
  )
}
