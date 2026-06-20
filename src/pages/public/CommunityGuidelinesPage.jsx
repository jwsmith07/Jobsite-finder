export default function CommunityGuidelinesPage() {
  return (
    <div className="space-y-8">
      <section className="rounded-3xl border border-slate-800 bg-slate-900 p-8 sm:p-10">
        <p className="inline-flex rounded-full border border-yellow-500/30 bg-yellow-500/10 px-3 py-1 text-xs font-semibold uppercase tracking-wider text-yellow-300">
          Community Guidelines
        </p>
        <h1 className="mt-4 text-3xl font-black text-white sm:text-4xl">
          Community Guidelines
        </h1>
        <p className="mt-4 max-w-3xl text-lg leading-relaxed text-slate-300">
          Jobsite Finder is built on trust, transparency, and professionalism. These guidelines help keep our community safe and productive for all users.
        </p>
      </section>

      <section className="space-y-6">
        <div className="rounded-2xl border border-red-900/50 bg-red-950/30 p-6">
          <h2 className="text-xl font-bold text-red-300">Violations &amp; Enforcement</h2>
          <p className="mt-4 text-slate-300">
            Violating these guidelines may result in account suspension, removal of content, or permanent termination. We take these standards seriously to protect our community.
          </p>
        </div>

        <div className="rounded-2xl border border-slate-800 bg-slate-950 p-6">
          <h2 className="text-xl font-bold text-white">✗ Fake Jobsites &amp; Fraudulent Listings</h2>
          <div className="mt-4 space-y-3 text-slate-300">
            <p>
              Do not post jobsites that are:
            </p>
            <ul className="ml-4 space-y-2 list-disc text-slate-400">
              <li>Not real active construction projects you're working on</li>
              <li>Misrepresenting location, project details, or timeline</li>
              <li>Duplicates or test listings that will be deleted</li>
              <li>Created to deceive workers or other contractors</li>
            </ul>
            <p className="mt-3 text-sm">
              Jobsite verification helps us maintain data integrity. Contractors who post fake jobsites will have content removed and may lose posting privileges.
            </p>
          </div>
        </div>

        <div className="rounded-2xl border border-slate-800 bg-slate-950 p-6">
          <h2 className="text-xl font-bold text-white">✗ Fake Companies &amp; Fraudulent Profiles</h2>
          <div className="mt-4 space-y-3 text-slate-300">
            <p>
              Do not create accounts using:
            </p>
            <ul className="ml-4 space-y-2 list-disc text-slate-400">
              <li>False company information or stolen credentials</li>
              <li>Impersonation of legitimate businesses or contractors</li>
              <li>Fake worker profiles to misrepresent qualifications</li>
              <li>Multiple accounts to evade account restrictions</li>
            </ul>
            <p className="mt-3 text-sm">
              We verify contractor credentials. Fraudulent accounts are subject to immediate termination and may be reported to authorities.
            </p>
          </div>
        </div>

        <div className="rounded-2xl border border-slate-800 bg-slate-950 p-6">
          <h2 className="text-xl font-bold text-white">✗ Harassment &amp; Abusive Behavior</h2>
          <div className="mt-4 space-y-3 text-slate-300">
            <p>
              Jobsite Finder is a professional platform. Do not:
            </p>
            <ul className="ml-4 space-y-2 list-disc text-slate-400">
              <li>Harass, threaten, or abuse other users</li>
              <li>Engage in discrimination based on race, gender, religion, age, or other protected characteristics</li>
              <li>Use derogatory, offensive, or hateful language</li>
              <li>Engage in bullying or targeted attacks</li>
              <li>Pursue users romantically or personally outside professional context</li>
            </ul>
            <p className="mt-3 text-sm">
              Violations will result in account suspension or termination. Serious cases may be reported to law enforcement.
            </p>
          </div>
        </div>

        <div className="rounded-2xl border border-slate-800 bg-slate-950 p-6">
          <h2 className="text-xl font-bold text-white">✗ Spam &amp; Abuse</h2>
          <div className="mt-4 space-y-3 text-slate-300">
            <p>
              Keep communications professional and relevant:
            </p>
            <ul className="ml-4 space-y-2 list-disc text-slate-400">
              <li>Do not mass-message or spam workers or contractors</li>
              <li>Do not post repetitive, promotional, or off-topic content</li>
              <li>Do not solicit personal information for non-professional purposes</li>
              <li>Do not advertise unrelated products or services</li>
              <li>Do not attempt to direct users off the platform</li>
            </ul>
          </div>
        </div>

        <div className="rounded-2xl border border-slate-800 bg-slate-950 p-6">
          <h2 className="text-xl font-bold text-white">✗ Misleading Hiring Posts</h2>
          <div className="mt-4 space-y-3 text-slate-300">
            <p>
              Job postings must be accurate and truthful:
            </p>
            <ul className="ml-4 space-y-2 list-disc text-slate-400">
              <li>Clearly state the job type, required skills, and responsibilities</li>
              <li>Provide accurate wage or compensation information</li>
              <li>Accurately describe project timeline and duration</li>
              <li>Do not misrepresent employment conditions or safety risks</li>
              <li>Do not post if you're not actively hiring</li>
            </ul>
          </div>
        </div>

        <div className="rounded-2xl border border-slate-800 bg-slate-950 p-6">
          <h2 className="text-xl font-bold text-white">✗ Unsafe or Illegal Activity</h2>
          <div className="mt-4 space-y-3 text-slate-300">
            <p>
              Jobsite Finder does not tolerate:
            </p>
            <ul className="ml-4 space-y-2 list-disc text-slate-400">
              <li>Solicitation of illegal activities or services</li>
              <li>Sharing or requesting hazardous materials or weapons</li>
              <li>Posts promoting unsafe work practices or bypassing regulations</li>
              <li>Violation of workplace safety laws (OSHA, provincial regulations)</li>
              <li>Child labor or exploitation</li>
            </ul>
            <p className="mt-3 text-sm">
              Illegal activity will be reported to law enforcement and result in permanent platform ban.
            </p>
          </div>
        </div>

        <div className="rounded-2xl border border-slate-800 bg-slate-950 p-6">
          <h2 className="text-xl font-bold text-white">✗ Misuse of Data &amp; Privacy Violations</h2>
          <div className="mt-4 space-y-3 text-slate-300">
            <p>
              Respect user privacy and data:
            </p>
            <ul className="ml-4 space-y-2 list-disc text-slate-400">
              <li>Do not collect, share, or misuse worker resumes or personal information</li>
              <li>Do not sell or trade contact information</li>
              <li>Do not use data for purposes outside of recruiting or hiring</li>
              <li>Do not bypass privacy controls to contact workers</li>
            </ul>
          </div>
        </div>

        <div className="rounded-2xl border border-slate-800 bg-slate-950 p-6">
          <h2 className="text-xl font-bold text-white">Professional Conduct Standards</h2>
          <div className="mt-4 space-y-3 text-slate-300">
            <p>
              All users should:
            </p>
            <ul className="ml-4 space-y-2 list-disc text-slate-400">
              <li>Communicate professionally and respectfully</li>
              <li>Respond promptly to inquiries and messages</li>
              <li>Follow up on job offers or applications</li>
              <li>Disclose conflicts of interest if applicable</li>
              <li>Report platform issues or suspicious activity</li>
            </ul>
          </div>
        </div>

        <div className="rounded-2xl border border-slate-800 bg-slate-950 p-6">
          <h2 className="text-xl font-bold text-white">Reporting Violations</h2>
          <p className="mt-4 text-slate-300">
            If you encounter a violation of these guidelines, please:
          </p>
          <ol className="mt-3 ml-4 space-y-2 list-decimal text-slate-400">
            <li>Document the violation (screenshots, usernames, timestamps)</li>
            <li>Email us at <a href="mailto:joseph@jobsitefinder.ca" className="text-yellow-400 hover:text-yellow-300">joseph@jobsitefinder.ca</a> with details</li>
            <li>Do not engage with or escalate the violation</li>
            <li>We will investigate and take action within 48 hours</li>
          </ol>
        </div>

        <div className="rounded-2xl border border-yellow-500/20 bg-yellow-500/10 p-6">
          <p className="text-slate-300">
            <span className="font-semibold text-yellow-300">Note:</span> These guidelines apply to all users—workers, subcontractors, and general contractors. Violations may result in removal of content, account suspension, or permanent termination from the platform.
          </p>
        </div>
      </section>
    </div>
  )
}
