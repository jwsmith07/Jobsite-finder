export const SITE_URL = 'https://www.jobsitefinder.ca'
export const SITE_NAME = 'Jobsite Finder'
export const DEFAULT_OG_IMAGE = `${SITE_URL}/opengraph.jpg`
export const BRAND_SLOGAN = 'Built for the Trades. Powered by Real Jobsites.'

export const defaultDescription =
  'Connect construction work with real jobsites across Canada. Workers sign up free. General contractors and subcontractors of every business size are welcome.'

export const staticRouteMeta = {
  '/': {
    title: 'Construction Hiring & Jobsites | Jobsite Finder',
    description: defaultDescription,
    structuredData: ['organization', 'website'],
  },
  '/under-construction': {
    title: 'Jobsite Finder in Development | Launch Updates',
    description: 'Learn about Jobsite Finder, a construction hiring platform in development. Join the waitlist for updates for workers, general contractors and subcontractors.',
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
    description: 'Explore public construction project locations across Canada. View jobsite details and participating teams; a map listing does not mean the project is hiring.',
  },
  '/contact': {
    title: 'Contact | Jobsite Finder',
    description: 'Contact Joseph W. Smith and the Jobsite Finder team for beta access, support, and partnership inquiries.',
  },
  '/signin': {
    title: 'Sign In | Jobsite Finder',
    description: 'Sign in to your Jobsite Finder worker or contractor account.',
  },
  '/signup': {
    title: 'Worker & Contractor Sign Up | Jobsite Finder',
    description: 'Create your free worker or company profile. Choose Worker, General Contractor or Subcontractor to get started.',
  },
  '/forgot-password': {
    title: 'Reset Password | Jobsite Finder',
    description: 'Request a password reset link for your Jobsite Finder account.',
  },
  '/reset-password': {
    title: 'Set New Password | Jobsite Finder',
    description: 'Choose a new password for your Jobsite Finder account.',
  },
  '/faq': {
    title: 'FAQ | Jobsite Finder',
    description: 'Answers about worker accounts, contractor participation, project eligibility and Jobsite Finder’s construction hiring platform in development.',
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
  const cleanPath = String(pathname).split(/[?#]/)[0]
  const path = !cleanPath || cleanPath === '/' ? '/' : `/${cleanPath.replace(/^\/+|\/+$/g, '')}`
  return `${SITE_URL}${path}`
}

// These routes currently render public pages; redirected and private routes are excluded.
export const PUBLIC_SITEMAP_ROUTES = ['/', '/about', '/contact', '/jobsites', '/faq', '/privacy', '/terms']

export function isPublicSeoRoute(pathname) {
  return PUBLIC_SITEMAP_ROUTES.includes(pathname) || pathname === '/under-construction' || /^\/projects\/[^/]+$/.test(pathname)
}

export function robotsForPage(pathname, hostname) {
  // Preserve existing production public-page policy until release indexing is approved.
  return !['jobsitefinder.ca', 'www.jobsitefinder.ca'].includes(hostname) || !isPublicSeoRoute(pathname)
    ? 'noindex, nofollow'
    : null
}

export function socialImageUrl(image = DEFAULT_OG_IMAGE) {
  try {
    const url = new URL(image, `${SITE_URL}/`)
    return url.protocol === 'https:' ? url.href : DEFAULT_OG_IMAGE
  } catch {
    return DEFAULT_OG_IMAGE
  }
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
