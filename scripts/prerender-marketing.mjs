// Offline, explicit allowlist only. Never import the router, auth or data services.
import { mkdir, readFile, writeFile } from 'node:fs/promises'
import { dirname, resolve } from 'node:path'
import { createServer } from 'vite'
import react from '@vitejs/plugin-react'
import { createElement } from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import { canonicalUrl, staticRouteMeta, organizationSchema, websiteSchema } from '../src/lib/seo.js'

// Add future approved public components here; never discover projects or routes.
export const marketingPages = [{ path: '/under-construction', component: '/src/pages/public/UnderConstructionPage.jsx' }]
const escape = value => value.replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
const server = await createServer({
  configFile: false, envDir: false, plugins: [react(), {
    name: 'offline-marketing-boundary',
    load(id) {
      const normalized = id.replace(/\\/g, '/')
      if (/\/src\/(services|hooks|app)\//.test(normalized) || /\/src\/lib\/(supabase|env)\./.test(normalized)) {
        throw new Error('Marketing prerender must not load backend, authentication or application modules')
      }
    },
  }],
  optimizeDeps: { noDiscovery: true, include: [], entries: [] },
  server: { middlewareMode: true, hmr: false }, appType: 'custom',
})
try {
  const template = await readFile('dist/index.html', 'utf8')
  for (const page of marketingPages) {
    const { default: Component } = await server.ssrLoadModule(page.component)
    const body = renderToStaticMarkup(createElement(Component, { staticPreview: true }))
    if ((body.match(/<h1\b/g) || []).length !== 1) throw new Error('Maintenance snapshot must contain exactly one H1')
    if (!template.includes('<div id="root"></div>')) throw new Error('Expected empty Vite root template')
    const meta = staticRouteMeta[page.path]
    let html = template.replace('<div id="root"></div>', () => `<div id="root" data-marketing-snapshot="maintenance">${body}</div>`)
    html = html.replace(/<title>[^<]*<\/title>/, `<title>${escape(meta.title)}</title>`)
    const update = (selector, content) => {
      const pattern = new RegExp(`(<meta ${selector} content=")[^"]*("[^>]*>)`)
      if (!pattern.test(html)) throw new Error(`Missing metadata template: ${selector}`)
      html = html.replace(pattern, (_, start, end) => `${start}${escape(content)}${end}`)
    }
    for (const selector of ['name="description"', 'property="og:description"', 'name="twitter:description"']) update(selector, meta.description)
    for (const selector of ['property="og:title"', 'name="twitter:title"']) update(selector, meta.title)
    update('property="og:url"', canonicalUrl(page.path))
    html = html.replace(/(<link rel="canonical" href=")[^"]*("[^>]*>)/, (_, start, end) => `${start}${canonicalUrl(page.path)}${end}`)
    const schema = JSON.stringify([organizationSchema(), websiteSchema()]).replace(/</g, '\\u003c')
    html = html.replace('</head>', `<script id="jf-jsonld" type="application/ld+json">${schema}</script>\n</head>`)
    const destination = resolve('dist', '.' + page.path, 'index.html')
    await mkdir(dirname(destination), { recursive: true })
    await writeFile(destination, html)
    if (page.path === '/under-construction') await writeFile('dist/index.html', html)
  }
  // The hosting SPA fallback continues to serve this public-only snapshot.
  // A sitemap subset is intentional: allowed legal/contact pages need not be listed.
  await writeFile('dist/sitemap.xml', `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${marketingPages.map(page => `  <url><loc>${canonicalUrl(page.path)}</loc></url>`).join('\n')}\n</urlset>\n`)
  const robots = await readFile('public/robots.txt', 'utf8')
  // Do not advertise unfinished discovery/public profiles during closed beta.
  const restricted = ['/about', '/pricing', '/faq', '/jobsites', '/projects/', '/companies/', '/resources']
  const filtered = robots.split(/\r?\n/).filter(line => !restricted.some(route => line === `Allow: ${route}`)).join('\n')
  await writeFile('dist/robots.txt', filtered.replace('Sitemap:', `${restricted.map(route => `Disallow: ${route}`).join('\n')}\n\nSitemap:`))
  console.log('Prerendered maintenance landing: one H1, offline schema and maintenance-only sitemap. No backend reads.')
} finally {
  await server.close()
}
