export default function RefundPolicyPage() {
  return (
    <div className="space-y-8">
      <section className="rounded-3xl border border-slate-800 bg-slate-900 p-8 sm:p-10">
        <p className="inline-flex rounded-full border border-yellow-500/30 bg-yellow-500/10 px-3 py-1 text-xs font-semibold uppercase tracking-wider text-yellow-300">
          Refund Policy
        </p>
        <h1 className="mt-4 text-3xl font-black text-white sm:text-4xl">
          Refund Policy
        </h1>
        <p className="mt-4 text-sm text-slate-400">
          Last updated: {new Date().toLocaleDateString('en-CA')}
        </p>
        <p className="mt-4 max-w-3xl text-slate-300">
          This Refund Policy explains Jobsite Finder's beta billing status and future refund approach.
        </p>
      </section>

      <section className="space-y-6">
        <div className="rounded-2xl border border-blue-900/50 bg-blue-950/30 p-6">
          <p className="text-sm text-slate-300">
            <span className="font-semibold text-blue-300">Beta Status:</span> Jobsite Finder is currently in free beta access. Billing, checkout, paid subscriptions, and subscription charges are not active.
          </p>
        </div>

        <div className="rounded-2xl border border-slate-800 bg-slate-950 p-6">
          <h2 className="text-xl font-bold text-white">Monthly Subscriptions</h2>
          <div className="mt-4 space-y-3 text-slate-300">
            <p>
              Monthly subscriptions are not active during beta. When paid plans launch:
            </p>
            <ul className="ml-4 space-y-2 list-disc text-slate-400">
              <li>You can cancel anytime before your renewal date</li>
              <li>Cancellation takes effect at the end of your current billing period</li>
              <li>No refund is issued for the current month</li>
              <li>You retain platform access until the end of your billing period</li>
              <li>To cancel, visit your account settings or contact support</li>
            </ul>
          </div>
        </div>

        <div className="rounded-2xl border border-slate-800 bg-slate-950 p-6">
          <h2 className="text-xl font-bold text-white">Annual Subscriptions</h2>
          <div className="mt-4 space-y-3 text-slate-300">
            <p>
              For annual subscription plans (when offered):
            </p>
            <ul className="ml-4 space-y-2 list-disc text-slate-400">
              <li>You can cancel within 30 days of purchase for a full refund</li>
              <li>After 30 days, no refund is issued</li>
              <li>Cancellation takes effect at the end of your annual billing period</li>
              <li>You retain platform access until your annual term ends</li>
            </ul>
          </div>
        </div>

        <div className="rounded-2xl border border-slate-800 bg-slate-950 p-6">
          <h2 className="text-xl font-bold text-white">Beta &amp; Free Trial Access</h2>
          <p className="mt-4 text-slate-300">
            During beta testing, contractor access is free. No refund is applicable for free beta access. Subscription plans are coming soon and will be announced before any billing begins.
          </p>
        </div>

        <div className="rounded-2xl border border-slate-800 bg-slate-950 p-6">
          <h2 className="text-xl font-bold text-white">Founding Member Discounts</h2>
          <p className="mt-4 text-slate-300">
            Founding member discounts may be available after beta. Any paid terms will be published before subscriptions become active.
          </p>
        </div>

        <div className="rounded-2xl border border-slate-800 bg-slate-950 p-6">
          <h2 className="text-xl font-bold text-white">Refund Request Process</h2>
          <div className="mt-4 space-y-3 text-slate-300">
            <p>
              To request a refund:
            </p>
            <ol className="ml-4 space-y-2 list-decimal text-slate-400">
              <li>Email us at <a href="mailto:joseph@jobsitefinder.ca" className="text-yellow-400 hover:text-yellow-300">joseph@jobsitefinder.ca</a> with your account details</li>
              <li>Include the reason for your refund request</li>
              <li>We will respond within 5–7 business days</li>
              <li>If approved, refunds are processed within 7–10 business days</li>
              <li>Refunds are issued to your original payment method</li>
            </ol>
          </div>
        </div>

        <div className="rounded-2xl border border-slate-800 bg-slate-950 p-6">
          <h2 className="text-xl font-bold text-white">No Refund Conditions</h2>
          <p className="mt-4 text-slate-300 mb-3">
            Refunds will not be issued for:
          </p>
          <ul className="ml-4 space-y-2 list-disc text-slate-300">
            <li>Usage beyond the 30-day refund window for annual plans</li>
            <li>Subscription cancellations and re-subscriptions</li>
            <li>Account suspensions or terminations due to policy violations</li>
            <li>Changes to subscription features or pricing</li>
            <li>User error or accidental purchases</li>
            <li>Third-party charges or service provider fees</li>
          </ul>
        </div>

        <div className="rounded-2xl border border-slate-800 bg-slate-950 p-6">
          <h2 className="text-xl font-bold text-white">Billing Disputes</h2>
          <p className="mt-4 text-slate-300">
            If you notice unauthorized charges or billing errors, contact us immediately at <a href="mailto:joseph@jobsitefinder.ca" className="text-yellow-400 hover:text-yellow-300">joseph@jobsitefinder.ca</a>. We will investigate and resolve legitimate disputes.
          </p>
        </div>

        <div className="rounded-2xl border border-slate-800 bg-slate-950 p-6">
          <h2 className="text-xl font-bold text-white">Taxes &amp; Currency</h2>
          <p className="mt-4 text-slate-300">
            Future paid plans are expected to be displayed in Canadian Dollars (CAD) and may exclude applicable taxes. No paid billing is active during beta.
          </p>
        </div>

        <div className="rounded-2xl border border-slate-800 bg-slate-950 p-6">
          <h2 className="text-xl font-bold text-white">Policy Changes</h2>
          <p className="mt-4 text-slate-300">
            Jobsite Finder may update this refund policy at any time. Changes take effect upon posting. Your continued use of the platform indicates acceptance of updated terms.
          </p>
        </div>

        <div className="rounded-2xl border border-slate-800 bg-slate-950 p-6">
          <h2 className="text-xl font-bold text-white">Contact</h2>
          <p className="mt-4 text-slate-300">
            For refund requests or billing questions, contact us at:
          </p>
          <div className="mt-3 text-slate-400">
            <p>Email: <a href="mailto:joseph@jobsitefinder.ca" className="text-yellow-400 hover:text-yellow-300">joseph@jobsitefinder.ca</a></p>
          </div>
        </div>
      </section>
    </div>
  )
}
