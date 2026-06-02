export default function LoadingState({ label = 'Loading...' }) {
  return (
    <div className="rounded-2xl border border-slate-800 bg-slate-900 p-4 text-sm text-slate-400">
      {label}
    </div>
  )
}
