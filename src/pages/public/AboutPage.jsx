import { Link } from 'react-router-dom'

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
          Jobsite Finder Technologies Inc. is an Indigenous-owned Canadian construction technology company building a workforce and jobsite discovery platform that connects workers, subcontractors, and general contractors through real active jobsites across Canada.
        </p>
      </section>

      <section className="rounded-3xl border border-slate-800 bg-slate-900 p-8">
        <h2 className="text-2xl font-bold text-white">Built by Trades. Built for the Trades.</h2>
        <p className="mt-4 text-base leading-relaxed text-slate-300">
          After spending more than a decade working in commercial construction, I saw the same problems over and over again:
        </p>
        <ul className="mt-6 space-y-3 text-sm text-slate-200">
          <li className="flex gap-3"><span className="text-yellow-400">•</span> Skilled workers struggling to find active projects</li>
          <li className="flex gap-3"><span className="text-yellow-400">•</span> Contractors searching for qualified workers</li>
          <li className="flex gap-3"><span className="text-yellow-400">•</span> Subcontractors looking for opportunities to grow</li>
          <li className="flex gap-3"><span className="text-yellow-400">•</span> Projects hiring without an easy way to connect to the people who need the work</li>
        </ul>
        <p className="mt-6 text-sm leading-relaxed text-slate-400">
          The construction industry is one of Canada's largest industries, yet many hiring and workforce connections still rely on word-of-mouth, social media posts, classified ads, and outdated job boards.
        </p>
        <p className="mt-4 text-sm leading-relaxed text-slate-300">
          We believe there is a better way.
        </p>
      </section>

      <section className="rounded-3xl border border-slate-800 bg-slate-900 p-8">
        <h2 className="text-2xl font-bold text-white">Our Mission</h2>
        <p className="mt-4 max-w-3xl text-base leading-relaxed text-slate-300">
          To simplify how Canada's construction workforce connects to real jobsites, real projects, and real opportunities.
        </p>

        <div className="mt-6 grid gap-4 sm:grid-cols-3">
          <div className="rounded-3xl border border-slate-800 bg-slate-950 p-5">
            <h3 className="text-lg font-semibold text-white">Workers</h3>
            <ul className="mt-3 space-y-2 text-sm text-slate-300">
              <li>Discover active construction projects</li>
              <li>Build professional trade profiles</li>
              <li>Upload resumes and certifications</li>
              <li>Connect directly with hiring contractors</li>
              <li>Find opportunities closer to home</li>
            </ul>
          </div>
          <div className="rounded-3xl border border-slate-800 bg-slate-950 p-5">
            <h3 className="text-lg font-semibold text-white">Subcontractors</h3>
            <ul className="mt-3 space-y-2 text-sm text-slate-300">
              <li>Increase visibility</li>
              <li>Showcase company capabilities</li>
              <li>Connect with general contractors</li>
              <li>Recruit workers</li>
              <li>Grow their business</li>
            </ul>
          </div>
          <div className="rounded-3xl border border-slate-800 bg-slate-950 p-5">
            <h3 className="text-lg font-semibold text-white">General Contractors</h3>
            <ul className="mt-3 space-y-2 text-sm text-slate-300">
              <li>Create and manage jobsites</li>
              <li>Promote hiring opportunities</li>
              <li>Connect with qualified subcontractors</li>
              <li>Build stronger project teams</li>
              <li>Improve workforce visibility</li>
            </ul>
          </div>
        </div>
      </section>

      <section className="rounded-3xl border border-slate-800 bg-slate-900 p-8">
        <h2 className="text-2xl font-bold text-white">Why We Are Different</h2>
        <p className="mt-4 max-w-3xl text-sm leading-relaxed text-slate-300">
          Most job boards focus only on job postings. Jobsite Finder focuses on the actual jobsite.
        </p>
        <p className="mt-4 max-w-3xl text-sm leading-relaxed text-slate-300">
          Instead of simply searching for jobs, workers and contractors can discover active projects, see where work is happening, and connect directly through the construction ecosystem surrounding each project.
        </p>
        <p className="mt-4 max-w-3xl text-sm leading-relaxed text-slate-300">
          Our platform is designed around real jobsites, real companies, and real workforce needs.
        </p>
      </section>

      <section className="rounded-3xl border border-slate-800 bg-slate-900 p-8">
        <h2 className="text-2xl font-bold text-white">Built in Canada</h2>
        <p className="mt-4 max-w-3xl text-sm leading-relaxed text-slate-300">
          Jobsite Finder is proudly Canadian and built with the goal of supporting construction projects and workforce development across the country.
        </p>
        <p className="mt-4 max-w-3xl text-sm leading-relaxed text-slate-300">
          We are starting with major project visibility and expanding toward a national platform where workers, subcontractors, and contractors can connect more efficiently than ever before.
        </p>
      </section>

      <section className="rounded-3xl border border-slate-800 bg-slate-900 p-8">
        <h2 className="text-2xl font-bold text-white">Indigenous-Owned</h2>
        <p className="mt-4 max-w-3xl text-sm leading-relaxed text-slate-300">
          Jobsite Finder Technologies Inc. is proudly Indigenous-owned.
        </p>
        <p className="mt-4 max-w-3xl text-sm leading-relaxed text-slate-300">
          As a Canadian technology company, we believe innovation, opportunity, and economic development should be accessible to all communities and industries across the country.
        </p>
      </section>

      <section className="rounded-3xl border border-yellow-500/40 bg-yellow-500/10 p-8">
        <h2 className="text-2xl font-bold text-white">From the Founder</h2>
        <blockquote className="mt-5 rounded-3xl border border-yellow-500/20 bg-slate-950 p-6 text-sm leading-relaxed text-slate-200">
          “My name is Joseph W. Smith, Founder and CEO of Jobsite Finder Technologies Inc.
          With over 10 years of experience in commercial construction, I experienced firsthand how difficult it can be for workers and contractors to find each other at the right time.
          Jobsite Finder was created to bridge that gap and modernize how the construction industry connects. Our goal is simple: help people find work, help companies find workers, and help projects succeed.”
        </blockquote>
      </section>

      <section className="rounded-3xl border border-yellow-500/40 bg-yellow-500/10 p-8 text-center">
        <p className="text-2xl font-black text-yellow-300 sm:text-3xl">
          Built for the Trades. Powered by Real Jobsites.
        </p>
        <p className="mt-4 max-w-3xl mx-auto text-sm leading-relaxed text-slate-300">
          Connecting Canada's construction workforce—one jobsite at a time.
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
