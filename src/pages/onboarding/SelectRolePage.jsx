import { useState } from 'react'
import { Navigate, useNavigate } from 'react-router-dom'
import { Building2, Hammer, Users } from 'lucide-react'
import { useAuth } from '../../hooks/useAuth'
import { supabase } from '../../lib/supabase'
import { getDefaultRouteForRole } from '../../lib/utils'

const roles = [
  {
    id: 'worker',
    label: 'Worker',
    description: 'Find jobsites and apply for trade roles.',
    icon: Hammer,
  },
  {
    id: 'sc',
    label: 'Subcontractor',
    description: 'Manage your company profile, jobs, and applicants.',
    icon: Users,
  },
  {
    id: 'gc',
    label: 'General Contractor',
    description: 'Manage jobsites, jobs, applicants, and project claims.',
    icon: Building2,
  },
]

export default function SelectRolePage() {
  const { user, role, loading, profileLoading } = useAuth()
  const navigate = useNavigate()
  const [savingRole, setSavingRole] = useState(null)
  const [message, setMessage] = useState(null)

  if (loading || (user && profileLoading)) {
    return (
      <div className="rounded-3xl border border-slate-800 bg-slate-900 p-6 text-slate-400">
        Loading...
      </div>
    )
  }

  if (!user) return <Navigate to="/signin" replace />

  const existingRoute = getDefaultRouteForRole(role)
  if (existingRoute) return <Navigate to={existingRoute} replace />

  async function selectRole(nextRole) {
    setSavingRole(nextRole)
    setMessage(null)

    const meta = user.user_metadata || {}
    const fullName = meta.full_name || meta.name || user.email || null

    const { error } = await supabase
      .from('profiles')
      .upsert(
        {
          id: user.id,
          email: user.email ?? null,
          full_name: fullName,
          avatar_url: meta.avatar_url ?? null,
          role: nextRole,
        },
        { onConflict: 'id' },
      )

    if (error) {
      setSavingRole(null)
      setMessage({ type: 'error', text: error.message })
      return
    }

    navigate(getDefaultRouteForRole(nextRole), { replace: true })
  }

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white">Choose your account type</h1>
        <p className="mt-2 text-sm text-slate-400">
          Select the dashboard you need for Jobsite Finder.
        </p>
      </div>

      {message && (
        <div className="rounded-2xl border border-red-500/40 bg-red-500/10 px-5 py-4 text-sm font-medium text-red-300">
          {message.text}
        </div>
      )}

      <div className="grid gap-4 sm:grid-cols-3">
        {roles.map((option) => {
          const Icon = option.icon
          const saving = savingRole === option.id
          return (
            <button
              key={option.id}
              type="button"
              onClick={() => selectRole(option.id)}
              disabled={!!savingRole}
              className="rounded-3xl border border-slate-800 bg-slate-900 p-5 text-left transition hover:border-amber-400/60 disabled:cursor-not-allowed disabled:opacity-70"
            >
              <Icon className="h-7 w-7 text-amber-400" />
              <span className="mt-4 block text-base font-semibold text-white">
                {option.label}
              </span>
              <span className="mt-1 block text-sm text-slate-400">
                {option.description}
              </span>
              <span className="mt-4 block text-sm font-semibold text-amber-300">
                {saving ? 'Saving...' : 'Select'}
              </span>
            </button>
          )
        })}
      </div>
    </div>
  )
}
