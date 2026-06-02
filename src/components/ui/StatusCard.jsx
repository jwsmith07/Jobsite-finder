const TONES = {
  neutral: 'border-slate-800 bg-slate-900 text-slate-200',
  success: 'border-emerald-900/60 bg-emerald-950/40 text-emerald-300',
  warning: 'border-yellow-900/60 bg-yellow-950/30 text-yellow-200',
  error: 'border-red-900/60 bg-red-950/40 text-red-300',
}

export default function StatusCard({ tone = 'neutral', title, children }) {
  return (
    <div className={`rounded-2xl border p-4 text-sm ${TONES[tone] || TONES.neutral}`}>
      {title && <p className="font-semibold">{title}</p>}
      {children && <div className={title ? 'mt-1' : ''}>{children}</div>}
    </div>
  )
}
