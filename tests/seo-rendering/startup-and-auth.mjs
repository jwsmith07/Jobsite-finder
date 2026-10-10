// Browser-only fixtures. No external traffic, database changes or real accounts.
import assert from 'node:assert/strict'
import { createServer } from 'node:http'
import { mkdir, readFile, stat, writeFile } from 'node:fs/promises'
import { resolve, sep, extname } from 'node:path'
import { chromium, expect } from '@playwright/test'

const root = resolve('dist'), evidence = resolve('.release-review/final-release')
await mkdir(evidence, { recursive: true })
const mime = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.png': 'image/png', '.webp': 'image/webp', '.svg': 'image/svg+xml' }
const server = createServer(async (req, res) => {
  try {
    let file = resolve(root, '.' + decodeURIComponent(new URL(req.url, 'http://localhost').pathname))
    if (!file.startsWith(root + sep)) file = resolve(root, 'index.html')
    try { if ((await stat(file)).isDirectory()) file = resolve(file, 'index.html') } catch { file = resolve(root, 'index.html') }
    res.setHeader('Content-Type', mime[extname(file)] || 'application/octet-stream')
    res.setHeader('X-Robots-Tag', 'noindex, nofollow')
    res.end(await readFile(file))
  } catch { res.writeHead(500).end() }
})
await new Promise(done => server.listen(0, '127.0.0.1', done))
const origin = `http://127.0.0.1:${server.address().port}`
const browser = await chromium.launch({ headless: true })
const results = [], errors = [], unexpected = []
const sleep = ms => new Promise(done => setTimeout(done, ms))
const user = { id: '11111111-1111-4111-8111-111111111111', aud: 'authenticated', role: 'authenticated', email: 'seo-regression@example.test', app_metadata: {}, user_metadata: { role: 'admin' }, created_at: '2026-01-01T00:00:00.000Z' }
function session(expired = false) {
  const expires = Math.floor(Date.now() / 1000) + (expired ? -3600 : 3600)
  const encode = value => Buffer.from(JSON.stringify(value)).toString('base64url')
  return { access_token: `${encode({ alg: 'HS256', typ: 'JWT' })}.${encode({ sub: user.id, role: 'authenticated', exp: expires })}.synthetic-signature`, refresh_token: 'synthetic-refresh-not-a-real-token', expires_in: 3600, expires_at: expires, token_type: 'bearer', user }
}
async function fixture(options = {}) {
  const context = await browser.newContext({ viewport: { width: options.width || 1440, height: 900 }, serviceWorkers: 'block' })
  const counters = { settings: 0, auth: 0, profiles: 0 }
  if (options.seedSession) await context.addInitScript(({ value, origin }) => {
    // Do not seed about:blank or third-party explainer frames.
    if (window === window.top && location.origin === origin) localStorage.setItem('sb-seo-review-auth-token', JSON.stringify(value))
  }, { value: options.seedSession, origin })
  await context.route('**/*', async route => {
    const req = route.request(), url = new URL(req.url())
    if (url.origin === origin) {
      if (url.pathname.endsWith('.js')) {
        if (options.moduleFailure) return route.abort()
        await sleep(options.moduleDelay ?? 700)
      }
      return route.continue()
    }
    if (url.pathname === '/rest/v1/site_settings' && req.method() === 'GET') {
      if (url.searchParams.get('key') === 'eq.maintenance_mode') {
        counters.settings++
        if (options.settingsFailure) return route.fulfill({ status: 503, contentType: 'application/json', body: '{"message":"Synthetic unavailable settings"}' })
        await sleep(options.settingsDelay || 0)
        return route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ value: options.maintenance ?? true }) }).catch(() => {})
      }
      if (url.searchParams.get('key') === 'eq.map_provider') return route.fulfill({ status: 200, contentType: 'application/json', body: '{"value":"maplibre"}' })
    }
    if (options.authMode && url.pathname === '/auth/v1/token' && req.method() === 'POST') {
      counters.auth++
      await sleep(options.authDelay || 0)
      if (options.authMode === 'success') {
        assert.equal(req.postDataJSON().email, user.email)
        return route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(session()) })
      }
      return route.fulfill({ status: 400, contentType: 'application/json', body: '{"code":"invalid_credentials","error":"invalid_grant","error_description":"Invalid login credentials"}' }).catch(() => {})
    }
    if (options.authMode && url.pathname === '/rest/v1/profiles' && req.method() === 'GET') {
      counters.profiles++
      // Auth metadata must not grant privileges when the DB profile has no role.
      return route.fulfill({ status: 200, contentType: 'application/json', body: 'null' })
    }
    if (/\/rest\/v1\/|\/auth\/v1\//.test(url.pathname)) unexpected.push(`${req.method()} ${url.pathname}`)
    return route.abort()
  })
  const page = await context.newPage()
  page.setDefaultTimeout(15000)
  page.on('pageerror', error => errors.push(error.message))
  page.on('console', message => { if (/hydration|Minified React error/i.test(message.text())) errors.push(message.text()) })
  return { context, page, counters }
}
try {
  for (const scenario of [
    { name: 'desktop-success', width: 1440 },
    { name: 'desktop-delay', width: 1440, settingsDelay: 1500 },
    { name: 'tablet-delay', width: 768, settingsDelay: 1500 },
    { name: 'mobile-delay', width: 360, settingsDelay: 1500 },
    { name: 'homepage-delay', path: '/', settingsDelay: 1500 },
    { name: 'settings-timeout', settingsDelay: 5000 },
    { name: 'settings-failure', settingsFailure: true },
    { name: 'scroll-preserved', settingsDelay: 1500, scroll: 1200 },
    { name: 'expired-session-delay', seedSession: session(true), authMode: 'error', authDelay: 1500 },
    { name: 'expired-session-timeout', seedSession: session(true), authMode: 'error', authDelay: 5000 },
    { name: 'bundle-unavailable', moduleFailure: true },
  ]) {
    const { context, page, counters } = await fixture(scenario)
    await page.addInitScript(() => {
      window.startupEvidence = { active: false, samples: [], cls: 0 }
      new PerformanceObserver(list => {
        for (const entry of list.getEntries()) if (!entry.hadRecentInput && window.startupEvidence.active) window.startupEvidence.cls += entry.value
      }).observe({ type: 'layout-shift', buffered: true })
      const sample = () => {
        if (window.startupEvidence.active) window.startupEvidence.samples.push({
          time: performance.now(), h1: document.querySelectorAll('h1').length,
          roots: document.querySelectorAll('#root').length,
          loading: document.getElementById('root')?.textContent.includes('Loading Jobsite Finder...') || false,
          snapshot: !!document.querySelector('[data-marketing-snapshot]'),
          height: document.documentElement.scrollHeight, scrollY,
        })
        requestAnimationFrame(sample)
      }
      requestAnimationFrame(sample)
    })
    await page.goto(origin + (scenario.path || '/under-construction'), { waitUntil: 'commit' })
    await page.waitForFunction(() => {
      const landing = document.querySelector('#root > div')
      return landing && getComputedStyle(landing).backgroundColor === 'rgb(15, 18, 22)'
    })
    await expect(page.locator('[data-marketing-snapshot]')).toHaveCount(1)
    const initial = await page.evaluate(scroll => {
      if (scroll) window.scrollTo(0, scroll)
      window.startupEvidence.active = true
      return { height: document.documentElement.scrollHeight, scrollY }
    }, scenario.scroll || 0)
    await page.screenshot({ path: resolve(evidence, scenario.name + '-initial.png') })
    if (scenario.moduleFailure) {
      await page.waitForTimeout(1200)
      await expect(page.locator('[data-marketing-snapshot]')).toHaveCount(1)
      await expect(page.getByRole('button', { name: 'Join Waitlist', exact: true })).toBeDisabled()
    } else {
      if (scenario.settingsDelay === 1500 || scenario.authDelay === 1500) {
        await page.waitForTimeout(850)
        await expect(page.locator('[data-marketing-snapshot]')).toHaveCount(1)
        await page.screenshot({ path: resolve(evidence, scenario.name + '-initializing.png') })
      }
      await expect(page.getByRole('button', { name: 'Join Waitlist', exact: true })).toBeEnabled()
      await expect(page.locator('[data-marketing-snapshot]')).toHaveCount(0)
      // An expired-session refresh can hold the SDK's settings request queue
      // past the existing 4s settings timeout; the fallback still fails closed.
      if (!scenario.authDelay || scenario.authDelay < 4000) assert.ok(counters.settings > 0, 'Maintenance settings request actually ran')
      if (scenario.authMode) assert.ok(counters.auth > 0, 'Expired-session path actually ran')
    }
    await page.waitForTimeout(200)
    const data = await page.evaluate(() => window.startupEvidence)
    assert.ok(data.samples.length > 0)
    for (const sample of data.samples) {
      assert.equal(sample.h1, 1, `${scenario.name}: one H1 throughout initialization`)
      assert.equal(sample.roots, 1, 'One connected root throughout initialization')
      assert.equal(sample.loading, false, 'No visible loading screen')
      assert.ok(Math.abs(sample.height - initial.height) <= 1, `${scenario.name}: no document-height collapse (${sample.height} vs ${initial.height})`)
      assert.ok(Math.abs(sample.scrollY - initial.scrollY) <= 1, 'Scroll position preserved')
    }
    assert.ok(data.cls <= 0.01, `Controlled startup CLS ${data.cls}`)
    await expect(page.locator('head meta[name="msvalidate.01"]')).toHaveAttribute('content', 'ADE257E16E03BAE1931E14672A5AE938')
    await expect(page.locator('link[rel="canonical"]')).toHaveAttribute('href', 'https://www.jobsitefinder.ca/under-construction')
    await page.screenshot({ path: resolve(evidence, scenario.name + '-final.png') })
    const handoff = data.samples.find(sample => !sample.snapshot)
    const result = { name: scenario.name, viewport: scenario.width || 1440, visibleLoadingMs: 0, height: initial.height, cls: data.cls, handoffMs: handoff?.time ?? null, counters, samples: data.samples }
    results.push(result)
    console.log(`PASS ${scenario.name}: zero loading gap, one H1, stable height ${initial.height}px, CLS ${data.cls}`)
    await context.close()
  }
  for (const path of ['/admin', '/admin/projects', '/gc/dashboard', '/sc/dashboard', '/worker/dashboard', '/signup', '/projects/not-a-real-seo-fixture']) {
    const { context, page } = await fixture({ moduleDelay: 0 })
    await page.goto(origin + path)
    await page.waitForURL(origin + (path.startsWith('/admin') ? '/signin' : '/under-construction'))
    await expect(page.locator('h1')).toHaveCount(1)
    console.log(`PASS anonymous maintenance/auth guard ${path}`)
    await context.close()
  }
  for (const mode of ['error', 'success']) {
    const { context, page, counters } = await fixture({ authMode: mode, moduleDelay: 0 })
    await page.goto(origin + '/signin')
    await expect(page.getByRole('heading', { name: 'Sign in', exact: true })).toBeVisible()
    await page.getByPlaceholder('Email', { exact: true }).fill(user.email)
    await page.getByPlaceholder('Password', { exact: true }).fill('synthetic-test-password')
    await page.getByRole('button', { name: 'Sign in', exact: true }).click()
    if (mode === 'error') {
      await expect(page.getByText('Email or password did not match. Please try again.')).toBeVisible()
      assert.equal(new URL(page.url()).pathname, '/signin')
    } else {
      await page.waitForURL(origin + '/onboarding/select-role')
      await expect(page.getByRole('heading', { name: 'Choose your account type' })).toBeVisible()
      assert.ok(counters.profiles > 0, 'Role resolved from database profile fixture')
      await page.goto(origin + '/admin')
      await page.waitForURL(origin + '/onboarding/select-role')
      await expect(page.getByRole('heading', { name: 'Choose your account type' })).toBeVisible()
    }
    assert.equal(counters.auth, 1, 'One mock sign-in, no duplicate handlers')
    console.log(`PASS sign-in ${mode}${mode === 'success' ? ' and rejection of admin user_metadata without DB role' : ''}`)
    await context.close()
  }
  // The maintenance flag's false branch still defers private access to auth.
  const { context, page } = await fixture({ maintenance: false, moduleDelay: 0 })
  await page.goto(origin + '/gc/dashboard')
  await page.waitForURL(origin + '/signin')
  await expect(page.getByRole('heading', { name: 'Sign in', exact: true })).toBeVisible()
  await context.close()
  console.log('PASS auth guard still rejects private access when maintenance is disabled')
  assert.deepEqual(errors, [], 'No browser or hydration errors')
  assert.deepEqual(unexpected, [], 'No unexpected auth/private-data requests')
  await writeFile(resolve(evidence, 'startup-results.json'), JSON.stringify(results, null, 2) + '\n')
  console.log('PASS startup, maintenance and authentication regressions; zero external requests sent')
} finally {
  await browser.close()
  await new Promise(done => server.close(done))
}
