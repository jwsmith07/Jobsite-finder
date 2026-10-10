import { useEffect } from 'react'
import { DEFAULT_OG_IMAGE, SITE_NAME, canonicalUrl, robotsForPage, socialImageUrl } from '../../lib/seo'

function upsertMeta(selector, attrs) {
  let tag = document.head.querySelector(selector)
  if (!tag) {
    tag = document.createElement('meta')
    document.head.appendChild(tag)
  }
  for (const [key, value] of Object.entries(attrs)) {
    tag.setAttribute(key, value)
  }
}

function upsertLink(selector, attrs) {
  let tag = document.head.querySelector(selector)
  if (!tag) {
    tag = document.createElement('link')
    document.head.appendChild(tag)
  }
  for (const [key, value] of Object.entries(attrs)) {
    tag.setAttribute(key, value)
  }
}

function upsertJsonLd(id, data) {
  let tag = document.head.querySelector(`#${id}`)
  if (!data) {
    if (tag) tag.remove()
    return
  }
  if (!tag) {
    tag = document.createElement('script')
    tag.id = id
    tag.type = 'application/ld+json'
    document.head.appendChild(tag)
  }
  tag.textContent = JSON.stringify(data)
}

export default function PageMeta({
  title,
  description,
  path,
  image = DEFAULT_OG_IMAGE,
  type = 'website',
  imageAlt,
  structuredData,
}) {
  useEffect(() => {
    if (title) document.title = title
    if (description) {
      upsertMeta('meta[name="description"]', { name: 'description', content: description })
    }
    const url = canonicalUrl(path || window.location.pathname)
    const robots = robotsForPage(window.location.pathname, window.location.hostname)
    if (robots) upsertMeta('meta[name="robots"]', { name: 'robots', content: robots })
    else document.head.querySelector('meta[name="robots"]')?.remove()
    const sharingImage = socialImageUrl(image)
    const sharingImageAlt = imageAlt || (sharingImage === DEFAULT_OG_IMAGE ? 'Jobsite Finder — Built for the Trades. Powered by Real Jobsites.' : 'Construction project image')
    upsertLink('link[rel="canonical"]', { rel: 'canonical', href: url })
    upsertMeta('meta[property="og:title"]', { property: 'og:title', content: title || SITE_NAME })
    upsertMeta('meta[property="og:description"]', { property: 'og:description', content: description || '' })
    upsertMeta('meta[property="og:url"]', { property: 'og:url', content: url })
    upsertMeta('meta[property="og:site_name"]', { property: 'og:site_name', content: SITE_NAME })
    upsertMeta('meta[property="og:type"]', { property: 'og:type', content: type })
    upsertMeta('meta[property="og:image"]', { property: 'og:image', content: sharingImage })
    upsertMeta('meta[property="og:image:alt"]', { property: 'og:image:alt', content: sharingImageAlt })
    upsertMeta('meta[name="twitter:card"]', { name: 'twitter:card', content: 'summary_large_image' })
    upsertMeta('meta[name="twitter:title"]', { name: 'twitter:title', content: title || SITE_NAME })
    upsertMeta('meta[name="twitter:description"]', { name: 'twitter:description', content: description || '' })
    upsertMeta('meta[name="twitter:image"]', { name: 'twitter:image', content: sharingImage })
    upsertMeta('meta[name="twitter:image:alt"]', { name: 'twitter:image:alt', content: sharingImageAlt })
    upsertJsonLd('jf-jsonld', structuredData)
  }, [title, description, path, image, imageAlt, type, structuredData])
  return null
}
