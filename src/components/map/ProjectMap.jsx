import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { GoogleMap, OverlayView, useJsApiLoader } from '@react-google-maps/api'
import { Link } from 'react-router-dom'
import { MarkerClusterer, SuperClusterAlgorithm } from '@googlemaps/markerclusterer'
import { googleMapsApiKey, googleMapsMapId, googleMapsMapIdDark } from '../../lib/env'
import { googleMapsDarkStyle } from './mapStyles'
import { formatCurrencyShort, formatDistanceKm, getContractorDisplayLocation, haversineKm } from '../../lib/utils'
import {
  HIRING_NOW_TONE,
  PUBLIC_STAGE_TONES,
  getPublicStageColor,
  getPublicStageKey,
  getPublicStageMeta,
  projectHasHiringPulse,
} from '../../lib/projectStages'
import { normalizeTrade } from '../../lib/trades'

const MAP_LIBRARIES = ['marker']

const containerStyle = { width: '100%', height: '100%' }
const defaultCenter = { lat: 54.5, lng: -113.5 }
const DEFAULT_DESKTOP_ZOOM = 4
const DEFAULT_MOBILE_ZOOM = 4
const GOOGLE_MAPS_AUTH_FAILURE_EVENT = 'jobsite-finder:google-maps-auth-failure'
const MAP_THEME_TOGGLE_EVENT = 'jobsite-finder:map-theme-toggle'
const ALBERTA_BOUNDS = { north: 60, south: 49, west: -120, east: -110 }

const ALBERTA_BORDER = [
  { lat: 60.0, lng: -120.0 },
  { lat: 60.0, lng: -110.0 },
  { lat: 49.0, lng: -110.0 },
  { lat: 49.0, lng: -114.054 },
  { lat: 49.616, lng: -114.5 },
  { lat: 50.0, lng: -114.7 },
  { lat: 50.5, lng: -115.2 },
  { lat: 51.0, lng: -115.6 },
  { lat: 51.5, lng: -116.3 },
  { lat: 52.0, lng: -117.0 },
  { lat: 52.5, lng: -117.5 },
  { lat: 53.0, lng: -118.3 },
  { lat: 53.5, lng: -119.0 },
  { lat: 54.0, lng: -119.7 },
  { lat: 54.5, lng: -120.0 },
]

function installGoogleMapsAuthFailureHandler() {
  if (typeof window === 'undefined' || window.__jfGoogleMapsAuthHandlerInstalled) return
  const previous = window.gm_authFailure
  window.gm_authFailure = (...args) => {
    if (typeof previous === 'function') previous(...args)
    window.dispatchEvent(new Event(GOOGLE_MAPS_AUTH_FAILURE_EVENT))
  }
  window.__jfGoogleMapsAuthHandlerInstalled = true
}

function useGoogleMapsAuthFailure() {
  const [authFailed, setAuthFailed] = useState(false)

  useEffect(() => {
    installGoogleMapsAuthFailureHandler()
    const handleAuthFailure = () => setAuthFailed(true)
    window.addEventListener(GOOGLE_MAPS_AUTH_FAILURE_EVENT, handleAuthFailure)
    return () => {
      window.removeEventListener(GOOGLE_MAPS_AUTH_FAILURE_EVENT, handleAuthFailure)
    }
  }, [])

  return authFailed
}

function toAlbertaPercent(lat, lng) {
  return {
    left: ((lng - ALBERTA_BOUNDS.west) / (ALBERTA_BOUNDS.east - ALBERTA_BOUNDS.west)) * 100,
    top: ((ALBERTA_BOUNDS.north - lat) / (ALBERTA_BOUNDS.north - ALBERTA_BOUNDS.south)) * 100,
  }
}

function StaticProjectMapFallback({ projects = [], message = 'Google Maps is blocked for this domain.' }) {
  const visibleProjects = projects
    .filter((p) => Number.isFinite(p._lat) && Number.isFinite(p._lng))
    .slice(0, 90)

  return (
    <div className="relative h-full w-full overflow-hidden rounded-2xl bg-slate-950">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_25%_20%,rgba(250,204,21,0.12),transparent_32%),linear-gradient(135deg,rgba(15,23,42,0.96),rgba(2,6,23,1))]" />
      <svg className="absolute inset-0 h-full w-full" viewBox="0 0 100 100" aria-hidden="true">
        <polyline
          points={ALBERTA_BORDER.map(({ lat, lng }) => {
            const point = toAlbertaPercent(lat, lng)
            return `${point.left},${point.top}`
          }).join(' ')}
          fill="rgba(250,204,21,0.06)"
          stroke="rgba(250,204,21,0.75)"
          strokeWidth="0.9"
        />
      </svg>
      {visibleProjects.map((project) => {
        const point = toAlbertaPercent(project._lat, project._lng)
        return (
          <span
            key={project.id}
            className="absolute inline-flex h-4 w-4 items-center justify-center"
            style={{
              left: `${point.left}%`,
              top: `${point.top}%`,
              transform: 'translate(-50%, -50%)',
            }}
            title={project.project_name || 'Jobsite'}
          >
            <span
              className="relative h-2.5 w-2.5 rounded-full border border-slate-950 shadow-[0_0_0_2px_rgba(250,204,21,0.18),0_0_12px_rgba(250,204,21,0.35)]"
              style={{ backgroundColor: getMapPinColor(project) }}
            />
          </span>
        )
      })}
      <div className="absolute left-3 right-3 top-3 rounded-xl border border-amber-400/25 bg-slate-950/85 px-3 py-2 text-xs text-slate-200 backdrop-blur">
        <p className="font-semibold text-amber-200">Fallback map shown</p>
        <p className="mt-0.5 text-slate-400">{message}</p>
      </div>
    </div>
  )
}

// Build the DOM content for a jobsite pin. AdvancedMarkerElement anchors
// content by its bottom-center, which matches the SVG's tip at (14, 36).
function buildJobsitePinContent(color, sourceType) {
  const isContractorCreated = sourceType === 'contractor_created'
  const wrapper = document.createElement('div')
  wrapper.style.width = '28px'
  wrapper.style.height = '36px'
  wrapper.style.position = 'relative'
  wrapper.style.overflow = 'visible'
  wrapper.innerHTML = `
    <svg xmlns="http://www.w3.org/2000/svg" width="28" height="36" viewBox="0 0 28 36" style="display:block;position:relative">
      <path d="M14 1 C 6.8 1 1 6.8 1 14 C 1 23.5 14 35 14 35 C 14 35 27 23.5 27 14 C 27 6.8 21.2 1 14 1 Z"
        fill="${color}" stroke="#0f172a" stroke-width="1.5"/>
      <circle cx="14" cy="14" r="${isContractorCreated ? '5.8' : '4.5'}" fill="${isContractorCreated ? '#2563eb' : '#0f172a'}" stroke="#0f172a" stroke-width="${isContractorCreated ? '1.5' : '0'}"/>
    </svg>`
  return wrapper
}

function getProjectOpenRolesCount(project) {
  const enrichedOpenRoles = Number(project?._openRolesCount)
  const openJobs = Array.isArray(project?._openJobs) ? project._openJobs : []

  if (Number.isFinite(enrichedOpenRoles) && enrichedOpenRoles > 0) return enrichedOpenRoles
  return openJobs.length
}

function getMapPinColor(project) {
  return getPublicStageColor(project?.stage)
}

// Build DOM content for a cluster bubble. We translate it down by half its
// height so the geometric center sits on the lat/lng (default anchor is
// bottom-center).
function buildClusterContent(count) {
  const size = count < 10 ? 40 : count < 100 ? 48 : count < 500 ? 56 : 64
  const wrapper = document.createElement('div')
  wrapper.style.width = `${size}px`
  wrapper.style.height = `${size}px`
  wrapper.style.transform = 'translateY(50%)'
  wrapper.innerHTML = `
    <svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 ${size} ${size}" style="display:block">
      <circle cx="${size / 2}" cy="${size / 2}" r="${size / 2 - 4}"
        fill="rgba(34,197,94,0.10)" stroke="rgba(22,163,74,0.52)" stroke-width="2"/>
      <circle cx="${size / 2}" cy="${size / 2}" r="${size / 2 - 10}"
        fill="#111827" stroke="rgba(34,197,94,0.9)" stroke-width="2"
        filter="drop-shadow(0 0 8px rgba(34,197,94,0.32))"/>
      <text x="50%" y="50%" dy=".35em" text-anchor="middle"
        font-family="Inter,system-ui,sans-serif"
        font-size="${size / 3}" font-weight="800" fill="#ffffff">${count}</text>
    </svg>`
  return wrapper
}

// Build DOM content for the user's "you are here" dot (16x16 blue circle
// with a white halo). Translated so its center sits on the lat/lng.
function buildUserDotContent() {
  const dot = document.createElement('div')
  dot.style.width = '16px'
  dot.style.height = '16px'
  dot.style.borderRadius = '50%'
  dot.style.background = '#3b82f6'
  dot.style.border = '3px solid #ffffff'
  dot.style.boxShadow = '0 0 0 1px rgba(15, 23, 42, 0.35)'
  dot.style.transform = 'translateY(50%)'
  return dot
}

const mapIds = Array.from(new Set([googleMapsMapId, googleMapsMapIdDark].filter(Boolean)))

function getMapIdForTheme(mapTheme) {
  return mapTheme === 'dark' ? googleMapsMapIdDark || googleMapsMapId : googleMapsMapId
}

function buildClusterRenderer() {
  return {
    render({ count, position }) {
      return new google.maps.marker.AdvancedMarkerElement({
        position,
        content: buildClusterContent(count),
        zIndex: 1000 + count,
      })
    },
  }
}

function getDefaultZoom() {
  if (typeof window !== 'undefined' && window.matchMedia?.('(max-width: 767px)').matches) {
    return DEFAULT_MOBILE_ZOOM
  }
  return DEFAULT_DESKTOP_ZOOM
}

function normalizeMapPadding(padding) {
  if (!padding || typeof padding !== 'object') return undefined
  return {
    top: Number(padding.top) || 0,
    right: Number(padding.right) || 0,
    bottom: Number(padding.bottom) || 0,
    left: Number(padding.left) || 0,
  }
}

function readMapViewport(map) {
  if (!map) return null
  const center = map.getCenter()
  const zoom = map.getZoom()
  const bounds = map.getBounds()
  return {
    center: center ? { lat: center.lat(), lng: center.lng() } : null,
    zoom: typeof zoom === 'number' ? zoom : null,
    bounds: bounds || null,
  }
}

function restoreMapViewport(map, viewport) {
  if (!map || !viewport) return
  if (viewport.bounds) {
    map.fitBounds(viewport.bounds, 0)
  }
  if (viewport.center) map.setCenter(viewport.center)
  if (typeof viewport.zoom === 'number') map.setZoom(viewport.zoom)
}

// Approx distance in meters between two lat/lng points (Haversine).
function distanceMeters(a, b) {
  const R = 6371000
  const toRad = (d) => (d * Math.PI) / 180
  const dLat = toRad(b.lat - a.lat)
  const dLng = toRad(b.lng - a.lng)
  const lat1 = toRad(a.lat)
  const lat2 = toRad(b.lat)
  const x =
    Math.sin(dLat / 2) ** 2 +
    Math.sin(dLng / 2) ** 2 * Math.cos(lat1) * Math.cos(lat2)
  return 2 * R * Math.asin(Math.sqrt(x))
}

const NEAR_JOBSITE_METERS = 250_000
const NEAREST_JOBSITES_FOR_FAR_FIT = 5

function ProjectMapPopup({
  project,
  distanceLabel,
  onClose,
  onApplyNearbyShortcut,
  nearbyShortcutActive,
  userLocation,
}) {
  if (!project) return null

  const stageMeta = getPublicStageMeta(project.stage)
  const openJobs = Array.isArray(project._openJobs) ? project._openJobs : []
  const openRolesCount = getProjectOpenRolesCount(project)
  const isHiring = projectHasHiringPulse(project)
  const location = getContractorDisplayLocation(project) || 'Alberta'
  const hasEstimatedValue = project.estimated_value != null && project.estimated_value !== ''
  const roleLabels = openJobs
    .map((job) => normalizeTrade(job.trade) || job.title)
    .filter(Boolean)
    .slice(0, 3)
  const ctaLabel = openRolesCount > 0 || openJobs.length > 0 ? 'View Jobs / Apply' : 'View Project'
  const primaryImage = project._primaryImage || (project.primary_image_url ? {
    image_url: project.primary_image_url,
    alt_text: `${project.project_name || 'Jobsite'} photo`,
  } : null)

  return (
    <div
      className="pointer-events-auto relative z-[100000] w-[min(280px,calc(100vw-32px))]"
      style={{ transform: 'translate(-50%, calc(-100% - 42px))', zIndex: 100000 }}
      onClick={(event) => event.stopPropagation()}
    >
      <div className="relative isolate overflow-hidden rounded-2xl border border-yellow-400/50 bg-[#07111f] text-slate-100 shadow-[0_28px_70px_rgba(0,0,0,0.9),0_0_0_1px_rgba(2,6,23,0.95)]">
        <div className="absolute inset-0 -z-10 bg-[#07111f]" />
        {primaryImage && (
          <img
            src={primaryImage.image_url}
            alt={primaryImage.alt_text || `${project.project_name || 'Jobsite'} photo`}
            className="relative h-28 w-full object-cover"
          />
        )}
        <div className="relative p-4">
          <button
            type="button"
            onClick={onClose}
            aria-label="Close project popup"
            className="absolute right-2.5 top-2.5 flex h-7 w-7 items-center justify-center rounded-full border border-slate-600 bg-[#0b1220] text-xs font-bold text-slate-200 shadow-[0_8px_18px_rgba(0,0,0,0.55)] transition hover:border-yellow-400/60 hover:text-yellow-200"
          >
            x
          </button>

          <div className="pr-8">
            <h4 className="text-sm font-black leading-snug text-white">
              {project.project_name || 'Untitled project'}
            </h4>
            <p className="mt-1 text-xs font-medium text-slate-400">{location}</p>
          </div>

          <div className="mt-3 flex flex-wrap gap-1.5">
            <span className={`inline-flex rounded-full border px-2 py-0.5 text-[11px] font-bold ${
              project.source_type === 'contractor_created'
                ? 'border-blue-500/40 bg-blue-500/10 text-blue-200'
                : 'border-slate-700 bg-slate-950 text-slate-300'
            }`}>
              {project.source_type === 'contractor_created' ? 'Contractor Created' : 'Public Project'}
            </span>
            {(project.project_status_type === 'verified' || project.claimed_by_company_id) && (
              <span className="inline-flex rounded-full border border-emerald-500/40 bg-emerald-500/10 px-2 py-0.5 text-[11px] font-bold text-emerald-200">
                Contractor Verified
              </span>
            )}
            <span className={`inline-flex rounded-full border px-2 py-0.5 text-[11px] font-bold ${PUBLIC_STAGE_TONES[stageMeta.key]}`}>
              {stageMeta.label}
            </span>
            {isHiring && (
              <span className={`inline-flex items-center gap-1.5 rounded-full border px-2 py-0.5 text-[11px] font-black uppercase tracking-wide ${HIRING_NOW_TONE}`}>
                <span className="relative flex h-2 w-2" aria-hidden="true">
                  <span className="absolute inset-0 animate-ping rounded-full bg-green-500 opacity-45" />
                  <span className="relative h-2 w-2 rounded-full bg-green-500" />
                </span>
                Hiring Now
              </span>
            )}
          </div>

          <div className="mt-4 grid grid-cols-2 gap-2">
            <div className="rounded-xl border border-slate-700 bg-[#0b1220] px-3 py-2 shadow-[inset_0_1px_0_rgba(255,255,255,0.03)]">
              <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-500">
                Est. value
              </p>
              <p className="mt-0.5 text-sm font-black text-yellow-200">
                {hasEstimatedValue ? formatCurrencyShort(project.estimated_value) : 'TBD'}
              </p>
            </div>
            <div className="rounded-xl border border-slate-700 bg-[#0b1220] px-3 py-2 shadow-[inset_0_1px_0_rgba(255,255,255,0.03)]">
              <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-500">
                Open roles
              </p>
              <p className={`mt-0.5 text-sm font-black ${openRolesCount > 0 ? 'text-green-200' : 'text-slate-300'}`}>
                {openRolesCount > 0 ? openRolesCount : 'None yet'}
              </p>
            </div>
          </div>

          {roleLabels.length > 0 && (
            <p className="mt-3 line-clamp-2 text-xs font-semibold text-slate-300">
              {roleLabels.join(' / ')}
            </p>
          )}

          {distanceLabel && (
            <p className="mt-2 text-[11px] font-semibold text-blue-200">
              {distanceLabel} from you
            </p>
          )}

          <Link
            to={`/projects/${project.id}`}
            className="mt-3 inline-flex w-full items-center justify-center rounded-xl border border-yellow-200/60 bg-yellow-400 px-3 py-2 text-xs font-black text-slate-950 shadow-[0_12px_24px_rgba(0,0,0,0.45)] transition hover:bg-yellow-300"
          >
            {ctaLabel}
          </Link>

          {onApplyNearbyShortcut && userLocation && (
            <button
              type="button"
              onClick={() => onApplyNearbyShortcut()}
              disabled={nearbyShortcutActive}
              className="mt-2 inline-flex w-full items-center justify-center rounded-xl border border-blue-300/55 bg-[#0b1b33] px-3 py-2 text-[11px] font-semibold text-blue-100 shadow-[0_10px_20px_rgba(0,0,0,0.35)] transition hover:border-blue-200 hover:bg-[#102646] disabled:cursor-not-allowed disabled:opacity-60"
              title={
                nearbyShortcutActive
                  ? 'Already showing nearest within 25 km'
                  : 'Sort by nearest and limit to 25 km from you'
              }
            >
              {nearbyShortcutActive
                ? 'Showing nearest within 25 km'
                : 'Find more within 25 km'}
            </button>
          )}
        </div>
      </div>
      <div className="mx-auto h-3 w-3 rotate-45 border-b border-r border-yellow-400/50 bg-[#07111f] shadow-[6px_6px_18px_rgba(0,0,0,0.65)]" />
    </div>
  )
}

export default function ProjectMap({
  projects = [],
  userLocation = null,
  centerOnUserToken = 0,
  resetViewToken = 0,
  filterSignature = '',
  mappedCount = 0,
  initialCenter,
  initialZoom,
  onViewChange,
  restoreInitialView = false,
  onApplyNearbyShortcut,
  nearbyShortcutActive = false,
  onProjectSelect,
  onBoundsChange,
  mapTheme = 'dark',
  interactive = true,
  showPopups = true,
  mapPadding,
}) {
  const mapsAuthFailed = useGoogleMapsAuthFailure()
  const normalizedMapTheme = mapTheme === 'light' ? 'light' : 'dark'
  const selectedMapId = getMapIdForTheme(normalizedMapTheme)
  const normalizedPadding = useMemo(() => normalizeMapPadding(mapPadding), [mapPadding])
  const mapOptions = useMemo(() => {
    const isDark = normalizedMapTheme === 'dark'
    return {
      ...(selectedMapId ? { mapId: selectedMapId } : {}),
      colorScheme: isDark ? 'DARK' : 'LIGHT',
      backgroundColor: isDark ? '#17191d' : '#e5e7eb',
      streetViewControl: false,
      mapTypeControl: false,
      fullscreenControl: false,
      zoomControl: interactive,
      draggable: interactive,
      scrollwheel: interactive,
      disableDoubleClickZoom: !interactive,
      keyboardShortcuts: interactive,
      clickableIcons: interactive,
      gestureHandling: interactive ? 'greedy' : 'none',
      padding: normalizedPadding,
      styles: !selectedMapId && isDark ? googleMapsDarkStyle : undefined,
    }
  }, [interactive, normalizedMapTheme, normalizedPadding, selectedMapId])

  const { isLoaded, loadError } = useJsApiLoader({
    id: 'jobsite-finder-google-map',
    googleMapsApiKey: googleMapsApiKey || '',
    libraries: MAP_LIBRARIES,
    mapIds: mapIds.length > 0 ? mapIds : undefined,
  })

  const [mapInstance, setMapInstance] = useState(null)
  const [infoProjectId, setInfoProjectId] = useState(null)
  const [renderedViewport, setRenderedViewport] = useState(null)
  const clustererRef = useRef(null)
  const markersRef = useRef([])
  // Cache of project id -> { marker, stageKey } so successive filter
  // updates can diff against the previous set instead of tearing every
  // marker down and rebuilding them. Keyed by project id because that's
  // the stable identity across filter changes.
  const markersByIdRef = useRef(new Map())
  const albertaPolygonRef = useRef(null)
  const userMarkerRef = useRef(null)
  const userAccuracyCircleRef = useRef(null)
  const lastCenterTokenRef = useRef(0)
  const lastResetTokenRef = useRef(0)
  const lastFilterSigRef = useRef(null)
  const userMovedMapRef = useRef(false)
  const pendingUserGestureRef = useRef(false)
  const pendingThemeViewportRef = useRef(null)
  // Tracks whether we have already handled the one-shot initial-data-load
  // auto-fit (the first time mappedCount goes non-zero). Set to true once
  // handled so the effect doesn't fire again on subsequent filter changes.
  const seenDataRef = useRef(false)

  // Refs mirror latest values so the recenter effect only runs when the
  // parent explicitly bumps the token, not on every state change.
  const userLocationRef = useRef(userLocation)
  useEffect(() => {
    userLocationRef.current = userLocation
  }, [userLocation])

  // Hold onViewChange in a ref so the idle listener stays attached to a
  // single instance and isn't re-attached on every parent re-render.
  const onViewChangeRef = useRef(onViewChange)
  useEffect(() => {
    onViewChangeRef.current = onViewChange
  }, [onViewChange])

  // Same pattern for onBoundsChange — emitted on every idle so the
  // parent can gate the project list to what's currently visible on
  // the map without re-attaching the listener on every render.
  const onBoundsChangeRef = useRef(onBoundsChange)
  useEffect(() => {
    onBoundsChangeRef.current = onBoundsChange
  }, [onBoundsChange])

  // Mirror onProjectSelect into a ref so the per-marker click listeners
  // (rebuilt only when validProjects changes) always see the latest
  // callback identity without forcing a marker rebuild on parent
  // re-renders.
  const onProjectSelectRef = useRef(onProjectSelect)
  useEffect(() => {
    onProjectSelectRef.current = onProjectSelect
  }, [onProjectSelect])

  // Resolve the boot center/zoom once at mount. Keeping these stable
  // avoids the GoogleMap re-mounting if the parent re-renders.
  const bootCenterRef = useRef(
    initialCenter && Number.isFinite(initialCenter.lat) && Number.isFinite(initialCenter.lng)
      ? initialCenter
      : defaultCenter,
  )
  const bootZoomRef = useRef(Number.isFinite(initialZoom) ? initialZoom : getDefaultZoom())

  const effectiveInitialViewport = pendingThemeViewportRef.current || renderedViewport

  // Projects already enriched by useProjects: have _lat / _lng / _hasValidCoords.
  const validProjects = useMemo(() => {
    return projects
      .filter((p) => p._hasValidCoords && Number.isFinite(p._lat) && Number.isFinite(p._lng))
      .map((p) => {
        const stageKey = getPublicStageKey(p.stage)
        return {
          ...p,
          _stageKey: stageKey,
        }
      })
  }, [projects])

  const validProjectsRef = useRef([])
  useEffect(() => {
    validProjectsRef.current = validProjects
  }, [validProjects])

  // Project currently shown in the map popup (looked up fresh so a filter
  // change that excludes the open one closes the window cleanly).
  const infoProject = useMemo(() => {
    if (!infoProjectId) return null
    return validProjects.find((p) => p.id === infoProjectId) || null
  }, [infoProjectId, validProjects])

  // Straight-line (haversine) distance from the user to the open project,
  // shown in the popup when the user's location is available. Driving
  // distance per item is intentionally avoided to preserve Directions API
  // quota.
  const infoDistanceLabel = useMemo(() => {
    if (!infoProject || !userLocation) return ''
    const km = haversineKm(userLocation, {
      lat: infoProject._lat,
      lng: infoProject._lng,
    })
    return formatDistanceKm(km)
  }, [infoProject, userLocation])

  useEffect(() => {
    if (infoProjectId && !infoProject) setInfoProjectId(null)
  }, [infoProjectId, infoProject])

  useEffect(() => {
    if (!isLoaded || !mapInstance) return
    const captureThemeViewport = () => {
      const viewport = readMapViewport(mapInstance)
      if (!viewport) return
      pendingThemeViewportRef.current = viewport
      setRenderedViewport(viewport)
    }
    window.addEventListener(MAP_THEME_TOGGLE_EVENT, captureThemeViewport)
    return () => {
      window.removeEventListener(MAP_THEME_TOGGLE_EVENT, captureThemeViewport)
    }
  }, [isLoaded, mapInstance])

  const onMapLoad = useCallback((map) => {
    setMapInstance(map)
    setTimeout(() => {
      if (map) {
        google.maps.event.trigger(map, 'resize')
        if (normalizedPadding) map.setOptions({ padding: normalizedPadding })
        const themeViewport = pendingThemeViewportRef.current
        pendingThemeViewportRef.current = null
        if (themeViewport) {
          restoreMapViewport(map, themeViewport)
        } else {
          map.setCenter(effectiveInitialViewport?.center || bootCenterRef.current)
          map.setZoom(effectiveInitialViewport?.zoom ?? bootZoomRef.current)
        }
      }
    }, 100)
  }, [effectiveInitialViewport, normalizedPadding])

  const onMapUnmount = useCallback(() => {
    if (clustererRef.current) clustererRef.current.clearMarkers()
    markersRef.current.forEach((m) => {
      m.map = null
    })
    markersRef.current = []
    markersByIdRef.current.clear()
    clustererRef.current = null
    if (albertaPolygonRef.current) {
      albertaPolygonRef.current.setMap(null)
      albertaPolygonRef.current = null
    }
    if (userMarkerRef.current) {
      userMarkerRef.current.map = null
      userMarkerRef.current = null
    }
    if (userAccuracyCircleRef.current) {
      userAccuracyCircleRef.current.setMap(null)
      userAccuracyCircleRef.current = null
    }
    lastCenterTokenRef.current = 0
    lastResetTokenRef.current = 0
    lastFilterSigRef.current = null
    userMovedMapRef.current = false
    pendingUserGestureRef.current = false
    seenDataRef.current = false
    setMapInstance(null)
  }, [])

  // Notify the parent every time the map settles after a pan/zoom so it
  // can persist the user's view. 'idle' fires once at the end of any
  // interaction (drag, zoom, programmatic setCenter), which is exactly
  // what we want — no debouncing needed.
  useEffect(() => {
    if (!isLoaded || !mapInstance) return
    const viewport = readMapViewport(mapInstance)

    mapInstance.setOptions(mapOptions)
    restoreMapViewport(mapInstance, viewport)
  }, [isLoaded, mapInstance, mapOptions])

  useEffect(() => {
    if (!isLoaded || !mapInstance || !interactive) return
    const listeners = [
      mapInstance.addListener('dragstart', () => {
        userMovedMapRef.current = true
      }),
      mapInstance.addListener('zoom_changed', () => {
        if (pendingUserGestureRef.current) userMovedMapRef.current = true
      }),
    ]
    const div = mapInstance.getDiv()
    const markPendingGesture = () => {
      pendingUserGestureRef.current = true
      window.setTimeout(() => {
        pendingUserGestureRef.current = false
      }, 1200)
    }
    div.addEventListener('wheel', markPendingGesture, { passive: true })
    div.addEventListener('dblclick', markPendingGesture)
    div.addEventListener('touchstart', markPendingGesture, { passive: true })
    return () => {
      listeners.forEach((listener) => listener.remove())
      div.removeEventListener('wheel', markPendingGesture)
      div.removeEventListener('dblclick', markPendingGesture)
      div.removeEventListener('touchstart', markPendingGesture)
    }
  }, [interactive, isLoaded, mapInstance])

  useEffect(() => {
    if (!isLoaded || !mapInstance) return
    const listener = mapInstance.addListener('idle', () => {
      const center = mapInstance.getCenter()
      const zoom = mapInstance.getZoom()
      if (center && typeof zoom === 'number') {
        const nextViewport = {
          center: { lat: center.lat(), lng: center.lng() },
          zoom,
          bounds: mapInstance.getBounds() || null,
        }
        setRenderedViewport(nextViewport)
        const viewCb = onViewChangeRef.current
        if (viewCb && userMovedMapRef.current) {
          viewCb({
            center: { lat: center.lat(), lng: center.lng() },
            zoom,
          })
        }
      }
      const boundsCb = onBoundsChangeRef.current
      if (boundsCb) {
        const b = mapInstance.getBounds()
        if (b) {
          const ne = b.getNorthEast()
          const sw = b.getSouthWest()
          boundsCb({
            north: ne.lat(),
            east: ne.lng(),
            south: sw.lat(),
            west: sw.lng(),
          })
        }
      }
    })
    return () => {
      if (listener && typeof listener.remove === 'function') {
        listener.remove()
      } else if (listener) {
        google.maps.event.removeListener(listener)
      }
    }
  }, [isLoaded, mapInstance])

  // Alberta outline (rendered once).
  useEffect(() => {
    if (!isLoaded || !mapInstance) return
    if (albertaPolygonRef.current) return

    albertaPolygonRef.current = new google.maps.Polygon({
      paths: ALBERTA_BORDER,
      strokeColor: '#facc15',
      strokeOpacity: 0.95,
      strokeWeight: 3,
      fillColor: '#facc15',
      fillOpacity: 0.06,
      clickable: false,
      zIndex: 1,
      map: mapInstance,
    })

    return () => {
      if (albertaPolygonRef.current) {
        albertaPolygonRef.current.setMap(null)
        albertaPolygonRef.current = null
      }
    }
  }, [isLoaded, mapInstance])

  // Markers + clustering. Diffs by project id between updates so pins
  // that are still in the visible set are reused (no DOM tear-down,
  // no re-create) — only newly-included projects build markers, only
  // newly-excluded ones get removed. With ~1000 jobsites this turns a
  // full rebuild on every keystroke / filter change into a tiny delta,
  // eliminating the visible flash and keeping typing smooth.
  useEffect(() => {
    if (!isLoaded || !mapInstance) return

    if (!clustererRef.current) {
      clustererRef.current = new MarkerClusterer({
        map: mapInstance,
        markers: [],
        algorithm: new SuperClusterAlgorithm({ radius: 80, maxZoom: 14 }),
        renderer: buildClusterRenderer(),
        onClusterClick: interactive ? undefined : () => {},
      })
    }

    const cache = markersByIdRef.current
    const nextIds = new Set()
    const toAdd = []

    for (const p of validProjects) {
      nextIds.add(p.id)
      const prev = cache.get(p.id)
      if (prev) {
        // Same project, still visible — reuse the marker. If the stage
        // changed (rare; only happens when fresh data overwrites this
        // project's stage), swap the pin content in place so the color
        // stays correct without rebuilding the marker.
        if (prev.stageKey !== p._stageKey) {
          prev.marker.content = buildJobsitePinContent(getMapPinColor(p), p.source_type)
          prev.stageKey = p._stageKey
        }
        continue
      }

      const marker = new google.maps.marker.AdvancedMarkerElement({
        position: { lat: p._lat, lng: p._lng },
        content: buildJobsitePinContent(getMapPinColor(p), p.source_type),
        gmpClickable: interactive,
      })
      const projectId = p.id
      if (interactive) {
        marker.addListener('gmp-click', () => {
          setInfoProjectId(projectId)
          if (onProjectSelectRef.current) onProjectSelectRef.current(projectId)
        })
      }
      cache.set(projectId, {
        marker,
        stageKey: p._stageKey,
      })
      toAdd.push(marker)
    }

    const toRemove = []
    for (const [id, entry] of cache) {
      if (!nextIds.has(id)) {
        toRemove.push(entry.marker)
        cache.delete(id)
      }
    }

    // Batch the changes through the clusterer with one redraw at the
    // end. removeMarkers / addMarkers each trigger a render by default;
    // we suppress the first so the cluster bubbles only re-paint once.
    if (toRemove.length > 0) {
      clustererRef.current.removeMarkers(toRemove, true)
      toRemove.forEach((m) => {
        m.map = null
      })
    }
    if (toAdd.length > 0) {
      clustererRef.current.addMarkers(toAdd)
    } else if (toRemove.length > 0) {
      clustererRef.current.render()
    }

    markersRef.current = Array.from(cache.values(), (e) => e.marker)
  }, [interactive, isLoaded, mapInstance, validProjects])

  // One-shot initial-data-load auto-fit. Fires exactly once, the first time
  // mappedCount goes from 0 → >0 (i.e. projects finish loading). For new
  // visitors (no saved view) it fits the map to show all projects. For
  // returning visitors whose saved view was restored, it skips so the
  // restored center/zoom is never clobbered by the data-arrival event.
  // This effect is intentionally separate from the filter-change auto-fit
  // below so that data loading and user-initiated filter changes cannot
  // interfere with each other.
  useEffect(() => {
    if (!isLoaded || !mapInstance) return
    if (seenDataRef.current) return
    if (mappedCount === 0) return

    seenDataRef.current = true
  }, [isLoaded, mapInstance, mappedCount])

  // Auto-fit map bounds whenever the user changes a filter. filterSignature
  // contains only user-controllable filter values (search, stage, trade,
  // minValue) — mappedCount is intentionally excluded
  // so that project data arriving after mount never triggers this path.
  // Single match → pan + city zoom. Empty → reset to default Alberta view.
  // Many → fitBounds with padding. We always skip the very first trigger
  // (initialization at mount) so neither new nor returning visitors get a
  // spurious auto-fit before they have interacted with anything.
  useEffect(() => {
    if (!isLoaded || !mapInstance) return
    if (filterSignature === lastFilterSigRef.current) return

    const isInitialization = lastFilterSigRef.current === null
    lastFilterSigRef.current = filterSignature

    if (isInitialization) return

    const sites = validProjectsRef.current

    if (sites.length === 0) {
      mapInstance.panTo(defaultCenter)
      mapInstance.setZoom(getDefaultZoom())
      return
    }

    if (sites.length === 1) {
      mapInstance.panTo({ lat: sites[0]._lat, lng: sites[0]._lng })
      mapInstance.setZoom(12)
      return
    }

    const bounds = new google.maps.LatLngBounds()
    sites.forEach((p) => bounds.extend({ lat: p._lat, lng: p._lng }))
    mapInstance.fitBounds(bounds, 64)
  }, [isLoaded, mapInstance, filterSignature, validProjects])

  // Center on user when the parent bumps the token (first-fix and explicit
  // "Recenter on me" clicks). Reads from refs so routine GPS refreshes /
  // filter changes don't fire this effect.
  useEffect(() => {
    if (!isLoaded || !mapInstance) return
    if (!centerOnUserToken || centerOnUserToken === lastCenterTokenRef.current) return
    const loc = userLocationRef.current
    if (!loc || !Number.isFinite(loc.lat) || !Number.isFinite(loc.lng)) return
    lastCenterTokenRef.current = centerOnUserToken

    const userLatLng = { lat: loc.lat, lng: loc.lng }
    const sites = validProjectsRef.current
    let nearestDist = Infinity
    for (const p of sites) {
      const d = distanceMeters(userLatLng, { lat: p._lat, lng: p._lng })
      if (d < nearestDist) nearestDist = d
      if (nearestDist < NEAR_JOBSITE_METERS) break
    }

    if (sites.length === 0 || nearestDist < NEAR_JOBSITE_METERS) {
      mapInstance.panTo(userLatLng)
      if ((mapInstance.getZoom() ?? 0) < 11) mapInstance.setZoom(12)
      return
    }

    const sorted = [...sites]
      .map((p) => ({
        p,
        d: distanceMeters(userLatLng, { lat: p._lat, lng: p._lng }),
      }))
      .sort((a, b) => a.d - b.d)
      .slice(0, NEAREST_JOBSITES_FOR_FAR_FIT)

    const bounds = new google.maps.LatLngBounds()
    bounds.extend(userLatLng)
    sorted.forEach(({ p }) => bounds.extend({ lat: p._lat, lng: p._lng }))
    mapInstance.fitBounds(bounds, 80)
  }, [isLoaded, mapInstance, centerOnUserToken])

  // Snap back to the default regional Alberta activity view when the parent bumps
  // the reset token. Mirrors the centerOnUserToken pattern so a single
  // click in the parent translates into one programmatic re-view.
  useEffect(() => {
    if (!isLoaded || !mapInstance) return
    if (!resetViewToken || resetViewToken === lastResetTokenRef.current) return
    lastResetTokenRef.current = resetViewToken
    mapInstance.panTo(defaultCenter)
    mapInstance.setZoom(getDefaultZoom())
  }, [isLoaded, mapInstance, resetViewToken])

  // Render the user's GPS dot + accuracy halo. Reuses the existing marker
  // / circle on each tick so the dot doesn't flicker as watchPosition
  // streams updates.
  useEffect(() => {
    if (!isLoaded || !mapInstance) return

    const hasValidLocation =
      userLocation &&
      Number.isFinite(userLocation.lat) &&
      Number.isFinite(userLocation.lng)

    if (!hasValidLocation) {
      if (userMarkerRef.current) {
        userMarkerRef.current.map = null
        userMarkerRef.current = null
      }
      if (userAccuracyCircleRef.current) {
        userAccuracyCircleRef.current.setMap(null)
        userAccuracyCircleRef.current = null
      }
      return
    }

    const pos = { lat: userLocation.lat, lng: userLocation.lng }

    if (userMarkerRef.current) {
      userMarkerRef.current.position = pos
    } else {
      userMarkerRef.current = new google.maps.marker.AdvancedMarkerElement({
        position: pos,
        map: mapInstance,
        content: buildUserDotContent(),
        zIndex: 9999,
        title: 'Your location',
      })
    }

    if (userLocation.accuracy && userLocation.accuracy > 0) {
      if (userAccuracyCircleRef.current) {
        userAccuracyCircleRef.current.setCenter(pos)
        userAccuracyCircleRef.current.setRadius(userLocation.accuracy)
      } else {
        userAccuracyCircleRef.current = new google.maps.Circle({
          map: mapInstance,
          center: pos,
          radius: userLocation.accuracy,
          strokeColor: '#3b82f6',
          strokeOpacity: 0.4,
          strokeWeight: 1,
          fillColor: '#3b82f6',
          fillOpacity: 0.1,
          clickable: false,
        })
      }
    } else if (userAccuracyCircleRef.current) {
      userAccuracyCircleRef.current.setMap(null)
      userAccuracyCircleRef.current = null
    }
  }, [isLoaded, mapInstance, userLocation])

  if (mapsAuthFailed || loadError || !googleMapsApiKey) {
    const message = !googleMapsApiKey
      ? 'Missing VITE_GOOGLE_MAPS_API_KEY.'
      : mapsAuthFailed
        ? 'Check the Google Maps API key billing and allowed website referrers.'
        : 'Google Maps failed to load.'

    return <StaticProjectMapFallback projects={validProjects} message={message} />
  }

  if (!isLoaded) {
    return (
      <div className="grid h-full place-items-center rounded-2xl border border-dashed border-slate-700 text-slate-400">
        Loading map…
      </div>
    )
  }

  return (
    <div className="relative h-full w-full overflow-hidden rounded-2xl">
      <GoogleMap
        key={`project-map-${normalizedMapTheme}-${selectedMapId || 'inline'}`}
        mapContainerStyle={containerStyle}
        center={effectiveInitialViewport?.center || bootCenterRef.current}
        zoom={effectiveInitialViewport?.zoom ?? bootZoomRef.current}
        options={mapOptions}
        onLoad={onMapLoad}
        onUnmount={onMapUnmount}
      >
        {interactive && showPopups && infoProject && (
          <OverlayView
            position={{ lat: infoProject._lat, lng: infoProject._lng }}
            mapPaneName={OverlayView.OVERLAY_MOUSE_TARGET}
          >
            <ProjectMapPopup
              project={infoProject}
              distanceLabel={infoDistanceLabel}
              onClose={() => setInfoProjectId(null)}
              onApplyNearbyShortcut={onApplyNearbyShortcut}
              nearbyShortcutActive={nearbyShortcutActive}
              userLocation={userLocation}
            />
          </OverlayView>
        )}
      </GoogleMap>
    </div>
  )
}
