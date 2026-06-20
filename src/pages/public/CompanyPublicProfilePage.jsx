import { useEffect, useMemo, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { Building2, Globe, Mail, MapPin, Phone } from 'lucide-react'
import PageMeta from '../../components/ui/PageMeta'
import { breadcrumbSchema, canonicalUrl } from '../../lib/seo'
import { getPublicCompanyProfile } from '../../services/companiesService'

function normalizeCompanyType(type) {
  const value = String(type || '').toLowerCase()
  if (value === 'gc' || value === 'general_contractor') return 'General Contractor'
  if (value === 'sc' || value === 'subcontractor') return 'Subcontractor'
  return type || 'Construction Company'
}

function InfoItem({ icon: Icon, label, value, href }) {
  if (!value) return null
  const content = href ? (
    <a href={href} className="text-yellow-300 hover:text-yellow-200">{value}</a>
  ) : value
  return (
    <div className="flex gap-3 rounded-2xl border border-slate-800 bg-slate-950 p-4">
      <Icon className="mt-0.5 h-5 w-5 shrink-0 text-yellow-300" aria-hidden="true" />
      <div>
        <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">{label}</p>
        <p className="mt-1 text-sm text-slate-200">{content}</p>
      </div>
    </div>
  )
}

export default function CompanyPublicProfilePage() {
  const { id } = useParams()
  const [company, setCompany] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    let mounted = true
    setLoading(true)
    setError(null)
    getPublicCompanyProfile(id)
      .then((data) => { if (mounted) setCompany(data) })
      .catch((err) => { if (mounted) setError(err) })
      .finally(() => { if (mounted) setLoading(false) })
    return () => { mounted = false }
  }, [id])

  const meta = useMemo(() => {
    const name = company?.company_name || 'Construction Company'
    return {
      title: `${name} | Jobsite Finder`,
      description: `${name} is a verified ${normalizeCompanyType(company?.company_type).toLowerCase()} on Jobsite Finder.`,
      structuredData: company ? [
        breadcrumbSchema([
          { name: 'Home', path: '/' },
          { name: 'Companies', path: '/jobsites' },
          { name, path: `/companies/${company.id}` },
        ]),
        {
          '@context': 'https://schema.org',
          '@type': 'Organization',
          name,
          url: canonicalUrl(`/companies/${company.id}`),
          description: company.description || undefined,
          logo: company.logo_url || undefined,
          email: company.email || undefined,
          telephone: company.phone || undefined,
        },
      ] : null,
    }
  }, [company])

  if (loading) {
    return (
      <>
        <PageMeta title="Company | Jobsite Finder" description="Verified construction company profile on Jobsite Finder." path={`/companies/${id}`} />
        <div className="rounded-3xl border border-slate-800 bg-slate-900 p-6 text-slate-400">Loading company...</div>
      </>
    )
  }

  if (error) {
    return <div className="rounded-3xl border border-red-900/60 bg-red-950/40 p-6 text-red-300">{error.message}</div>
  }

  if (!company) {
    return (
      <div className="rounded-3xl border border-slate-800 bg-slate-900 p-6">
        <h1 className="text-2xl font-bold text-white">Company not found</h1>
        <p className="mt-2 text-slate-400">That company profile may not be public yet.</p>
        <Link to="/jobsites" className="mt-6 inline-block rounded-xl bg-yellow-400 px-4 py-2 font-bold text-black">
          Back to Jobsites Map
        </Link>
      </div>
    )
  }

  const website = company.website
  const websiteHref = website && /^https?:\/\//i.test(website) ? website : website ? `https://${website}` : ''

  return (
    <div className="space-y-6">
      <PageMeta
        title={meta.title}
        description={meta.description}
        path={`/companies/${company.id}`}
        image={company.logo_url || undefined}
        structuredData={meta.structuredData}
      />
      <section className="rounded-3xl border border-slate-800 bg-slate-900 p-8 sm:p-10">
        <div className="flex flex-col gap-5 sm:flex-row sm:items-center">
          {company.logo_url ? (
            <img src={company.logo_url} alt="" className="h-20 w-20 rounded-2xl object-cover" />
          ) : (
            <span className="flex h-20 w-20 items-center justify-center rounded-2xl border border-yellow-400/30 bg-yellow-400/10 text-yellow-300">
              <Building2 size={34} aria-hidden="true" />
            </span>
          )}
          <div>
            <p className="text-xs font-bold uppercase tracking-wide text-yellow-300">Verified Company</p>
            <h1 className="mt-2 text-3xl font-black text-white sm:text-4xl">{company.company_name}</h1>
            <p className="mt-2 text-slate-300">{normalizeCompanyType(company.company_type)}</p>
          </div>
        </div>
      </section>

      <section className="grid gap-4 md:grid-cols-2">
        <InfoItem icon={MapPin} label="Service Area" value={company.service_area} />
        <InfoItem icon={Building2} label="Trades / Services" value={company.trades_hired} />
        <InfoItem icon={Globe} label="Website" value={website} href={websiteHref} />
        <InfoItem icon={Mail} label="Email" value={company.email} href={company.email ? `mailto:${company.email}` : ''} />
        <InfoItem icon={Phone} label="Phone" value={company.phone} href={company.phone ? `tel:${company.phone}` : ''} />
      </section>

      {company.description && (
        <section className="rounded-3xl border border-slate-800 bg-slate-900 p-6">
          <h2 className="text-xl font-bold text-white">About</h2>
          <p className="mt-3 whitespace-pre-line leading-7 text-slate-300">{company.description}</p>
        </section>
      )}
    </div>
  )
}
