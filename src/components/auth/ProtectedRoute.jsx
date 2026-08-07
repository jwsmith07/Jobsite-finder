import { Navigate, useLocation } from 'react-router-dom'
import { useAuth } from '../../hooks/useAuth'
import { getDefaultRouteForRole, normalizeRole } from '../../lib/utils'

export default function ProtectedRoute({ children, allowedRoles }) {
  const { user, role, loading, profileLoading } = useAuth()
  const location = useLocation()

  // While the auth session is resolving — OR the user is signed in and we
  // are still fetching their role from the profiles table — show loading.
  // This prevents a flash-redirect while the database profile role loads.
  if (loading || (user && profileLoading)) {
    return (
      <div className="rounded-3xl border border-slate-800 bg-slate-900 p-6 text-slate-400">
        Loading...
      </div>
    )
  }

  if (!user) {
    return <Navigate to="/signin" replace state={{ from: location.pathname }} />
  }

  if (Array.isArray(allowedRoles) && allowedRoles.length > 0) {
    const allowed = allowedRoles.map((r) => normalizeRole(r))
    if (!allowed.includes(role)) {
      const fallback = getDefaultRouteForRole(role)
      return <Navigate to={fallback || '/onboarding/select-role'} replace />
    }
  }

  return children
}
