import { useEffect } from 'react'
import { DEFAULT_OG_IMAGE, SITE_NAME, canonicalUrl } from '../../lib/seo'

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
  structuredData,
}) {
  useEffect(() => {
    if (title) document.title = title
    if (description) {
      upsertMeta('meta[name="description"]', { name: 'description', content: description })
    }
    const url = canonicalUrl(path || window.location.pathname)
    upsertLink('link[rel="canonical"]', { rel: 'canonical', href: url })
    upsertMeta('meta[property="og:title"]', { property: 'og:title', content: title || SITE_NAME })
    upsertMeta('meta[property="og:description"]', { property: 'og:description', content: description || '' })
    upsertMeta('meta[property="og:url"]', { property: 'og:url', content: url })
    upsertMeta('meta[property="og:site_name"]', { property: 'og:site_name', content: SITE_NAME })
    upsertMeta('meta[property="og:type"]', { property: 'og:type', content: type })
    upsertMeta('meta[property="og:image"]', { property: 'og:image', content: image })
    upsertMeta('meta[name="twitter:card"]', { name: 'twitter:card', content: 'summary_large_image' })
    upsertMeta('meta[name="twitter:title"]', { name: 'twitter:title', content: title || SITE_NAME })
    upsertMeta('meta[name="twitter:description"]', { name: 'twitter:description', content: description || '' })
    upsertMeta('meta[name="twitter:image"]', { name: 'twitter:image', content: image })
    upsertJsonLd('jf-jsonld', structuredData)
  }, [title, description, path, image, type, structuredData])
  return null
}
