export default function ContactPage() {
  return (
    <div className="space-y-8">
      <section className="rounded-3xl border border-slate-800 bg-slate-900 p-8 sm:p-10">
        <p className="inline-flex rounded-full border border-yellow-500/30 bg-yellow-500/10 px-3 py-1 text-xs font-semibold uppercase tracking-wider text-yellow-300">
          Contact
        </p>
        <h1 className="mt-4 text-3xl font-black text-white sm:text-4xl">
          Get in Touch
        </h1>
        <p className="mt-4 max-w-3xl text-lg leading-relaxed text-slate-300">
          Have questions? We'd love to hear from you. Reach out to the Jobsite Finder team.
        </p>
      </section>

      <section className="grid gap-6 md:grid-cols-2">
        <div className="rounded-2xl border border-slate-800 bg-slate-950 p-6">
          <h2 className="text-xl font-bold text-white">Email</h2>
          <p className="mt-4 text-slate-300">
            The best way to reach us with questions, feedback, or partnership inquiries:
          </p>
          <p className="mt-4">
            <a 
              href="mailto:joseph@jobsitefinder.ca"
              className="inline-flex items-center gap-2 rounded-lg bg-yellow-500 px-4 py-2 font-semibold text-slate-900 hover:bg-yellow-400"
            >
              joseph@jobsitefinder.ca
            </a>
          </p>
        </div>

        <div className="rounded-2xl border border-slate-800 bg-slate-950 p-6">
          <h2 className="text-xl font-bold text-white">Website</h2>
          <p className="mt-4 text-slate-300">
            Visit our main website for more information:
          </p>
          <p className="mt-4">
            <a 
              href="https://jobsitefinder.ca"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 rounded-lg bg-yellow-500 px-4 py-2 font-semibold text-slate-900 hover:bg-yellow-400"
            >
              JobsiteFinder.ca
            </a>
          </p>
        </div>

        <div className="rounded-2xl border border-slate-800 bg-slate-950 p-6">
          <h2 className="text-xl font-bold text-white">Company</h2>
          <p className="mt-4 text-slate-300">
            Jobsite Finder Technologies Inc.
          </p>
          <p className="mt-2 text-slate-300">
            Joseph W. Smith, Founder &amp; CEO
          </p>
          <p className="mt-2 text-slate-400">
            Phone: <a href="tel:+18673931283" className="text-yellow-400 hover:text-yellow-300">(867) 393-1283</a>
          </p>
          <p className="mt-2 text-sm text-slate-400">
            Indigenous-owned Canadian construction technology company
          </p>
        </div>
      </section>

      <section className="rounded-2xl border border-slate-800 bg-slate-950 p-6">
        <h2 className="text-xl font-bold text-white">Contact Form</h2>
        <p className="mt-4 text-slate-300">
          While we're building out our contact form, please email us directly at <a href="mailto:joseph@jobsitefinder.ca" className="text-yellow-400 hover:text-yellow-300">joseph@jobsitefinder.ca</a> with:
        </p>
        <ul className="mt-4 ml-4 space-y-2 list-disc text-slate-400">
          <li>Your name and role (worker, subcontractor, GC, etc.)</li>
          <li>Your email and phone number</li>
          <li>Subject of your inquiry</li>
          <li>Detailed message or question</li>
        </ul>
        <p className="mt-4 text-slate-300">
          We aim to respond within 24–48 business hours.
        </p>
      </section>

      <section className="rounded-2xl border border-slate-800 bg-slate-950 p-6">
        <h2 className="text-xl font-bold text-white">Response Times</h2>
        <div className="mt-4 space-y-3 text-slate-300">
          <p>
            <strong>Email Support:</strong> 24–48 hours
          </p>
          <p>
            <strong>Beta Feedback:</strong> We actively review feedback to improve Jobsite Finder
          </p>
        </div>
      </section>

      <section className="rounded-2xl border border-yellow-500/20 bg-yellow-500/10 p-6">
        <h2 className="text-xl font-bold text-yellow-300">Quick Resources</h2>
        <ul className="mt-4 ml-4 space-y-2 list-disc text-slate-300">
          <li>
            <a href="/privacy" className="text-yellow-400 hover:text-yellow-300">Privacy Policy</a> – How we handle your data
          </li>
          <li>
            <a href="/terms" className="text-yellow-400 hover:text-yellow-300">Terms of Service</a> – Platform usage guidelines
          </li>
          <li>
            <a href="/faq" className="text-yellow-400 hover:text-yellow-300">FAQ</a> – Answers to common questions
          </li>
          <li>
            <a href="/community-guidelines" className="text-yellow-400 hover:text-yellow-300">Community Guidelines</a> – Community standards
          </li>
        </ul>
      </section>
    </div>
  )
}
