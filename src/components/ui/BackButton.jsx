import { useNavigate } from 'react-router-dom'

export default function BackButton({ label = '← Back' }) {
  const navigate = useNavigate()

  return (
    <button
      onClick={() => navigate(-1)}
      className="inline-flex items-center gap-2 rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-sm font-medium text-slate-300 transition-colors hover:border-slate-600 hover:bg-slate-900 hover:text-slate-200"
    >
      {label}
    </button>
  )
}
