import { ChevronDown } from 'lucide-react'
import { useState } from 'react'

function FAQItem({ question, answer, isOpen, onToggle }) {
  return (
    <button
      onClick={onToggle}
      className="w-full text-left"
    >
      <div className="rounded-2xl border border-slate-800 bg-slate-950 p-6 transition-colors hover:bg-slate-900">
        <div className="flex items-center justify-between gap-4">
          <h3 className="text-lg font-semibold text-white">{question}</h3>
          <ChevronDown 
            className={`h-5 w-5 shrink-0 text-slate-400 transition-transform ${isOpen ? 'rotate-180' : ''}`}
          />
        </div>
        {isOpen && (
          <p className="mt-4 text-slate-300">
            {answer}
          </p>
        )}
      </div>
    </button>
  )
}

export default function FAQPage() {
  const [openItems, setOpenItems] = useState({})

  const toggleItem = (index) => {
    setOpenItems((prev) => ({
      ...prev,
      [index]: !prev[index],
    }))
  }

  const faqs = [
    {
      question: 'What is Jobsite Finder?',
      answer: 'Jobsite Finder is a map-first construction platform that connects workers, subcontractors, and general contractors through real active jobsites across Canada. Workers can browse live project locations, apply for jobs, and connect with hiring contractors. Contractors can post jobsites, manage hiring, and verify company credentials.',
    },
    {
      question: 'Is Jobsite Finder free for workers?',
      answer: 'Yes, worker accounts are completely free. Workers can create profiles, upload resumes, browse jobsites on the live map, and apply for jobs without any charge. There are no hidden fees for workers.',
    },
    {
      question: 'Can subcontractors create profiles?',
      answer: 'Yes, subcontractors can create company profiles and participate in project workflows. Contractor access is free during beta. Subscription plans are coming soon and will be announced before billing begins.',
    },
    {
      question: 'Can general contractors create jobsites?',
      answer: 'Yes, general contractors can claim and create jobsites, post hiring opportunities, and manage applications. General contractors must verify their company credentials. Contractor access is free during beta.',
    },
    {
      question: 'Is Jobsite Finder available across Canada?',
      answer: 'Jobsite Finder covers active jobsites across Canada, though we currently focus on major projects and high-activity regions. Our coverage continues to expand as more contractors and workers join the platform.',
    },
    {
      question: 'Why are Alberta major projects shown first?',
      answer: 'Alberta is a major market for construction activity in Canada, and our initial release focused on building verified data for major projects in high-activity provinces. As we expand, jobsite visibility across all regions will improve.',
    },
    {
      question: 'How does company verification work?',
      answer: 'General contractors must verify their company credentials and business information before posting jobsites. This may include providing business registration, tax ID, and contractor licensing information. Verification helps ensure platform integrity and protects workers from fraudulent postings.',
    },
    {
      question: 'Can contractors post hiring opportunities?',
      answer: 'Yes, both subcontractors and general contractors can post job opportunities tied to their jobsites. Workers can apply directly and receive responses from the hiring contractor.',
    },
    {
      question: 'When do paid plans start?',
      answer: 'Jobsite Finder is currently in free beta access. Subscription plans are coming soon, but billing and checkout are not active during beta. Workers remain free forever.',
    },
    {
      question: 'How do I contact support?',
      answer: 'You can reach us at joseph@jobsitefinder.ca or call (867) 393-1283. For detailed information, visit our Contact page. We typically respond within 24–48 business hours.',
    },
  ]

  return (
    <div className="space-y-8">
      <section className="rounded-3xl border border-slate-800 bg-slate-900 p-8 sm:p-10">
        <p className="inline-flex rounded-full border border-yellow-500/30 bg-yellow-500/10 px-3 py-1 text-xs font-semibold uppercase tracking-wider text-yellow-300">
          FAQ
        </p>
        <h1 className="mt-4 text-3xl font-black text-white sm:text-4xl">
          Frequently Asked Questions
        </h1>
        <p className="mt-4 max-w-3xl text-lg leading-relaxed text-slate-300">
          Find answers to common questions about Jobsite Finder, how it works, and our pricing.
        </p>
      </section>

      <section className="space-y-4">
        {faqs.map((faq, index) => (
          <FAQItem
            key={index}
            question={faq.question}
            answer={faq.answer}
            isOpen={openItems[index] || false}
            onToggle={() => toggleItem(index)}
          />
        ))}
      </section>

      <section className="rounded-2xl border border-yellow-500/20 bg-yellow-500/10 p-6">
        <h2 className="text-lg font-bold text-yellow-300">Didn't find what you're looking for?</h2>
        <p className="mt-3 text-slate-300">
          Check out our <a href="/community-guidelines" className="text-yellow-400 hover:text-yellow-300">Community Guidelines</a> for platform rules, or <a href="/contact" className="text-yellow-400 hover:text-yellow-300">contact us</a> directly for additional support.
        </p>
      </section>
    </div>
  )
}
