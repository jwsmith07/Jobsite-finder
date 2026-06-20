export const SITE_URL = 'https://jobsitefinder.ca'
export const SITE_NAME = 'Jobsite Finder'
export const DEFAULT_OG_IMAGE = `${SITE_URL}/opengraph.jpg`
export const BRAND_SLOGAN = 'Built for the Trades. Powered by Real Jobsites.'

export const defaultDescription =
  'Discover construction jobsites, hiring companies, and job opportunities across Canada with Jobsite Finder.'

export const staticRouteMeta = {
  '/': {
    title: 'Jobsite Finder | Construction Jobsites Across Canada',
    description: 'Find active construction jobsites, open roles, and verified contractors across Canada.',
    structuredData: ['organization', 'website'],
  },
  '/about': {
    title: 'About Jobsite Finder',
    description: 'Learn about Jobsite Finder, a Canadian construction technology platform built for workers, subcontractors, and general contractors.',
  },
  '/pricing': {
    title: 'Pricing | Jobsite Finder',
    description: 'Jobsite Finder is offering free beta access. Subscription plans for contractors are coming soon.',
  },
  '/jobsites': {
    title: 'Jobsites Map | Jobsite Finder',
    description: 'Explore public construction jobsites across Canada and find projects with hiring activity.',
  },
  '/contact': {
    title: 'Contact | Jobsite Finder',
    description: 'Contact Joseph W. Smith and the Jobsite Finder team for beta access, support, and partnership inquiries.',
  },
  '/faq': {
    title: 'FAQ | Jobsite Finder',
    description: 'Answers to common questions about Jobsite Finder, public beta access, workers, contractors, jobsites, and pricing.',
  },
  '/community-guidelines': {
    title: 'Community Guidelines | Jobsite Finder',
    description: 'Review the community standards for using Jobsite Finder safely and professionally.',
  },
  '/privacy': {
    title: 'Privacy Policy | Jobsite Finder',
    description: 'Read how Jobsite Finder collects, uses, and protects personal information during public beta.',
  },
  '/terms': {
    title: 'Terms of Service | Jobsite Finder',
    description: 'Review the terms that apply to Jobsite Finder beta access and platform use.',
  },
  '/cookies': {
    title: 'Cookie Policy | Jobsite Finder',
    description: 'Learn how Jobsite Finder uses essential cookies and similar technologies.',
  },
  '/refund-policy': {
    title: 'Refund Policy | Jobsite Finder',
    description: 'Jobsite Finder billing is not active during free beta access. Review future refund policy terms.',
  },
  '/security': {
    title: 'Security | Jobsite Finder',
    description: 'Learn about Jobsite Finder account security, privacy controls, and responsible disclosure.',
  },
  '/accessibility': {
    title: 'Accessibility | Jobsite Finder',
    description: 'Review Jobsite Finder accessibility commitments and how to report accessibility barriers.',
  },
}

export function canonicalUrl(pathname = '/') {
  const path = pathname === '/' ? '/' : pathname.replace(/\/+$/, '')
  return `${SITE_URL}${path}`
}

export function organizationSchema() {
  return {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    name: SITE_NAME,
    url: SITE_URL,
    email: 'joseph@jobsitefinder.ca',
    telephone: '+1-867-393-1283',
    slogan: BRAND_SLOGAN,
    founder: {
      '@type': 'Person',
      name: 'Joseph W. Smith',
      jobTitle: 'Founder & CEO',
    },
  }
}

export function websiteSchema() {
  return {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    name: SITE_NAME,
    url: SITE_URL,
    description: defaultDescription,
  }
}

export function breadcrumbSchema(items) {
  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: items.map((item, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      name: item.name,
      item: canonicalUrl(item.path),
    })),
  }
}
