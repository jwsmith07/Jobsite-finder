import { useEffect, useRef, useState } from 'react'
import {
  ArrowDown,
  ArrowRight,
  Building2,
  CheckCircle2,
  CircleDollarSign,
  ExternalLink,
  HardHat,
  Mail,
  Users,
} from 'lucide-react'
import PageMeta from '../../components/ui/PageMeta'
import Logo from '../../components/common/Logo'
import { organizationSchema, staticRouteMeta, websiteSchema } from '../../lib/seo'

const pageMeta = staticRouteMeta['/under-construction']
const pageStructuredData = [organizationSchema(), websiteSchema()]

const roleOptions = [
  'Trades Worker',
  'Subcontractor',
  'General Contractor',
  'Industry Partner',
  'Investor',
]

const constructionSurveyUrl = 'https://docs.google.com/forms/d/e/1FAIpQLSf_BG5toMR2Dd-GadmGHgzyix_meRQC7-f0FmGnRYOGvxyH8g/viewform'
const jobsiteExplainerUrl = 'https://scrimba.com/explain/guide0o93ighc7'
const contactEmail = 'info@jobsitefinder.ca'

const stats = [
  { icon: HardHat, title: 'For workers', text: 'Planned profiles, jobsite discovery, job postings, and applications for trades roles.' },
  { icon: Building2, title: 'For contractors', text: 'Planned company profiles, job postings, and tools to review applications.' },
  { icon: Users, title: 'For projects', text: 'A planned Canada-wide map to help people discover active construction jobsites.' },
]

const workCards = [
  {
    icon: HardHat,
    title: 'Planned tools for workers',
    points: ['Build a worker profile', 'Share trade experience and a resume', 'Discover active construction projects', 'Apply to job postings', 'Connect with hiring contractors'],
  },
  {
    icon: Building2,
    title: 'Planned tools for contractors',
    points: ['Create a company profile', 'Share construction job openings', 'Review applications', 'Find workers for project roles'],
  },
]

function SectionHeader({ eyebrow, title, text }) {
  return (
    <div className="mx-auto max-w-3xl text-center">
      {eyebrow && <p className="text-sm font-bold uppercase tracking-[0.2em] text-amber-300">{eyebrow}</p>}
      <h2 className="mt-3 text-3xl font-black text-white sm:text-4xl">{title}</h2>
      {text && <p className="mt-4 text-lg text-slate-300">{text}</p>}
    </div>
  )
}

function ExplainerEmbed() {
  const frame = useRef(null)
  const container = useRef(null)
  const [status, setStatus] = useState('loading')
  const [attempt, setAttempt] = useState(0)

  useEffect(() => {
    // A frame load can fire for error pages; require the observed player message.
    let timeout
    let settled = false
    const observer = new IntersectionObserver(entries => {
      if (!settled && entries.some(entry => entry.isIntersecting)) {
        observer.disconnect()
        timeout = window.setTimeout(() => { settled = true; setStatus('fallback') }, 10000)
      }
    })
    observer.observe(container.current)
    function ready(event) {
      if (event.origin !== 'https://scrimba.com' || !frame.current || event.source !== frame.current.contentWindow || event.data?.type !== 'scrimba:embed-watching') return
      settled = true
      observer.disconnect()
      window.clearTimeout(timeout)
      setStatus('ready')
    }
    window.addEventListener('message', ready)
    return () => {
      observer.disconnect()
      window.clearTimeout(timeout)
      window.removeEventListener('message', ready)
    }
  }, [attempt])

  return (
    <div ref={container} data-explainer-state={status} className="relative mx-auto mt-10 aspect-video w-full max-w-[800px] overflow-hidden rounded-lg border border-amber-300/35 bg-[#0f1216] shadow-2xl shadow-black/20">
      {status !== 'ready' && (
        <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 bg-gradient-to-br from-slate-950 to-amber-950/30 px-4 text-center sm:gap-4 sm:px-8">
          <p className="text-base font-black text-amber-200 sm:text-2xl">Jobsite Finder explainer</p>
          <p className="max-w-md text-base leading-6 text-slate-200">Learn about our planned project-first platform.</p>
          <div className="flex items-center justify-center gap-3">
            <a href={jobsiteExplainerUrl} target="_blank" rel="noreferrer" className="inline-flex min-h-11 items-center rounded-lg bg-amber-400 px-4 text-sm font-bold text-slate-950 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-amber-300">Open explainer <ExternalLink className="ml-2 h-4 w-4" aria-hidden="true" /></a>
            {status === 'fallback' && <button type="button" onClick={() => { setStatus('loading'); setAttempt(value => value + 1) }} className="min-h-11 rounded-lg px-3 text-sm font-bold text-amber-200 underline underline-offset-4 focus-visible:outline focus-visible:outline-2 focus-visible:outline-amber-300">Retry</button>}
          </div>
        </div>
      )}
      {status !== 'fallback' && <iframe
        key={attempt}
        ref={frame}
        src={jobsiteExplainerUrl}
        title="Jobsite Finder platform concept explainer"
        width="800"
        height="450"
        allow="autoplay; fullscreen"
        allowFullScreen
        onError={() => setStatus('fallback')}
        aria-hidden={status !== 'ready'}
        tabIndex={status === 'ready' ? 0 : -1}
        style={{ border: 0 }}
        className={'absolute inset-0 h-full w-full bg-[#0f1216] ' + (status === 'ready' ? 'opacity-100' : 'pointer-events-none opacity-0')}
      />}
    </div>
  )
}

export default function UnderConstructionPage({ staticPreview = false } = {}) {
  const [form, setForm] = useState({ name: '', email: '', role: 'Trades Worker', message: '' })
  const [status, setStatus] = useState({ type: '', message: '' })
  const [submitting, setSubmitting] = useState(false)
  async function handleSubmit(event) {
    event.preventDefault()
    setSubmitting(true)
    setStatus({ type: '', message: '' })

    try {
      // Keep build-time rendering independent of backend clients and credentials.
      const { createWaitlistSignup } = await import('../../services/waitlistService')
      const result = await createWaitlistSignup(form)
      setForm({ name: '', email: '', role: 'Trades Worker', message: '' })
      setStatus({
        type: 'success',
        message: result.duplicate
          ? 'That email is already on the waitlist. We will be in touch as Jobsite Finder gets closer to launch.'
          : 'You are on the waitlist. We will be in touch as Jobsite Finder gets closer to launch.',
      })
    } catch (error) {
      setStatus({
        type: 'error',
        message: error.message || 'Something went wrong. Please try again.',
      })
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="min-h-screen bg-[#0f1216] text-white">
      <PageMeta
        title={pageMeta.title}
        description={pageMeta.description}
          path="/under-construction"
        structuredData={pageStructuredData}
      />

      <main id="learn-more">
      <section className="relative overflow-hidden" aria-labelledby="landing-heading">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_14%_12%,rgba(251,191,36,0.18),transparent_30%),radial-gradient(circle_at_86%_18%,rgba(148,163,184,0.14),transparent_24%),linear-gradient(135deg,#0f1216,#151a20_52%,#0f1216)]" />
        <div className="absolute inset-0 opacity-30 [background-image:repeating-linear-gradient(135deg,transparent_0,transparent_18px,rgba(251,191,36,0.12)_18px,rgba(251,191,36,0.12)_20px)]" aria-hidden="true" />

        <div className="relative mx-auto max-w-7xl px-4 pb-16 pt-6 sm:px-6 sm:pt-8 lg:px-8">
          <div className="mb-10 rounded-lg border border-slate-800/80 bg-slate-950/55 p-4 shadow-2xl shadow-black/25 backdrop-blur sm:p-6">
            <Logo
              size="hero"
              imageClassName="mx-auto"
              width={1747}
              height={519}
              fetchPriority="high"
            />
          </div>
        </div>

        <div className="relative mx-auto max-w-5xl px-4 pb-20 text-center sm:px-6 lg:px-8">
          <div className="mx-auto mb-8 max-w-4xl rounded-lg border border-amber-300/45 bg-slate-950/80 px-5 py-6 shadow-2xl shadow-amber-950/20 backdrop-blur sm:px-8 sm:py-7">
            <p className="text-sm font-black uppercase tracking-[0.18em] text-amber-300 drop-shadow sm:text-base">
              In development
            </p>
            <p className="mx-auto mt-5 max-w-2xl text-lg font-bold text-white sm:text-xl">
              Jobsite Finder is preparing a closed beta for Canadian construction workers, general contractors and subcontractors.
            </p>
            <p className="mx-auto mt-4 max-w-3xl text-base leading-7 text-slate-300 sm:text-lg">
              Job postings, applications, and jobsite discovery are planned features and are not currently available for public use. Join the waitlist for launch updates.
            </p>
          </div>
          <p className="inline-flex rounded-lg border border-amber-300/40 bg-amber-300/10 px-4 py-2 text-sm font-bold uppercase tracking-[0.18em] text-amber-200">
            Built for the Trades. Powered by Real Jobsites.
          </p>
          <h1 id="landing-heading" className="mt-6 text-4xl font-black leading-tight text-white sm:text-6xl lg:text-7xl">
            Find Construction Jobs. Connect With Real Jobsites.
          </h1>
          <p className="mx-auto mt-6 max-w-3xl text-xl font-semibold leading-8 text-slate-200">
            Explore construction projects and discover opportunities across Canada—from labourers and skilled tradespeople to supervisors and project managers.
          </p>
          <p className="mx-auto mt-4 max-w-3xl text-lg leading-7 text-slate-300">
            The planned platform will connect workers with active construction projects and jobsites, and help general contractors and subcontractors share openings and find people for their projects.
          </p>
          <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
            <a
              href={constructionSurveyUrl}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center justify-center gap-2 rounded-lg bg-amber-400 px-6 py-3 text-sm font-black text-slate-950 shadow-lg shadow-amber-400/20 transition hover:bg-amber-300 sm:text-base"
            >
              Take the Survey
              <ExternalLink className="h-5 w-5" aria-hidden="true" />
            </a>
            <a href="#waitlist" className="inline-flex items-center justify-center gap-2 rounded-lg bg-amber-400 px-6 py-3 text-sm font-black text-slate-950 shadow-lg shadow-amber-400/20 transition hover:bg-amber-300 sm:text-base">
              Join the Waitlist
              <ArrowRight className="h-5 w-5" aria-hidden="true" />
            </a>
            <a href="#learn-more" className="inline-flex items-center justify-center gap-2 rounded-lg border border-slate-600 bg-slate-950/30 px-6 py-3 text-sm font-bold text-white transition hover:border-amber-300 hover:text-amber-200 sm:text-base">
              Learn More
              <ArrowDown className="h-5 w-5" aria-hidden="true" />
            </a>
          </div>
        </div>
      </section>

        <section aria-labelledby="planned-overview-heading" className="border-y border-slate-800 bg-slate-950 px-4 py-16 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-7xl">
            <h2 id="planned-overview-heading" className="mb-6 text-center text-2xl font-black text-white sm:text-3xl">
              A Canada-wide construction platform in development
            </h2>
            <p className="mx-auto mb-8 max-w-3xl text-center leading-7 text-slate-300">
              Planned features are being designed for workers, general contractors, subcontractors, and projects. They are not yet available for public signup or use.
            </p>
          </div>
          <div className="mx-auto grid max-w-7xl gap-4 sm:grid-cols-3">
            {stats.map(({ icon: Icon, title, text }) => (
              <div key={title} className="rounded-lg border border-slate-800 bg-slate-900 p-6">
                <Icon className="h-8 w-8 text-amber-300" aria-hidden="true" />
                <h3 className="mt-4 text-xl font-black text-white">{title}</h3>
                <p className="mt-2 text-base leading-7 text-slate-300 sm:text-sm sm:leading-6">{text}</p>
              </div>
            ))}
          </div>
        </section>

        <section className="px-4 py-20 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-7xl">
            <SectionHeader title="Construction jobs and hiring, organized around jobsites" text="Jobsite Finder is being built to connect construction workers with opportunities and help general contractors and subcontractors find people for their projects. These tools are planned and are not yet live." />
            <ExplainerEmbed />
            <div className="mt-12 grid gap-5 lg:grid-cols-2">
              {workCards.map(({ icon: Icon, title, points }) => (
                <div key={title} className="rounded-lg border border-slate-700 bg-slate-900 p-7">
                  <Icon className="h-10 w-10 text-amber-300" aria-hidden="true" />
                  <h3 className="mt-5 text-2xl font-black text-white">{title}</h3>
                  <p className="mt-3 text-base leading-7 text-slate-300 sm:text-sm sm:leading-6">These features are planned and are not yet available for public use.</p>
                  <ul className="mt-6 space-y-3">
                    {points.map((point) => (
                      <li key={point} className="flex gap-3 leading-7 text-slate-200">
                        <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-amber-300" aria-hidden="true" />
                        <span>{point}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section id="pricing" aria-labelledby="pricing-heading" className="border-b border-slate-800 px-4 py-20 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-5xl">
            <div className="mx-auto max-w-3xl text-center">
              <h2 id="pricing-heading" className="text-3xl font-black text-white sm:text-4xl">Simple pricing</h2>
            </div>

            <div className="mt-10 rounded-lg border border-amber-300/35 bg-amber-300/10 p-6 shadow-2xl shadow-black/20 sm:p-8">
              <h3 className="text-2xl font-black text-white sm:text-3xl">Trades Workers</h3>
              <p className="mt-4 text-3xl font-black text-amber-300 sm:text-4xl">Always free</p>
              <p className="mt-6 text-lg text-slate-200">Planned worker features will be free to:</p>
              <ul className="mt-6 grid gap-3 sm:grid-cols-2">
                {[
                  'Discover active jobsites',
                  'Browse construction jobs',
                  'Create a worker profile',
                  'Share trade experience and a resume',
                  'Apply for jobs',
                  'Connect with opportunities across Canada',
                ].map((point) => (
                  <li key={point} className="flex gap-3 leading-7 text-slate-200">
                    <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-amber-300" aria-hidden="true" />
                    <span>{point}</span>
                  </li>
                ))}
              </ul>
              <p className="mt-8 border-t border-amber-300/20 pt-6 text-lg font-bold text-white">
                Workers never pay to search for work or apply for jobs.
              </p>
            </div>

            <div className="mt-8 rounded-lg border border-slate-700 bg-slate-900 p-6 shadow-2xl shadow-black/20 sm:p-8">
              <h3 className="text-2xl font-black text-white sm:text-3xl">General &amp; Sub Contractors</h3>
              <p className="mt-4 text-3xl font-black text-amber-300 sm:text-4xl">30-day free trial</p>
              <p className="mt-6 text-lg leading-8 text-slate-300">
                Company profiles will be free. The 30-day trial starts when your company first activates hiring tools on its first jobsite.
              </p>
              <div className="mt-8 grid gap-8 md:grid-cols-2">
                <div>
                  <p className="text-2xl font-black text-white sm:text-3xl">$99 CAD per active jobsite per month, for your company</p>
                  <ul className="mt-6 space-y-3">
                    {[
                      'Unlimited job postings',
                      'Unlimited applications',
                      'Unlimited hires',
                      'No per-posting, per-application, or per-hire fees',
                    ].map((point) => (
                      <li key={point} className="flex gap-3 leading-7 text-slate-200">
                        <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-amber-300" aria-hidden="true" />
                        <span>{point}</span>
                      </li>
                    ))}
                  </ul>
                </div>
                <div className="rounded-lg border border-amber-300/35 bg-amber-300/10 p-5 sm:p-6">
                  <h4 className="text-sm font-bold uppercase tracking-[0.18em] text-amber-200">Per-company hiring tools</h4>
                  <p className="mt-3 text-2xl font-black text-white">Each contractor company pays for its own active jobsite plan.</p>
                </div>
              </div>

              <p className="mt-8 border-t border-slate-700 pt-6 text-base leading-7 text-slate-300">
                After the 30-day trial, the company profile remains free. Hiring tools require an active paid jobsite plan.
              </p>
              <p className="mt-6 text-base leading-7 text-slate-300 sm:text-sm sm:leading-6">
                Pricing preview for launch. Payment is not yet available. Signing up does not activate a trial or collect payment. Public signup is unavailable while the site is under construction.
              </p>
            </div>
          </div>
        </section>

        <section id="waitlist" className="px-4 py-20 sm:px-6 lg:px-8">
          <div className="mx-auto grid max-w-6xl gap-8 lg:grid-cols-[0.82fr_1.18fr] lg:items-start">
            <div>
              <p className="text-sm font-bold uppercase tracking-[0.2em] text-amber-300">Join the Waitlist</p>
              <h2 className="mt-3 text-3xl font-black text-white sm:text-4xl">Be among the first to access Jobsite Finder when we launch.</h2>
              <p className="mt-5 text-lg text-slate-300">
                Workers, subcontractors, general contractors, industry partners, and investors can join the list for launch updates.
              </p>
            </div>

            <form onSubmit={handleSubmit} className="rounded-lg border border-slate-700 bg-slate-900 p-6 shadow-2xl shadow-black/20">
              <div className="grid gap-4 sm:grid-cols-2">
                <label className="block">
                  <span className="text-sm font-semibold text-slate-200">Name</span>
                  <input
                    type="text"
                    value={form.name}
                    onChange={(event) => setForm((current) => ({ ...current, name: event.target.value }))}
                    required
                    className="mt-2 w-full"
                    placeholder="Your name"
                  />
                </label>
                <label className="block">
                  <span className="text-sm font-semibold text-slate-200">Email</span>
                  <input
                    type="email"
                    value={form.email}
                    onChange={(event) => setForm((current) => ({ ...current, email: event.target.value }))}
                    required
                    className="mt-2 w-full"
                    placeholder="you@example.com"
                  />
                </label>
              </div>
              <label className="mt-4 block">
                <span className="text-sm font-semibold text-slate-200">I am a:</span>
                <select
                  value={form.role}
                  onChange={(event) => setForm((current) => ({ ...current, role: event.target.value }))}
                  className="mt-2 w-full"
                >
                  {roleOptions.map((option) => (
                    <option key={option} value={option}>{option}</option>
                  ))}
                </select>
              </label>
              <label className="mt-4 block">
                <span className="text-sm font-semibold text-slate-200">Message</span>
                <textarea
                  value={form.message}
                  onChange={(event) => setForm((current) => ({ ...current, message: event.target.value }))}
                  className="mt-2 w-full"
                  placeholder="Optional"
                  rows={3}
                />
              </label>
              <button
                type="submit"
                disabled={staticPreview || submitting}
                className="mt-6 inline-flex w-full items-center justify-center gap-2 rounded-lg bg-amber-400 px-6 py-3 font-black text-slate-950 transition hover:bg-amber-300 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {submitting ? 'Joining...' : 'Join Waitlist'}
                <ArrowRight className="h-5 w-5" aria-hidden="true" />
              </button>
              {status.message && (
                <p className={`mt-4 rounded-lg border p-3 text-sm ${status.type === 'success' ? 'border-emerald-400/40 bg-emerald-400/10 text-emerald-100' : 'border-red-400/40 bg-red-400/10 text-red-100'}`}>
                  {status.message}
                </p>
              )}
            </form>

            <div className="rounded-lg border border-amber-300/35 bg-amber-300/10 p-5 lg:col-span-2">
              <p className="text-sm font-bold uppercase tracking-[0.18em] text-amber-200">Market Research Survey</p>
              <h3 className="mt-3 text-2xl font-black text-white">25 quick questions. Just a few minutes.</h3>
              <p className="mt-3 max-w-4xl text-base leading-7 text-slate-200">
                Tell us what would actually help you find work, workers, or projects. Your answers will help shape Jobsite Finder before launch, including the tools we build first for workers, subcontractors, and contractors.
              </p>
              <a
                href={constructionSurveyUrl}
                target="_blank"
                rel="noreferrer"
                className="mt-4 inline-flex w-full items-center justify-center gap-2 rounded-lg bg-amber-400 px-5 py-3 text-sm font-black text-slate-950 shadow-lg shadow-amber-400/15 transition hover:bg-amber-300 sm:w-auto"
              >
                Take the Survey
                <ExternalLink className="h-4 w-4" aria-hidden="true" />
              </a>
            </div>
          </div>
        </section>

        <section className="border-t border-slate-800 bg-[#07101c] px-4 py-16 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-7xl text-center">
            <div className="mx-auto max-w-5xl rounded-lg border border-amber-300/30 bg-amber-300/10 px-6 py-10 shadow-2xl shadow-amber-950/10 sm:px-10">
              <p className="text-sm font-bold uppercase tracking-[0.2em] text-amber-300">Mission Statement</p>
              <h2 className="mt-4 text-3xl font-black text-white sm:text-4xl">Let's Build Canada Together</h2>
              <p className="mx-auto mt-5 max-w-4xl text-lg leading-8 text-slate-100 sm:text-xl">
                We encourage teamwork, collaboration, and partnership across Canada as we work together to strengthen the construction industry, connect workers and contractors, and create opportunities from coast to coast.
              </p>
            </div>
          </div>
        </section>

        <section className="border-y border-amber-300/20 bg-slate-950 px-4 py-16 sm:px-6 lg:px-8">
          <div className="mx-auto flex max-w-7xl flex-col gap-6 rounded-lg border border-slate-800 bg-slate-900 p-8 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <div className="flex items-center gap-3 text-amber-300">
                <CircleDollarSign className="h-7 w-7" aria-hidden="true" />
                <h2 className="text-3xl font-black text-white">Interested in Partnering?</h2>
              </div>
              <p className="mt-4 max-w-3xl text-lg text-slate-300">
                We are currently exploring partnerships, industry collaborations, and investment opportunities across Canada.
              </p>
            </div>
            <a href={`mailto:${contactEmail}`} className="inline-flex items-center justify-center gap-2 rounded-lg bg-amber-400 px-6 py-3 font-black text-slate-950 transition hover:bg-amber-300">
              Contact Us
              <Mail className="h-5 w-5" aria-hidden="true" />
            </a>
          </div>
        </section>

        <section className="bg-slate-950 px-4 pb-10 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-7xl border-t border-slate-800 pt-6 text-center">
            <p className="text-sm leading-6 font-semibold uppercase tracking-[0.16em] text-slate-400">Land Acknowledgement</p>
            <p className="mx-auto mt-2 max-w-5xl text-base leading-7 text-slate-300 sm:text-sm sm:leading-6">
              Jobsite Finder Technologies Inc. respectfully acknowledges the traditional territories of Indigenous Peoples across Canada. We honour the enduring relationships Indigenous Nations have with these lands and recognize their contributions to our communities.
            </p>
          </div>
        </section>
      </main>

      <footer className="bg-[#0b0e12] px-4 py-10 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-7xl text-base leading-7 text-slate-300 sm:text-sm">
          <div className="flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="font-bold text-white">Jobsite Finder Technologies Inc.</p>
              <p className="mt-2">Built for the Trades. Powered by Real Jobsites.</p>
              <a href={`mailto:${contactEmail}`} className="mt-4 inline-flex items-center gap-2 text-amber-300 underline underline-offset-4 transition hover:text-amber-200">
                <Mail className="h-4 w-4" aria-hidden="true" />
                {contactEmail}
              </a>
              <nav aria-label="Legal and contact" className="mt-4 flex flex-wrap gap-x-5 gap-y-3">
                {[['/privacy', 'Privacy'], ['/terms', 'Terms'], ['/contact', 'Contact']].map(([href, label]) => (
                  <a key={href} href={href} className="rounded text-amber-300 underline underline-offset-4 transition hover:text-amber-200 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-amber-300">
                    {label}
                  </a>
                ))}
              </nav>
              <p className="mt-4">Copyright &copy; 2026 Jobsite Finder Technologies Inc.</p>
              <p>All Rights Reserved.</p>
            </div>
            <a href="/admin" className="text-sm leading-6 font-semibold uppercase tracking-[0.16em] text-slate-400 transition hover:text-amber-300">
              Admin Login
            </a>
          </div>
        </div>
      </footer>

    </div>
  )
}
