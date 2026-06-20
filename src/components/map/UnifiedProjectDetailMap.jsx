import ProjectDetailMap from './ProjectDetailMap'
import ProjectDetailMapMapLibre from './ProjectDetailMapMapLibre'
import { useMapProvider } from './MapProviderContext'

function MapProviderLoading() {
  return (
    <div className="grid h-full place-items-center rounded-2xl border border-dashed border-slate-700 text-sm text-slate-400">
      Loading map...
    </div>
  )
}

export default function UnifiedProjectDetailMap(props) {
  const { provider, loading } = useMapProvider()

  if (loading) return <MapProviderLoading />
  if (provider === 'maplibre') return <ProjectDetailMapMapLibre key="maplibre" {...props} />
  return <ProjectDetailMap key="google" {...props} />
}
