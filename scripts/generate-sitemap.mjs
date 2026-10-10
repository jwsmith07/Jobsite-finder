// Offline only: no environment files, credentials, database queries or submissions.
// Default/build mode checks the reviewed sitemap; --write explicitly regenerates it.
import { readFileSync, writeFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { PUBLIC_SITEMAP_ROUTES, canonicalUrl } from '../src/lib/seo.js'
const destination = resolve('public/sitemap.xml')
const xml = [
  '<?xml version="1.0" encoding="UTF-8"?>',
  '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">',
  ...PUBLIC_SITEMAP_ROUTES.map(route => `  <url>\n    <loc>${canonicalUrl(route)}</loc>\n  </url>`),
  '</urlset>',
  '',
].join('\n')
if (process.argv.includes('--write')) {
  writeFileSync(destination, xml)
  console.log(`Wrote ${PUBLIC_SITEMAP_ROUTES.length} reviewed public URLs to public/sitemap.xml (offline).`)
} else {
  const actual = readFileSync(destination, 'utf8').replace(/\r\n/g, '\n')
  if (actual !== xml) {
    console.error('Sitemap differs from reviewed public routes. Inspect changes, then run node scripts/generate-sitemap.mjs --write locally.')
    process.exitCode = 1
  } else console.log('Reviewed static sitemap check passed (no files written; no network access).')
}
