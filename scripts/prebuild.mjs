// Run the marketing policy and existing sitemap check before Vite.
await import('./check-marketing-claims.mjs')
await import('./generate-sitemap.mjs')
