import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../../hooks/useAuth'
import DashboardShell from '../../components/layout/DashboardShell'
import { Switch } from '../../components/ui/switch'
import { getMaintenanceMode, updateMaintenanceMode } from '../../services/siteSettingsService'

const links = [
  { to: '/admin/projects', label: 'Projects', desc: 'Review and edit project visibility, stage, and status.' },
  { to: '/admin/jobsites', label: 'Jobsites Map', desc: 'Add jobsites tied to projects so GCs and SCs can post jobs.' },
  { to: '/admin/claims', label: 'Project claims', desc: 'Approve or reject company claims to verify projects.' },
  { to: '/admin/users', label: 'Users & companies', desc: 'View users and verify pending company profiles.' },
]

export default function AdminDashboardPage() {
  const { user } = useAuth()
  const [maintenanceMode, setMaintenanceMode] = useState(true)
  const [settingsLoading, setSettingsLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [settingsError, setSettingsError] = useState('')

  useEffect(() => {
    let cancelled = false

    getMaintenanceMode()
      .then((enabled) => {
        if (!cancelled) {
          setMaintenanceMode(enabled)
          setSettingsError('')
        }
      })
      .catch((error) => {
        if (!cancelled) setSettingsError(error.message)
      })
      .finally(() => {
        if (!cancelled) setSettingsLoading(false)
      })

    return () => {
      cancelled = true
    }
  }, [])

  async function handleMaintenanceModeChange(enabled) {
    setMaintenanceMode(enabled)
    setSaving(true)
    setSettingsError('')
    try {
      const savedValue = await updateMaintenanceMode(enabled)
      setMaintenanceMode(savedValue)
    } catch (error) {
      setMaintenanceMode(!enabled)
      setSettingsError(error.message)
    } finally {
      setSaving(false)
    }
  }

  if (!user) {
    return (
      <DashboardShell title="Admin" subtitle="Sign in required.">
        <div className="rounded-3xl border border-slate-800 bg-slate-900 p-6 text-slate-400">
          Please sign in with an admin account.
        </div>
      </DashboardShell>
    )
  }

  return (
    <DashboardShell
      title="Admin dashboard"
      subtitle="Moderate projects, users, and company verifications."
    >
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

      <section className="rounded-3xl border border-slate-800 bg-slate-900 p-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.16em] text-yellow-300">Site Settings</p>
            <h2 className="mt-2 text-xl font-semibold text-white">Pre-Launch Landing Page</h2>
            <p className="mt-1 text-sm text-slate-400">
              When enabled, public visitors see the waitlist landing page. Turn it off on launch day to reveal the full platform.
            </p>
          </div>
          <div className="flex items-center gap-3 rounded-2xl border border-slate-800 bg-slate-950 px-4 py-3">
            <span className={`text-sm font-semibold ${maintenanceMode ? 'text-yellow-300' : 'text-slate-300'}`}>
              {maintenanceMode ? 'ON' : 'OFF'}
            </span>
            <Switch
              checked={maintenanceMode}
              disabled={settingsLoading || saving}
              onCheckedChange={handleMaintenanceModeChange}
              aria-label="Toggle maintenance mode"
              className="data-[state=checked]:bg-yellow-400"
            />
          </div>
        </div>
        {settingsError && (
          <p className="mt-4 rounded-2xl border border-red-500/40 bg-red-500/10 p-3 text-sm text-red-200">
            {settingsError}
          </p>
        )}
        {!settingsError && (
          <p className="mt-4 text-sm text-slate-500">
            {saving ? 'Saving site setting...' : 'No redeploy is required. Changes apply on the next page load.'}
          </p>
        )}
      </section>
    </DashboardShell>
  )
}
