// Offline marketing policy gate. Historical audits and negative product-policy
// instructions are not promotional copy; scan application/public content instead.
import assert from 'node:assert/strict'
import { readdir, readFile, stat } from 'node:fs/promises'
import { extname, join } from 'node:path'

function normalize(value) {
  return value.replace(/&(?:eacute|#233|#xe9);/gi, 'e')
    .normalize('NFD').replace(/\p{M}/gu, '').toLowerCase()
    .replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ')
}
function claims(value) {
  const text = normalize(value), found = []
  const names = /\b(?:resumes?|cvs?|curriculum vitae)[\s_-]*(?:builders?|makers?|generators?|creators?|designers?|writing tools?|creation tools?|building|creation|generation)\b/g
  for (const match of text.matchAll(names)) found.push(match[0])
  const actions = /\b(?:build|building|create|creating|generate|generating|design|designing|make|making|write|writing|compose|craft)(?:\s+[a-z]+){0,6}\s+(?:resumes?|cvs?|curriculum vitae)\b/g
  for (const match of text.matchAll(actions)) {
    // Profile creation plus upload of an existing document is supported.
    if (/\b(?:upload|uploads|uploading|attach|attaching)\b/.test(match[0])) continue
    const following = text.slice(match.index + match[0].length)
    if (/^\s+(?:uploads?|uploading|attachments?|access|signed urls?)\b/.test(following)) continue
    found.push(match[0])
  }
  return found
}

for (const phrase of ['Resume builder', 'résumé builder', 're\u0301sume\u0301-builder', 'CV generator', 'Build your resume', 'Create profiles and resumes', 'Generate a professional curriculum vitae', 'Build and share a resume', 'resume creation tools']) {
  assert.ok(claims(phrase).length, `Detect prohibited claim: ${phrase}`)
}
// The approved external URL is not prohibited website copy. No source files
// or arbitrary video hosts are exempted from the claim detector.
assert.equal(claims('<iframe src="https://scrimba.com/explain/guide0o93ighc7" title="Jobsite Finder platform concept explainer"></iframe><a href="https://scrimba.com/explain/guide0o93ighc7">Open explainer</a>').length, 0)

for (const phrase of ['Create a worker profile', 'Upload your résumé', 'Share trade experience and a resume', 'Create profiles and upload resumes', 'Create profiles, upload resumes and apply', 'createResumeSignedUrl(path)', 'ResumeUpload', 'Build a worker profile. Share a resume.']) {
  assert.equal(claims(phrase).length, 0, `Preserve supported capability: ${phrase}`)
}

const extensions = new Set(['.js', '.jsx', '.ts', '.tsx', '.html', '.json', '.xml', '.txt', '.md', '.mdx', '.csv', '.yml', '.yaml'])
let checked = 0
const violations = []
async function scan(path) {
  let info
  try { info = await stat(path) } catch (error) { if (error.code === 'ENOENT') return; throw error }
  if (info.isDirectory()) {
    for (const entry of await readdir(path, { withFileTypes: true })) {
      if (entry.isSymbolicLink() || entry.name.startsWith('.') || entry.name === 'node_modules') continue
      await scan(join(path, entry.name))
    }
  } else if (extensions.has(extname(path))) {
    checked++
    const matches = claims(await readFile(path, 'utf8'))
    if (matches.length) violations.push(`${path}: ${[...new Set(matches)].join('; ')}`)
  }
}
for (const path of ['src', 'public', 'index.html', 'README.md', 'marketing', 'content', 'emails', 'templates', 'docs/marketing', 'docs/content', 'supabase/functions']) await scan(path)
if (process.argv.includes('--built')) {
  assert.ok((await stat('dist')).isDirectory(), 'Build before checking emitted marketing content')
  await scan('dist')
}
assert.deepEqual(violations, [], 'Prohibited résumé-builder claims in application/public/marketing content')
console.log(`PASS marketing policy: ${checked} source/artifact files; prohibited variants rejected; uploads and profiles allowed. No network or writes.`)
