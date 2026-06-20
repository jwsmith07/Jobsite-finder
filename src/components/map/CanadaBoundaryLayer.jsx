import { useEffect } from 'react'

const DEFAULT_GEOJSON_URL = '/data/canada-provinces-territories.geojson'
const BOUNDARY_LAYER_KEY = 'jobsite-finder-canada-boundary'

export default function CanadaBoundaryLayer({
  map,
  geoJsonUrl = DEFAULT_GEOJSON_URL,
  strokeColor = '#facc15',
  strokeOpacity = 0.58,
  strokeWeight = 1.75,
  fillOpacity = 0,
}) {
  useEffect(() => {
    if (!map?.data) return undefined

    const controller = new AbortController()
    const dataLayer = map.data
    const features = []
    let active = true

    dataLayer.setStyle((feature) => {
      if (feature.getProperty('layer') !== BOUNDARY_LAYER_KEY) return null
      return {
        clickable: false,
        fillOpacity,
        strokeColor,
        strokeOpacity,
        strokeWeight,
        zIndex: 50,
      }
    })

    fetch(geoJsonUrl, { signal: controller.signal })
      .then((response) => {
        if (!response.ok) {
          throw new Error(`HTTP ${response.status}`)
        }
        return response.json()
      })
      .then((geoJson) => {
        if (!active) return
        const boundaryGeoJson = {
          ...geoJson,
          features: (geoJson.features || []).map((feature) => ({
            ...feature,
            properties: {
              ...(feature.properties || {}),
              layer: BOUNDARY_LAYER_KEY,
            },
          })),
        }
        const addedFeatures = dataLayer.addGeoJson(boundaryGeoJson)
        for (const feature of addedFeatures) {
          features.push(feature)
        }
      })
      .catch((error) => {
        if (error?.name === 'AbortError') return
        console.warn('[CanadaBoundaryLayer] Failed to load Canada boundaries:', error?.message || error)
      })

    return () => {
      active = false
      controller.abort()
      for (const feature of features) {
        dataLayer.remove(feature)
      }
    }
  }, [fillOpacity, geoJsonUrl, map, strokeColor, strokeOpacity, strokeWeight])

  return null
}
