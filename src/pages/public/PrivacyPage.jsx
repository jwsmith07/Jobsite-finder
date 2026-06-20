export default function PrivacyPage() {
  return (
    <div className="space-y-8">
      <section className="rounded-3xl border border-slate-800 bg-slate-900 p-8 sm:p-10">
        <p className="inline-flex rounded-full border border-yellow-500/30 bg-yellow-500/10 px-3 py-1 text-xs font-semibold uppercase tracking-wider text-yellow-300">
          Privacy Policy
        </p>
        <h1 className="mt-4 text-3xl font-black text-white sm:text-4xl">
          Privacy Policy
        </h1>
        <p className="mt-4 text-sm text-slate-400">
          Last updated: {new Date().toLocaleDateString('en-CA')}
        </p>
        <p className="mt-4 max-w-3xl text-slate-300">
          At Jobsite Finder Technologies Inc., we are committed to protecting your privacy. This Privacy Policy explains how we collect, use, disclose, and otherwise handle your information.
        </p>
      </section>

      <section className="space-y-6">
        <div className="rounded-2xl border border-slate-800 bg-slate-950 p-6">
          <h2 className="text-xl font-bold text-white">Information We Collect</h2>
          <div className="mt-4 space-y-4 text-slate-300">
            <p>We collect information you provide directly to us, as well as information collected automatically when you use our platform.</p>

            <div>
              <h3 className="font-semibold text-slate-100">Worker Profiles</h3>
              <ul className="mt-2 ml-4 space-y-1 list-disc text-slate-400">
                <li>Name, email address, phone number</li>
                <li>Trade skills, certifications, experience level</li>
                <li>Profile photo and resume documents</li>
                <li>Location and work preferences</li>
                <li>Employment history</li>
              </ul>
            </div>

            <div>
              <h3 className="font-semibold text-slate-100">Resumes and Uploaded Documents</h3>
              <ul className="mt-2 ml-4 space-y-1 list-disc text-slate-400">
                <li>PDF, Word, and image files you upload</li>
                <li>Document metadata and timestamps</li>
                <li>Files are stored securely with access controls</li>
              </ul>
            </div>

            <div>
              <h3 className="font-semibold text-slate-100">Contractor &amp; Company Accounts</h3>
              <ul className="mt-2 ml-4 space-y-1 list-disc text-slate-400">
                <li>Company name, registration number, tax ID</li>
                <li>Business address and contact details</li>
                <li>Company profile information</li>
                <li>Team member accounts and roles</li>
                <li>Verification documents (business license, etc.)</li>
              </ul>
            </div>

            <div>
              <h3 className="font-semibold text-slate-100">Job Applications</h3>
              <ul className="mt-2 ml-4 space-y-1 list-disc text-slate-400">
                <li>Application history and status</li>
                <li>Cover letters or application messages</li>
                <li>Application timestamp and jobsite details</li>
              </ul>
            </div>

            <div>
              <h3 className="font-semibold text-slate-100">Jobsite Data</h3>
              <ul className="mt-2 ml-4 space-y-1 list-disc text-slate-400">
                <li>Project location, description, and details</li>
                <li>Hiring status, project stage, and timeline</li>
                <li>Photos and project images</li>
                <li>Job posting details and requirements</li>
              </ul>
            </div>

            <div>
              <h3 className="font-semibold text-slate-100">Payment &amp; Subscription Data</h3>
              <ul className="mt-2 ml-4 space-y-1 list-disc text-slate-400">
                <li>Future billing information if paid plans are introduced after beta</li>
                <li>Future subscription plan and billing history if applicable</li>
                <li>Payment method details only if future checkout is enabled through a secure processor</li>
                <li>Invoice records</li>
              </ul>
            </div>

            <div>
              <h3 className="font-semibold text-slate-100">Cookies &amp; Analytics</h3>
              <ul className="mt-2 ml-4 space-y-1 list-disc text-slate-400">
                <li>Cookies for authentication and session management</li>
                <li>Analytics data about your usage (pages visited, time spent, etc.)</li>
                <li>Device type, operating system, browser information</li>
                <li>IP address and general location (country/region)</li>
              </ul>
            </div>
          </div>
        </div>

        <div className="rounded-2xl border border-slate-800 bg-slate-950 p-6">
          <h2 className="text-xl font-bold text-white">How We Use Your Information</h2>
          <ul className="mt-4 ml-4 space-y-2 list-disc text-slate-300">
            <li>To provide, maintain, and improve our platform</li>
            <li>To process future transactions and send billing information if paid plans are introduced</li>
            <li>To match workers with jobsites and opportunities</li>
            <li>To enable contractors to post jobs and manage applications</li>
            <li>To verify user identity and prevent fraud</li>
            <li>To communicate with you about your account and service updates</li>
            <li>To respond to your inquiries and customer support requests</li>
            <li>To analyze usage patterns and improve user experience</li>
            <li>To send promotional communications (with your consent)</li>
          </ul>
        </div>

        <div className="rounded-2xl border border-slate-800 bg-slate-950 p-6">
          <h2 className="text-xl font-bold text-white">Data Sharing</h2>
          <div className="mt-4 space-y-3 text-slate-300">
            <p>
              We do not sell your personal information. We may share information with:
            </p>
            <ul className="ml-4 space-y-2 list-disc">
              <li><strong>Service Providers:</strong> Supabase (database/auth), analytics providers, and future payment processors if billing is introduced</li>
              <li><strong>Other Users:</strong> When you apply for jobs, your resume and profile are shared with hiring contractors only</li>
              <li><strong>Legal Compliance:</strong> When required by law or to protect our rights</li>
              <li><strong>Business Partners:</strong> Only with your explicit consent</li>
            </ul>
          </div>
        </div>

        <div className="rounded-2xl border border-slate-800 bg-slate-950 p-6">
          <h2 className="text-xl font-bold text-white">Data Retention</h2>
          <p className="mt-4 text-slate-300">
            We retain your information as long as necessary to provide our services. You may request account deletion at any time. Archived data may be retained for legal or compliance purposes.
          </p>
        </div>

        <div className="rounded-2xl border border-slate-800 bg-slate-950 p-6">
          <h2 className="text-xl font-bold text-white">Your Rights</h2>
          <div className="mt-4 space-y-3 text-slate-300">
            <p>You may have the right to:</p>
            <ul className="ml-4 space-y-2 list-disc">
              <li>Access your personal information</li>
              <li>Request correction of inaccurate data</li>
              <li>Request deletion of your account and associated data</li>
              <li>Opt out of marketing communications</li>
              <li>Download your information in portable format</li>
            </ul>
            <p className="mt-4">
              To exercise these rights, contact us at <a href="mailto:joseph@jobsitefinder.ca" className="text-yellow-400 hover:text-yellow-300">joseph@jobsitefinder.ca</a>.
            </p>
          </div>
        </div>

        <div className="rounded-2xl border border-slate-800 bg-slate-950 p-6">
          <h2 className="text-xl font-bold text-white">Security</h2>
          <p className="mt-4 text-slate-300">
            We implement security measures to protect your information, including encryption, secure authentication, and access controls. However, no security system is impenetrable. We encourage you to use strong passwords and secure your account credentials.
          </p>
        </div>

        <div className="rounded-2xl border border-blue-900/50 bg-blue-950/30 p-6">
          <p className="text-sm text-slate-300">
            <span className="font-semibold text-blue-300">Legal Notice:</span> This policy is intended for Canadian users and should be reviewed by legal counsel before commercial launch to ensure compliance with Canadian privacy laws (PIPEDA and provincial legislation).
          </p>
        </div>

        <div className="rounded-2xl border border-slate-800 bg-slate-950 p-6">
          <h2 className="text-xl font-bold text-white">Contact</h2>
          <p className="mt-4 text-slate-300">
            For privacy questions or concerns, contact us at:
          </p>
          <div className="mt-3 text-slate-400">
            <p>Email: <a href="mailto:joseph@jobsitefinder.ca" className="text-yellow-400 hover:text-yellow-300">joseph@jobsitefinder.ca</a></p>
          </div>
        </div>
      </section>
    </div>
  )
}
