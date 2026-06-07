import { Link, Navigate } from 'react-router-dom'
import { useAuth } from '../../hooks/useAuth'

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

  return <Navigate to="/jobsites" replace />
}
