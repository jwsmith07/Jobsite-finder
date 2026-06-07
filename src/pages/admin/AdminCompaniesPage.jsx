import { useEffect, useMemo, useState } from 'react'
import DashboardShell from '../../components/layout/DashboardShell'
import { getAllCompanyProfiles } from '../../services/adminService'

export default function AdminCompaniesPage() {
  const [companies, setCompanies] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    let mounted = true
    getAllCompanyProfiles()
      .then((rows) => { if (mounted) setCompanies(rows) })
      .catch((err) => { if (mounted) setError(err) })
      .finally(() => { if (mounted) setLoading(false) })
    return () => { mounted = false }
  }, [])

  const counts = useMemo(() => ({
    total: companies.length,
    verified: companies.filter((company) => company.verified).length,
    hidden: companies.filter((company) => company.is_hidden).length,
  }), [companies])

  return (
    <DashboardShell title="Companies" subtitle="Review company profiles and account ownership.">
      <div className="grid gap-3 sm:grid-cols-3">
        {Object.entries(counts).map(([label, value]) => (
          <div key={label} className="rounded-2xl border border-slate-800 bg-slate-900 p-4">
            <p className="text-xs uppercase tracking-[0.14em] text-slate-500">{label}</p>
            <p className="mt-1 text-2xl font-black text-white">{value}</p>
          </div>
        ))}
      </div>

      {loading && <p className="rounded-3xl border border-slate-800 bg-slate-900 p-6 text-sm text-slate-400">Loading companies...</p>}
      {error && <p className="rounded-3xl border border-red-900/60 bg-red-950/40 p-6 text-sm text-red-300">{error.message}</p>}
      {!loading && !error && (
        <div className="space-y-3">
          {companies.map((company) => (
            <article key={company.id} className="rounded-2xl border border-slate-800 bg-slate-900 p-5">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <h2 className="text-lg font-semibold text-white">{company.company_name || 'Unnamed company'}</h2>
                  <p className="mt-1 text-sm text-slate-400">{company.account_email || company.email || 'No email listed'}</p>
                </div>
                <span className="rounded-full border border-yellow-400/40 bg-yellow-400/10 px-3 py-1 text-xs font-bold text-yellow-200">
                  {company.company_type || 'company'}
                </span>
              </div>
              <p className="mt-3 text-sm text-slate-400">{company.description || company.service_area || 'No company description.'}</p>
            </article>
          ))}
          {companies.length === 0 && <p className="text-sm text-slate-400">No company profiles yet.</p>}
        </div>
      )}
    </DashboardShell>
  )
}
