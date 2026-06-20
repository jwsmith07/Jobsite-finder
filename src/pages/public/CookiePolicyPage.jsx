export default function CookiePolicyPage() {
  return (
    <div className="space-y-8">
      <section className="rounded-3xl border border-slate-800 bg-slate-900 p-8 sm:p-10">
        <p className="inline-flex rounded-full border border-yellow-500/30 bg-yellow-500/10 px-3 py-1 text-xs font-semibold uppercase tracking-wider text-yellow-300">
          Cookie Policy
        </p>
        <h1 className="mt-4 text-3xl font-black text-white sm:text-4xl">
          Cookie Policy
        </h1>
        <p className="mt-4 text-sm text-slate-400">
          Last updated: {new Date().toLocaleDateString('en-CA')}
        </p>
        <p className="mt-4 max-w-3xl text-slate-300">
          This Cookie Policy explains how Jobsite Finder uses cookies and similar technologies to enhance your experience on our platform.
        </p>
      </section>

      <section className="space-y-6">
        <div className="rounded-2xl border border-slate-800 bg-slate-950 p-6">
          <h2 className="text-xl font-bold text-white">What Are Cookies?</h2>
          <p className="mt-4 text-slate-300">
            Cookies are small text files stored on your device that help websites remember information about your visit. They may contain data like login credentials, preferences, or usage history.
          </p>
        </div>

        <div className="rounded-2xl border border-slate-800 bg-slate-950 p-6">
          <h2 className="text-xl font-bold text-white">Types of Cookies We Use</h2>

          <div className="mt-4 space-y-4">
            <div>
              <h3 className="font-semibold text-slate-100">Essential Cookies</h3>
              <p className="mt-2 text-slate-400">
                Required for basic platform functionality. These cookies enable login, session management, security features, and account access. They are necessary and cannot be disabled.
              </p>
              <ul className="mt-2 ml-4 space-y-1 list-disc text-slate-400">
                <li>Session identification</li>
                <li>Authentication tokens</li>
                <li>CSRF protection</li>
                <li>Security features</li>
              </ul>
            </div>

            <div>
              <h3 className="font-semibold text-slate-100">Login/Session Cookies</h3>
              <p className="mt-2 text-slate-400">
                Maintain your authenticated session while you navigate the platform. These expire when you log out or after a period of inactivity.
              </p>
            </div>

            <div>
              <h3 className="font-semibold text-slate-100">Analytics Cookies</h3>
              <p className="mt-2 text-slate-400">
                Help us understand how you use Jobsite Finder. We collect data on pages visited, features used, and time spent on the platform to improve user experience and identify issues.
              </p>
              <p className="mt-2 text-slate-400">
                These cookies may be managed through your browser settings or opt-out mechanisms where available.
              </p>
            </div>

            <div>
              <h3 className="font-semibold text-slate-100">Preference Cookies</h3>
              <p className="mt-2 text-slate-400">
                Remember your preferences such as display settings, notification choices, and language preferences to personalize your experience.
              </p>
            </div>
          </div>
        </div>

        <div className="rounded-2xl border border-slate-800 bg-slate-950 p-6">
          <h2 className="text-xl font-bold text-white">Third-Party Services</h2>
          <p className="mt-4 text-slate-300 mb-3">
            We use third-party services that may set their own cookies:
          </p>
          <ul className="ml-4 space-y-2 list-disc text-slate-300">
            <li><strong>Supabase:</strong> Authentication and database services</li>
            <li><strong>Payment Processor:</strong> Future payment processing if paid plans are introduced after beta</li>
            <li><strong>Analytics Providers:</strong> Usage and performance monitoring</li>
          </ul>
          <p className="mt-4 text-slate-300">
            Please review the privacy policies of these third parties for their cookie practices.
          </p>
        </div>

        <div className="rounded-2xl border border-slate-800 bg-slate-950 p-6">
          <h2 className="text-xl font-bold text-white">How to Manage Cookies</h2>
          <div className="mt-4 space-y-4 text-slate-300">
            <div>
              <h3 className="font-semibold text-slate-100 mb-2">Browser Settings</h3>
              <p className="text-slate-400">
                Most browsers allow you to control cookies through settings. You can:
              </p>
              <ul className="mt-2 ml-4 space-y-1 list-disc text-slate-400">
                <li>Accept all cookies</li>
                <li>Block all cookies</li>
                <li>Block third-party cookies only</li>
                <li>Be notified when cookies are set</li>
              </ul>
              <p className="mt-2 text-slate-400">
                Note: Disabling essential cookies may prevent you from using Jobsite Finder.
              </p>
            </div>

            <div>
              <h3 className="font-semibold text-slate-100 mb-2">Browser Do Not Track</h3>
              <p className="text-slate-400">
                Some browsers support a "Do Not Track" feature. While we may respect these signals, we cannot guarantee all third parties will honor them.
              </p>
            </div>

            <div>
              <h3 className="font-semibold text-slate-100 mb-2">Opt-Out Options</h3>
              <p className="text-slate-400">
                You may opt out of analytics cookies where available through our settings or third-party opt-out tools.
              </p>
            </div>
          </div>
        </div>

        <div className="rounded-2xl border border-slate-800 bg-slate-950 p-6">
          <h2 className="text-xl font-bold text-white">Your Privacy Rights</h2>
          <p className="mt-4 text-slate-300">
            We are committed to transparency and respect your privacy choices. Essential cookies cannot be disabled as they are required for platform functionality. However, you have control over analytics and preference cookies through your browser settings.
          </p>
        </div>

        <div className="rounded-2xl border border-slate-800 bg-slate-950 p-6">
          <h2 className="text-xl font-bold text-white">Contact</h2>
          <p className="mt-4 text-slate-300">
            For questions about our cookie practices, contact us at:
          </p>
          <div className="mt-3 text-slate-400">
            <p>Email: <a href="mailto:info@jobsitefinder.ca" className="text-yellow-400 hover:text-yellow-300">info@jobsitefinder.ca</a></p>
          </div>
        </div>
      </section>
    </div>
  )
}
