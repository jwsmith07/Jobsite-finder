// Built-artifact regression test. External traffic is intercepted; no backend writes.
import assert from 'node:assert/strict'
import { readFile, stat } from 'node:fs/promises'
import { createServer } from 'node:http'
import { resolve, extname, sep } from 'node:path'
import { chromium, expect } from '@playwright/test'
import { canonicalUrl, staticRouteMeta } from '../../src/lib/seo.js'

const root = resolve('dist')
const html = await readFile(resolve(root, 'index.html'), 'utf8')
const source = await readFile('index.html', 'utf8')
assert.equal(await readFile(resolve(root, 'under-construction/index.html'), 'utf8'), html, 'Direct maintenance artifact matches SPA fallback')
const meta = staticRouteMeta['/under-construction']
assert.equal((html.match(/<h1\b/g) || []).length, 1)
assert.ok(html.includes('Find Construction Jobs. Connect With Real Jobsites.'))
assert.ok(html.includes('not currently available for public use'))
assert.ok(!html.includes('$999'))
assert.ok(!html.includes('platform-preview-mockup'), 'No unverified preview references in initial HTML')
for (const tag of source.match(/<meta[^>]+(?:msvalidate\.01|google-site-verification)[^>]*>/g) || []) assert.ok(html.includes(tag), 'Verification tag preserved')
assert.equal((html.match(/name="msvalidate\.01"/g) || []).length, 1)
assert.ok(html.indexOf('ADE257E16E03BAE1931E14672A5AE938') < html.indexOf('</head>'))
assert.ok(html.includes('G-DKTKBS8JFY'))
assert.ok(html.includes(`href="${canonicalUrl('/under-construction')}"`))
assert.equal(new URL(canonicalUrl('/under-construction')).hostname, 'www.jobsitefinder.ca')
assert.ok(!html.includes('https://jobsitefinder.ca'), 'No apex URL signals in initial HTML')
assert.ok(html.includes('preparing a closed beta'))
assert.ok(html.includes('first activates hiring tools on its first jobsite'))
assert.ok(html.includes('$99 CAD per active jobsite per month, for your company'))
for (const name of ['platform-preview-mockup.png', 'platform-preview-mockup.webp', 'platform-preview-mockup-mobile.webp']) {
  await assert.rejects(stat(resolve(root, 'assets', name)), { code: 'ENOENT' }, 'Unverified preview excluded from deployable assets')
}
const sitemap = await readFile(resolve(root, 'sitemap.xml'), 'utf8')
assert.deepEqual([...sitemap.matchAll(/<loc>(.*?)<\/loc>/g)].map(m => m[1]), [canonicalUrl('/under-construction')])
const robots = await readFile(resolve(root, 'robots.txt'), 'utf8')
assert.ok(robots.includes('Sitemap: https://www.jobsitefinder.ca/sitemap.xml'))
assert.ok(!robots.includes('https://jobsitefinder.ca'))
for (const path of ['/projects/', '/jobsites', '/pricing', '/admin', '/signin', '/tests/']) assert.ok(robots.includes(`Disallow: ${path}`))

const mime = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.png': 'image/png', '.webp': 'image/webp', '.svg': 'image/svg+xml', '.xml': 'application/xml' }
const server = createServer(async (req, res) => {
  try {
    const pathname = decodeURIComponent(new URL(req.url, 'http://localhost').pathname)
    let file = resolve(root, '.' + pathname)
    if (!file.startsWith(root + sep)) file = resolve(root, 'index.html')
    try { if ((await stat(file)).isDirectory()) file = resolve(file, 'index.html') } catch { file = resolve(root, 'index.html') }
    res.setHeader('Content-Type', mime[extname(file)] || 'application/octet-stream')
    res.setHeader('X-Robots-Tag', 'noindex, nofollow') // Local tests never indexable.
    res.end(await readFile(file))
  } catch { res.writeHead(500).end() }
})
await new Promise(done => server.listen(0, '127.0.0.1', done))
const origin = `http://127.0.0.1:${server.address().port}`
const browser = await chromium.launch({ headless: true })
const errors = [], unexpectedData = []
let settingReads = 0
async function contextFor(javaScriptEnabled, width) {
  const context = await browser.newContext({ javaScriptEnabled, viewport: { width, height: 900 }, serviceWorkers: 'block' })
  await context.route('**/*', route => {
    const req = route.request(), url = new URL(req.url())
    if (url.origin === origin) return route.continue()
    if (req.method() === 'GET' && url.pathname === '/rest/v1/site_settings' && url.searchParams.get('key') === 'eq.maintenance_mode') {
      settingReads++
      return route.fulfill({ status: 200, contentType: 'application/json', body: '{"value":true}' })
    }
    if (req.method() === 'GET' && url.pathname === '/rest/v1/site_settings' && url.searchParams.get('key') === 'eq.map_provider') {
      return route.fulfill({ status: 200, contentType: 'application/json', body: '{"value":"maplibre"}' })
    }
    if (/\/rest\/v1\/|\/auth\/v1\//.test(url.pathname)) unexpectedData.push(url.pathname)
    return route.abort()
  })
  const page = await context.newPage()
  await page.addInitScript(() => {
    window.maximumH1Count = 0
    new MutationObserver(() => {
      window.maximumH1Count = Math.max(window.maximumH1Count, document.querySelectorAll('h1').length)
    }).observe(document, { childList: true, subtree: true })
  })
  page.on('pageerror', error => errors.push(error.message))
  page.on('console', message => { if (/hydration|Minified React error/i.test(message.text())) errors.push(message.text()) })
  return { context, page }
}
try {
  for (const width of [360, 768, 1440]) {
    for (const js of [false, true]) {
      const { context, page } = await contextFor(js, width)
      await page.goto(origin + '/under-construction')
      await expect(page.locator('h1')).toHaveCount(1)
      await expect(page.locator('h1')).toHaveText('Find Construction Jobs. Connect With Real Jobsites.')
      if (js) await expect(page.getByRole('button', { name: 'Join Waitlist', exact: true })).toBeEnabled()
      else await expect(page.getByRole('button', { name: 'Join Waitlist', exact: true })).toBeDisabled()
      await expect(page.locator('[data-explainer-state]')).toHaveAttribute('data-explainer-state', 'loading')
      await expect(page.locator('iframe[src*="scrimba.com"]')).toHaveAttribute('src', 'https://scrimba.com/explain/guide0o93ighc7')
      await expect(page.getByRole('link', { name: 'Open explainer' })).toHaveAttribute('href', 'https://scrimba.com/explain/guide0o93ighc7')
      await expect(page).toHaveTitle(meta.title)
      await expect(page.locator('meta[name="description"]')).toHaveAttribute('content', meta.description)
      await expect(page.locator('meta[name="msvalidate.01"]')).toHaveCount(1)
      await expect(page.locator('head meta[name="msvalidate.01"]')).toHaveAttribute('content', 'ADE257E16E03BAE1931E14672A5AE938')
      await expect(page.locator('meta[name="google-site-verification"]')).toHaveCount(0)
      await expect(page.locator('link[rel="canonical"]')).toHaveAttribute('href', canonicalUrl('/under-construction'))
      assert.equal(await page.locator('#jf-jsonld').count(), 1)
      const schema = JSON.parse(await page.locator('#jf-jsonld').textContent())
      assert.deepEqual(schema.map(item => item['@type']), ['Organization', 'WebSite'])
      for (const item of schema) assert.equal(item.url, 'https://www.jobsitefinder.ca')
      assert.ok(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth), `No horizontal overflow ${width} JS=${js}`)
      const cards = page.getByRole('heading', { name: 'Planned tools for workers', exact: true }).locator('xpath=ancestor::div[contains(@class,"grid")][1]')
      const layout = await cards.evaluate(e => ({ columns: getComputedStyle(e).gridTemplateColumns.split(' ').length, widths: [...e.children].map(c => c.getBoundingClientRect().width) }))
      assert.equal(layout.columns, width >= 1024 ? 2 : 1, 'Balanced desktop pair; stacked cards below desktop')
      assert.equal(layout.widths.length, 2)
      assert.ok(Math.abs(layout.widths[0] - layout.widths[1]) < 1, 'Feature cards have equal widths')
      if (width === 360) {
        for (const selector of ['[aria-labelledby="planned-overview-heading"] .grid p:first-of-type', '#pricing p.mt-6.text-base', 'main .grid.lg\\:grid-cols-2 > div > p']) {
          const typography = await page.locator(selector).evaluateAll(es => es.map(e => ({ size: parseFloat(getComputedStyle(e).fontSize), line: parseFloat(getComputedStyle(e).lineHeight) })))
          assert.ok(typography.length > 0, 'Mobile supporting text selected')
          for (const t of typography) { assert.ok(t.size >= 16); assert.ok(t.line >= t.size * 1.5) }
        }
      }
      const heading = await page.locator('h1').boundingBox()
      assert.ok(heading.width <= width)
      if (js) {
        await expect(page.locator('img[src*="platform-preview"]')).toHaveCount(0)
        await expect(page.getByRole('button', { name: 'Open larger platform preview' })).toHaveCount(0)
        await expect(page.locator('h1')).toHaveCount(1)
        assert.equal(await page.evaluate(() => window.maximumH1Count), 1, 'No duplicate H1 during startup or interaction')
      }
      console.log(`PASS maintenance HTML/content/metadata/layout ${width}px JS=${js}`)
      await context.close()
    }
  }
  for (const mode of ['ready', 'empty-response']) {
    const { context, page } = await contextFor(true, 360)
    await page.route('https://scrimba.com/**', route => route.fulfill({ status: 200, contentType: 'text/html', body: mode === 'ready' ? '<body style="background:#0f1216;color:#fde68a">Local player fixture<script>setTimeout(()=>parent.postMessage({type:"scrimba:embed-watching"},"*"),500)</script>' : '<body></body>' }))
    await page.goto(origin + '/under-construction')
    await expect(page.getByRole('button', { name: 'Join Waitlist', exact: true })).toBeEnabled()
    const embed = page.locator('[data-explainer-state]')
    await embed.scrollIntoViewIfNeeded()
    if (mode === 'ready') {
      await expect(embed).toHaveAttribute('data-explainer-state', 'ready')
      await expect(embed.locator('iframe')).toHaveAttribute('aria-hidden', 'false')
    } else {
      await page.evaluate(() => {
        const frame = document.querySelector('[data-explainer-state] iframe')
        window.dispatchEvent(new MessageEvent('message', { origin: 'https://example.test', source: frame.contentWindow, data: { type: 'scrimba:embed-watching' } }))
        window.dispatchEvent(new MessageEvent('message', { origin: 'https://scrimba.com', source: window, data: { type: 'scrimba:embed-watching' } }))
      })
      await expect(embed).toHaveAttribute('data-explainer-state', 'loading')
      await expect(embed.locator('iframe')).toHaveCSS('opacity', '0')
      const before = await embed.boundingBox()
      await expect(embed).toHaveAttribute('data-explainer-state', 'fallback', { timeout: 15000 })
      await expect(embed.locator('iframe')).toHaveCount(0)
      await expect(embed.getByRole('link', { name: 'Open explainer' })).toBeVisible()
      assert.equal((await embed.boundingBox()).height, before.height, 'Fallback keeps reserved height')
      await embed.getByRole('button', { name: 'Retry' }).click()
      await expect(embed).toHaveAttribute('data-explainer-state', 'loading')
      await expect(embed.locator('iframe')).toHaveCount(1)
    }
    console.log('PASS explainer ' + mode + ': readiness / spoof rejection / stable fallback / retry')
    await context.close()
  }
  for (const path of ['/signin', '/privacy', '/terms', '/contact']) {
    const { context, page } = await contextFor(true, 1280)
    await page.goto(origin + path)
    await expect(page).toHaveTitle(staticRouteMeta[path].title)
    assert.equal(new URL(page.url()).pathname, path, 'Existing allowed route remains accessible')
    await expect(page.locator('h1')).toHaveCount(1)
    console.log(`PASS existing maintenance exception ${path}`)
    await context.close()
  }
  for (const path of ['/', '/jobsites', '/pricing', '/faq', '/projects/seo-test-not-a-real-project', '/gc/dashboard', '/signup']) {
    const { context, page } = await contextFor(true, 1280)
    await page.goto(origin + path)
    await page.waitForURL(origin + '/under-construction')
    await expect(page.locator('h1')).toHaveCount(1)
    await expect(page.getByRole('button', { name: 'Join Waitlist', exact: true })).toBeEnabled()
    console.log(`PASS closed-beta anonymous guard ${path}`)
    await context.close()
  }
  assert.ok(settingReads > 0, 'Real settings reader exercised with intercepted local fixture')
  assert.deepEqual(unexpectedData, [], 'No auth/project/private-data requests')
  assert.deepEqual(errors, [], 'No JavaScript or hydration errors')
  console.log('PASS initial HTML, verification tags, schema, maintenance sitemap/robots and all browser checks. Zero external requests sent.')
} finally {
  await browser.close()
  await new Promise(done => server.close(done))
}
