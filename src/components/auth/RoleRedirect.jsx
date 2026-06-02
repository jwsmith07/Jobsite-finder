import { Navigate } from 'react-router-dom'
import { useAuth } from '../../hooks/useAuth'
import { getDefaultRouteForRole } from '../../lib/utils'

export default function RoleRedirect() {
  const { user, role, loading, profileLoading } = useAuth()

  // Wait for both the session and the profile (role lookup) to finish so
  // we redirect to the correct dashboard instead of flashing through the
  // wrong one.
  if (loading || (user && profileLoading)) {
    return (
      <div className="rounded-3xl border border-slate-800 bg-slate-900 p-6 text-slate-400">
        Loading...
      </div>
    )
  }

  if (!user) return <Navigate to="/signin" replace />

  const target = getDefaultRouteForRole(role) || '/onboarding/select-role'
  return <Navigate to={target} replace />
}
