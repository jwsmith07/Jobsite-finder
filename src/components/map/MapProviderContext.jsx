import { createContext, useContext, useEffect, useMemo, useState } from 'react'
import {
  MAP_PROVIDER_CHANGED_EVENT,
  getLocalMapProviderSetting,
  getMapProviderSetting,
} from '../../services/siteSettingsService'

const MapProviderContext = createContext({
  provider: 'maplibre',
  loading: true,
  reload: () => {},
})

export function MapProviderProvider({ children }) {
  const [provider, setProvider] = useState(() => getLocalMapProviderSetting())
  const [loading, setLoading] = useState(true)
  const [reloadToken, setReloadToken] = useState(0)

  useEffect(() => {
    let cancelled = false
    setLoading(true)
    getMapProviderSetting()
      .then((nextProvider) => {
        if (!cancelled) setProvider(nextProvider)
      })
      .catch((error) => {
        if (typeof console !== 'undefined') {
          console.warn('[MapProviderProvider] Failed to load map provider:', error?.message || error)
        }
        if (!cancelled) setProvider('maplibre')
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })
    return () => {
      cancelled = true
    }
  }, [reloadToken])

  useEffect(() => {
    if (typeof window === 'undefined') return undefined

    const handleProviderChange = (event) => {
      const nextProvider = event?.detail?.provider || getLocalMapProviderSetting()
      setProvider(nextProvider)
      setLoading(false)
    }

    const handleStorageChange = (event) => {
      if (event.key === 'jobsitefinder.map_provider') {
        setProvider(getLocalMapProviderSetting())
        setLoading(false)
      }
    }

    window.addEventListener(MAP_PROVIDER_CHANGED_EVENT, handleProviderChange)
    window.addEventListener('storage', handleStorageChange)
    return () => {
      window.removeEventListener(MAP_PROVIDER_CHANGED_EVENT, handleProviderChange)
      window.removeEventListener('storage', handleStorageChange)
    }
  }, [])

  const value = useMemo(() => ({
    provider,
    loading,
    reload: () => setReloadToken((token) => token + 1),
  }), [loading, provider])

  return (
    <MapProviderContext.Provider value={value}>
      {children}
    </MapProviderContext.Provider>
  )
}

export function useMapProvider() {
  return useContext(MapProviderContext)
}
