import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { Inbox, Map as MapIcon, Moon, Sun } from 'lucide-react'
import ProjectMapMapLibre from '../../components/map/UnifiedProjectMap'
import ProjectListPanel from '../../components/map/ProjectListPanel'
import SelectedProjectPanel from '../../components/map/SelectedProjectPanel'
import MapFilters from '../../components/map/MapFilters'
import ActiveFilterChips from '../../components/map/ActiveFilterChips'
import { useProjects } from '../../hooks/useProjects'
import { haversineKm, useDebouncedValue } from '../../lib/utils'
import {
  PUBLIC_STAGE_OPTIONS,
  getPublicStageKey,
  isPublicProjectVisible,
} from '../../lib/projectStages'
import { MAJOR_PROJECT_MESSAGE, normalizeProjectValueFilter, parseProjectValue } from '../../lib/projectValue'
import { STANDARD_TRADES, normalizeTrade } from '../../lib/trades'
import { normalizeCanadianRegion } from '../../lib/canadianRegions'

const DEFAULT_FILTERS = {
  search: '',
  province: 'all',
  stage: 'all',
  trade: 'all',
  minValue: '0',
}

const ALBERTA_CENTER = { lat: 53.9333, lng: -116.5765 }

function matchesSearch(project, query) {
  if (!query) return true
  const haystack = [
    project.project_name,
    project.city,
    project.province,
    project.region,
    project.general_contractor,
    project.owner,
  ]
    .filter(Boolean)
    .join(' ')
    .toLowerCase()
  return haystack.includes(query)
}

export default function MapLibrePocPage() {
  const { projects, loading, error, reload } = useProjects()
  const [search, setSearch] = useState(DEFAULT_FILTERS.search)
  const debouncedSearch = useDebouncedValue(search, 200)
  const [province, setProvince] = useState('AB')
  const [stage, setStage] = useState(DEFAULT_FILTERS.stage)
  const [trade, setTrade] = useState(DEFAULT_FILTERS.trade)
  const [minValue, setMinValue] = useState(DEFAULT_FILTERS.minValue)
  const [limitToMapView, setLimitToMapView] = useState(true)
  const [mapTheme, setMapTheme] = useState('dark')
  const [selectedProjectId, setSelectedProjectId] = useState(null)
  const [userLocation, setUserLocation] = useState(null)
  const [locating, setLocating] = useState(false)
  const [locationError, setLocationError] = useState(null)
  const [mapBounds, setMapBounds] = useState(null)
  const [centerOnUserToken, setCenterOnUserToken] = useState(0)
  const [resetViewToken, setResetViewToken] = useState(0)
  const mountedRef = useRef(true)

  const publicProjects = useMemo(
    () => projects.filter(isPublicProjectVisible),
    [projects],
  )

  const stages = PUBLIC_STAGE_OPTIONS
  const trades = useMemo(() => {
    const set = new Set()
    for (const project of publicProjects) {
      const openJobs = Array.isArray(project._openJobs) ? project._openJobs : []
      for (const job of openJobs) {
        const tradeName = normalizeTrade(job.trade)
        if (tradeName) set.add(tradeName)
      }
    }
    return STANDARD_TRADES.filter((tradeOption) => set.has(tradeOption))
  }, [publicProjects])

  const filtered = useMemo(() => {
    const q = debouncedSearch.trim().toLowerCase()
    const min = normalizeProjectValueFilter(minValue)

    return publicProjects
      .filter((project) => {
        if (!project._hasValidCoords) return false
        if (province !== 'all' && normalizeCanadianRegion(project.province) !== province) return false
        if (stage !== 'all' && getPublicStageKey(project.stage) !== stage) return false
        if (trade !== 'all') {
          const openJobs = Array.isArray(project._openJobs) ? project._openJobs : []
          if (!openJobs.some((job) => normalizeTrade(job.trade) === trade)) return false
        }
        if (min > 0 && parseProjectValue(project.estimated_value) < min) return false
        if (!matchesSearch(project, q)) return false
        return true
      })
      .map((project) => {
        if (!userLocation) return project
        return {
          ...project,
          _distanceKm: haversineKm(userLocation, { lat: project._lat, lng: project._lng }),
        }
      })
  }, [debouncedSearch, minValue, province, publicProjects, stage, trade, userLocation])

  const mappedCount = filtered.length

  const viewportFiltered = useMemo(() => {
    if (!limitToMapView || !mapBounds) return filtered
    const { north, south, east, west } = mapBounds
    return filtered.filter((project) => {
      const lat = project._lat
      const lng = project._lng
      if (!Number.isFinite(lat) || !Number.isFinite(lng)) return false
      const inLat = lat <= north && lat >= south
      const inLng = west <= east
        ? lng >= west && lng <= east
        : lng >= west || lng <= east
      return inLat && inLng
    })
  }, [filtered, limitToMapView, mapBounds])

  const viewportActive = limitToMapView && !!mapBounds
  const hiddenByViewport = viewportActive ? Math.max(0, filtered.length - viewportFiltered.length) : 0
  const hasActiveFilters =
    search !== DEFAULT_FILTERS.search ||
    province !== DEFAULT_FILTERS.province ||
    stage !== DEFAULT_FILTERS.stage ||
    trade !== DEFAULT_FILTERS.trade ||
    minValue !== DEFAULT_FILTERS.minValue

  const selectedProject = useMemo(() => {
    if (selectedProjectId == null) return null
    const target = String(selectedProjectId)
    return publicProjects.find((project) => String(project.id) === target) || null
  }, [publicProjects, selectedProjectId])

  const handleBoundsChange = useCallback((bounds) => {
    setMapBounds(bounds)
  }, [])

  const clearFilters = useCallback(() => {
    setSearch(DEFAULT_FILTERS.search)
    setProvince(DEFAULT_FILTERS.province)
    setStage(DEFAULT_FILTERS.stage)
    setTrade(DEFAULT_FILTERS.trade)
    setMinValue(DEFAULT_FILTERS.minValue)
  }, [])

  const requestLocation = useCallback(() => {
    if (typeof navigator === 'undefined' || !('geolocation' in navigator)) {
      setLocationError({ kind: 'unsupported', message: 'Geolocation is not supported by this browser.' })
      return
    }
    mountedRef.current = true
    setLocating(true)
    setLocationError(null)
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        if (!mountedRef.current) return
        setUserLocation({
          lat: pos.coords.latitude,
          lng: pos.coords.longitude,
          accuracy: pos.coords.accuracy,
        })
        setLocating(false)
      },
      (err) => {
        if (!mountedRef.current) return
        setLocating(false)
        setLocationError({
          kind: err.code === err.PERMISSION_DENIED ? 'denied' : 'unknown',
          message: err.message || 'Could not determine your location.',
        })
      },
      { enableHighAccuracy: false, timeout: 30000, maximumAge: 60000 },
    )
  }, [])

  useEffect(() => {
    requestLocation()
  }, [requestLocation])

  const handleRecenterOnMe = useCallback(() => {
    if (!userLocation) {
      requestLocation()
      return
    }
    setCenterOnUserToken((token) => token + 1)
  }, [requestLocation, userLocation])

  return (
    <div className="relative -mx-4 -my-4 h-[calc(100vh-4rem)] min-h-[620px] overflow-hidden bg-slate-950 sm:-mx-6 sm:-my-6 lg:-mx-8 lg:-my-8 lg:grid lg:grid-cols-[380px_minmax(0,1fr)] lg:grid-rows-[auto_minmax(0,1fr)] lg:gap-x-6 lg:gap-y-4 lg:p-6">
      <h1 className="sr-only">MapLibre jobsites proof of concept</h1>

      <section className="absolute inset-0 overflow-hidden bg-slate-900 lg:relative lg:inset-auto lg:col-start-2 lg:row-start-1 lg:row-span-2 lg:min-h-0 lg:overflow-hidden lg:rounded-3xl lg:border lg:border-slate-800">
        <LocationStatusPill
          userLocation={userLocation}
          locating={locating}
          locationError={locationError}
          onRetry={requestLocation}
          onRecenter={handleRecenterOnMe}
        />
        <ResetViewButton onReset={() => setResetViewToken((token) => token + 1)} />
        <MapThemeButton mapTheme={mapTheme} onToggle={() => setMapTheme((theme) => theme === 'dark' ? 'light' : 'dark')} />

        <div className="absolute bottom-10 left-3 z-10 rounded-xl border border-slate-700/60 bg-slate-950/80 px-3 py-2 backdrop-blur-sm">
          <p className="mb-1.5 text-[10px] font-semibold uppercase tracking-wider text-slate-400">Stage</p>
          <div className="flex flex-col gap-1">
            {PUBLIC_STAGE_OPTIONS.map(({ label, color }) => (
              <div key={label} className="flex items-center gap-1.5">
                <svg width="11" height="14" viewBox="0 0 28 36" aria-hidden="true">
                  <path d="M14 1 C 6.8 1 1 6.8 1 14 C 1 23.5 14 35 14 35 C 14 35 27 23.5 27 14 C 27 6.8 21.2 1 14 1 Z"
                    fill={color} stroke="#0f172a" strokeWidth="1.5"/>
                  <circle cx="14" cy="14" r="4.5" fill="#0f172a"/>
                </svg>
                <span className="text-[11px] text-slate-300">{label}</span>
              </div>
            ))}
          </div>
        </div>

        <ProjectMapMapLibre
          projects={filtered}
          selectedProjectId={selectedProjectId}
          onProjectSelect={setSelectedProjectId}
          userLocation={userLocation}
          mapTheme={mapTheme}
          initialCenter={ALBERTA_CENTER}
          initialZoom={5}
          onBoundsChange={handleBoundsChange}
          centerOnUserToken={centerOnUserToken}
          resetViewToken={resetViewToken}
          showBoundaryLayers
        />
        {loading && <MapSkeleton />}
      </section>

      <section className="absolute inset-x-0 bottom-0 z-20 mx-auto flex max-h-[58vh] min-h-[280px] w-full max-w-7xl flex-col rounded-t-3xl border border-slate-800 bg-slate-950/96 shadow-[0_-22px_60px_rgba(0,0,0,0.65)] backdrop-blur lg:relative lg:inset-auto lg:col-start-1 lg:row-start-2 lg:max-h-none lg:min-h-0 lg:w-full lg:max-w-none lg:rounded-3xl lg:shadow-none">
        <div className="shrink-0 space-y-3 border-b border-slate-800/80 px-3 pb-3 pt-3 sm:px-4 lg:px-5">
          <div className="mx-auto h-1.5 w-12 rounded-full bg-slate-700 lg:hidden" aria-hidden="true" />
          <div className="flex flex-wrap items-center gap-2 px-1">
            <span className="inline-flex rounded-full border border-amber-400/30 bg-amber-400/10 px-3 py-1 text-xs font-bold uppercase tracking-wide text-amber-200">
              {MAJOR_PROJECT_MESSAGE}
            </span>
          </div>

          <MapFilters
            search={search}
            onSearchChange={setSearch}
            province={province}
            onProvinceChange={setProvince}
            stage={stage}
            onStageChange={setStage}
            stages={stages}
            trade={trade}
            onTradeChange={setTrade}
            trades={trades}
            minValue={minValue}
            onMinValueChange={setMinValue}
            onClearAll={clearFilters}
            hasActiveFilters={hasActiveFilters}
          />

          <div className="flex flex-wrap items-center gap-2 px-1">
            <span className="inline-flex items-center gap-1.5 rounded-full border border-slate-800 bg-slate-900/80 px-3 py-1 text-xs text-slate-400">
              Showing <span className="font-semibold text-white">{viewportFiltered.length}</span> of <span className="font-semibold text-white">{publicProjects.length}</span> projects
              <span className="mx-0.5 text-slate-600">.</span>
              <span className="font-semibold text-amber-300">{mappedCount}</span> mapped
            </span>
            <button
              type="button"
              role="switch"
              aria-checked={limitToMapView}
              onClick={() => setLimitToMapView((value) => !value)}
              className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-semibold transition ${
                limitToMapView
                  ? 'border-blue-500/50 bg-blue-500/15 text-blue-100 hover:border-blue-400'
                  : 'border-slate-700 bg-slate-900/80 text-slate-300 hover:border-slate-500'
              }`}
            >
              <span aria-hidden="true" className={`inline-block h-2 w-2 rounded-full ${limitToMapView ? 'bg-blue-400' : 'bg-slate-500'}`} />
              {limitToMapView ? 'Showing this map area' : 'Showing all results'}
            </button>
            {viewportActive && hiddenByViewport > 0 && (
              <button type="button" onClick={() => setLimitToMapView(false)} className="text-xs font-semibold text-slate-400 underline-offset-2 hover:text-amber-200 hover:underline">
                Show {hiddenByViewport} more
              </button>
            )}
          </div>

          <ActiveFilterChips
            province={province}
            onClearProvince={() => setProvince(DEFAULT_FILTERS.province)}
            stage={stage}
            trade={trade}
            minValue={minValue}
            onClearStage={() => setStage(DEFAULT_FILTERS.stage)}
            onClearTrade={() => setTrade(DEFAULT_FILTERS.trade)}
            onClearMinValue={() => setMinValue(DEFAULT_FILTERS.minValue)}
            onClearAll={clearFilters}
          />
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-3 py-3 sm:px-4 lg:px-5">
          {loading && <ListSkeleton />}
          {!loading && error && (
            <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-red-900/60 bg-red-950/40 p-4 text-sm text-red-200">
              <div>
                <p className="font-semibold">Could not load projects.</p>
                <p className="text-xs text-red-300/80">{error.message}</p>
              </div>
              <button type="button" onClick={reload} className="rounded-xl border border-red-700/60 bg-red-950 px-3 py-1.5 text-xs font-semibold text-red-100 hover:border-red-500">
                Retry
              </button>
            </div>
          )}
          {!loading && !error && viewportFiltered.length === 0 && (
            <div className="flex flex-col items-center gap-4 rounded-2xl border border-dashed border-slate-700 bg-slate-950 p-12 text-center">
              <span className="flex h-12 w-12 items-center justify-center rounded-full border border-slate-800 bg-slate-900 text-slate-500" aria-hidden="true">
                <Inbox size={20} />
              </span>
              <p className="text-base font-semibold text-white">
                {hasActiveFilters ? 'No projects match those filters - try clearing them.' : 'No projects to show right now.'}
              </p>
              <button type="button" onClick={hasActiveFilters ? clearFilters : reload} className="rounded-xl bg-amber-400 px-4 py-2 text-sm font-bold text-black transition hover:bg-amber-300">
                {hasActiveFilters ? 'Clear filters' : 'Reload'}
              </button>
            </div>
          )}
          {!loading && !error && selectedProject && (
            <div className="rounded-3xl border border-slate-800 bg-slate-950 p-5">
              <SelectedProjectPanel
                project={selectedProject}
                onClose={() => setSelectedProjectId(null)}
                userLocation={userLocation}
              />
            </div>
          )}
          {!loading && !error && !selectedProject && viewportFiltered.length > 0 && (
            <ProjectListPanel projects={viewportFiltered} />
          )}
        </div>
      </section>
    </div>
  )
}

function ResetViewButton({ onReset }) {
  return (
    <button
      type="button"
      onClick={onReset}
      title="Reset map to the North America view"
      aria-label="Reset map view"
      className="absolute right-4 top-14 z-10 inline-flex h-8 w-8 items-center justify-center rounded-full border border-slate-700 bg-slate-900/90 text-slate-200 shadow-lg backdrop-blur transition hover:border-amber-400/50 hover:text-amber-200"
    >
      <MapIcon size={14} aria-hidden="true" />
    </button>
  )
}

function MapThemeButton({ mapTheme, onToggle }) {
  const isDark = mapTheme === 'dark'
  const Icon = isDark ? Moon : Sun
  return (
    <button
      type="button"
      onClick={onToggle}
      title={isDark ? 'Switch map to light mode' : 'Switch map to dark mode'}
      aria-label={isDark ? 'Switch map to light mode' : 'Switch map to dark mode'}
      className="absolute right-4 top-[6.5rem] z-10 inline-flex h-8 w-8 items-center justify-center rounded-full border border-slate-700 bg-slate-900/90 text-slate-200 shadow-lg backdrop-blur transition hover:border-amber-400/50 hover:text-amber-200"
    >
      <Icon size={14} aria-hidden="true" />
    </button>
  )
}

function LocationStatusPill({ userLocation, locating, locationError, onRetry, onRecenter }) {
  if (userLocation) {
    return (
      <button type="button" onClick={onRecenter} disabled={locating} title="Recenter map on me" aria-label="Recenter map on me" className="absolute right-4 top-4 z-10 inline-flex items-center gap-1.5 rounded-full border border-blue-500/40 bg-blue-500/15 px-3 py-1.5 text-xs font-semibold text-blue-200 shadow-lg backdrop-blur hover:border-blue-400 hover:text-blue-100 disabled:opacity-60">
        <span className="relative inline-flex h-2 w-2">
          <span className="absolute inset-0 animate-ping rounded-full bg-blue-400 opacity-60" />
          <span className="relative inline-block h-2 w-2 rounded-full bg-blue-400" />
        </span>
        {locating ? 'Updating...' : 'Recenter on me'}
      </button>
    )
  }
  if (locating) {
    return (
      <div className="absolute right-4 top-4 z-10 inline-flex items-center gap-1.5 rounded-full border border-slate-700 bg-slate-900/90 px-3 py-1.5 text-xs font-semibold text-slate-300 shadow-lg backdrop-blur" aria-live="polite">
        <span className="inline-block h-2 w-2 animate-pulse rounded-full bg-slate-400" />
        Locating you...
      </div>
    )
  }
  if (locationError) {
    const label = locationError.kind === 'denied'
      ? 'Location blocked'
      : locationError.kind === 'unsupported'
        ? 'Location unavailable'
        : 'Try location again'
    return (
      <button type="button" onClick={onRetry} title={`${locationError.message} Click to retry.`} className="absolute right-4 top-4 z-10 inline-flex items-center gap-1.5 rounded-full border border-slate-700 bg-slate-900/90 px-3 py-1.5 text-xs font-semibold text-slate-200 shadow-lg backdrop-blur hover:border-amber-400/50 hover:text-amber-100">
        <span className="inline-block h-2 w-2 rounded-full bg-amber-300" />
        {label}
      </button>
    )
  }
  return (
    <button type="button" onClick={onRetry} title="Use my location on the map" className="absolute right-4 top-4 z-10 inline-flex items-center gap-1.5 rounded-full border border-slate-700 bg-slate-900/90 px-3 py-1.5 text-xs font-semibold text-slate-200 shadow-lg backdrop-blur hover:border-amber-400/50 hover:text-amber-200">
      <span className="inline-block h-2 w-2 rounded-full bg-slate-500" />
      Use my location
    </button>
  )
}

function MapSkeleton() {
  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden bg-slate-900" aria-hidden="true">
      <div className="absolute inset-0 animate-pulse bg-gradient-to-br from-slate-800 via-slate-900 to-slate-950" />
      <div className="absolute inset-x-0 bottom-0 flex items-center justify-center pb-4">
        <span className="rounded-full border border-slate-700 bg-slate-950/80 px-3 py-1 text-xs font-semibold text-slate-300 shadow-lg backdrop-blur">
          Loading projects...
        </span>
      </div>
    </div>
  )
}

function ListSkeleton() {
  return (
    <div className="grid gap-3" aria-busy="true" aria-label="Loading projects">
      {[0, 1, 2, 3, 4, 5].map((i) => (
        <div key={i} className="overflow-hidden rounded-2xl border border-slate-800 bg-slate-950 p-4">
          <div className="space-y-3">
            <div className="h-4 w-3/4 animate-pulse rounded bg-slate-800/80" />
            <div className="h-3 w-1/2 animate-pulse rounded bg-slate-800/60" />
            <div className="flex gap-1.5 pt-1">
              <div className="h-5 w-16 animate-pulse rounded-full bg-slate-800/60" />
              <div className="h-5 w-20 animate-pulse rounded-full bg-slate-800/60" />
              <div className="h-5 w-14 animate-pulse rounded-full bg-slate-800/60" />
            </div>
          </div>
        </div>
      ))}
    </div>
  )
}
