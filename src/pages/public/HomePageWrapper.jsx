import { Navigate } from 'react-router-dom'
import { useAuth } from '../../hooks/useAuth'
import { getDefaultRouteForRole } from '../../lib/utils'
import HomePage from './HomePage'

/**
 * Wraps HomePage to redirect authenticated users to their dashboard.
 * Unauthenticated users see the onboarding home page.
 */
export default function HomePageWrapper() {
  const { user, role, loading, profileLoading } = useAuth()

  // Wait for both session and profile to load
  if (loading || (user && profileLoading)) {
    return (
      <div className="rounded-3xl border border-slate-800 bg-slate-900 p-6 text-slate-400">
        Loading...
      </div>
    )
  }

  // If authenticated, redirect to dashboard
  if (user) {
    const dashboardRoute = getDefaultRouteForRole(role) || '/onboarding/select-role'
    return <Navigate to={dashboardRoute} replace />
  }

  // Show onboarding home page for unauthenticated users
  return <HomePage />
}
