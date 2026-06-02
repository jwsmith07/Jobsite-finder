import { Link } from 'react-router-dom'

function FeatureCard({ title, body }) {
  return (
    <div className="rounded-3xl border border-slate-800 bg-slate-900 p-6">
      <h3 className="text-lg font-bold text-white">{title}</h3>
      <p className="mt-2 text-sm leading-relaxed text-slate-400">{body}</p>
    </div>
  )
}

function FocusItem({ label }) {
  return (
    <li className="flex items-start gap-3 rounded-2xl border border-slate-800 bg-slate-950 px-4 py-3">
      <span className="mt-2 inline-block h-1.5 w-1.5 shrink-0 rounded-full bg-yellow-400" />
      <span className="text-sm text-slate-200">{label}</span>
    </li>
  )
}

export default function AboutPage() {
  return (
    <div className="space-y-10">
      <section className="rounded-3xl border border-slate-800 bg-slate-900 p-8 sm:p-10">
        <p className="inline-flex rounded-full border border-yellow-500/30 bg-yellow-500/10 px-3 py-1 text-xs font-semibold uppercase tracking-wider text-yellow-300">
          About
        </p>
        <h1 className="mt-4 text-3xl font-black text-white sm:text-4xl">
          About Jobsite Finder
        </h1>
        <p className="mt-4 max-w-3xl text-lg leading-relaxed text-slate-300">
          Jobsite Finder is a map-first platform built to help trades workers,
          Subcontractors, and General Contractors find where the work is
          happening.
        </p>
      </section>

      <section className="grid gap-6 md:grid-cols-2">
        <FeatureCard
          title="For Workers"
          body="Instead of searching through disconnected job posts, workers can explore real Alberta construction projects on a live map, view project details, and connect with opportunities tied to active jobsites."
        />
        <FeatureCard
          title="For Contractors"
          body="For contractors, Jobsite Finder creates a simple way to connect hiring needs to real project locations, helping companies reach workers who are looking for construction opportunities in their region."
        />
      </section>

      <section className="rounded-3xl border border-slate-800 bg-slate-900 p-8">
        <h2 className="text-2xl font-bold text-white">What V1 focuses on</h2>
        <p className="mt-2 max-w-3xl text-sm text-slate-400">
          Our first release lays a clean foundation for trades and contractors
          across Alberta.
        </p>
        <ul className="mt-6 grid gap-3 sm:grid-cols-2">
          <FocusItem label="Alberta large-scale projects" />
          <FocusItem label="Clean project data" />
          <FocusItem label="Map search" />
          <FocusItem label="Worker profiles" />
          <FocusItem label="Company profiles" />
          <FocusItem label="Foundation for project claiming and job posting" />
        </ul>
      </section>

      <section className="rounded-3xl border border-slate-800 bg-slate-900 p-8">
        <h2 className="text-2xl font-bold text-white">Our goal is simple</h2>
        <p className="mt-3 max-w-3xl text-base leading-relaxed text-slate-300">
          Make it easier for trades and contractors to find each other through
          the jobsites that already exist.
        </p>
      </section>

      <section className="rounded-3xl border border-yellow-500/40 bg-yellow-500/10 p-8 text-center">
        <p className="text-2xl font-black text-yellow-300 sm:text-3xl">
          Built for the Trades. Powered by Large-Scale Projects.
        </p>
        <div className="mt-6 flex flex-wrap justify-center gap-3">
          <Link
            to="/jobsites"
            className="rounded-2xl bg-yellow-400 px-6 py-3 font-bold text-black hover:bg-yellow-300"
          >
            Explore Jobsites Map
          </Link>
          <Link
            to="/signup"
            className="rounded-2xl border border-slate-700 bg-slate-950 px-6 py-3 font-semibold text-white hover:border-yellow-400/50"
          >
            Create Profile
          </Link>
        </div>
      </section>
    </div>
  )
}
