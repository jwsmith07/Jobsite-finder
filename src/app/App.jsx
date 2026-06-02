import { Navigate, Outlet, useLocation } from 'react-router-dom'
import { useEffect, useState } from 'react'
import Navbar from '../components/layout/Navbar'
import Footer from '../components/layout/Footer'
import ScrollToTop from '../components/layout/ScrollToTop'
import ErrorBoundary from '../components/ui/ErrorBoundary'
import { getMaintenanceMode } from '../services/siteSettingsService'
import { useAuth } from '../hooks/useAuth'

const maintenanceAllowedPrefixes = ['/under-construction', '/login', '/signin', '/admin', '/api']

function isMaintenanceAllowed(pathname) {
  return maintenanceAllowedPrefixes.some((prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`))
}

export default function App() {
  const location = useLocation()
  const { user, loading: authLoading } = useAuth()
  const [maintenanceMode, setMaintenanceMode] = useState(null)
  const isUnderConstruction = location.pathname === '/under-construction'
  const maintenanceAllowed = isMaintenanceAllowed(location.pathname)

  useEffect(() => {
    let cancelled = false

    getMaintenanceMode()
      .then((enabled) => {
        if (!cancelled) setMaintenanceMode(enabled)
      })
      .catch((error) => {
        if (typeof console !== 'undefined') {
          console.warn(`Maintenance mode check failed: ${error.message}`)
        }
        if (!cancelled) setMaintenanceMode(true)
      })

    return () => {
      cancelled = true
    }
  }, [location.pathname])

  if (maintenanceMode === null || authLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-950 px-4 text-slate-100">
        <div className="rounded-lg border border-slate-800 bg-slate-900 p-6 text-sm text-slate-300">
          Loading Jobsite Finder...
        </div>
      </div>
    )
  }

  if (maintenanceMode && !user && !maintenanceAllowed) {
    return <Navigate to="/under-construction" replace />
  }

  if (isUnderConstruction) {
    return (
      <ErrorBoundary key={location.pathname}>
        <Outlet />
      </ErrorBoundary>
    )
  }

  return (
    <div className="min-h-screen flex flex-col bg-slate-950 text-slate-100">
      <ScrollToTop />
      <Navbar />
      <main className="flex-1 mx-auto w-full max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <ErrorBoundary key={location.pathname}>
          <Outlet />
        </ErrorBoundary>
      </main>
      <Footer />
    </div>
  )
}
