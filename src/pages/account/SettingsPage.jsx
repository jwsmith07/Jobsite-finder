import DashboardShell from '../../components/layout/DashboardShell'
import { useAuth } from '../../hooks/useAuth'
import { getRoleLabel } from '../../lib/utils'

export default function SettingsPage() {
  const { user, role, profile } = useAuth()

  return (
    <DashboardShell
      title="Settings"
      subtitle="Account details and platform preferences."
    >
      <section className="rounded-3xl border border-slate-800 bg-slate-900 p-6">
        <h2 className="text-lg font-semibold text-white">Account</h2>
        <div className="mt-4 grid gap-3 text-sm sm:grid-cols-2">
          <div className="rounded-2xl border border-slate-800 bg-slate-950 p-4">
            <p className="text-xs uppercase tracking-[0.14em] text-slate-500">Name</p>
            <p className="mt-1 font-semibold text-white">{profile?.full_name || user?.user_metadata?.full_name || 'Not set'}</p>
          </div>
          <div className="rounded-2xl border border-slate-800 bg-slate-950 p-4">
            <p className="text-xs uppercase tracking-[0.14em] text-slate-500">Email</p>
            <p className="mt-1 font-semibold text-white">{user?.email || 'Not available'}</p>
          </div>
          <div className="rounded-2xl border border-slate-800 bg-slate-950 p-4">
            <p className="text-xs uppercase tracking-[0.14em] text-slate-500">Role</p>
            <p className="mt-1 font-semibold text-white">{getRoleLabel(role)}</p>
          </div>
        </div>
      </section>
    </DashboardShell>
  )
}
