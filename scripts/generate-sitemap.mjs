import { createClient } from '@supabase/supabase-js'
import { writeFileSync } from 'node:fs'
import { join } from 'node:path'

const SITE_URL = (process.env.VITE_SITE_URL || 'https://jobsitefinder.ca').replace(/\/+$/, '')

const staticRoutes = [
  '/',
  '/about',
  '/pricing',
  '/contact',
  '/jobsites',
  '/faq',
  '/community-guidelines',
  '/privacy',
  '/terms',
  '/cookies',
  '/refund-policy',
  '/security',
  '/accessibility',
]

function urlEntry(path, priority = '0.7', changefreq = 'weekly') {
  return [
    '  <url>',
    `    <loc>${SITE_URL}${path}</loc>`,
    `    <changefreq>${changefreq}</changefreq>`,
    `    <priority>${priority}</priority>`,
    '  </url>',
  ].join('\n')
}

async function getDynamicRoutes() {
  const url = process.env.VITE_SUPABASE_URL
  const key = process.env.VITE_SUPABASE_ANON_KEY
  if (!url || !key) return []

  const supabase = createClient(url, key)
  const routes = []

  const { data: projects, error: projectsError } = await supabase
    .from('projects')
    .select('id')
    .eq('is_active', true)
    .eq('is_public_project', true)
    .eq('review_status', 'approved')
    .eq('is_public', true)
    .range(0, 4999)

  if (!projectsError) {
    for (const project of projects ?? []) routes.push(`/projects/${project.id}`)
  }

  const { data: companies, error: companiesError } = await supabase
    .from('company_profiles')
    .select('id')
    .eq('verified', true)
    .range(0, 4999)

  if (!companiesError) {
    for (const company of companies ?? []) routes.push(`/companies/${company.id}`)
  }

  return routes
}

const dynamicRoutes = await getDynamicRoutes().catch(() => [])
const urls = [
  ...staticRoutes.map((route) => urlEntry(route, route === '/' ? '1.0' : route === '/jobsites' ? '0.9' : '0.7')),
  ...dynamicRoutes.map((route) => urlEntry(route, route.startsWith('/projects/') ? '0.8' : '0.6')),
]

const xml = [
  '<?xml version="1.0" encoding="UTF-8"?>',
  '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">',
  ...urls,
  '</urlset>',
  '',
].join('\n')

writeFileSync(join(process.cwd(), 'public', 'sitemap.xml'), xml)
console.log(`Generated sitemap.xml with ${urls.length} URLs.`)
