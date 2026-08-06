import { Navigate, Outlet, useLocation } from 'react-router-dom'
import { useEffect, useState } from 'react'
import Navbar from '../components/layout/Navbar'
import Footer from '../components/layout/Footer'
import ScrollToTop from '../components/layout/ScrollToTop'
import ErrorBoundary from '../components/ui/ErrorBoundary'
import { getMaintenanceMode } from '../services/siteSettingsService'
import { useAuth } from '../hooks/useAuth'
import PageMeta from '../components/ui/PageMeta'
import { defaultDescription, organizationSchema, staticRouteMeta, websiteSchema } from '../lib/seo'
import { MapProviderProvider } from '../components/map/MapProviderContext'

const maintenanceAllowedPrefixes = ['/under-construction', '/login', '/signin', '/admin', '/api']
const devMaintenanceAllowedPrefixes = import.meta.env.DEV ? ['/maplibre-poc'] : []

function isMaintenanceAllowed(pathname) {
  return [...maintenanceAllowedPrefixes, ...devMaintenanceAllowedPrefixes].some(
    (prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`),
  )
}

export default function App() {
  const location = useLocation()
  const { user, loading: authLoading } = useAuth()
  const [maintenanceMode, setMaintenanceMode] = useState(null)
  const isUnderConstruction = location.pathname === '/under-construction'
  const isMapWorkspace = location.pathname === '/jobsites' || location.pathname === '/maplibre-poc'
  const maintenanceAllowed = isMaintenanceAllowed(location.pathname)
  const routeMeta = staticRouteMeta[location.pathname] || {
    title: 'Jobsite Finder',
    description: defaultDescription,
  }
  const structuredData = routeMeta.structuredData?.includes('organization')
    ? [organizationSchema(), websiteSchema()]
    : null

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
      <div className="jf-page-shell flex items-center justify-center px-4">
        <div className="jf-surface p-6 text-sm text-slate-300">
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
      <MapProviderProvider>
        <ErrorBoundary key={location.pathname}>
          <Outlet />
        </ErrorBoundary>
      </MapProviderProvider>
    )
  }

  return (
    <div className="jf-page-shell relative flex min-h-screen flex-col overflow-hidden">
      <div className="jf-hazard-overlay pointer-events-none fixed inset-0 opacity-25" aria-hidden="true" />
      <PageMeta
        title={routeMeta.title}
        description={routeMeta.description}
        path={location.pathname}
        structuredData={structuredData}
      />
      <ScrollToTop />
      <Navbar />
      <MapProviderProvider>
        <main className="relative z-10 mx-auto w-full max-w-7xl flex-1 px-4 py-8 sm:px-6 lg:px-8">
          <ErrorBoundary key={location.pathname}>
            <Outlet />
          </ErrorBoundary>
        </main>
      </MapProviderProvider>
      {!isMapWorkspace && <Footer />}
    </div>
  )
}
