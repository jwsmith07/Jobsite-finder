import ProjectMap from './ProjectMap'
import ProjectMapMapLibre from './ProjectMapMapLibre'
import { useMapProvider } from './MapProviderContext'

function MapProviderLoading() {
  return (
    <div className="grid h-full place-items-center rounded-2xl border border-dashed border-slate-700 text-sm text-slate-400">
      Loading map...
    </div>
  )
}

export default function UnifiedProjectMap(props) {
  const { provider, loading } = useMapProvider()

  if (loading) return <MapProviderLoading />
  if (provider === 'maplibre') return <ProjectMapMapLibre key="maplibre" {...props} />
  return <ProjectMap key="google" {...props} />
}
