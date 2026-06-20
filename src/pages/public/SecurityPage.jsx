export default function SecurityPage() {
  return (
    <div className="space-y-8">
      <section className="rounded-3xl border border-slate-800 bg-slate-900 p-8 sm:p-10">
        <p className="inline-flex rounded-full border border-yellow-500/30 bg-yellow-500/10 px-3 py-1 text-xs font-semibold uppercase tracking-wider text-yellow-300">
          Security
        </p>
        <h1 className="mt-4 text-3xl font-black text-white sm:text-4xl">
          Security &amp; Data Protection
        </h1>
        <p className="mt-4 max-w-3xl text-lg leading-relaxed text-slate-300">
          We take security seriously and are committed to protecting your data and account. Here's what we do to keep Jobsite Finder secure.
        </p>
      </section>

      <section className="space-y-6">
        <div className="rounded-2xl border border-slate-800 bg-slate-950 p-6">
          <h2 className="text-xl font-bold text-white">Account Protection</h2>
          <div className="mt-4 space-y-3 text-slate-300">
            <p>
              We implement multiple layers of security:
            </p>
            <ul className="ml-4 space-y-2 list-disc text-slate-400">
              <li><strong>Encrypted Passwords:</strong> Passwords are hashed and encrypted, never stored in plain text</li>
              <li><strong>Secure Login:</strong> Two-factor authentication (2FA) and login verification available</li>
              <li><strong>Session Management:</strong> Sessions expire automatically after a period of inactivity</li>
              <li><strong>Account Recovery:</strong> Recovery codes and email verification prevent unauthorized access</li>
              <li><strong>Fraud Detection:</strong> We monitor for suspicious login attempts and unusual account activity</li>
            </ul>
          </div>
        </div>

        <div className="rounded-2xl border border-slate-800 bg-slate-950 p-6">
          <h2 className="text-xl font-bold text-white">Password Best Practices</h2>
          <p className="mt-4 text-slate-300 mb-3">
            To protect your account:
          </p>
          <ul className="ml-4 space-y-2 list-disc text-slate-300">
            <li>Use a strong, unique password (at least 12 characters)</li>
            <li>Include uppercase, lowercase, numbers, and special characters</li>
            <li>Do not reuse passwords across platforms</li>
            <li>Do not share your password with anyone</li>
            <li>Change your password regularly (every 90 days recommended)</li>
            <li>Use a password manager to generate and store strong passwords</li>
            <li>Log out on shared devices after use</li>
          </ul>
        </div>

        <div className="rounded-2xl border border-slate-800 bg-slate-950 p-6">
          <h2 className="text-xl font-bold text-white">Data Encryption</h2>
          <div className="mt-4 space-y-3 text-slate-300">
            <p>
              Your information is protected in transit and at rest:
            </p>
            <ul className="ml-4 space-y-2 list-disc text-slate-400">
              <li>All data transmitted to Jobsite Finder uses HTTPS/TLS encryption</li>
              <li>Sensitive data is encrypted in our database</li>
              <li>Billing is not active during beta; if payments are introduced later, payment details will be handled by a PCI-compliant processor</li>
              <li>Uploaded documents are encrypted and access-controlled</li>
            </ul>
          </div>
        </div>

        <div className="rounded-2xl border border-slate-800 bg-slate-950 p-6">
          <h2 className="text-xl font-bold text-white">Authentication &amp; Authorization</h2>
          <div className="mt-4 space-y-3 text-slate-300">
            <p>
              We use secure authentication and access controls:
            </p>
            <ul className="ml-4 space-y-2 list-disc text-slate-400">
              <li><strong>Supabase Auth:</strong> Industry-standard authentication platform</li>
              <li><strong>OAuth 2.0:</strong> Secure, token-based authentication</li>
              <li><strong>Role-Based Access Control:</strong> Different permissions for workers, contractors, and admins</li>
              <li><strong>API Security:</strong> Rate limiting and request validation prevent abuse</li>
            </ul>
          </div>
        </div>

        <div className="rounded-2xl border border-slate-800 bg-slate-950 p-6">
          <h2 className="text-xl font-bold text-white">Data Access Controls</h2>
          <div className="mt-4 space-y-3 text-slate-300">
            <p>
              Your information is carefully controlled:
            </p>
            <ul className="ml-4 space-y-2 list-disc text-slate-400">
              <li>Workers' resumes are shared only with contractors they apply to or who search profiles</li>
              <li>Personal information (phone, email) is not publicly visible without consent</li>
              <li>Contractors see only information relevant to their hiring needs</li>
              <li>Admin access is limited to designated staff for support and moderation</li>
              <li>No third parties access your data without explicit consent</li>
            </ul>
          </div>
        </div>

        <div className="rounded-2xl border border-slate-800 bg-slate-950 p-6">
          <h2 className="text-xl font-bold text-white">Resume &amp; Document Protection</h2>
          <p className="mt-4 text-slate-300">
            Resumes and documents you upload are:
          </p>
          <ul className="mt-3 ml-4 space-y-2 list-disc text-slate-300">
            <li>Stored securely with encryption</li>
            <li>Shared only when you apply to jobs or contractors view your profile</li>
            <li>Not visible to other workers or the general public</li>
            <li>Deletable by you at any time</li>
            <li>Subject to our privacy policy and data retention terms</li>
          </ul>
        </div>

        <div className="rounded-2xl border border-slate-800 bg-slate-950 p-6">
          <h2 className="text-xl font-bold text-white">Payment Security</h2>
          <p className="mt-4 text-slate-300">
            Billing is not active during beta. If payments are introduced later:
          </p>
          <ul className="mt-3 ml-4 space-y-2 list-disc text-slate-300">
            <li>Payment details will be handled by a PCI-compliant payment processor</li>
            <li>Credit card information will not be stored on Jobsite Finder servers</li>
            <li>Transactions will use encrypted checkout flows</li>
            <li>Billing information will be used only for account and subscription processing</li>
          </ul>
        </div>

        <div className="rounded-2xl border border-slate-800 bg-slate-950 p-6">
          <h2 className="text-xl font-bold text-white">Platform Security</h2>
          <div className="mt-4 space-y-3 text-slate-300">
            <p>
              We maintain strong platform security:
            </p>
            <ul className="ml-4 space-y-2 list-disc text-slate-400">
              <li>Regular security audits and penetration testing</li>
              <li>Vulnerability scanning and patch management</li>
              <li>Intrusion detection and monitoring</li>
              <li>Backup systems to prevent data loss</li>
              <li>Disaster recovery and business continuity planning</li>
              <li>Compliance with security best practices and standards</li>
            </ul>
          </div>
        </div>

        <div className="rounded-2xl border border-slate-800 bg-slate-950 p-6">
          <h2 className="text-xl font-bold text-white">Reporting Security Issues</h2>
          <p className="mt-4 text-slate-300">
            If you discover a security vulnerability, please:
          </p>
          <ol className="mt-3 ml-4 space-y-2 list-decimal text-slate-300">
            <li>Do not publicly disclose the vulnerability</li>
            <li>Email us at <a href="mailto:joseph@jobsitefinder.ca" className="text-yellow-400 hover:text-yellow-300">joseph@jobsitefinder.ca</a> with details</li>
            <li>Include steps to reproduce the issue if possible</li>
            <li>We will investigate and respond within 48 hours</li>
            <li>We appreciate responsible disclosure and will acknowledge your help</li>
          </ol>
        </div>

        <div className="rounded-2xl border border-slate-800 bg-slate-950 p-6">
          <h2 className="text-xl font-bold text-white">What to Do If Your Account Is Compromised</h2>
          <div className="mt-4 space-y-3 text-slate-300">
            <p>
              If you suspect unauthorized access:
            </p>
            <ol className="mt-3 ml-4 space-y-2 list-decimal text-slate-400">
              <li>Change your password immediately</li>
              <li>Review your account activity and settings</li>
              <li>Remove any suspicious connected devices or sessions</li>
              <li>Enable two-factor authentication if available</li>
              <li>Contact us at <a href="mailto:joseph@jobsitefinder.ca" className="text-yellow-400 hover:text-yellow-300">joseph@jobsitefinder.ca</a> to report the incident</li>
            </ol>
          </div>
        </div>

        <div className="rounded-2xl border border-yellow-500/20 bg-yellow-500/10 p-6">
          <p className="text-slate-300">
            <span className="font-semibold text-yellow-300">Trust &amp; Safety:</span> Your security is our priority. We are committed to maintaining a safe, secure platform for all users. If you have questions about security practices, contact us at <a href="mailto:joseph@jobsitefinder.ca" className="text-yellow-400 hover:text-yellow-300">joseph@jobsitefinder.ca</a>.
          </p>
        </div>
      </section>
    </div>
  )
}
