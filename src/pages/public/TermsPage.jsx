export default function TermsPage() {
  return (
    <div className="space-y-8">
      <section className="rounded-3xl border border-slate-800 bg-slate-900 p-8 sm:p-10">
        <p className="inline-flex rounded-full border border-yellow-500/30 bg-yellow-500/10 px-3 py-1 text-xs font-semibold uppercase tracking-wider text-yellow-300">
          Terms of Service
        </p>
        <h1 className="mt-4 text-3xl font-black text-white sm:text-4xl">
          Terms of Service
        </h1>
        <p className="mt-4 text-sm text-slate-400">
          Last updated: {new Date().toLocaleDateString('en-CA')}
        </p>
        <p className="mt-4 max-w-3xl text-slate-300">
          These Terms of Service govern your use of the Jobsite Finder platform. By accessing or using Jobsite Finder, you agree to be bound by these terms.
        </p>
      </section>

      <section className="space-y-6">
        <div className="rounded-2xl border border-slate-800 bg-slate-950 p-6">
          <h2 className="text-xl font-bold text-white">1. Acceptance of Terms</h2>
          <p className="mt-4 text-slate-300">
            By using Jobsite Finder, you accept these Terms of Service. If you do not agree, do not use the platform. We reserve the right to modify these terms at any time. Continued use of the platform following changes constitutes acceptance of those changes.
          </p>
        </div>

        <div className="rounded-2xl border border-slate-800 bg-slate-950 p-6">
          <h2 className="text-xl font-bold text-white">2. Account Registration</h2>
          <div className="mt-4 space-y-3 text-slate-300">
            <p>To use Jobsite Finder, you must create an account with accurate information. You are responsible for:</p>
            <ul className="ml-4 space-y-2 list-disc">
              <li>Providing truthful and complete registration information</li>
              <li>Maintaining the confidentiality of your login credentials</li>
              <li>All activities conducted under your account</li>
              <li>Notifying us of unauthorized account access</li>
            </ul>
          </div>
        </div>

        <div className="rounded-2xl border border-slate-800 bg-slate-950 p-6">
          <h2 className="text-xl font-bold text-white">3. User Roles &amp; Responsibilities</h2>

          <div className="mt-4 space-y-4">
            <div>
              <h3 className="font-semibold text-slate-100">Workers</h3>
              <ul className="mt-2 ml-4 space-y-1 list-disc text-slate-400">
                <li>Provide accurate resume and profile information</li>
                <li>Represent your skills and qualifications honestly</li>
                <li>Respond professionally to hiring inquiries</li>
                <li>Do not misuse others' contact information</li>
                <li>Comply with workplace safety laws and regulations</li>
              </ul>
            </div>

            <div>
              <h3 className="font-semibold text-slate-100">Subcontractors</h3>
              <ul className="mt-2 ml-4 space-y-1 list-disc text-slate-400">
                <li>Maintain accurate company profile and credentials</li>
                <li>Post only legitimate jobsites you are actively working on</li>
                <li>Ensure all job postings are truthful and comply with employment law</li>
                <li>Respect worker privacy and confidentiality</li>
                <li>Honor communication and hiring standards</li>
              </ul>
            </div>

            <div>
              <h3 className="font-semibold text-slate-100">General Contractors</h3>
              <ul className="mt-2 ml-4 space-y-1 list-disc text-slate-400">
                <li>Maintain verified company profile with current credentials</li>
                <li>Only post and claim jobsites you have authority to represent</li>
                <li>Post accurate, lawful job opportunities</li>
                <li>Verify worker information legally and ethically</li>
                <li>Comply with all contractor licensing and safety requirements</li>
              </ul>
            </div>
          </div>
        </div>

        <div className="rounded-2xl border border-slate-800 bg-slate-950 p-6">
          <h2 className="text-xl font-bold text-white">4. Jobsite Posting Rules</h2>
          <div className="mt-4 space-y-3 text-slate-300">
            <p>When posting jobsites, you agree to:</p>
            <ul className="ml-4 space-y-2 list-disc">
              <li>Post only real, active construction projects</li>
              <li>Provide accurate location and project information</li>
              <li>Update jobsite status and hiring information regularly</li>
              <li>Not post to harass or deceive others</li>
              <li>Not duplicate or spam jobsite listings</li>
              <li>Remove jobsites that are no longer active</li>
            </ul>
          </div>
        </div>

        <div className="rounded-2xl border border-slate-800 bg-slate-950 p-6">
          <h2 className="text-xl font-bold text-white">5. Company Verification</h2>
          <p className="mt-4 text-slate-300">
            General contractors and subcontractors may be required to verify their identity and business credentials. Providing false information or failing verification may result in account suspension or termination.
          </p>
        </div>

        <div className="rounded-2xl border border-slate-800 bg-slate-950 p-6">
          <h2 className="text-xl font-bold text-white">6. Subscriptions &amp; Billing</h2>
          <div className="mt-4 space-y-3 text-slate-300">
            <p>
              <strong>Contractor accounts are currently in free beta access.</strong> Paid subscriptions are not active. When paid plans become available:
            </p>
            <ul className="ml-4 space-y-2 list-disc">
              <li>You authorize us to charge your payment method monthly or annually</li>
              <li>Billing terms will be shown before any subscription begins</li>
              <li>Prices are in Canadian Dollars (CAD) unless otherwise stated</li>
              <li>All fees are exclusive of applicable taxes</li>
              <li>You can cancel anytime before the renewal date</li>
            </ul>
          </div>
        </div>

        <div className="rounded-2xl border border-slate-800 bg-slate-950 p-6">
          <h2 className="text-xl font-bold text-white">7. Beta Access Terms</h2>
          <p className="mt-4 text-slate-300">
            Jobsite Finder is currently in beta. Beta access is provided "as-is" without warranty. Features may change or be discontinued. Data may be reset or deleted without notice. We are not liable for any data loss or service interruptions during beta testing.
          </p>
        </div>

        <div className="rounded-2xl border border-slate-800 bg-slate-950 p-6">
          <h2 className="text-xl font-bold text-white">8. No Guarantee of Employment or Contracts</h2>
          <p className="mt-4 text-slate-300">
            Jobsite Finder is a platform to connect workers with contractors. We do not guarantee employment, job placement, or contract awards. We are not a party to any employment or contractor relationship. All hiring decisions are made by contractors independently.
          </p>
        </div>

        <div className="rounded-2xl border border-slate-800 bg-slate-950 p-6">
          <h2 className="text-xl font-bold text-white">9. Acceptable Use</h2>
          <p className="mt-4 text-slate-300 mb-3">
            You agree not to:
          </p>
          <ul className="ml-4 space-y-2 list-disc text-slate-300">
            <li>Engage in harassment, discrimination, or abusive behavior</li>
            <li>Post false, misleading, or fraudulent information</li>
            <li>Attempt to hack, reverse-engineer, or breach platform security</li>
            <li>Spam, phish, or conduct malicious activities</li>
            <li>Violate any applicable laws or regulations</li>
            <li>Infringe on intellectual property or privacy rights</li>
            <li>Misuse worker data or contact information</li>
            <li>Impersonate other users or companies</li>
            <li>Post illegal content or facilitate illegal activity</li>
          </ul>
        </div>

        <div className="rounded-2xl border border-slate-800 bg-slate-950 p-6">
          <h2 className="text-xl font-bold text-white">10. Suspension or Termination</h2>
          <p className="mt-4 text-slate-300">
            We may suspend or terminate your account if you violate these terms, engage in fraud, or conduct illegal activity. Termination may be immediate and without notice in cases of severe violations. Upon termination, your access is immediately revoked.
          </p>
        </div>

        <div className="rounded-2xl border border-slate-800 bg-slate-950 p-6">
          <h2 className="text-xl font-bold text-white">11. Limitation of Liability</h2>
          <p className="mt-4 text-slate-300">
            To the fullest extent permitted by law, Jobsite Finder is provided "as-is" without warranties. We are not liable for:
          </p>
          <ul className="ml-4 mt-3 space-y-2 list-disc text-slate-300">
            <li>Lost profits or lost data</li>
            <li>Indirect, incidental, or consequential damages</li>
            <li>Third-party conduct or disputes</li>
            <li>Employment relationship outcomes</li>
            <li>Service interruptions or downtime</li>
          </ul>
        </div>

        <div className="rounded-2xl border border-blue-900/50 bg-blue-950/30 p-6">
          <p className="text-sm text-slate-300">
            <span className="font-semibold text-blue-300">Legal Notice:</span> These Terms of Service are intended for Canadian users and should be reviewed by legal counsel before commercial launch to ensure compliance with applicable Canadian laws and regulations.
          </p>
        </div>

        <div className="rounded-2xl border border-slate-800 bg-slate-950 p-6">
          <h2 className="text-xl font-bold text-white">Contact</h2>
          <p className="mt-4 text-slate-300">
            For questions about these Terms of Service, contact us at:
          </p>
          <div className="mt-3 text-slate-400">
            <p>Email: <a href="mailto:joseph@jobsitefinder.ca" className="text-yellow-400 hover:text-yellow-300">joseph@jobsitefinder.ca</a></p>
          </div>
        </div>
      </section>
    </div>
  )
}
