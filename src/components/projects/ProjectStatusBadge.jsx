const STYLES = {
  verified: 'border-emerald-500/40 bg-emerald-500/10 text-emerald-300',
  claimed: 'border-yellow-500/40 bg-yellow-500/10 text-yellow-300',
  unverified: 'border-slate-700 bg-slate-800 text-slate-300',
}

const LABELS = {
  verified: 'Verified',
  claimed: 'Claim pending',
  unverified: 'Unverified',
}

export default function ProjectStatusBadge({ status = 'unverified' }) {
  const key = STYLES[status] ? status : 'unverified'
  return (
    <span
      className={`inline-flex items-center rounded-full border px-3 py-1 text-xs font-semibold ${STYLES[key]}`}
    >
      {LABELS[key]}
    </span>
  )
}
