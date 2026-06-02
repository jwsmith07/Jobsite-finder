import { useMemo, useState } from 'react'
import {
  ArrowDown,
  ArrowRight,
  BriefcaseBusiness,
  Building2,
  CheckCircle2,
  CircleDollarSign,
  HardHat,
  Mail,
  MapPin,
  Users,
} from 'lucide-react'
import PageMeta from '../../components/ui/PageMeta'
import ProjectMap from '../../components/map/ProjectMap'
import { useProjects } from '../../hooks/useProjects'
import { PUBLIC_STAGE_OPTIONS, isPublicProjectVisible } from '../../lib/projectStages'
import { createWaitlistSignup } from '../../services/waitlistService'

const HERO_LOGO_SRC = '/JobsiteFinderHeroLogo.png'
const HOMEPAGE_MAP_CENTER = { lat: 54.8, lng: -113.6 }
const HOMEPAGE_MAP_PADDING = {
  top: 24,
  right: 24,
  bottom: 78,
  left: 150,
}

const roleOptions = [
  'Trades Worker',
  'Subcontractor',
  'General Contractor',
  'Industry Partner',
  'Investor',
]

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

function SectionHeader({ eyebrow, title, text }) {
  return (
    <div className="mx-auto max-w-3xl text-center">
      {eyebrow && <p className="text-sm font-bold uppercase tracking-[0.2em] text-amber-300">{eyebrow}</p>}
      <h2 className="mt-3 text-3xl font-black text-white sm:text-4xl">{title}</h2>
      {text && <p className="mt-4 text-lg text-slate-300">{text}</p>}
    </div>
  )
}

function PlatformPreview({ projects }) {
  return (
    <div className="rounded-3xl border border-slate-800 bg-slate-900 p-3 shadow-2xl">
      <div className="relative h-[460px] overflow-hidden rounded-2xl">
        <ProjectMap
          projects={projects}
          mappedCount={projects.length}
          initialCenter={HOMEPAGE_MAP_CENTER}
          initialZoom={5}
          mapPadding={HOMEPAGE_MAP_PADDING}
          interactive={false}
          showPopups={false}
        />
        <div
          className="absolute inset-0 z-[5] cursor-default bg-gradient-to-t from-slate-950/28 via-transparent to-slate-950/10"
          aria-hidden="true"
        />
        <div className="absolute bottom-3 left-3 z-10 rounded-xl border border-slate-700/60 bg-slate-950/80 px-3 py-2 backdrop-blur-sm">
          <p className="mb-1.5 text-[10px] font-semibold uppercase tracking-wider text-slate-400">Stage</p>
          <div className="flex flex-col gap-1">
            {PUBLIC_STAGE_OPTIONS.map(({ label, color }) => (
              <div key={label} className="flex items-center gap-1.5">
                <svg width="11" height="14" viewBox="0 0 28 36" aria-hidden="true">
                  <path
                    d="M14 1 C 6.8 1 1 6.8 1 14 C 1 23.5 14 35 14 35 C 14 35 27 23.5 27 14 C 27 6.8 21.2 1 14 1 Z"
                    fill={color}
                    stroke="#0f172a"
                    strokeWidth="1.5"
                  />
                  <circle cx="14" cy="14" r="4.5" fill="#0f172a" />
                </svg>
                <span className="text-[11px] text-slate-300">{label}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
      <p className="mt-3 text-center text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">
        Platform Preview
      </p>
    </div>
  )
}

export default function UnderConstructionPage() {
  const { projects } = useProjects()
  const [form, setForm] = useState({ name: '', email: '', role: 'Trades Worker', message: '' })
  const [status, setStatus] = useState({ type: '', message: '' })
  const [submitting, setSubmitting] = useState(false)
  const projectsWithCoords = useMemo(
    () =>
      projects
        .filter(isPublicProjectVisible)
        .filter(
          (p) =>
            Number.isFinite(Number(p.latitude)) &&
            Number.isFinite(Number(p.longitude)),
        ),
    [projects],
  )

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
        title="Jobsite Finder | Canada's Construction Workforce & Jobsite Platform"
        description="Jobsite Finder is a Canada-wide construction workforce platform connecting workers, contractors, industry partners, and investors through real jobsites."
      />

      <section className="relative overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_14%_12%,rgba(251,191,36,0.18),transparent_30%),radial-gradient(circle_at_86%_18%,rgba(148,163,184,0.14),transparent_24%),linear-gradient(135deg,#0f1216,#151a20_52%,#0f1216)]" />
        <div className="absolute inset-0 opacity-30 [background-image:repeating-linear-gradient(135deg,transparent_0,transparent_18px,rgba(251,191,36,0.12)_18px,rgba(251,191,36,0.12)_20px)]" aria-hidden="true" />

        <div className="relative mx-auto max-w-7xl px-4 pb-16 pt-6 sm:px-6 sm:pt-8 lg:px-8">
          <div className="mb-10 rounded-lg border border-slate-800/80 bg-slate-950/55 p-4 shadow-2xl shadow-black/25 backdrop-blur sm:p-6">
            <img
              src={HERO_LOGO_SRC}
              alt="Jobsite Finder"
              className="mx-auto h-auto w-full max-w-5xl object-contain"
            />
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
              Join our beta waitlist below to be among the first workers, subcontractors, and general contractors to access Jobsite Finder when we launch.
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

        <section className="border-y border-slate-800 bg-[#151a20] px-4 py-20 sm:px-6 lg:px-8">
          <div className="mx-auto grid max-w-7xl gap-10 lg:grid-cols-[0.9fr_1.1fr] lg:items-center">
            <div>
              <p className="text-sm font-bold uppercase tracking-[0.2em] text-amber-300">Platform Preview</p>
              <h2 className="mt-3 text-3xl font-black text-white sm:text-4xl">A modern workforce platform designed specifically for the construction industry.</h2>
              <p className="mt-5 text-lg text-slate-300">
                Preview the experience: an interactive Alberta map, jobsite pins, jobsite cards, and worker profiles built around real construction activity.
              </p>
            </div>
            <PlatformPreview projects={projectsWithCoords} />
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
            <a href="mailto:support@jobsitefinder.ca" className="inline-flex items-center justify-center gap-2 rounded-lg bg-amber-400 px-6 py-3 font-black text-slate-950 transition hover:bg-amber-300">
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
            <a href="mailto:support@jobsitefinder.ca" className="mt-3 inline-block font-semibold text-amber-300 hover:text-amber-200">
              support@jobsitefinder.ca
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
