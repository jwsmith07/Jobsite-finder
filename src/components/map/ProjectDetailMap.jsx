import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { GoogleMap, useJsApiLoader } from '@react-google-maps/api'
import { googleMapsApiKey, googleMapsMapId, googleMapsMapIdDark } from '../../lib/env'
import { googleMapsDarkStyle } from './mapStyles'

const MAP_LIBRARIES = ['marker']

// ---------------------------------------------------------------------------
// Route cache — keyed by jobsiteId + rounded origin coords + travel mode.
// Entries live for CACHE_TTL_MS within the session; the module-level Map
// means it persists across React re-renders / remounts without any extra
// context or provider. Size is capped at CACHE_MAX_ENTRIES: when full the
// oldest entry (by insertion order) is evicted first.
// ---------------------------------------------------------------------------
const CACHE_TTL_MS = 5 * 60 * 1000 // 5 minutes
const CACHE_MAX_ENTRIES = 15        // cap memory; oldest entry evicted first
const COORD_PRECISION = 3           // ~100 m rounding for origin
const _routeCache = new Map()

function buildCacheKey(jobsiteId, originLat, originLng, travelMode) {
  const oLat = originLat.toFixed(COORD_PRECISION)
  const oLng = originLng.toFixed(COORD_PRECISION)
  return `${jobsiteId}|${oLat},${oLng}|${travelMode}`
}

function getCachedRoute(key) {
  const entry = _routeCache.get(key)
  if (!entry) return null
  if (Date.now() - entry.ts > CACHE_TTL_MS) {
    _routeCache.delete(key)
    return null
  }
  return entry.data
}

function setCachedRoute(key, data) {
  if (_routeCache.size >= CACHE_MAX_ENTRIES) {
    const oldest = _routeCache.keys().next().value
    _routeCache.delete(oldest)
  }
  _routeCache.set(key, { ts: Date.now(), data })
}

const containerStyle = { width: '100%', height: '100%' }

const mapIds = Array.from(new Set([googleMapsMapId, googleMapsMapIdDark].filter(Boolean)))

function getMapIdForTheme(mapTheme) {
  return mapTheme === 'dark' ? googleMapsMapIdDark || googleMapsMapId : googleMapsMapId
}

// Same yellow jobsite pin shape used on the main /jobsites map so the
// detail page reads as the same product. AdvancedMarkerElement anchors
// content by its bottom-center, which matches the SVG's tip at (14, 36).
function buildJobsitePinContent() {
  const wrapper = document.createElement('div')
  wrapper.style.width = '28px'
  wrapper.style.height = '36px'
  wrapper.innerHTML = `
    <svg xmlns="http://www.w3.org/2000/svg" width="28" height="36" viewBox="0 0 28 36" style="display:block">
      <path d="M14 1 C 6.8 1 1 6.8 1 14 C 1 23.5 14 35 14 35 C 14 35 27 23.5 27 14 C 27 6.8 21.2 1 14 1 Z"
        fill="#facc15" stroke="#0f172a" stroke-width="1.5"/>
      <circle cx="14" cy="14" r="4.5" fill="#0f172a"/>
    </svg>`
  return wrapper
}

// Blue "you are here" dot, translated so its center sits on the lat/lng
// (default AdvancedMarkerElement anchor is bottom-center).
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

export default function ProjectDetailMap({
  jobsiteId,
  destination,
  userLocation = null,
  showRoute = false,
  travelMode = 'DRIVING',
  onRouteResult,
  mapTheme = 'dark',
}) {
  const normalizedMapTheme = mapTheme === 'light' ? 'light' : 'dark'
  const selectedMapId = getMapIdForTheme(normalizedMapTheme)
  const mapOptions = useMemo(() => {
    const isDark = normalizedMapTheme === 'dark'
    return {
      ...(selectedMapId ? { mapId: selectedMapId } : {}),
      colorScheme: isDark ? 'DARK' : 'LIGHT',
      backgroundColor: isDark ? '#17191d' : '#e5e7eb',
      streetViewControl: false,
      mapTypeControl: false,
      fullscreenControl: false,
      gestureHandling: 'greedy',
      zoomControl: true,
      styles: !selectedMapId && isDark ? googleMapsDarkStyle : undefined,
    }
  }, [normalizedMapTheme, selectedMapId])

  const { isLoaded, loadError } = useJsApiLoader({
    id: 'jobsite-finder-google-map',
    googleMapsApiKey: googleMapsApiKey || '',
    libraries: MAP_LIBRARIES,
    mapIds: mapIds.length > 0 ? mapIds : undefined,
  })

  const [mapInstance, setMapInstance] = useState(null)
  const jobsiteMarkerRef = useRef(null)
  const userMarkerRef = useRef(null)
  const directionsServiceRef = useRef(null)
  const directionsRendererRef = useRef(null)

  // Hold the latest callback in a ref so the directions effect doesn't
  // re-run just because the parent re-rendered with a new callback identity.
  const onRouteResultRef = useRef(onRouteResult)
  useEffect(() => {
    onRouteResultRef.current = onRouteResult
  }, [onRouteResult])

  const onMapLoad = useCallback((map) => {
    setMapInstance(map)
    // Trigger a resize after the container settles so the map paints the
    // full viewport (works around the well-known blank-tile race when the
    // map mounts inside a flex/grid container).
    setTimeout(() => {
      if (map) {
        google.maps.event.trigger(map, 'resize')
        if (
          destination &&
          Number.isFinite(destination.lat) &&
          Number.isFinite(destination.lng)
        ) {
          map.setCenter(destination)
          map.setZoom(13)
        }
      }
    }, 100)
    // We intentionally only want this to run on first load; the
    // destination is stable per page render so this is safe.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const onMapUnmount = useCallback(() => {
    if (jobsiteMarkerRef.current) {
      jobsiteMarkerRef.current.map = null
      jobsiteMarkerRef.current = null
    }
    if (userMarkerRef.current) {
      userMarkerRef.current.map = null
      userMarkerRef.current = null
    }
    if (directionsRendererRef.current) {
      directionsRendererRef.current.setMap(null)
      directionsRendererRef.current = null
    }
    directionsServiceRef.current = null
    setMapInstance(null)
  }, [])

  // Drop / refresh the jobsite marker.
  useEffect(() => {
    if (!isLoaded || !mapInstance) return
    if (
      !destination ||
      !Number.isFinite(destination.lat) ||
      !Number.isFinite(destination.lng)
    ) {
      return
    }
    if (jobsiteMarkerRef.current) {
      jobsiteMarkerRef.current.position = destination
    } else {
      jobsiteMarkerRef.current = new google.maps.marker.AdvancedMarkerElement({
        position: destination,
        map: mapInstance,
        content: buildJobsitePinContent(),
        title: 'Jobsite',
      })
    }
  }, [isLoaded, mapInstance, destination])

  // Render the user's "you are here" dot when location is available.
  useEffect(() => {
    if (!isLoaded || !mapInstance) return
    const hasUser =
      userLocation &&
      Number.isFinite(userLocation.lat) &&
      Number.isFinite(userLocation.lng)
    if (!hasUser) {
      if (userMarkerRef.current) {
        userMarkerRef.current.map = null
        userMarkerRef.current = null
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
  }, [isLoaded, mapInstance, userLocation])

  // Optional route rendering. We intentionally fetch only when `showRoute`
  // is true so we don't burn Directions API quota on every detail-page view.
  // The route stays
  // pinned to the location at the time of the click — keeping it in
  // sync with live GPS movement is tracked as a separate follow-up task.
  useEffect(() => {
    if (!isLoaded || !mapInstance) return

    const hasUser =
      userLocation &&
      Number.isFinite(userLocation.lat) &&
      Number.isFinite(userLocation.lng)
    const hasDest =
      destination &&
      Number.isFinite(destination.lat) &&
      Number.isFinite(destination.lng)

    // When the route is hidden (or we lack inputs), tear down the
    // renderer so the polyline & A/B markers vanish from the map.
    if (!showRoute || !hasUser || !hasDest) {
      if (directionsRendererRef.current) {
        directionsRendererRef.current.setMap(null)
        directionsRendererRef.current = null
      }
      return
    }

    if (!directionsServiceRef.current) {
      directionsServiceRef.current = new google.maps.DirectionsService()
    }
    if (!directionsRendererRef.current) {
      directionsRendererRef.current = new google.maps.DirectionsRenderer({
        map: mapInstance,
        // Suppress Google's default A/B markers — we already render our
        // own jobsite pin & blue user dot, and the duplicate markers
        // sit on top of them and look messy.
        suppressMarkers: true,
        preserveViewport: false,
        polylineOptions: {
          strokeColor: '#facc15',
          strokeOpacity: 0.95,
          strokeWeight: 5,
        },
      })
    } else {
      directionsRendererRef.current.setMap(mapInstance)
    }

    const cacheKey = buildCacheKey(
      jobsiteId ?? `${destination.lat},${destination.lng}`,
      userLocation.lat,
      userLocation.lng,
      travelMode,
    )
    const cached = getCachedRoute(cacheKey)

    if (cached) {
      console.log('[RouteCache] HIT — skipping Directions API call', cacheKey)
      if (directionsRendererRef.current) {
        directionsRendererRef.current.setDirections(cached.result)
      }
      if (onRouteResultRef.current) {
        onRouteResultRef.current(cached.info)
      }
      return
    }

    let cancelled = false

    directionsServiceRef.current.route(
      {
        origin: { lat: userLocation.lat, lng: userLocation.lng },
        destination: { lat: destination.lat, lng: destination.lng },
        travelMode:
          google.maps.TravelMode[travelMode] ?? google.maps.TravelMode.DRIVING,
      },
      (result, status) => {
        if (cancelled) return
        if (status === 'OK' && result) {
          if (directionsRendererRef.current) {
            directionsRendererRef.current.setDirections(result)
          }
          const leg = result.routes?.[0]?.legs?.[0]
          const info = {
            status: 'OK',
            distanceText: leg?.distance?.text ?? '',
            durationText: leg?.duration?.text ?? '',
            steps: leg?.steps ?? [],
          }
          setCachedRoute(cacheKey, { result, info })
          console.log('[RouteCache] MISS — stored result for', cacheKey)
          if (onRouteResultRef.current) {
            onRouteResultRef.current(info)
          }
        } else {
          // Tear down the renderer so a stale route doesn't linger after
          // a failed request, and surface the failure to the parent so
          // it can show a useful message.
          if (directionsRendererRef.current) {
            directionsRendererRef.current.setMap(null)
            directionsRendererRef.current = null
          }
          if (onRouteResultRef.current) {
            onRouteResultRef.current({ status: status || 'UNKNOWN_ERROR' })
          }
        }
      },
    )

    return () => {
      cancelled = true
    }
  }, [isLoaded, mapInstance, showRoute, userLocation, destination, travelMode, jobsiteId])

  if (loadError) {
    return (
      <div className="grid h-full place-items-center rounded-2xl border border-dashed border-slate-700 text-sm text-slate-400">
        Failed to load Google Maps
      </div>
    )
  }

  if (!isLoaded) {
    return (
      <div className="grid h-full place-items-center rounded-2xl border border-dashed border-slate-700 text-sm text-slate-400">
        Loading map…
      </div>
    )
  }

  return (
    <div className="relative h-full w-full overflow-hidden rounded-2xl">
      <GoogleMap
        key={`project-detail-map-${normalizedMapTheme}-${selectedMapId || 'inline'}`}
        mapContainerStyle={containerStyle}
        center={destination}
        zoom={13}
        options={mapOptions}
        onLoad={onMapLoad}
        onUnmount={onMapUnmount}
      />
    </div>
  )
}
