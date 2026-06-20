import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { ChevronDown, Inbox, Map as MapIcon, Moon, Sun, X } from 'lucide-react'
import ProjectMap from '../../components/map/UnifiedProjectMap'
import ProjectListPanel from '../../components/map/ProjectListPanel'
import SelectedProjectPanel from '../../components/map/SelectedProjectPanel'
import MapFilters from '../../components/map/MapFilters'
import { useProjects } from '../../hooks/useProjects'
import { useAuth } from '../../hooks/useAuth'
import { haversineKm, useDebouncedValue, useLocalStorage } from '../../lib/utils'
import {
  PUBLIC_STAGE_OPTIONS,
  getPublicStageKey,
  isPublicProjectVisible,
} from '../../lib/projectStages'
import { normalizeProjectValueFilter, parseProjectValue } from '../../lib/projectValue'
import { STANDARD_TRADES, normalizeTrade } from '../../lib/trades'
import { getCanadianRegionLabel, normalizeCanadianRegion } from '../../lib/canadianRegions'
import { getMyPreferences, saveMyPreferences } from '../../services/profilesService'

const DEFAULT_FILTERS = {
  search: '',
  province: 'all',
  stage: 'all',
  trade: 'all',
  minValue: '0',
  hiringOnly: false,
  claimedOnly: false,
}

const JOBSITES_MAP_PADDING = {
  top: 80,
  right: 24,
  bottom: 112,
  left: 24,
}

const JOBSITES_MAP_PADDING_DESKTOP = {
  top: 48,
  right: 48,
  bottom: 48,
  left: 48,
}

// Where the last map view (center + zoom) is persisted across visits.
// Stored locally per-browser; clearing site data resets to the default
// Canada-wide activity overview.
const MAP_VIEW_STORAGE_KEY = 'jobsite-finder:map-view:v1'

// Where the last opened jobsite id is persisted across visits, so the
// detail panel reopens on the same project the user was looking at.
// Stored locally per-browser alongside the saved map view; cleared
// when the user closes the panel or when the project no longer exists.
const SELECTED_PROJECT_STORAGE_KEY = 'jobsite-finder:selected-project:v1'

// Project ids come back from the API as numbers (Postgres bigint), but
// historical / future call-sites could pass strings. Accept either so a
// numeric id round-trips through JSON.stringify → JSON.parse cleanly
// without being rejected as the wrong shape.
const isValidSelectedProjectId = (v) =>
  v === null ||
  (typeof v === 'number' && Number.isFinite(v)) ||
  (typeof v === 'string' && v.length > 0)

// localStorage key prefixes for the persisted filter preferences. The
// final key is suffixed with the user id when signed in (so different
// accounts on the same browser don't stomp each other) or `:guest`
// otherwise.
const LIMIT_TO_MAP_VIEW_KEY_PREFIX = 'jobsite-finder:filter:limit-to-map-view:v1'
const MAP_THEME_STORAGE_KEY = 'jobsite-finder:map-theme:v1'
const MAP_THEME_TOGGLE_EVENT = 'jobsite-finder:map-theme-toggle'

const isValidLimitToMapView = (v) => typeof v === 'boolean'
const isValidMapTheme = (v) => v === 'dark' || v === 'light'

function getJobsitesMapPadding(drawerOpen = false) {
  if (typeof window !== 'undefined' && window.matchMedia?.('(min-width: 1024px)').matches) {
    return JOBSITES_MAP_PADDING_DESKTOP
  }
  if (drawerOpen && typeof window !== 'undefined') {
    return {
      top: 80,
      right: 24,
      bottom: Math.round(window.innerHeight * 0.72) + 24,
      left: 24,
    }
  }
  return JOBSITES_MAP_PADDING
}

function isValidMapView(view) {
  const lat = Number(view?.center?.lat)
  const lng = Number(view?.center?.lng)
  const zoom = Number(view?.zoom)
  return (
    Number.isFinite(lat) &&
    Number.isFinite(lng) &&
    Number.isFinite(zoom) &&
    lat >= -90 &&
    lat <= 90 &&
    lng >= -180 &&
    lng <= 180 &&
    zoom >= 0 &&
    zoom <= 24
  )
}

// Read center + zoom encoded in the URL as ?lat=…&lng=…&zoom=… (set by
// handleViewChange). URL params take precedence over localStorage so a
// shared / bookmarked link always boots into the intended area.
function readUrlMapView() {
  if (typeof window === 'undefined') return null
  try {
    const params = new URLSearchParams(window.location.search)
    const lat = parseFloat(params.get('lat'))
    const lng = parseFloat(params.get('lng'))
    const zoom = parseFloat(params.get('zoom'))
    const view = { center: { lat, lng }, zoom }
    return isValidMapView(view) ? view : null
  } catch {
    return null
  }
}

function readSavedMapView() {
  if (typeof window === 'undefined') return null
  try {
    const parsed = JSON.parse(window.localStorage.getItem(MAP_VIEW_STORAGE_KEY) || 'null')
    if (!parsed?.movedByUser) return null
    return isValidMapView(parsed) ? parsed : null
  } catch {
    return null
  }
}

function readInitialMapView() {
  return readUrlMapView() || readSavedMapView()
}

function writeSavedMapView(view) {
  if (typeof window === 'undefined') return
  try {
    window.localStorage.setItem(
      MAP_VIEW_STORAGE_KEY,
      JSON.stringify({ ...view, movedByUser: true }),
    )
  } catch {
    // Storage may be full or disabled (private mode); silently skip.
  }
}

export default function JobsitesPage() {
  const { projects, loading, error, reload } = useProjects()
  const { user, loading: authLoading } = useAuth()

  // Scope the persisted filter prefs by user when signed in so multiple
  // accounts on the same browser don't overwrite each other. While auth
  // is still resolving we pass `null` as the key, which makes the hook
  // hold the default and skip writing — once we know who (or whether)
  // the user is, the key flips and the saved value is loaded.
  const prefsScope = authLoading ? null : user?.id ? `user:${user.id}` : 'guest'
  const limitToMapViewKey = prefsScope ? `${LIMIT_TO_MAP_VIEW_KEY_PREFIX}:${prefsScope}` : null

  const [search, setSearch] = useState(DEFAULT_FILTERS.search)
  // Debounce the search so each keystroke doesn't re-run the filter
  // pipeline (which rebuilds the visible map markers). 200 ms still
  // feels instantaneous but coalesces fast typing into a single
  // recompute, eliminating the per-keystroke jank with hundreds of
  // pins on the map.
  const debouncedSearch = useDebouncedValue(search, 200)
  const [province, setProvince] = useState(DEFAULT_FILTERS.province)
  const [stage, setStage] = useState(DEFAULT_FILTERS.stage)
  const [trade, setTrade] = useState(DEFAULT_FILTERS.trade)
  const [minValue, setMinValue] = useState(DEFAULT_FILTERS.minValue)
  const [hiringOnly, setHiringOnly] = useState(DEFAULT_FILTERS.hiringOnly)
  const [claimedOnly, setClaimedOnly] = useState(DEFAULT_FILTERS.claimedOnly)
  const [limitToMapView, setLimitToMapView] = useLocalStorage(
    limitToMapViewKey,
    true,
    { validate: isValidLimitToMapView },
  )
  const [mapTheme, setMapTheme] = useLocalStorage(
    MAP_THEME_STORAGE_KEY,
    'dark',
    { validate: isValidMapTheme },
  )
  const [mobileDrawerOpen, setMobileDrawerOpen] = useState(false)
  const [stageLegendOpen, setStageLegendOpen] = useState(false)
  const [mapPadding, setMapPadding] = useState(() => getJobsitesMapPadding(false))

  useEffect(() => {
    if (typeof window === 'undefined') return
    const media = window.matchMedia('(min-width: 1024px)')
    const handleChange = () => setMapPadding(getJobsitesMapPadding(mobileDrawerOpen))
    handleChange()
    media.addEventListener?.('change', handleChange)
    window.addEventListener('resize', handleChange)
    return () => {
      media.removeEventListener?.('change', handleChange)
      window.removeEventListener('resize', handleChange)
    }
  }, [mobileDrawerOpen])

  // Server-side preferences sync. The localStorage values above act as
  // a fast-path cache (and are the only store for guests). For signed-in
  // users we also pull the saved preferences off the user's profile so
  // the same selection follows them across browsers / devices: server
  // value wins on first load when present, then we keep the server in
  // sync with subsequent changes.
  //
  // `serverHydrated` flips to true once we've either (a) finished the
  // initial server fetch or (b) decided no fetch is needed (guest /
  // auth still resolving). The save effect refuses to write until then,
  // so we never echo a stale local value back over a fresh server load
  // we haven't yet applied.
  const userId = user?.id ?? null
  const [serverHydrated, setServerHydrated] = useState(false)

  // Reset the hydration flag whenever the signed-in identity changes,
  // so signing in / switching accounts re-runs the server fetch.
  useEffect(() => {
    setServerHydrated(false)
  }, [userId])

  useEffect(() => {
    if (authLoading) return
    if (!userId) {
      // Guests: no server load — local cache is the source of truth.
      setServerHydrated(true)
      return
    }
    let cancelled = false
    getMyPreferences(userId)
      .then((prefs) => {
        if (cancelled) return
        if (prefs && typeof prefs === 'object') {
          if (isValidLimitToMapView(prefs.limitToMapView)) setLimitToMapView(prefs.limitToMapView)
        }
        setServerHydrated(true)
      })
      .catch((err) => {
        // On a transient failure, fall back to whatever the local cache
        // already gave us and let subsequent changes try again.
        console.warn(
          '[JobsitesPage] failed to load preferences:',
          err?.message || err,
        )
        if (!cancelled) setServerHydrated(true)
      })
    return () => {
      cancelled = true
    }
  }, [authLoading, userId, setLimitToMapView])

  // Persist subsequent changes back to the user's profile. Debounced so
  // dragging through dropdown options doesn't fire a write per option.
  // Skipped for guests and until the initial hydration completes.
  useEffect(() => {
    if (!userId || !serverHydrated) return
    const id = setTimeout(() => {
      saveMyPreferences(userId, { limitToMapView }).catch((err) => {
        console.warn(
          '[JobsitesPage] failed to save preferences:',
          err?.message || err,
        )
      })
    }, 500)
    return () => clearTimeout(id)
  }, [userId, serverHydrated, limitToMapView])

  // GPS / location state
  const [userLocation, setUserLocation] = useState(null)
  const [locating, setLocating] = useState(false)
  const [locationError, setLocationError] = useState(null)

  // The project the user has clicked on the map. When set, the side
  // panel takes over the list area to show details; clicking "Back to
  // list" or selecting a different jobsite clears / replaces it.
  // Persisted locally per-browser so returning to /jobsites reopens
  // the same panel the user last had open. The cleanup effect below
  // drops the value if the project no longer exists in the loaded
  // data set.
  const [selectedProjectId, setSelectedProjectId] = useLocalStorage(
    SELECTED_PROJECT_STORAGE_KEY,
    null,
    { validate: isValidSelectedProjectId },
  )

  // Bumping this token tells <ProjectMap> to recenter on the user.
  const [centerOnUserToken, setCenterOnUserToken] = useState(0)

  // Bumping this token tells <ProjectMap> to snap back to the default
  // Canada-wide activity view. Paired with clearing the persisted view so the
  // next visit also starts fresh.
  const [resetViewToken, setResetViewToken] = useState(0)
  // True while a reset is in flight. The programmatic pan/zoom that
  // follows a reset emits one or more 'idle' events; while this flag
  // is set, handleViewChange drops the write (and re-clears the key
  // for safety) instead of re-persisting the default view we just
  // cleared. Cleared by a short safety timeout so it can never wedge
  // persistence permanently.
  const resettingViewRef = useRef(false)
  const resetClearTimerRef = useRef(null)
  // Debounced URL-update timer — fires ~1 s after the last pan/zoom idle
  // so normal navigation doesn't spam the browser history.
  const urlUpdateTimerRef = useRef(null)
  useEffect(() => {
    return () => {
      if (resetClearTimerRef.current) clearTimeout(resetClearTimerRef.current)
      if (urlUpdateTimerRef.current) clearTimeout(urlUpdateTimerRef.current)
    }
  }, [])

  // Latest viewport bounds reported by the map (after each idle).
  // While null (before the first idle), the viewport gate is a no-op
  // and the list shows all filtered projects. Stored as a plain object
  // so it can be compared / serialised without holding a Google object.
  const [mapBounds, setMapBounds] = useState(null)
  // Pull the initial map view (center + zoom) once at mount. URL params
  // (?lat=…&lng=…&zoom=…) take precedence so a shared / bookmarked link
  // opens the intended area; localStorage is the fallback for returning
  // visitors. Lazy init so we touch both sources exactly once.
  const [initialMapView] = useState(() => readInitialMapView())
  // If we restored a saved view, treat first-fix auto-center as already
  // done — otherwise the map would yank away from where the user left it
  // as soon as GPS resolves. They can still hit "Recenter on me" to jump
  // back to their location on demand.
  const hasAutoCenteredRef = useRef(!!initialMapView)

  // Track mount status so async geolocation callbacks don't update state
  // after unmount.
  const mountedRef = useRef(true)
  useEffect(() => {
    mountedRef.current = true
    return () => {
      mountedRef.current = false
    }
  }, [])

  const watchIdRef = useRef(null)
  const hasFixRef = useRef(false)

  const stopWatching = useCallback(() => {
    if (
      watchIdRef.current != null &&
      typeof navigator !== 'undefined' &&
      'geolocation' in navigator
    ) {
      navigator.geolocation.clearWatch(watchIdRef.current)
    }
    watchIdRef.current = null
  }, [])

  const startWatching = useCallback(() => {
    if (typeof navigator === 'undefined' || !('geolocation' in navigator)) {
      setLocationError({
        kind: 'unsupported',
        message: 'Geolocation is not supported by this browser.',
      })
      return
    }
    stopWatching()
    setLocating(true)
    setLocationError(null)
    watchIdRef.current = navigator.geolocation.watchPosition(
      (pos) => {
        if (!mountedRef.current) return
        hasFixRef.current = true
        setUserLocation({
          lat: pos.coords.latitude,
          lng: pos.coords.longitude,
          accuracy: pos.coords.accuracy,
        })
        setLocating(false)
        setLocationError(null)
      },
      (err) => {
        if (!mountedRef.current) return
        if (err.code === err.PERMISSION_DENIED) {
          stopWatching()
          hasFixRef.current = false
          setLocating(false)
          setLocationError({
            kind: 'denied',
            message: 'Location blocked. Enable location access in your browser to center the map on you.',
          })
          return
        }
        if (hasFixRef.current) return
        setLocating(false)
        if (err.code === err.POSITION_UNAVAILABLE) {
          setLocationError({
            kind: 'unavailable',
            message: 'Could not determine your location.',
          })
        } else if (err.code === err.TIMEOUT) {
          setLocationError({
            kind: 'timeout',
            message: 'Locating you took too long. Try again.',
          })
        } else {
          setLocationError({
            kind: 'unknown',
            message: err.message || 'Failed to get your location.',
          })
        }
      },
      { enableHighAccuracy: false, timeout: 30000, maximumAge: 10000 },
    )
  }, [stopWatching])

  const requestLocation = startWatching

  useEffect(() => {
    requestLocation()
  }, [requestLocation])

  useEffect(() => {
    return () => {
      stopWatching()
    }
  }, [stopWatching])

  useEffect(() => {
    if (hasAutoCenteredRef.current) return
    if (!userLocation) return
    if (loading) return
    hasAutoCenteredRef.current = true
    setCenterOnUserToken((t) => t + 1)
  }, [userLocation, loading])

  const handleRecenterOnMe = useCallback(() => {
    if (!userLocation) {
      requestLocation()
      return
    }
    setCenterOnUserToken((t) => t + 1)
  }, [userLocation, requestLocation])

  // Persist whatever the map settles on so a refresh / return visit drops
  // the user back where they were. Idle is debounced by Google Maps
  // already (fires once per pan/zoom), so writing on every call is fine.
  // While a reset is in flight (resettingViewRef), drop the write — and
  // belt-and-braces re-clear the storage key — so the post-reset idle
  // (or any straggler idles from slow rendering) cannot re-persist the
  // default view we just cleared.
  const handleViewChange = useCallback((view) => {
    if (resettingViewRef.current) {
      if (typeof window !== 'undefined') {
        try {
          window.localStorage.removeItem(MAP_VIEW_STORAGE_KEY)
        } catch {
          // Storage may be disabled — best-effort.
        }
        // Also clear the URL params so the reset sticks if the page is
        // bookmarked / shared immediately after resetting.
        try {
          const url = new URL(window.location.href)
          url.searchParams.delete('lat')
          url.searchParams.delete('lng')
          url.searchParams.delete('zoom')
          history.replaceState(null, '', url.toString())
        } catch {
          // Non-critical — best-effort.
        }
      }
      return
    }
    writeSavedMapView(view)
    // Debounce the URL update so rapid panning doesn't spam the session
    // history. We use replaceState (not pushState) so bookmarking / sharing
    // reflects the latest view without adding unwanted back-button entries.
    if (urlUpdateTimerRef.current) clearTimeout(urlUpdateTimerRef.current)
    urlUpdateTimerRef.current = setTimeout(() => {
      urlUpdateTimerRef.current = null
      if (typeof window === 'undefined') return
      try {
        const url = new URL(window.location.href)
        url.searchParams.set('lat', view.center.lat.toFixed(6))
        url.searchParams.set('lng', view.center.lng.toFixed(6))
        url.searchParams.set('zoom', String(Math.round(view.zoom)))
        history.replaceState(null, '', url.toString())
      } catch {
        // Non-critical — best-effort.
      }
    }, 1000)
  }, [])

  const handleResetView = useCallback(() => {
    if (typeof window !== 'undefined') {
      try {
        window.localStorage.removeItem(MAP_VIEW_STORAGE_KEY)
      } catch {
        // Storage may be disabled (private mode) — the in-memory reset
        // below is what matters; persistence is best-effort.
      }
      // Clear URL params so a refresh after reset doesn't re-apply the
      // old view, and the reset location is shareable immediately.
      try {
        const url = new URL(window.location.href)
        url.searchParams.delete('lat')
        url.searchParams.delete('lng')
        url.searchParams.delete('zoom')
        history.replaceState(null, '', url.toString())
      } catch {
        // Non-critical — best-effort.
      }
      // Cancel any pending debounced URL write from the last pan/zoom
      // so a slow-firing timer can't re-apply stale params after reset.
      if (urlUpdateTimerRef.current) {
        clearTimeout(urlUpdateTimerRef.current)
        urlUpdateTimerRef.current = null
      }
    }
    setMapBounds(null)
    // Latch the "resetting" flag so any 'idle' writes that arrive
    // from the programmatic pan/zoom are dropped (and the storage
    // key is re-cleared on each one). Cleared after a short safety
    // window so user-initiated pans afterward persist normally.
    resettingViewRef.current = true
    if (resetClearTimerRef.current) clearTimeout(resetClearTimerRef.current)
    resetClearTimerRef.current = setTimeout(() => {
      resettingViewRef.current = false
      resetClearTimerRef.current = null
    }, 1500)
    setResetViewToken((t) => t + 1)
  }, [])

  const handleToggleMapTheme = useCallback(() => {
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new Event(MAP_THEME_TOGGLE_EVENT))
    }
    setMapTheme((theme) => theme === 'dark' ? 'light' : 'dark')
  }, [setMapTheme])

  // The map calls this on every idle with its current LatLng bounds.
  // We skip state updates when the new bounds are numerically identical
  // to the previous ones so React doesn't re-run the viewport filter on
  // a no-op (e.g. the idle that fires immediately after a programmatic
  // setCenter to the same spot).
  const handleBoundsChange = useCallback((bounds) => {
    setMapBounds((prev) => {
      if (
        prev &&
        prev.north === bounds.north &&
        prev.south === bounds.south &&
        prev.east === bounds.east &&
        prev.west === bounds.west
      ) {
        return prev
      }
      return bounds
    })
  }, [])

  const publicProjects = useMemo(
    () => projects.filter(isPublicProjectVisible),
    [projects],
  )

  const stages = PUBLIC_STAGE_OPTIONS
  const provinces = useMemo(() => {
    const byCode = new Map()
    for (const project of publicProjects) {
      const code = normalizeCanadianRegion(project.province)
      if (!code) continue
      byCode.set(code, getCanadianRegionLabel(code) || code)
    }
    return Array.from(byCode, ([value, label]) => ({ value, label }))
      .sort((a, b) => a.label.localeCompare(b.label))
  }, [publicProjects])

  // Distinct normalized values pulled live from open job-post trades, sorted alphabetically.
  const trades = useMemo(() => {
    const set = new Set()
    for (const project of publicProjects) {
      for (const roleTrade of project._openRoleTrades || []) {
        const normalized = normalizeTrade(roleTrade)
        if (STANDARD_TRADES.includes(normalized)) set.add(normalized)
      }
    }
    return STANDARD_TRADES.filter((tradeOption) => set.has(tradeOption))
  }, [publicProjects])

  const hasUserLocation = !!(
    userLocation &&
    Number.isFinite(userLocation.lat) &&
    Number.isFinite(userLocation.lng)
  )

  const minValueNum = useMemo(() => {
    return normalizeProjectValueFilter(minValue)
  }, [minValue])

  const mapFiltered = useMemo(() => {
    const list = []
    for (const p of publicProjects) {
      if (province !== 'all' && normalizeCanadianRegion(p.province) !== province) continue
      if (stage !== 'all' && getPublicStageKey(p.stage) !== stage) continue
      if (hiringOnly && !(p._isHiringNow || (Number(p._openRolesCount) || 0) > 0)) continue
      if (claimedOnly && !p.claimed_by_company_id) continue
      if (
        trade !== 'all' &&
        !(p._openRoleTrades || []).some((roleTrade) => normalizeTrade(roleTrade) === trade)
      ) continue
      if (minValueNum > 0) {
        const v = parseProjectValue(p.estimated_value)
        if (!Number.isFinite(v) || v < minValueNum) continue
      }
      list.push(p)
    }
    return list
  }, [
    publicProjects,
    province,
    stage,
    trade,
    hiringOnly,
    claimedOnly,
    minValueNum,
  ])

  const filtered = useMemo(() => {
    const q = debouncedSearch.trim().toLowerCase()
    const list = []
    for (const p of mapFiltered) {
      if (q) {
        const name = (p.project_name || '').toLowerCase()
        const city = (p.city || '').toLowerCase()
        if (!name.includes(q) && !city.includes(q)) continue
      }
      let distanceKm = null
      if (hasUserLocation && p._hasValidCoords) {
        distanceKm = haversineKm(userLocation, { lat: p._lat, lng: p._lng })
      }
      list.push(distanceKm == null ? p : { ...p, _distanceKm: distanceKm })
    }
    return list
  }, [
    mapFiltered,
    debouncedSearch,
    hasUserLocation,
    userLocation,
  ])

  const mappedCount = useMemo(
    () => filtered.filter((p) => p._hasValidCoords).length,
    [filtered],
  )
  const totalJobsitesCount = mappedCount

  // Viewport-gated list: when "Limit to map view" is on and the map has
  // reported its bounds at least once, narrow the filtered list to
  // projects whose pins lie inside the current viewport. Projects
  // without valid coords can't be placed on the map and are dropped
  // from the gated view (they're still reachable by toggling the
  // viewport gate off). When the gate is off, this is just `filtered`.
  const viewportFiltered = useMemo(() => {
    if (!limitToMapView || !mapBounds) return filtered
    const { north, south, east, west } = mapBounds
    const crossesAntimeridian = west > east
    return filtered.filter((p) => {
      if (!p._hasValidCoords) return false
      const lat = p._lat
      const lng = p._lng
      if (lat < south || lat > north) return false
      if (crossesAntimeridian) {
        return lng >= west || lng <= east
      }
      return lng >= west && lng <= east
    })
  }, [filtered, limitToMapView, mapBounds])

  const viewportActive = limitToMapView && !!mapBounds
  // Total items the gate is hiding from the list right now. This is a
  // mix of (a) projects whose pins fall outside the current map view
  // and (b) projects that lack valid coords and therefore can't be
  // mapped at all. We label this count as "more" rather than "outside
  // view" so the wording stays accurate for both buckets.
  const hiddenByViewport = viewportActive
    ? Math.max(0, filtered.length - viewportFiltered.length)
    : 0

  // Drive ProjectMap's auto-fit with the active filter values only —
  // `mappedCount` is intentionally excluded so that project data arriving
  // after mount (the 0 → ~981 transition) does not look like a user filter
  // change and overwrite a restored saved view. The initial "fit all data"
  // for first-time visitors is handled by a dedicated one-shot effect inside
  // ProjectMap that is keyed on `mappedCount` and gated by `restoreInitialView`.
  // `hasUserLocation` is also excluded: GPS resolving only adds distance
  // labels and should not clobber the map view.
  const filterSignature = useMemo(
    () =>
      [
        province,
        stage,
        trade,
        minValue,
        hiringOnly ? 'hiring' : 'all-hiring',
        claimedOnly ? 'claimed' : 'all-claims',
      ].join('|'),
    [province, stage, trade, minValue, hiringOnly, claimedOnly],
  )

  const hasActiveFilters = useMemo(
    () =>
      search !== DEFAULT_FILTERS.search ||
      province !== DEFAULT_FILTERS.province ||
      stage !== DEFAULT_FILTERS.stage ||
      trade !== DEFAULT_FILTERS.trade ||
      minValue !== DEFAULT_FILTERS.minValue ||
      hiringOnly !== DEFAULT_FILTERS.hiringOnly ||
      claimedOnly !== DEFAULT_FILTERS.claimedOnly,
    [search, province, stage, trade, minValue, hiringOnly, claimedOnly],
  )

  const clearFilters = useCallback(() => {
    setSearch(DEFAULT_FILTERS.search)
    setProvince(DEFAULT_FILTERS.province)
    setStage(DEFAULT_FILTERS.stage)
    setTrade(DEFAULT_FILTERS.trade)
    setMinValue(DEFAULT_FILTERS.minValue)
    setHiringOnly(DEFAULT_FILTERS.hiringOnly)
    setClaimedOnly(DEFAULT_FILTERS.claimedOnly)
  }, [])

  // One-click "find more nearby" shortcut surfaced from the map
  // InfoWindow and the selected-project side panel — applies the same
  // Nearest-first + 25 km radius the user could otherwise build
  // manually from the filter dropdowns.
  // Resolve the selected project against the full data set (not the
  // filtered list) so applying a filter — including the "Find more
  // like this within 25 km" shortcut from the panel itself — does not
  // yank the panel away from under the user. The panel only closes
  // when the user explicitly clicks "Back to list", or when the
  // project disappears from the source data entirely.
  // Compare ids stringified so a numeric API id (Postgres bigint) and
  // a string id surviving from older storage formats both match.
  const selectedProject = useMemo(() => {
    if (selectedProjectId == null) return null
    const target = String(selectedProjectId)
    return publicProjects.find((p) => String(p.id) === target) || null
  }, [selectedProjectId, publicProjects])

  // If the persisted selection no longer exists in the freshly loaded
  // data set (e.g. the project was deleted upstream), drop it so we
  // don't keep trying to restore a missing panel on every visit. We
  // only run this once loading has finished and the fetch did not
  // error — on a transient fetch error we want to keep the saved id
  // around for the next attempt. A successful but empty load is a
  // legitimate "no longer exists" signal and clears the stale id.
  useEffect(() => {
    if (loading || error) return
    if (selectedProjectId == null) return
    const target = String(selectedProjectId)
    const exists = publicProjects.some((p) => String(p.id) === target)
    if (!exists) setSelectedProjectId(null)
  }, [loading, error, publicProjects, selectedProjectId, setSelectedProjectId])

  const handleSelectProject = useCallback((id) => {
    setSelectedProjectId(id)
    setMobileDrawerOpen(true)
  }, [])

  const handleCloseSelected = useCallback(() => {
    setSelectedProjectId(null)
  }, [])

  return (
    <div className="fixed inset-x-0 bottom-0 top-[72px] z-20 overflow-hidden bg-slate-950 sm:top-20 lg:grid lg:grid-cols-[380px_minmax(0,1fr)] lg:grid-rows-[auto_minmax(0,1fr)] lg:gap-x-6 lg:gap-y-4 lg:p-6">
      <h1 className="sr-only">Jobsites Map</h1>
      <div className="absolute left-4 top-4 z-30 sm:left-6 lg:relative lg:left-auto lg:top-auto lg:z-auto lg:col-start-1 lg:row-start-1">
      </div>
      {/* Map at the top */}
      <section className="absolute inset-0 overflow-hidden bg-slate-900 lg:relative lg:inset-auto lg:col-start-2 lg:row-start-1 lg:row-span-2 lg:min-h-0 lg:overflow-hidden lg:rounded-3xl lg:border lg:border-slate-800">
        <LocationStatusPill
          userLocation={userLocation}
          locating={locating}
          locationError={locationError}
          onRetry={requestLocation}
          onRecenter={handleRecenterOnMe}
        />
        <ResetViewButton onReset={handleResetView} />
        <MapThemeButton mapTheme={mapTheme} onToggle={handleToggleMapTheme} />
        <div
          className={[
            'absolute left-3 z-10 rounded-xl border border-slate-700/60 bg-slate-950/80 backdrop-blur-sm transition-[bottom,opacity] duration-300',
            mobileDrawerOpen ? 'bottom-[calc(72vh+0.75rem)] opacity-90' : 'bottom-24 opacity-100',
            'lg:bottom-10',
          ].join(' ')}
        >
          <button
            type="button"
            onClick={() => setStageLegendOpen((open) => !open)}
            className="flex w-full items-center gap-2 px-3 py-2 text-left text-[10px] font-semibold uppercase tracking-wider text-slate-300 transition hover:text-amber-200"
            aria-expanded={stageLegendOpen}
            aria-controls="jobsites-stage-legend"
          >
            <span className="flex -space-x-1" aria-hidden="true">
              {PUBLIC_STAGE_OPTIONS.map(({ label, color }) => (
                <span
                  key={label}
                  className="h-2.5 w-2.5 rounded-full border border-slate-950"
                  style={{ backgroundColor: color }}
                />
              ))}
            </span>
            Stage
            <ChevronDown
              size={13}
              className={`transition-transform ${stageLegendOpen ? 'rotate-180' : ''}`}
              aria-hidden="true"
            />
          </button>
          {stageLegendOpen && (
            <div id="jobsites-stage-legend" className="flex flex-col gap-1 px-3 pb-2">
              {PUBLIC_STAGE_OPTIONS.map(({ label, color }) => (
                <div key={label} className="flex items-center gap-1.5">
                  <svg width="11" height="14" viewBox="0 0 28 36" aria-hidden="true">
                    <path
                      d="M14 1 C 6.8 1 1 6.8 1 14 C 1 23.5 14 35 14 35 C 14 35 27 23.5 27 14 C 27 6.8 21.2 1 14 1 Z"
                      fill={color}
                      stroke="#0f172a"
                      strokeWidth="1.5"
                    />
                    <circle cx="14" cy="14" r="4.5" fill="#0f172a" />
                  </svg>
                  <span className="text-[11px] text-slate-300">{label}</span>
                </div>
              ))}
            </div>
          )}
        </div>
        <ProjectMap
          projects={filtered}
          userLocation={userLocation}
          centerOnUserToken={centerOnUserToken}
          resetViewToken={resetViewToken}
          filterSignature={filterSignature}
          mappedCount={mappedCount}
          initialCenter={initialMapView?.center}
          initialZoom={initialMapView?.zoom}
          onViewChange={handleViewChange}
          restoreInitialView={!!initialMapView}
          onProjectSelect={handleSelectProject}
          onBoundsChange={handleBoundsChange}
          mapTheme={mapTheme}
          mapPadding={mapPadding}
          showPopups={false}
        />
        {loading && <MapSkeleton />}
      </section>

      <section
        className={[
          'absolute inset-x-0 bottom-0 z-20 mx-auto flex w-full max-w-7xl flex-col border border-slate-800 bg-slate-950/96 shadow-[0_-22px_60px_rgba(0,0,0,0.65)] backdrop-blur transition-[max-height,transform] duration-300 ease-out md:max-h-[72vh]',
          mobileDrawerOpen
            ? 'max-h-[72vh] rounded-t-3xl pb-[env(safe-area-inset-bottom)] lg:max-h-[calc(100vh-7rem)]'
            : 'max-h-[76px] rounded-t-2xl pb-[env(safe-area-inset-bottom)]',
          'lg:relative lg:inset-auto lg:col-start-1 lg:row-start-2 lg:max-h-none lg:min-h-0 lg:w-full lg:max-w-none lg:rounded-3xl lg:pb-0 lg:shadow-none',
        ].join(' ')}
        aria-label="Jobsites drawer"
      >
      <div className="shrink-0 space-y-3 border-b border-slate-800/80 px-3 pb-3 pt-3 sm:px-4 lg:px-5">
      <button
        type="button"
        onClick={() => setMobileDrawerOpen((open) => !open)}
        className="mx-auto block min-h-10 w-full rounded-t-2xl text-slate-300 lg:hidden"
        aria-expanded={mobileDrawerOpen}
        aria-controls="jobsites-mobile-drawer-content"
      >
        <span className="mx-auto block h-1.5 w-12 rounded-full bg-slate-700" aria-hidden="true" />
        {!mobileDrawerOpen && (
          <span className="mt-2 inline-flex items-center justify-center rounded-full border border-slate-700 bg-slate-900/90 px-4 py-1.5 text-xs font-bold text-white shadow-lg">
            View {totalJobsitesCount} Jobsites
          </span>
        )}
      </button>
      {mobileDrawerOpen && (
        <div className="flex items-center justify-between gap-3 lg:hidden">
          <p className="text-sm font-black text-white">View {totalJobsitesCount} Jobsites</p>
          <button
            type="button"
            onClick={() => setMobileDrawerOpen(false)}
            className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-slate-700 bg-slate-900 text-slate-200 transition hover:border-amber-400/50 hover:text-amber-200"
            aria-label="Collapse map view"
            title="Collapse map view"
          >
            <X size={16} aria-hidden="true" />
          </button>
        </div>
      )}
      <div
        id="jobsites-mobile-drawer-content"
        className={mobileDrawerOpen ? 'contents lg:contents' : 'hidden lg:contents'}
      >
      {/* Sticky compact filter bar */}
      <div className="relative z-30">
        <MapFilters
          search={search}
          onSearchChange={setSearch}
          province={province}
          onProvinceChange={setProvince}
          provinces={provinces}
          stage={stage}
          onStageChange={setStage}
          stages={stages}
          trade={trade}
          onTradeChange={setTrade}
          trades={trades}
          minValue={minValue}
          onMinValueChange={setMinValue}
          hiringOnly={hiringOnly}
          onHiringOnlyChange={setHiringOnly}
          claimedOnly={claimedOnly}
          onClaimedOnlyChange={setClaimedOnly}
          onClearAll={clearFilters}
          hasActiveFilters={hasActiveFilters}
        />
      </div>
      <p className="px-1 text-xs font-semibold text-slate-400">
        {totalJobsitesCount} Jobsites
      </p>

      {/* Page heading kept visually subtle — provides semantic structure
          for screen readers / SEO without breaking the compact look. The
          scoreboard does the heavy lifting visually. */}
      {/* Scoreboard + viewport-gate toggle. The count reflects whatever
          the list is currently showing (viewport-gated when on, full
          filtered set when off) so the number always matches the cards
          below it. */}
      

      {/* Active filter chips — one per non-default filter (excluding
          search, which is already visible in the bar). The radius chip
          only shows when geolocation is granted, mirroring the drawer
          badge logic. */}
      </div>
      </div>

      {/* List / states */}
      <div
        className={[
          'min-h-0 flex-1 overflow-y-auto overscroll-contain px-3 py-3 sm:px-4 lg:px-5',
          mobileDrawerOpen ? 'block' : 'hidden lg:block',
        ].join(' ')}
      >
        {loading && <ListSkeleton />}

        {!loading && error && (
          <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-red-900/60 bg-red-950/40 p-4 text-sm text-red-200">
            <div>
              <p className="font-semibold">Could not load projects.</p>
              <p className="text-xs text-red-300/80">{error.message}</p>
            </div>
            <button
              type="button"
              onClick={reload}
              className="rounded-xl border border-red-700/60 bg-red-950 px-3 py-1.5 text-xs font-semibold text-red-100 hover:border-red-500"
            >
              Retry
            </button>
          </div>
        )}

        {!loading && !error && filtered.length === 0 && (
          <div className="flex flex-col items-center gap-4 rounded-2xl border border-dashed border-slate-700 bg-slate-950 p-12 text-center">
            <span
              className="flex h-12 w-12 items-center justify-center rounded-full border border-slate-800 bg-slate-900 text-slate-500"
              aria-hidden="true"
            >
              <Inbox size={20} />
            </span>
            {viewportActive && filtered.length > 0 ? (
              <>
                <p className="text-base font-semibold text-white">
                  No projects in the current map view.
                </p>
                <p className="-mt-2 text-sm text-slate-400">
                  Pan or zoom out, or show all {filtered.length} matching
                  project{filtered.length === 1 ? '' : 's'}.
                </p>
                <button
                  type="button"
                  onClick={() => setLimitToMapView(false)}
                  className="rounded-xl bg-amber-400 px-4 py-2 text-sm font-bold text-black transition hover:bg-amber-300"
                >
                  Show all {filtered.length} result
                  {filtered.length === 1 ? '' : 's'}
                </button>
              </>
            ) : (
              <>
                <p className="text-base font-semibold text-white">
                  {hasActiveFilters
                    ? 'No projects match those filters — try clearing them.'
                    : 'No projects to show right now.'}
                </p>
                <button
                  type="button"
                  onClick={hasActiveFilters ? clearFilters : reload}
                  className="rounded-xl bg-amber-400 px-4 py-2 text-sm font-bold text-black transition hover:bg-amber-300"
                >
                  {hasActiveFilters ? 'Clear filters' : 'Reload'}
                </button>
              </>
            )}
          </div>
        )}

        {!loading && !error && selectedProject && (
          <div className="rounded-3xl border border-slate-800 bg-slate-950 p-5">
            <SelectedProjectPanel
              project={selectedProject}
              onClose={handleCloseSelected}
              userLocation={userLocation}
              locating={locating}
              locationError={locationError}
              onRequestLocation={requestLocation}
            />
          </div>
        )}

        {!loading && !error && !selectedProject && filtered.length > 0 && (
          <ProjectListPanel projects={filtered} />
        )}
      </div>
      </section>
    </div>
  )
}

function distinctSorted(items, key) {
  const set = new Set()
  for (const it of items) {
    const v = it?.[key]
    if (v != null && v !== '') set.add(String(v))
  }
  return Array.from(set).sort((a, b) => a.localeCompare(b))
}

function MapSkeleton() {
  // Full-bleed shimmer over the map section while project data is
  // loading. Sits above the Google map (which is still mounting in the
  // background) so the user sees motion and not a flash of bare grey.
  return (
    <div
      className="pointer-events-none absolute inset-0 overflow-hidden bg-slate-900"
      aria-hidden="true"
    >
      <div className="absolute inset-0 animate-pulse bg-gradient-to-br from-slate-800 via-slate-900 to-slate-950" />
      {/* faux pin clusters */}
      <div className="absolute left-[28%] top-[35%] h-12 w-12 animate-pulse rounded-full bg-amber-400/20" />
      <div className="absolute left-[55%] top-[28%] h-16 w-16 animate-pulse rounded-full bg-amber-400/15" />
      <div className="absolute left-[68%] top-[55%] h-10 w-10 animate-pulse rounded-full bg-amber-400/20" />
      <div className="absolute left-[40%] top-[62%] h-14 w-14 animate-pulse rounded-full bg-amber-400/15" />
      <div className="absolute inset-x-0 bottom-0 flex items-center justify-center pb-4">
        <span className="rounded-full border border-slate-700 bg-slate-950/80 px-3 py-1 text-xs font-semibold text-slate-300 shadow-lg backdrop-blur">
          Loading projects…
        </span>
      </div>
    </div>
  )
}

function ListSkeleton() {
  return (
    <div
      className="grid gap-3"
      aria-busy="true"
      aria-label="Loading projects"
    >
      {[0, 1, 2, 3, 4, 5].map((i) => (
        <div
          key={i}
          className="overflow-hidden rounded-2xl border border-slate-800 bg-slate-950 p-4"
        >
          <div className="space-y-3">
            <div className="h-4 w-3/4 animate-pulse rounded bg-slate-800/80" />
            <div className="h-3 w-1/2 animate-pulse rounded bg-slate-800/60" />
            <div className="flex gap-1.5 pt-1">
              <div className="h-5 w-16 animate-pulse rounded-full bg-slate-800/60" />
              <div className="h-5 w-20 animate-pulse rounded-full bg-slate-800/60" />
              <div className="h-5 w-14 animate-pulse rounded-full bg-slate-800/60" />
            </div>
            <div className="flex items-center justify-between pt-3">
              <div className="h-6 w-16 animate-pulse rounded bg-slate-800/60" />
              <div className="h-7 w-16 animate-pulse rounded-lg bg-slate-800/60" />
            </div>
          </div>
        </div>
      ))}
    </div>
  )
}

function ResetViewButton({ onReset }) {
  // Sits just below the LocationStatusPill in the top-right of the map.
  // Icon-only so it stays unobtrusive but exposes a clear aria-label /
  // tooltip for assistive tech and hover discovery.
  return (
    <button
      type="button"
      onClick={onReset}
      title="Reset map to the North America view"
      aria-label="Reset map view"
      data-testid="reset-view-button"
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
      data-testid="map-theme-toggle"
      className="absolute right-4 top-[6.5rem] z-10 inline-flex h-8 w-8 items-center justify-center rounded-full border border-slate-700 bg-slate-900/90 text-slate-200 shadow-lg backdrop-blur transition hover:border-amber-400/50 hover:text-amber-200"
    >
      <Icon size={14} aria-hidden="true" />
    </button>
  )
}

function LocationStatusPill({ userLocation, locating, locationError, onRetry, onRecenter }) {
  if (userLocation) {
    return (
      <button
        type="button"
        onClick={onRecenter}
        disabled={locating}
        title="Recenter map on me"
        aria-label="Recenter map on me"
        data-user-lat={userLocation.lat}
        data-user-lng={userLocation.lng}
        data-user-accuracy={userLocation.accuracy ?? ''}
        className="absolute right-4 top-4 z-10 inline-flex items-center gap-1.5 rounded-full border border-blue-500/40 bg-blue-500/15 px-3 py-1.5 text-xs font-semibold text-blue-200 shadow-lg backdrop-blur hover:border-blue-400 hover:text-blue-100 disabled:opacity-60"
      >
        <span className="relative inline-flex h-2 w-2">
          <span className="absolute inset-0 animate-ping rounded-full bg-blue-400 opacity-60" />
          <span className="relative inline-block h-2 w-2 rounded-full bg-blue-400" />
        </span>
        {locating ? 'Updating…' : 'Recenter on me'}
      </button>
    )
  }

  if (locating) {
    return (
      <div
        className="absolute right-4 top-4 z-10 inline-flex items-center gap-1.5 rounded-full border border-slate-700 bg-slate-900/90 px-3 py-1.5 text-xs font-semibold text-slate-300 shadow-lg backdrop-blur"
        aria-live="polite"
      >
        <span className="inline-block h-2 w-2 animate-pulse rounded-full bg-slate-400" />
        Locating you…
      </div>
    )
  }

  if (locationError) {
    const label = locationError.kind === 'denied'
      ? 'Location blocked'
      : locationError.kind === 'unsupported'
        ? 'Location unavailable'
        : 'Try location again'
    const showRetry = locationError.kind !== 'unsupported'
    return (
      <button
        type="button"
        onClick={onRetry}
        disabled={!showRetry}
        title={`${locationError.message}${showRetry ? ' Click to retry.' : ''}`}
        className="absolute right-4 top-4 z-10 inline-flex items-center gap-1.5 rounded-full border border-slate-700 bg-slate-900/90 px-3 py-1.5 text-xs font-semibold text-slate-200 shadow-lg backdrop-blur hover:border-amber-400/50 hover:text-amber-100 disabled:cursor-not-allowed disabled:opacity-80"
      >
        <span className="inline-block h-2 w-2 rounded-full bg-amber-300" />
        {label}
      </button>
    )
  }

  return (
    <button
      type="button"
      onClick={onRetry}
      title="Use my location on the map"
      className="absolute right-4 top-4 z-10 inline-flex items-center gap-1.5 rounded-full border border-slate-700 bg-slate-900/90 px-3 py-1.5 text-xs font-semibold text-slate-200 shadow-lg backdrop-blur hover:border-amber-400/50 hover:text-amber-200"
    >
      <span className="inline-block h-2 w-2 rounded-full bg-slate-500" />
      Use my location
    </button>
  )
}
