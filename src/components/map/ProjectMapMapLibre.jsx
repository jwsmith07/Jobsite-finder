import { useEffect, useMemo, useRef, useState } from 'react'
import maplibregl from 'maplibre-gl'
import Supercluster from 'supercluster'
import 'maplibre-gl/dist/maplibre-gl.css'
import {
  getPublicStageColor,
  getPublicStageKey,
  projectHasHiringPulse,
} from '../../lib/projectStages'
import CanadaBoundaryLayerMapLibre from './CanadaBoundaryLayerMapLibre'

const DEFAULT_CENTER = { lat: 48, lng: -105 }
const DEFAULT_ZOOM = 2
const CLUSTER_MAX_ZOOM = 14
const CLUSTER_RADIUS = 44
const CLUSTER_MIN_POINTS = 3
const MAP_READY_FALLBACK_MS = 5000

function getMapStyle(mapTheme) {
  return {
    version: 8,
    sources: {
      osm: {
        type: 'raster',
        tiles: ['https://tile.openstreetmap.org/{z}/{x}/{y}.png'],
        tileSize: 256,
        attribution: '&copy; OpenStreetMap contributors',
      },
    },
    layers: [
      {
        id: 'jf-maplibre-background',
        type: 'background',
        paint: {
          'background-color': mapTheme === 'light' ? '#dbe4ec' : '#111827',
        },
      },
      {
        id: 'jf-openstreetmap-tiles',
        type: 'raster',
        source: 'osm',
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

function buildPinElement(project, pinColorOverride) {
  const color = pinColorOverride || getPublicStageColor(project?.stage)
  const sourceType = project?.source_type
  const isContractorCreated = sourceType === 'contractor_created'
  const openRolesCount = Number(project?._openRolesCount) || 0
  const isHiring = projectHasHiringPulse(project) || openRolesCount > 0
  const claimed = !!project?.claimed_by_company_id
  const el = document.createElement('button')
  el.type = 'button'
  el.className = 'jf-maplibre-pin'
  el.setAttribute('aria-label', project?.project_name ? `Select ${project.project_name}` : 'Select jobsite')
  el.style.width = '32px'
  el.style.height = '40px'
  el.style.border = '0'
  el.style.padding = '0'
  el.style.background = 'transparent'
  el.style.cursor = 'pointer'
  el.innerHTML = `
    <svg xmlns="http://www.w3.org/2000/svg" width="32" height="40" viewBox="0 0 32 40" style="display:block">
      ${isHiring ? '<circle cx="16" cy="16" r="14" fill="rgba(251,191,36,0.20)" stroke="#facc15" stroke-width="2"/>' : ''}
      <path d="M14 1 C 6.8 1 1 6.8 1 14 C 1 23.5 14 35 14 35 C 14 35 27 23.5 27 14 C 27 6.8 21.2 1 14 1 Z"
        transform="translate(2 2)" fill="${color}" stroke="#0f172a" stroke-width="1.5"/>
      <circle cx="16" cy="16" r="${isContractorCreated || claimed ? '5.8' : '4.5'}" fill="${isContractorCreated || claimed ? '#2563eb' : '#0f172a'}" stroke="#0f172a" stroke-width="${isContractorCreated || claimed ? '1.5' : '0'}"/>
      ${isHiring ? '<circle cx="24" cy="8" r="4.2" fill="#facc15" stroke="#0f172a" stroke-width="1.5"/>' : ''}
    </svg>`
  return el
}

function buildClusterElement(count) {
  const size = count < 10 ? 40 : count < 100 ? 48 : count < 500 ? 56 : 64
  const el = document.createElement('button')
  el.type = 'button'
  el.className = 'jf-maplibre-cluster'
  el.setAttribute('aria-label', `${count} jobsites. Zoom in to expand cluster.`)
  el.style.width = `${size}px`
  el.style.height = `${size}px`
  el.style.border = '0'
  el.style.padding = '0'
  el.style.background = 'transparent'
  el.style.cursor = 'pointer'
  el.innerHTML = `
    <svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 ${size} ${size}" style="display:block">
      <circle cx="${size / 2}" cy="${size / 2}" r="${size / 2 - 4}"
        fill="rgba(34,197,94,0.12)" stroke="rgba(22,163,74,0.56)" stroke-width="2"/>
      <circle cx="${size / 2}" cy="${size / 2}" r="${size / 2 - 10}"
        fill="#111827" stroke="rgba(34,197,94,0.92)" stroke-width="2"/>
      <text x="50%" y="50%" dy=".35em" text-anchor="middle"
        font-family="Inter,system-ui,sans-serif"
        font-size="${size / 3}" font-weight="800" fill="#ffffff">${count}</text>
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

function projectToFeature(project) {
  return {
    type: 'Feature',
    geometry: {
      type: 'Point',
      coordinates: [project._lng, project._lat],
    },
    properties: {
      projectId: project.id,
      project,
    },
  }
}

function getValidProjects(projects) {
  return projects
    .filter((p) => p?._hasValidCoords && Number.isFinite(p._lat) && Number.isFinite(p._lng))
    .map((p) => ({
      ...p,
      _stageKey: getPublicStageKey(p.stage),
    }))
}

function normalizeMapPadding(padding) {
  if (!padding || typeof padding !== 'object') return 48
  return {
    top: Number(padding.top) || 0,
    right: Number(padding.right) || 0,
    bottom: Number(padding.bottom) || 0,
    left: Number(padding.left) || 0,
  }
}

export default function ProjectMapMapLibre({
  projects = [],
  selectedProjectId = null,
  onProjectSelect,
  userLocation = null,
  mapTheme = 'dark',
  initialCenter = DEFAULT_CENTER,
  initialZoom = DEFAULT_ZOOM,
  interactive = true,
  showBoundaryLayers = true,
  highlightProvinceCode = '',
  centerOnUserToken = 0,
  resetViewToken = 0,
  filterSignature = '',
  onViewChange,
  restoreInitialView = false,
  onBoundsChange,
  pinColorOverride,
  mapPadding,
}) {
  const containerRef = useRef(null)
  const mapRef = useRef(null)
  const markersByKeyRef = useRef(new Map())
  const userMarkerRef = useRef(null)
  const onProjectSelectRef = useRef(onProjectSelect)
  const onBoundsChangeRef = useRef(onBoundsChange)
  const onViewChangeRef = useRef(onViewChange)
  const lastCenterTokenRef = useRef(0)
  const lastResetTokenRef = useRef(0)
  const lastFilterSigRef = useRef(null)
  const hasAutoFitRef = useRef(restoreInitialView)
  const userMovedMapRef = useRef(false)
  const [mapInstance, setMapInstance] = useState(null)
  const [mapReady, setMapReady] = useState(false)
  const [mapError, setMapError] = useState('')
  const [viewportTick, setViewportTick] = useState(0)

  const normalizedTheme = mapTheme === 'light' ? 'light' : 'dark'
  const mapStyle = useMemo(() => getMapStyle(normalizedTheme), [normalizedTheme])
  const fitPadding = useMemo(() => normalizeMapPadding(mapPadding), [mapPadding])
  const validProjects = useMemo(() => getValidProjects(projects), [projects])
  const clusterIndex = useMemo(() => {
    const index = new Supercluster({
      radius: CLUSTER_RADIUS,
      maxZoom: CLUSTER_MAX_ZOOM,
      minPoints: CLUSTER_MIN_POINTS,
    })
    index.load(validProjects.map(projectToFeature))
    return index
  }, [validProjects])
  useEffect(() => {
    onProjectSelectRef.current = onProjectSelect
  }, [onProjectSelect])

  useEffect(() => {
    onBoundsChangeRef.current = onBoundsChange
  }, [onBoundsChange])

  useEffect(() => {
    onViewChangeRef.current = onViewChange
  }, [onViewChange])

  useEffect(() => {
    if (!containerRef.current) return undefined

    setMapError('')
    setMapReady(false)

    let map
    try {
      map = new maplibregl.Map({
        container: containerRef.current,
        style: mapStyle,
        center: [initialCenter.lng, initialCenter.lat],
        zoom: initialZoom,
        attributionControl: false,
        interactive,
      })
    } catch (error) {
      setMapError(error?.message || 'MapLibre failed to start.')
      return undefined
    }

    map.addControl(new maplibregl.AttributionControl({ compact: true }), 'bottom-right')
    const markReady = () => setMapReady(true)
    const readyFallbackId = setTimeout(() => {
      if (mapRef.current === map) markReady()
    }, MAP_READY_FALLBACK_MS)

    map.on('load', markReady)
    map.on('style.load', markReady)
    map.on('idle', markReady)
    const handleViewportChange = () => {
      setViewportTick((tick) => tick + 1)
      const center = map.getCenter()
      const zoom = map.getZoom()
      if (userMovedMapRef.current && center && Number.isFinite(zoom)) {
        onViewChangeRef.current?.({
          center: { lat: center.lat, lng: center.lng },
          zoom,
        })
      }
      const boundsCb = onBoundsChangeRef.current
      const bounds = map.getBounds()
      if (boundsCb && bounds) {
        boundsCb({
          north: bounds.getNorth(),
          east: bounds.getEast(),
          south: bounds.getSouth(),
          west: bounds.getWest(),
        })
      }
    }
    const markUserMoved = () => {
      userMovedMapRef.current = true
    }
    map.on('moveend', handleViewportChange)
    map.on('zoomend', handleViewportChange)
    map.on('dragstart', markUserMoved)
    map.on('zoomstart', markUserMoved)
    map.on('rotatestart', markUserMoved)
    map.on('pitchstart', markUserMoved)
    map.on('error', (event) => {
      const message = event?.error?.message || 'MapLibre failed to load.'
      setMapError(message)
    })

    mapRef.current = map
    setMapInstance(map)

    return () => {
      clearTimeout(readyFallbackId)
      map.off('load', markReady)
      map.off('style.load', markReady)
      map.off('idle', markReady)
      map.off('moveend', handleViewportChange)
      map.off('zoomend', handleViewportChange)
      map.off('dragstart', markUserMoved)
      map.off('zoomstart', markUserMoved)
      map.off('rotatestart', markUserMoved)
      map.off('pitchstart', markUserMoved)
      markersByKeyRef.current.forEach((marker) => marker.remove())
      markersByKeyRef.current.clear()
      userMarkerRef.current?.remove()
      userMarkerRef.current = null
      mapRef.current = null
      setMapInstance(null)
      try {
        map.remove()
      } catch (error) {
        console.warn('[ProjectMapMapLibre] Failed to remove map:', error?.message || error)
      }
    }
  }, [initialCenter.lat, initialCenter.lng, initialZoom, interactive])

  useEffect(() => {
    const map = mapRef.current
    if (!map || !mapReady) return
    map.setStyle(mapStyle)
  }, [mapReady, mapStyle])

  useEffect(() => {
    const map = mapRef.current
    if (!map || !mapReady) return
    if (hasAutoFitRef.current) return
    if (validProjects.length === 0) return

    hasAutoFitRef.current = true
    if (validProjects.length > 1) {
      const bounds = new maplibregl.LngLatBounds()
      validProjects.forEach((project) => bounds.extend([project._lng, project._lat]))
      map.fitBounds(bounds, { padding: fitPadding, maxZoom: 10, duration: 0 })
    } else {
      map.easeTo({
        center: [validProjects[0]._lng, validProjects[0]._lat],
        zoom: 11,
        duration: 0,
      })
    }
  }, [fitPadding, mapReady, validProjects])

  useEffect(() => {
    const map = mapRef.current
    if (!map || !mapReady) return
    if (filterSignature === lastFilterSigRef.current) return

    const isInitialization = lastFilterSigRef.current === null
    lastFilterSigRef.current = filterSignature
    if (isInitialization) return
    if (userMovedMapRef.current) return

    if (validProjects.length === 0) {
      map.easeTo({ center: [DEFAULT_CENTER.lng, DEFAULT_CENTER.lat], zoom: DEFAULT_ZOOM, duration: 250 })
      return
    }

    if (validProjects.length === 1) {
      map.easeTo({
        center: [validProjects[0]._lng, validProjects[0]._lat],
        zoom: 11,
        duration: 250,
      })
      return
    }

    const bounds = new maplibregl.LngLatBounds()
    validProjects.forEach((project) => bounds.extend([project._lng, project._lat]))
    map.fitBounds(bounds, { padding: fitPadding, maxZoom: 10, duration: 250 })
  }, [filterSignature, fitPadding, mapReady, validProjects])

  useEffect(() => {
    const map = mapRef.current
    if (!map || !mapReady) return

    let clusters = []
    try {
      const bounds = map.getBounds()
      const zoom = Math.floor(map.getZoom())
      clusters = clusterIndex.getClusters(
        [
          bounds.getWest(),
          bounds.getSouth(),
          bounds.getEast(),
          bounds.getNorth(),
        ],
        zoom,
      )
    } catch (error) {
      console.warn('[ProjectMapMapLibre] Failed to calculate clusters:', error?.message || error)
      return
    }
    const nextKeys = new Set()
    const markerCache = markersByKeyRef.current

    for (const cluster of clusters) {
      const [lng, lat] = cluster.geometry.coordinates
      const isCluster = !!cluster.properties.cluster
      const key = isCluster
        ? `cluster:${cluster.properties.cluster_id}`
        : `project:${cluster.properties.projectId}`
      nextKeys.add(key)

      const existing = markerCache.get(key)
      if (existing) {
        existing.setLngLat([lng, lat])
        continue
      }

      if (isCluster) {
        const count = cluster.properties.point_count
        const marker = new maplibregl.Marker({
          element: buildClusterElement(count),
          anchor: 'center',
        })
          .setLngLat([lng, lat])
          .addTo(map)

        marker.getElement().addEventListener('click', (event) => {
          event.stopPropagation()
          const expansionZoom = Math.min(
            clusterIndex.getClusterExpansionZoom(cluster.properties.cluster_id),
            map.getMaxZoom(),
          )
          map.easeTo({
            center: [lng, lat],
            zoom: expansionZoom,
            duration: 350,
          })
        })
        markerCache.set(key, marker)
      } else {
        const project = cluster.properties.project
        const marker = new maplibregl.Marker({
          element: buildPinElement(project, pinColorOverride),
          anchor: 'bottom',
        })
          .setLngLat([lng, lat])
          .addTo(map)

        marker.getElement().addEventListener('click', (event) => {
          event.stopPropagation()
          onProjectSelectRef.current?.(project.id)
        })
        markerCache.set(key, marker)
      }
    }

    for (const [key, marker] of markerCache) {
      if (!nextKeys.has(key)) {
        marker.remove()
        markerCache.delete(key)
      }
    }
  }, [clusterIndex, mapReady, pinColorOverride, viewportTick])

  useEffect(() => {
    const map = mapRef.current
    if (!map || !mapReady) return
    const hasUser =
      userLocation &&
      Number.isFinite(userLocation.lat) &&
      Number.isFinite(userLocation.lng)

    if (!hasUser) {
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

  useEffect(() => {
    const map = mapRef.current
    if (!map || !mapReady) return
    if (!centerOnUserToken || centerOnUserToken === lastCenterTokenRef.current) return
    if (!hasValidLatLng(userLocation)) return
    lastCenterTokenRef.current = centerOnUserToken
    map.easeTo({
      center: [userLocation.lng, userLocation.lat],
      zoom: Math.max(map.getZoom(), 11),
      duration: 350,
    })
  }, [centerOnUserToken, mapReady, userLocation])

  useEffect(() => {
    const map = mapRef.current
    if (!map || !mapReady) return
    if (!resetViewToken || resetViewToken === lastResetTokenRef.current) return
    lastResetTokenRef.current = resetViewToken
    map.easeTo({
      center: [DEFAULT_CENTER.lng, DEFAULT_CENTER.lat],
      zoom: DEFAULT_ZOOM,
      duration: 350,
    })
  }, [mapReady, resetViewToken])

  return (
    <div className="relative h-full w-full overflow-hidden rounded-2xl bg-slate-950">
      <div ref={containerRef} className="h-full w-full" data-testid="project-map-maplibre" />
      {showBoundaryLayers && (
        <CanadaBoundaryLayerMapLibre
          map={mapInstance}
          ready={mapReady}
          highlightProvinceCode={highlightProvinceCode}
        />
      )}
      {mapError && !mapReady && (
        <div className="absolute inset-0 grid place-items-center border border-dashed border-slate-700 bg-slate-950 p-6 text-center text-sm text-slate-300">
          <div>
            <p className="font-semibold text-amber-200">MapLibre unavailable</p>
            <p className="mt-2 text-slate-400">{mapError}</p>
          </div>
        </div>
      )}
      {mapError && mapReady && (
        <div className="pointer-events-none absolute left-3 top-3 z-10 max-w-[calc(100%-24px)] rounded-xl border border-amber-400/40 bg-slate-950/90 px-3 py-2 text-xs font-semibold text-amber-100 shadow-lg backdrop-blur-sm">
          Base map tiles are unavailable. Project pins are still shown.
        </div>
      )}
      {!mapError && !mapReady && (
        <div className="pointer-events-none absolute inset-x-0 bottom-4 flex justify-center">
          <span className="rounded-full border border-slate-700 bg-slate-950/85 px-3 py-1 text-xs font-semibold text-slate-300">
            Loading MapLibre...
          </span>
        </div>
      )}
    </div>
  )
}
