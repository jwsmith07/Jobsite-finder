import { useEffect, useState } from 'react'
import { getProjects, getProjectById } from '../services/projectsService'

function parseCoordinate(...values) {
  for (const value of values) {
    if (value == null || value === '') continue
    const parsed = typeof value === 'number' ? value : Number(String(value).trim())
    if (Number.isFinite(parsed)) return parsed
  }
  return null
}

function enrichProject(p) {
  const lat = parseCoordinate(p.latitude, p.lat)
  const lng = parseCoordinate(p.longitude, p.lng)
  const hasValidCoords =
    Number.isFinite(lat) &&
    Number.isFinite(lng) &&
    lat >= -90 &&
    lat <= 90 &&
    lng >= -180 &&
    lng <= 180
  return {
    ...p,
    _lat: hasValidCoords ? lat : null,
    _lng: hasValidCoords ? lng : null,
    _hasValidCoords: hasValidCoords,
  }
}

export function useProjects() {
  const [projects, setProjects] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [reloadKey, setReloadKey] = useState(0)

  useEffect(() => {
    let mounted = true
    setLoading(true)
    setError(null)

    getProjects()
      .then((data) => {
        if (!mounted) return
        setProjects((data ?? []).map(enrichProject))
      })
      .catch((err) => {
        if (!mounted) return
        setError(err)
      })
      .finally(() => {
        if (mounted) setLoading(false)
      })

    return () => {
      mounted = false
    }
  }, [reloadKey])

  const reload = () => setReloadKey((k) => k + 1)

  return { projects, loading, error, reload }
}

export function useProject(id) {
  const [project, setProject] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    if (!id) {
      setProject(null)
      setLoading(false)
      return
    }

    let mounted = true
    setLoading(true)
    setError(null)

    getProjectById(id)
      .then((data) => {
        if (!mounted) return
        setProject(data ? enrichProject(data) : null)
      })
      .catch((err) => {
        if (!mounted) return
        setError(err)
      })
      .finally(() => {
        if (mounted) setLoading(false)
      })

    return () => {
      mounted = false
    }
  }, [id])

  return { project, loading, error }
}
