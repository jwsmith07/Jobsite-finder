import { Link } from 'react-router-dom'
import DashboardShell from '../../components/layout/DashboardShell'

const reportLinks = [
  { to: '/admin/projects', label: 'Project activity', text: 'Review project visibility, lifecycle, and public map readiness.' },
  { to: '/admin/users', label: 'User activity', text: 'Audit account roles and company verification status.' },
  { to: '/admin/claims', label: 'Claim activity', text: 'Track pending and reviewed jobsite claims.' },
  { to: '/admin/job-postings', label: 'Hiring activity', text: 'Monitor job posting volume and status.' },
]

export default function AdminReportsPage() {
  return (
    <DashboardShell title="Reports" subtitle="Operational snapshots for platform moderation.">
      <div className="grid gap-4 sm:grid-cols-2">
        {reportLinks.map((report) => (
          <Link key={report.to} to={report.to} className="rounded-3xl border border-slate-800 bg-slate-900 p-6 transition hover:border-yellow-400/50">
            <h2 className="text-lg font-semibold text-white">{report.label}</h2>
            <p className="mt-2 text-sm text-slate-400">{report.text}</p>
          </Link>
        ))}
      </div>
    </DashboardShell>
  )
}
