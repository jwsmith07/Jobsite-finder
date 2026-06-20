import { useState } from 'react'
import {
  ArrowDown,
  ArrowRight,
  BriefcaseBusiness,
  Building2,
  CheckCircle2,
  CircleDollarSign,
  ExternalLink,
  HardHat,
  Mail,
  MapPin,
  Users,
} from 'lucide-react'
import PageMeta from '../../components/ui/PageMeta'
import Logo from '../../components/common/Logo'
import { createWaitlistSignup } from '../../services/waitlistService'

const roleOptions = [
  'Trades Worker',
  'Subcontractor',
  'General Contractor',
  'Industry Partner',
  'Investor',
]

const constructionSurveyUrl = 'https://docs.google.com/forms/d/e/1FAIpQLSf_BG5toMR2Dd-GadmGHgzyix_meRQC7-f0FmGnRYOGvxyH8g/viewform'

const stats = [
  { icon: MapPin, title: 'Canada-Wide Platform', text: 'Built to connect construction activity across Canada.' },
  { icon: HardHat, title: 'Built for Trades Workers', text: 'Profiles, resumes, jobsites, and hiring opportunities.' },
  { icon: Building2, title: 'Built for Contractors', text: 'Create jobsites, post jobs, and manage applications.' },
  { icon: Users, title: 'Real Jobsites. Real Opportunities.', text: 'A map-first network focused on active construction work.' },
]

const workCards = [
  {
    icon: HardHat,
    title: 'For Workers',
    points: ['Create a profile', 'Upload your resume', 'Discover jobsites', 'Apply for opportunities', 'Connect with hiring contractors'],
  },
  {
    icon: Building2,
    title: 'For Contractors',
    points: ['Create jobsites', 'Manage project information', 'Post jobs', 'Review applications', 'Build your workforce'],
  },
  {
    icon: BriefcaseBusiness,
    title: 'For Industry',
    points: ['Promote services', 'Connect with projects', 'Reach construction companies', 'Build industry relationships'],
  },
]

const platformFeatures = [
  'Interactive Jobsite Map',
  'Active Construction Projects',
  'Company Profiles',
  'Project Claiming',
  'Hiring Opportunities',
  'Real-Time Project Updates',
]

const CANADA_MAP_CENTER = { lat: 57.2, lng: -96.5 }
const CANADA_MAP_PADDING = {
  top: 48,
  right: 28,
  bottom: 46,
  left: 28,
}
const CANADA_GOOGLE_PLACE_ID = 'ChIJ2WrMN9MDDUsRpY9Doiq3a00'

const previewCities = [
  { city: 'Vancouver', lat: 49.2827, lng: -123.1207, count: 165, spread: 0.95 },
  { city: 'Calgary', lat: 51.0447, lng: -114.0719, count: 190, spread: 0.82 },
  { city: 'Edmonton', lat: 53.5461, lng: -113.4938, count: 145, spread: 0.78 },
  { city: 'Saskatoon', lat: 52.1579, lng: -106.6702, count: 72, spread: 0.56 },
  { city: 'Regina', lat: 50.4452, lng: -104.6189, count: 58, spread: 0.52 },
  { city: 'Winnipeg', lat: 49.8951, lng: -97.1384, count: 118, spread: 0.72 },
  { city: 'Toronto', lat: 43.6532, lng: -79.3832, count: 285, spread: 1.05 },
  { city: 'Ottawa', lat: 45.4215, lng: -75.6972, count: 104, spread: 0.68 },
  { city: 'Montreal', lat: 45.5019, lng: -73.5674, count: 205, spread: 0.88 },
  { city: 'Quebec City', lat: 46.8139, lng: -71.2080, count: 76, spread: 0.58 },
  { city: 'Halifax', lat: 44.6488, lng: -63.5752, count: 84, spread: 0.55 },
  { city: 'St. John\'s', lat: 47.5615, lng: -52.7126, count: 46, spread: 0.45 },
  { city: 'Kelowna', lat: 49.8880, lng: -119.4960, count: 54, spread: 0.44 },
  { city: 'Victoria', lat: 48.4284, lng: -123.3656, count: 48, spread: 0.38 },
  { city: 'Hamilton', lat: 43.2555, lng: -79.8720, count: 88, spread: 0.44 },
  { city: 'Kitchener', lat: 43.4516, lng: -80.4925, count: 64, spread: 0.4 },
  { city: 'London', lat: 42.9849, lng: -81.2453, count: 56, spread: 0.38 },
  { city: 'Moncton', lat: 46.0878, lng: -64.7782, count: 42, spread: 0.36 },
  { city: 'Prince George', lat: 53.9171, lng: -122.7497, count: 74, spread: 0.72 },
  { city: 'Fort St. John', lat: 56.2524, lng: -120.8464, count: 58, spread: 0.76 },
  { city: 'Grande Prairie', lat: 55.1707, lng: -118.7884, count: 82, spread: 0.74 },
  { city: 'Fort McMurray', lat: 56.7267, lng: -111.3790, count: 96, spread: 0.86 },
  { city: 'Lloydminster', lat: 53.2772, lng: -110.0050, count: 46, spread: 0.5 },
  { city: 'Thompson', lat: 55.7435, lng: -97.8558, count: 54, spread: 0.82 },
  { city: 'Brandon', lat: 49.8485, lng: -99.9501, count: 44, spread: 0.44 },
  { city: 'Thunder Bay', lat: 48.3809, lng: -89.2477, count: 76, spread: 0.7 },
  { city: 'Sault Ste. Marie', lat: 46.5219, lng: -84.3461, count: 48, spread: 0.48 },
  { city: 'Sudbury', lat: 46.4917, lng: -80.9930, count: 68, spread: 0.58 },
  { city: 'North Bay', lat: 46.3091, lng: -79.4608, count: 42, spread: 0.42 },
  { city: 'Rouyn-Noranda', lat: 48.2399, lng: -79.0200, count: 44, spread: 0.56 },
  { city: 'Saguenay', lat: 48.4280, lng: -71.0685, count: 58, spread: 0.58 },
  { city: 'Sept-Iles', lat: 50.2133, lng: -66.3758, count: 46, spread: 0.62 },
  { city: 'Labrador City', lat: 52.9390, lng: -66.9114, count: 40, spread: 0.68 },
  { city: 'Goose Bay', lat: 53.3017, lng: -60.3261, count: 42, spread: 0.72 },
  { city: 'Whitehorse', lat: 60.7212, lng: -135.0568, count: 70, spread: 0.96 },
  { city: 'Yellowknife', lat: 62.4540, lng: -114.3718, count: 64, spread: 0.98 },
  { city: 'Iqaluit', lat: 63.7467, lng: -68.5170, count: 42, spread: 0.86 },
  { city: 'Inuvik', lat: 68.3607, lng: -133.7230, count: 30, spread: 0.72 },
  { city: 'Rankin Inlet', lat: 62.8091, lng: -92.0853, count: 34, spread: 0.78 },
  { city: 'Prince Rupert', lat: 54.3150, lng: -130.3208, count: 42, spread: 0.62 },
  { city: 'Nanaimo', lat: 49.1659, lng: -123.9401, count: 38, spread: 0.38 },
  { city: 'Charlottetown', lat: 46.2382, lng: -63.1311, count: 34, spread: 0.32 },
  { city: 'Fredericton', lat: 45.9636, lng: -66.6431, count: 38, spread: 0.38 },
]

const previewStages = ['Planning', 'Active Construction', 'Near Completion']
const previewProjects = previewCities.flatMap((city) =>
  Array.from({ length: city.count }, (_, index) => {
    const angle = index * 2.399963
    const distance = Math.sqrt((index % 89) / 89) * city.spread
    const latOffset = Math.sin(angle) * distance * 0.62
    const lngOffset = Math.cos(angle) * distance
    return {
      id: `preview-${city.city}-${index}`,
      project_name: `${city.city} Preview Jobsite ${index + 1}`,
      city: city.city,
      province: '',
      stage: previewStages[index % previewStages.length],
      source_type: index % 4 === 0 ? 'contractor_created' : 'public_project',
      _hasValidCoords: true,
      _lat: city.lat + latOffset,
      _lng: city.lng + lngOffset,
      _openRolesCount: index % 3 === 0 ? 3 : 0,
      _openJobs: index % 3 === 0 ? [{ title: 'Trades Workers', trade: 'General Construction' }] : [],
    }
  }),
)

function SectionHeader({ eyebrow, title, text }) {
  return (
    <div className="mx-auto max-w-3xl text-center">
      {eyebrow && <p className="text-sm font-bold uppercase tracking-[0.2em] text-amber-300">{eyebrow}</p>}
      <h2 className="mt-3 text-3xl font-black text-white sm:text-4xl">{title}</h2>
      {text && <p className="mt-4 text-lg text-slate-300">{text}</p>}
    </div>
  )
}

function PlatformPreview() {
  return (
    <div className="relative">
      <div className="pointer-events-none absolute inset-0 rounded-full bg-[radial-gradient(circle,rgba(245,180,0,0.12),transparent_62%)] blur-2xl" aria-hidden="true" />
      <img
        src="/assets/platform-preview-mockup.png"
        alt="Jobsite Finder desktop and mobile platform preview"
        className="relative z-10 h-auto w-full max-w-[900px] object-contain drop-shadow-2xl transition-all duration-500 animate-float hover:scale-[1.02]"
      />
    </div>
  )
}

export default function UnderConstructionPage() {
  const [form, setForm] = useState({ name: '', email: '', role: 'Trades Worker', message: '' })
  const [status, setStatus] = useState({ type: '', message: '' })
  const [submitting, setSubmitting] = useState(false)

  async function handleSubmit(event) {
    event.preventDefault()
    setSubmitting(true)
    setStatus({ type: '', message: '' })

    try {
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
        title="Jobsite Finder | Built for the Trades"
        description="Canada's construction workforce platform. Connect workers, subcontractors, and general contractors through real jobsites across Canada."
      />

      <section className="relative overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_14%_12%,rgba(251,191,36,0.18),transparent_30%),radial-gradient(circle_at_86%_18%,rgba(148,163,184,0.14),transparent_24%),linear-gradient(135deg,#0f1216,#151a20_52%,#0f1216)]" />
        <div className="absolute inset-0 opacity-30 [background-image:repeating-linear-gradient(135deg,transparent_0,transparent_18px,rgba(251,191,36,0.12)_18px,rgba(251,191,36,0.12)_20px)]" aria-hidden="true" />

        <div className="relative mx-auto max-w-7xl px-4 pb-16 pt-6 sm:px-6 sm:pt-8 lg:px-8">
          <div className="mb-10 rounded-lg border border-slate-800/80 bg-slate-950/55 p-4 shadow-2xl shadow-black/25 backdrop-blur sm:p-6">
            <Logo size="hero" imageClassName="mx-auto" />
          </div>
        </div>

        <div className="relative mx-auto max-w-5xl px-4 pb-20 text-center sm:px-6 lg:px-8">
          <div className="mx-auto mb-8 max-w-4xl rounded-lg border border-amber-300/45 bg-slate-950/80 px-5 py-6 shadow-2xl shadow-amber-950/20 backdrop-blur sm:px-8 sm:py-7">
            <p className="text-2xl font-black uppercase tracking-[0.18em] text-amber-300 drop-shadow sm:text-4xl">
              🚧 UNDER CONSTRUCTION 🚧
            </p>
            <p className="mx-auto mt-5 max-w-2xl text-lg font-bold text-white sm:text-xl">
              Jobsite Finder is currently under active development.
            </p>
            <p className="mx-auto mt-4 max-w-3xl text-base leading-7 text-slate-300 sm:text-lg">
              This page is a preview of the platform and features being built for our upcoming launch. The full website, interactive jobsite map, contractor dashboards, worker profiles, and hiring tools are coming soon.
            </p>
            <p className="mx-auto mt-4 max-w-3xl text-base leading-7 text-slate-300 sm:text-lg">
              Join our beta waitlist below to be among the first workers, subcontractors, and general contractors to access Jobsite Finder when we launch, and take our quick 25-question market research survey to help shape what we build.
            </p>
          </div>
          <p className="inline-flex rounded-lg border border-amber-300/40 bg-amber-300/10 px-4 py-2 text-sm font-bold uppercase tracking-[0.18em] text-amber-200">
            Built for the Trades. Powered by Real Jobsites.
          </p>
          <h1 className="mt-6 text-4xl font-black leading-tight text-white sm:text-6xl lg:text-7xl">
            Canada's Construction Workforce & Jobsite Platform
          </h1>
          <p className="mx-auto mt-6 max-w-3xl text-xl font-semibold text-slate-200">
            Connect with real jobsites, hiring contractors, and skilled trades workers across Canada.
          </p>
          <p className="mx-auto mt-4 max-w-3xl text-lg text-slate-300">
            Jobsite Finder is building a modern platform where contractors can create and manage jobsites while workers discover opportunities through an interactive map.
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

      <main id="learn-more">
        <section className="border-y border-slate-800 bg-slate-950 px-4 py-16 sm:px-6 lg:px-8">
          <div className="mx-auto grid max-w-7xl gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {stats.map(({ icon: Icon, title, text }) => (
              <div key={title} className="rounded-lg border border-slate-800 bg-slate-900 p-6">
                <Icon className="h-8 w-8 text-amber-300" aria-hidden="true" />
                <h2 className="mt-4 text-xl font-black text-white">{title}</h2>
                <p className="mt-2 text-sm text-slate-300">{text}</p>
              </div>
            ))}
          </div>
        </section>

        <section className="px-4 py-20 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-7xl">
            <SectionHeader title="How Jobsite Finder Works" text="One platform for the construction workforce, contractors, and industry relationships." />
            <div className="mt-12 grid gap-5 lg:grid-cols-3">
              {workCards.map(({ icon: Icon, title, points }) => (
                <div key={title} className="rounded-lg border border-slate-700 bg-slate-900 p-7">
                  <Icon className="h-10 w-10 text-amber-300" aria-hidden="true" />
                  <h3 className="mt-5 text-2xl font-black text-white">{title}</h3>
                  <ul className="mt-6 space-y-3">
                    {points.map((point) => (
                      <li key={point} className="flex gap-3 text-slate-200">
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

        <section className="border-y border-slate-800 bg-[#07101c] px-4 py-20 sm:px-6 lg:px-8">
          <div className="mx-auto grid max-w-7xl gap-10 lg:grid-cols-[0.9fr_1.1fr] lg:items-center">
            <div>
              <p className="text-sm font-bold uppercase tracking-[0.2em] text-amber-300">Platform Preview</p>
              <h2 className="mt-3 text-3xl font-black text-white sm:text-4xl">A Better Way to Find Construction Opportunities</h2>
              <p className="mt-5 text-lg leading-8 text-slate-300">
                Jobsite Finder helps workers, subcontractors, and general contractors connect through real active jobsites across Canada.
              </p>
              <div className="mt-8 grid gap-3 sm:grid-cols-2">
                {platformFeatures.map((feature) => (
                  <div key={feature} className="flex items-center gap-3 text-slate-100">
                    <CheckCircle2 className="h-5 w-5 shrink-0 text-amber-300" aria-hidden="true" />
                    <span className="font-semibold">{feature}</span>
                  </div>
                ))}
              </div>
            </div>
            <PlatformPreview />
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
                disabled={submitting}
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

        <section className="bg-slate-950 px-4 pb-8 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-7xl rounded-lg border border-slate-800 bg-slate-900 p-8 text-center shadow-2xl shadow-black/20">
            <div className="mx-auto flex w-fit items-center justify-center gap-2 text-amber-300" aria-hidden="true">
              <span className="h-2 w-2 rotate-45 bg-amber-300" />
              <span className="h-px w-12 bg-amber-300" />
              <span className="h-3 w-3 rotate-45 border-2 border-amber-300" />
              <span className="h-px w-12 bg-amber-300" />
              <span className="h-2 w-2 rotate-45 bg-amber-300" />
            </div>
            <h2 className="mt-5 text-3xl font-black text-white sm:text-4xl">Proudly Indigenous-Owned</h2>
            <p className="mx-auto mt-4 max-w-4xl text-lg text-slate-200">
              Jobsite Finder Technologies Inc. is an Indigenous-owned Canadian construction technology company building a workforce and jobsite discovery platform that connects workers, subcontractors, and general contractors through real active jobsites across Canada.
            </p>
            <p className="mt-5 text-base font-black uppercase tracking-[0.18em] text-amber-300 sm:text-lg">
              Built for the Trades. Powered by Real Jobsites.
            </p>
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
            <a href="mailto:joseph@jobsitefinder.ca" className="inline-flex items-center justify-center gap-2 rounded-lg bg-amber-400 px-6 py-3 font-black text-slate-950 transition hover:bg-amber-300">
              Contact Us
              <Mail className="h-5 w-5" aria-hidden="true" />
            </a>
          </div>
        </section>
      </main>

      <footer className="bg-[#0b0e12] px-4 py-10 sm:px-6 lg:px-8">
        <div className="mx-auto flex max-w-7xl flex-col gap-5 text-sm text-slate-400 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="font-bold text-white">Jobsite Finder Technologies Inc.</p>
            <p className="mt-2">Built for the Trades. Powered by Real Jobsites.</p>
            <a href="mailto:joseph@jobsitefinder.ca" className="mt-3 inline-block font-semibold text-amber-300 hover:text-amber-200">
              joseph@jobsitefinder.ca
            </a>
            <p className="mt-4">Copyright © 2026 Jobsite Finder Technologies Inc.</p>
            <p>All Rights Reserved.</p>
          </div>
          <a href="/admin" className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500 transition hover:text-amber-300">
            Admin Login
          </a>
        </div>
      </footer>
    </div>
  )
}
