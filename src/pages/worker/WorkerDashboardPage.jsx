import { Link } from 'react-router-dom'
import { useAuth } from '../../hooks/useAuth'

const links = [
  { to: '/worker/profile', label: 'My profile', desc: 'Trade, experience, resume' },
  { to: '/worker/applications', label: 'Applications', desc: 'Jobs you have applied to' },
  { to: '/worker/saved', label: 'Saved jobs', desc: 'Roles you bookmarked' },
  { to: '/jobsites', label: 'Browse Jobsites Map', desc: 'Map of public Alberta projects' },
]

export default function WorkerDashboardPage() {
  const { user, loading } = useAuth()

  if (loading) {
    return <div className="rounded-3xl border border-slate-800 bg-slate-900 p-6 text-slate-400">Loading...</div>
  }

  if (!user) {
    return (
      <div className="rounded-3xl border border-slate-800 bg-slate-900 p-6">
        <h1 className="text-2xl font-bold">Worker dashboard</h1>
        <p className="mt-2 text-slate-400">Please sign in to access your worker dashboard.</p>
        <Link to="/signin" className="mt-6 inline-block rounded-xl bg-yellow-400 px-4 py-2 font-bold text-black">
          Sign in
        </Link>
      </div>
    )
  }

  const name = user.user_metadata?.full_name || user.email

  return (
    <div className="space-y-6">
      <div className="rounded-3xl border border-slate-800 bg-slate-900 p-6">
        <p className="text-sm text-yellow-300">Worker</p>
        <h1 className="mt-1 text-3xl font-black">Welcome, {name}</h1>
        <p className="mt-2 text-slate-400">
          Built for the Trades. Powered by Large-Scale Projects.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        {links.map((l) => (
          <Link
            key={l.to}
            to={l.to}
            className="rounded-3xl border border-slate-800 bg-slate-900 p-6 transition hover:border-yellow-400/50"
          >
            <h2 className="text-lg font-semibold text-white">{l.label}</h2>
            <p className="mt-1 text-sm text-slate-400">{l.desc}</p>
          </Link>
        ))}
      </div>
    </div>
  )
}
