import { Link } from 'react-router-dom'
import { Check, HardHat } from 'lucide-react'

const workerPlan = {
  plan: 'Worker',
  price: 'Free',
  features: [
    'Create worker profile',
    'Upload resume',
    'Browse live jobsites map',
    'Apply to jobs',
    'Connect with hiring contractors',
  ],
}

const subcontractorPlans = [
  {
    plan: 'SC Basic',
    price: 'Free Beta Access',
    jobsites: 'Up to 2 jobsites',
    features: [
      'Company profile',
      'Job postings',
      'Worker applications',
      'Hiring dashboard',
      'Jobsite visibility on map',
    ],
  },
  {
    plan: 'SC Pro',
    price: 'Coming Soon',
    jobsites: 'Up to 5 jobsites',
    popular: true,
    features: [
      'Everything in Basic',
      'Priority jobsites map placement',
      'Hiring analytics',
      'Featured company profile',
      'Team management tools',
    ],
  },
  {
    plan: 'SC Enterprise',
    price: 'Coming Soon',
    jobsites: '10+ jobsites',
    features: [
      'Everything in Pro',
      'Advanced workforce analytics',
      'Unlimited team accounts',
      'Priority support',
      'Featured advertising opportunities',
      'Future API integrations',
    ],
  },
]

const generalContractorPlans = [
  {
    plan: 'GC Basic',
    price: 'Free Beta Access',
    jobsites: 'Up to 2 jobsites',
    features: [
      'Company profile',
      'Job postings',
      'Worker applications',
      'Hiring dashboard',
      'Ability to claim jobsites',
      'Verified GC badge',
    ],
  },
  {
    plan: 'GC Pro',
    price: 'Coming Soon',
    jobsites: 'Up to 5 jobsites',
    popular: true,
    features: [
      'Everything in Basic',
      'Create new jobsites on map',
      'Edit and manage jobsite information',
      'Update hiring status and project stages',
      'Manage subcontractor visibility',
      'Priority map placement',
    ],
  },
  {
    plan: 'GC Enterprise',
    price: 'Coming Soon',
    jobsites: '10+ jobsites',
    features: [
      'Everything in Pro',
      'Regional workforce management',
      'Enterprise onboarding',
      'Advanced reporting',
      'Dedicated support',
      'Enterprise project management tools',
    ],
  },
]

const contractorFeatures = [
  'Company profile',
  'Company logo and branding',
  'Job postings',
  'Worker applications',
  'Hiring dashboard',
  'Resume management',
  'Verified company badge',
  'Jobsite visibility on map',
  'Jobsite photo uploads',
  'Company contact information',
]

function FeatureList({ features, accent = 'text-amber-300' }) {
  return (
    <ul className="space-y-2.5">
      {features.map((feature) => (
        <li key={feature} className="flex items-start gap-3 text-sm text-slate-200">
          <Check className={`mt-0.5 h-4 w-4 shrink-0 ${accent}`} aria-hidden="true" />
          <span>{feature}</span>
        </li>
      ))}
    </ul>
  )
}

function PricingCard({ plan, price, jobsites, features, popular, variant }) {
  const isSubcontractor = variant === 'subcontractor'
  const checkClass = isSubcontractor ? 'text-emerald-300' : 'text-sky-300'
  const jobsitesClass = isSubcontractor ? 'text-emerald-200' : 'text-sky-200'
  const borderClass = popular
    ? isSubcontractor
      ? 'border-emerald-300/70 shadow-2xl shadow-emerald-500/10'
      : 'border-sky-300/70 shadow-2xl shadow-sky-500/10'
    : 'border-slate-800'
  const topRuleClass = isSubcontractor ? 'bg-emerald-400' : 'bg-sky-400'
  const badgeClass = isSubcontractor
    ? 'bg-emerald-400 text-slate-950'
    : 'bg-sky-400 text-slate-950'

  return (
    <article
      className={`relative flex h-full flex-col overflow-hidden rounded-2xl border bg-slate-950 p-6 ${borderClass}`}
    >
      <div className={`absolute inset-x-0 top-0 h-1 ${topRuleClass}`} />
      {popular && (
        <span
          className={`absolute right-5 top-5 rounded-full px-3 py-1 text-xs font-extrabold uppercase tracking-wide ${badgeClass}`}
        >
          Most Popular
        </span>
      )}

      <div className="pr-28">
        <h3 className="text-xl font-black text-white">{plan}</h3>
        <p className={`mt-2 text-sm font-bold ${jobsitesClass}`}>{jobsites}</p>
      </div>
      <p className="mt-5 text-3xl font-black tracking-tight text-white">{price}</p>

      <div className="mt-6">
        <p className="mb-3 text-xs font-bold uppercase tracking-wide text-slate-500">
          Features
        </p>
        <FeatureList features={features} accent={checkClass} />
      </div>
    </article>
  )
}

function PricingSection({ title, plans, variant }) {
  return (
    <section className="space-y-5">
      <div>
        <p className="text-xs font-extrabold uppercase tracking-wide text-amber-300">
          Contractor Pricing
        </p>
        <h2 className="mt-2 text-2xl font-black text-white sm:text-3xl">{title}</h2>
      </div>
      <div className="grid gap-4 lg:grid-cols-3">
        {plans.map((plan) => (
          <PricingCard key={plan.plan} {...plan} variant={variant} />
        ))}
      </div>
    </section>
  )
}

export default function PricingPage() {
  return (
    <div className="space-y-12">
      <section className="overflow-hidden rounded-3xl border border-slate-800 bg-slate-950">
        <div className="border-b border-slate-800 bg-slate-900 px-6 py-10 sm:px-10 sm:py-14">
          <p className="inline-flex rounded-full border border-amber-400/30 bg-amber-400/10 px-3 py-1 text-xs font-extrabold uppercase tracking-wide text-amber-200">
            Pricing
          </p>
          <h1 className="mt-5 max-w-4xl text-4xl font-black leading-tight text-white sm:text-5xl">
            Free beta access for construction teams
          </h1>
          <p className="mt-5 max-w-3xl text-base leading-relaxed text-slate-300 sm:text-lg">
            Jobsite Finder helps workers, subcontractors, and general contractors
            connect through a live map-based construction hiring ecosystem.
          </p>
          <p className="mt-3 max-w-3xl text-sm font-semibold text-amber-200">
            Subscription plans are coming soon. Billing and checkout are not active during beta.
          </p>
          <p className="mt-5 inline-flex rounded-xl bg-amber-400 px-4 py-2 text-sm font-extrabold text-slate-950">
            Worker accounts are always free.
          </p>
        </div>
      </section>

      <section>
        <article className="grid gap-6 rounded-2xl border border-amber-400/40 bg-slate-950 p-6 sm:grid-cols-[auto_1fr] sm:p-7">
          <span className="flex h-12 w-12 items-center justify-center rounded-xl bg-amber-400 text-slate-950">
            <HardHat size={24} aria-hidden="true" />
          </span>
          <div>
            <div className="flex flex-wrap items-end justify-between gap-3">
              <div>
                <p className="text-sm font-bold uppercase tracking-wide text-amber-300">
                  {workerPlan.plan}
                </p>
                <h2 className="mt-1 text-3xl font-black text-white">
                  {workerPlan.price}
                </h2>
              </div>
              <Link
                to="/signup"
                className="inline-flex rounded-xl bg-amber-400 px-5 py-3 text-sm font-extrabold text-slate-950 transition hover:bg-amber-300"
              >
                Create Free Worker Account
              </Link>
            </div>
            <div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {workerPlan.features.map((feature) => (
                <div
                  key={feature}
                  className="flex items-start gap-3 rounded-xl border border-slate-800 bg-slate-900 px-4 py-3 text-sm text-slate-200"
                >
                  <Check className="mt-0.5 h-4 w-4 shrink-0 text-amber-300" aria-hidden="true" />
                  <span>{feature}</span>
                </div>
              ))}
            </div>
          </div>
        </article>
      </section>

      <PricingSection
        title="Subcontractor Plans"
        plans={subcontractorPlans}
        variant="subcontractor"
      />

      <PricingSection
        title="General Contractor Plans"
        plans={generalContractorPlans}
        variant="general-contractor"
      />

      <section className="rounded-2xl border border-slate-800 bg-slate-950 p-6 sm:p-8">
        <h2 className="text-2xl font-black text-white sm:text-3xl">
          Included in Contractor Plans
        </h2>
        <div className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {contractorFeatures.map((feature) => (
            <div
              key={feature}
              className="flex items-start gap-3 rounded-xl border border-slate-800 bg-slate-900 px-4 py-3 text-sm text-slate-200"
            >
              <Check className="mt-0.5 h-4 w-4 shrink-0 text-amber-300" aria-hidden="true" />
              <span>{feature}</span>
            </div>
          ))}
        </div>
      </section>

      <section className="rounded-3xl border border-amber-400/40 bg-amber-400/10 px-6 py-10 text-center sm:px-10">
        <h2 className="mx-auto max-w-3xl text-3xl font-black text-white sm:text-4xl">
          Start building your construction workforce network
        </h2>
        <div className="mt-7 flex flex-col justify-center gap-3 sm:flex-row">
          <Link
            to="/signup"
            className="inline-flex items-center justify-center rounded-xl bg-amber-400 px-6 py-3 text-sm font-extrabold text-slate-950 transition hover:bg-amber-300"
          >
            Create Free Worker Account
          </Link>
          <Link
            to="/signup"
            className="inline-flex items-center justify-center rounded-xl border border-slate-700 bg-slate-950 px-6 py-3 text-sm font-bold text-white transition hover:border-amber-400/60"
          >
            Request Beta Access
          </Link>
        </div>
      </section>
    </div>
  )
}
