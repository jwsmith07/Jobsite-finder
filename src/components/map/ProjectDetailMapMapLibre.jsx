import { useEffect, useMemo, useRef, useState } from 'react'
import maplibregl from 'maplibre-gl'
import 'maplibre-gl/dist/maplibre-gl.css'
import { mapTilerKey } from '../../lib/env'

const DEFAULT_ZOOM = 13
const MAP_READY_FALLBACK_MS = 5000

function getMapStyle(mapTheme) {
  const rasterSource = mapTilerKey
    ? {
        type: 'raster',
        tiles: [`https://api.maptiler.com/maps/streets-v2${mapTheme === 'dark' ? '-dark' : ''}/256/{z}/{x}/{y}.png?key=${mapTilerKey}`],
        tileSize: 256,
        attribution: '&copy; MapTiler &copy; OpenStreetMap contributors',
      }
    : {
        type: 'raster',
        tiles: ['https://tile.openstreetmap.org/{z}/{x}/{y}.png'],
        tileSize: 256,
        attribution: '&copy; OpenStreetMap contributors',
      }

  return {
    version: 8,
    sources: {
      basemap: rasterSource,
    },
    layers: [
      {
        id: 'jf-maplibre-detail-background',
        type: 'background',
        paint: {
          'background-color': mapTheme === 'light' ? '#dbe4ec' : '#111827',
        },
      },
      {
        id: 'jf-maplibre-detail-tiles',
        type: 'raster',
        source: 'basemap',
        paint: {
          'raster-opacity': mapTheme === 'light' ? 1 : 0.72,
          'raster-saturation': mapTheme === 'light' ? 0 : -0.45,
          'raster-brightness-min': mapTheme === 'light' ? 0 : 0.08,
          'raster-brightness-max': mapTheme === 'light' ? 1 : 0.72,
        },
      },
    ],
  }
}

function hasValidLatLng(value) {
  return (
    value &&
    Number.isFinite(value.lat) &&
    Number.isFinite(value.lng) &&
    value.lat >= -90 &&
    value.lat <= 90 &&
    value.lng >= -180 &&
    value.lng <= 180
  )
}

function buildJobsitePinElement() {
  const el = document.createElement('div')
  el.style.width = '28px'
  el.style.height = '36px'
  el.innerHTML = `
    <svg xmlns="http://www.w3.org/2000/svg" width="28" height="36" viewBox="0 0 28 36" style="display:block">
      <path d="M14 1 C 6.8 1 1 6.8 1 14 C 1 23.5 14 35 14 35 C 14 35 27 23.5 27 14 C 27 6.8 21.2 1 14 1 Z"
        fill="#facc15" stroke="#0f172a" stroke-width="1.5"/>
      <circle cx="14" cy="14" r="4.5" fill="#0f172a"/>
    </svg>`
  return el
}

function buildUserDotElement() {
  const el = document.createElement('div')
  el.style.width = '16px'
  el.style.height = '16px'
  el.style.borderRadius = '50%'
  el.style.background = '#3b82f6'
  el.style.border = '3px solid #ffffff'
  el.style.boxShadow = '0 0 0 1px rgba(15, 23, 42, 0.35)'
  return el
}

export default function ProjectDetailMapMapLibre({
  destination,
  userLocation = null,
  mapTheme = 'dark',
  zoom = DEFAULT_ZOOM,
}) {
  const containerRef = useRef(null)
  const mapRef = useRef(null)
  const jobsiteMarkerRef = useRef(null)
  const userMarkerRef = useRef(null)
  const didInitialCenterRef = useRef(false)
  const [mapReady, setMapReady] = useState(false)
  const [mapError, setMapError] = useState('')

  const normalizedTheme = mapTheme === 'light' ? 'light' : 'dark'
  const mapStyle = useMemo(() => getMapStyle(normalizedTheme), [normalizedTheme])
  const hasDestination = hasValidLatLng(destination)

  useEffect(() => {
    if (!containerRef.current) return undefined
    if (!hasDestination) {
      setMapError('Missing project coordinates.')
      return undefined
    }

    setMapError('')
    setMapReady(false)
    didInitialCenterRef.current = false

    let map
    try {
      map = new maplibregl.Map({
        container: containerRef.current,
        style: mapStyle,
        center: [destination.lng, destination.lat],
        zoom,
        attributionControl: false,
      })
    } catch (error) {
      setMapError(error?.message || 'MapLibre failed to start.')
      return undefined
    }

    map.addControl(new maplibregl.AttributionControl({ compact: true }), 'bottom-right')
    map.addControl(new maplibregl.NavigationControl({ visualizePitch: false }), 'bottom-right')

    const markReady = () => setMapReady(true)
    const readyFallbackId = setTimeout(() => {
      if (mapRef.current === map) markReady()
    }, MAP_READY_FALLBACK_MS)

    map.on('load', markReady)
    map.on('style.load', markReady)
    map.on('idle', markReady)
    map.on('error', (event) => {
      setMapError(event?.error?.message || 'MapLibre failed to load.')
    })

    mapRef.current = map

    return () => {
      clearTimeout(readyFallbackId)
      map.off('load', markReady)
      map.off('style.load', markReady)
      map.off('idle', markReady)
      jobsiteMarkerRef.current?.remove()
      jobsiteMarkerRef.current = null
      userMarkerRef.current?.remove()
      userMarkerRef.current = null
      mapRef.current = null
      try {
        map.remove()
      } catch (error) {
        console.warn('[ProjectDetailMapMapLibre] Failed to remove map:', error?.message || error)
      }
    }
  }, [destination?.lat, destination?.lng, hasDestination, zoom])

  useEffect(() => {
    const map = mapRef.current
    if (!map || !mapReady) return
    map.setStyle(mapStyle)
  }, [mapReady, mapStyle])

  useEffect(() => {
    const map = mapRef.current
    if (!map || !mapReady || !hasDestination) return

    const lngLat = [destination.lng, destination.lat]
    if (jobsiteMarkerRef.current) {
      jobsiteMarkerRef.current.setLngLat(lngLat)
    } else {
      jobsiteMarkerRef.current = new maplibregl.Marker({
        element: buildJobsitePinElement(),
        anchor: 'bottom',
      })
        .setLngLat(lngLat)
        .addTo(map)
    }

    if (!didInitialCenterRef.current) {
      didInitialCenterRef.current = true
      map.easeTo({ center: lngLat, zoom, duration: 0 })
    }
  }, [destination, hasDestination, mapReady, zoom])

  useEffect(() => {
    const map = mapRef.current
    if (!map || !mapReady) return

    if (!hasValidLatLng(userLocation)) {
      userMarkerRef.current?.remove()
      userMarkerRef.current = null
      return
    }

    const lngLat = [userLocation.lng, userLocation.lat]
    if (userMarkerRef.current) {
      userMarkerRef.current.setLngLat(lngLat)
    } else {
      userMarkerRef.current = new maplibregl.Marker({
        element: buildUserDotElement(),
        anchor: 'center',
      })
        .setLngLat(lngLat)
        .addTo(map)
    }
  }, [mapReady, userLocation])

  if (!hasDestination) {
    return (
      <div className="grid h-full place-items-center rounded-2xl border border-dashed border-slate-700 text-sm text-slate-400">
        Missing project coordinates
      </div>
    )
  }

  return (
    <div className="relative h-full w-full overflow-hidden rounded-2xl bg-slate-950">
      <div ref={containerRef} className="h-full w-full" data-testid="project-detail-map-maplibre" />
      {mapError && !mapReady && (
        <div className="absolute inset-0 grid place-items-center border border-dashed border-slate-700 bg-slate-950 p-4 text-center text-sm text-slate-300">
          <div>
            <p className="font-semibold text-amber-200">MapLibre detail map unavailable</p>
            <p className="mt-2 text-slate-400">{mapError}</p>
          </div>
        </div>
      )}
      {mapError && mapReady && (
        <div className="pointer-events-none absolute left-3 top-3 z-10 max-w-[calc(100%-24px)] rounded-xl border border-amber-400/40 bg-slate-950/90 px-3 py-2 text-xs font-semibold text-amber-100 shadow-lg backdrop-blur-sm">
          Base map tiles are unavailable. Jobsite location is still shown.
        </div>
      )}
      {!mapError && !mapReady && (
        <div className="pointer-events-none absolute inset-x-0 bottom-3 flex justify-center">
          <span className="rounded-full border border-slate-700 bg-slate-950/85 px-3 py-1 text-xs font-semibold text-slate-300">
            Loading detail map...
          </span>
        </div>
      )}
    </div>
  )
}
