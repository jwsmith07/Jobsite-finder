import { useEffect } from 'react'

const DEFAULT_GEOJSON_URL = '/data/canada-provinces-territories.geojson'
const SOURCE_ID = 'jf-canada-provinces-territories'
const FILL_LAYER_ID = 'jf-canada-provinces-fill'
const OUTLINE_CASING_LAYER_ID = 'jf-canada-provinces-outline-casing'
const OUTLINE_LAYER_ID = 'jf-canada-provinces-outline'
const HIGHLIGHT_FILL_LAYER_ID = 'jf-canada-province-highlight-fill'
const HIGHLIGHT_OUTLINE_LAYER_ID = 'jf-canada-province-highlight-outline'

function removeLayerIfPresent(map, layerId) {
  if (map.getLayer(layerId)) map.removeLayer(layerId)
}

function removeSourceIfPresent(map, sourceId) {
  if (map.getSource(sourceId)) map.removeSource(sourceId)
}

function removeBoundaryLayers(map) {
  try {
    if (!map || !map.getStyle()) return
    removeLayerIfPresent(map, HIGHLIGHT_OUTLINE_LAYER_ID)
    removeLayerIfPresent(map, HIGHLIGHT_FILL_LAYER_ID)
    removeLayerIfPresent(map, OUTLINE_LAYER_ID)
    removeLayerIfPresent(map, OUTLINE_CASING_LAYER_ID)
    removeLayerIfPresent(map, FILL_LAYER_ID)
    removeSourceIfPresent(map, SOURCE_ID)
  } catch (error) {
    console.warn('[CanadaBoundaryLayerMapLibre] Failed to remove Canada boundary layers:', error?.message || error)
  }
}

export default function CanadaBoundaryLayerMapLibre({
  map,
  ready = false,
  geoJsonUrl = DEFAULT_GEOJSON_URL,
  highlightProvinceCode = '',
  strokeColor = '#facc15',
  strokeOpacity = 0.58,
  strokeWidth = 1.5,
  fillColor = '#facc15',
  fillOpacity = 0,
  highlightFillColor = '#22c55e',
  highlightFillOpacity = 0.16,
  highlightStrokeColor = '#86efac',
  highlightStrokeOpacity = 0.92,
  highlightStrokeWidth = 2.6,
}) {
  useEffect(() => {
    if (!map || !ready) return undefined

    const controller = new AbortController()
    let active = true

    fetch(geoJsonUrl, { signal: controller.signal })
      .then((response) => {
        if (!response.ok) throw new Error(`HTTP ${response.status}`)
        return response.json()
      })
      .then((geoJson) => {
        if (!active || !map || !map.getStyle()) return

        removeBoundaryLayers(map)

        try {
          map.addSource(SOURCE_ID, {
            type: 'geojson',
            data: geoJson,
          })

          map.addLayer({
            id: FILL_LAYER_ID,
            type: 'fill',
            source: SOURCE_ID,
            paint: {
              'fill-color': fillColor,
              'fill-opacity': fillOpacity,
            },
          })

          if (highlightProvinceCode) {
            map.addLayer({
              id: HIGHLIGHT_FILL_LAYER_ID,
              type: 'fill',
              source: SOURCE_ID,
              filter: ['==', ['get', 'code'], String(highlightProvinceCode).toUpperCase()],
              paint: {
                'fill-color': highlightFillColor,
                'fill-opacity': highlightFillOpacity,
              },
            })
          }

          map.addLayer({
            id: OUTLINE_CASING_LAYER_ID,
            type: 'line',
            source: SOURCE_ID,
            paint: {
              'line-color': '#020617',
              'line-opacity': 0.28,
              'line-width': [
                'interpolate',
                ['linear'],
                ['zoom'],
                2,
                strokeWidth + 2.5,
                4,
                strokeWidth + 1.5,
                6,
                strokeWidth + 0.75,
              ],
            },
          })

          map.addLayer({
            id: OUTLINE_LAYER_ID,
            type: 'line',
            source: SOURCE_ID,
            paint: {
              'line-color': strokeColor,
              'line-opacity': strokeOpacity,
              'line-width': [
                'interpolate',
                ['linear'],
                ['zoom'],
                2,
                strokeWidth + 0.8,
                4,
                strokeWidth + 0.35,
                6,
                strokeWidth,
              ],
              'line-blur': 0.3,
            },
          })

          if (highlightProvinceCode) {
            map.addLayer({
              id: HIGHLIGHT_OUTLINE_LAYER_ID,
              type: 'line',
              source: SOURCE_ID,
              filter: ['==', ['get', 'code'], String(highlightProvinceCode).toUpperCase()],
              paint: {
                'line-color': highlightStrokeColor,
                'line-opacity': highlightStrokeOpacity,
                'line-width': highlightStrokeWidth,
              },
            })
          }
        } catch (error) {
          console.warn('[CanadaBoundaryLayerMapLibre] Failed to render Canada boundaries:', error?.message || error)
        }
      })
      .catch((error) => {
        if (error?.name === 'AbortError') return
        console.warn('[CanadaBoundaryLayerMapLibre] Failed to load Canada boundaries:', error?.message || error)
      })

    return () => {
      active = false
      controller.abort()
      removeBoundaryLayers(map)
    }
  }, [
    fillColor,
    fillOpacity,
    geoJsonUrl,
    highlightFillColor,
    highlightFillOpacity,
    highlightProvinceCode,
    highlightStrokeColor,
    highlightStrokeOpacity,
    highlightStrokeWidth,
    map,
    ready,
    strokeColor,
    strokeOpacity,
    strokeWidth,
  ])

  return null
}
