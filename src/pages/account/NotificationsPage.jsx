import DashboardShell from '../../components/layout/DashboardShell'
import { useAuth } from '../../hooks/useAuth'

export default function NotificationsPage() {
  const { user } = useAuth()

  return (
    <DashboardShell
      title="Notifications"
      subtitle="Your account alerts, application updates, jobsite activity, and admin notices."
    >
      <section className="rounded-3xl border border-slate-800 bg-slate-900 p-6">
        <h2 className="text-lg font-semibold text-white">Inbox</h2>
        <p className="mt-2 text-sm text-slate-400">
          No notifications yet for {user?.email || 'this account'}.
        </p>
      </section>
    </DashboardShell>
  )
}
