import { promises as fs } from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const repoRoot = path.resolve(__dirname, '..')
const supabaseDir = path.join(repoRoot, 'supabase')
const outputDir = path.join(supabaseDir, 'migrations')
const tempRoot = path.join(supabaseDir, '.temp')
const projectRefPath = path.join(tempRoot, 'project-ref')

const manifest = [
  ['20260807000000', '000_initial_v1_schema_baseline.sql'],
  ['20260807000100', '001_worker_profiles_columns.sql'],
  ['20260807000200', '002_company_and_profiles_columns.sql'],
  ['20260807000300', '003_profile_rls_policies.sql'],
  ['20260807000400', '004_profile_preferences_column.sql'],
  ['20260807000500', '005_job_posts_applications_rls.sql'],
  ['20260807000600', '006_applications_company_notes.sql'],
  ['20260807000700', '007_applications_snapshot_fields.sql'],
  ['20260807000800', '008_worker_profiles_company_read.sql'],
  ['20260807000900', '009_project_claim_management.sql'],
  ['20260807001000', '010_project_company_connections.sql'],
  ['20260807001100', '011_admin_profile_company_management.sql'],
  ['20260807001200', '012_contractor_project_location_fields.sql'],
  ['20260807001300', '013_major_project_minimum.sql'],
  ['20260807001400', '014_project_images.sql'],
  ['20260807001500', '015_structured_job_posts.sql'],
  ['20260807001600', '016_job_status_management.sql'],
  ['20260807001700', '017_contractor_created_jobsites.sql'],
  ['20260807001800', '018_site_settings_maintenance_mode.sql'],
  ['20260807001900', '019_waitlist_signups.sql'],
  ['20260807002000', '020_gc_subcontractor_assignments.sql'],
  ['20260807002100', '021_gc_owned_contractor_created_jobsites.sql'],
  ['20260807002200', '022_primary_gc_project_workspace_updates.sql'],
  ['20260807002300', '023_saved_jobs_worker_bookmarks.sql'],
  ['20260807002400', '024_worker_credentials_foundation.sql'],
  ['20260807002500', '025_gc_talent_discovery_policies.sql'],
  ['20260807002600', '026_candidate_pipeline_worker_privacy.sql'],
  ['20260807002700', '027_privacy_security_hardening.sql'],
  ['20260807002800', '028_project_participation_workflow.sql'],
  ['20260807002810', '028_site_settings_map_provider_policy.sql'],
  ['20260807003000', '030_canada_import_duplicate_protection.sql'],
  ['20260807003100', '031_project_eligibility_rules.sql'],
  ['20260807003200', '032_role_hardening_resume_privacy.sql'],
  ['20260807003300', '033_organization_membership_authorization_foundation.sql'],
  ['20260807003400', '034_database_privilege_hardening.sql'],
  ['20260807003500', '035_rls_behavioral_blocker_corrections.sql'],
  ['20260807003600', '036_candidate_pipeline_organization_authorization.sql'],
]

function generatedName([timestamp, sourceName]) {
  return `${timestamp}_${sourceName}`
}

async function exists(filePath) {
  try {
    await fs.access(filePath)
    return true
  } catch {
    return false
  }
}

async function assertSafeEnvironment() {
  if (await exists(projectRefPath)) {
    throw new Error('Refusing to generate local migrations because supabase/.temp/project-ref exists. Unlink or review the remote project reference first.')
  }
}

async function assertManifestMatchesSupabaseDirectory() {
  const expected = new Set(manifest.map(([, sourceName]) => sourceName))
  const duplicateTargets = new Set()
  const generatedTargets = new Set()

  for (const entry of manifest) {
    const target = generatedName(entry)
    if (generatedTargets.has(target)) duplicateTargets.add(target)
    generatedTargets.add(target)
  }

  if (duplicateTargets.size > 0) {
    throw new Error(`Manifest contains duplicate generated filenames: ${[...duplicateTargets].join(', ')}`)
  }

  const entries = await fs.readdir(supabaseDir, { withFileTypes: true })
  const numberedSqlFiles = entries
    .filter((entry) => entry.isFile() && /^\d{3}_.+\.sql$/.test(entry.name))
    .map((entry) => entry.name)
    .sort()

  const unexpected = numberedSqlFiles.filter((name) => !expected.has(name))
  const missing = [...expected].filter((name) => !numberedSqlFiles.includes(name))

  if (unexpected.length > 0) {
    throw new Error(`Unexpected numbered SQL files found in supabase/: ${unexpected.join(', ')}`)
  }

  if (missing.length > 0) {
    throw new Error(`Expected migration source files are missing: ${missing.join(', ')}`)
  }
}

function headerFor(sourceName) {
  return [
    '-- GENERATED LOCAL TEST ARTIFACT.',
    '-- Do not edit. Do not use for production deployment.',
    `-- Source: ../${sourceName}`,
    '-- The original migration file remains authoritative.',
    '',
  ].join('\n')
}

async function writeStagedCopies(stagingDir) {
  await fs.mkdir(stagingDir, { recursive: true })

  for (const entry of manifest) {
    const [, sourceName] = entry
    const sourcePath = path.join(supabaseDir, sourceName)
    const targetPath = path.join(stagingDir, generatedName(entry))
    const sourceBody = await fs.readFile(sourcePath, 'utf8')
    await fs.writeFile(targetPath, `${headerFor(sourceName)}${sourceBody}`, 'utf8')
  }
}

async function verifyStagedCopies(stagingDir) {
  const generated = (await fs.readdir(stagingDir))
    .filter((name) => name.endsWith('.sql'))
    .sort()
  const expectedGenerated = manifest.map(generatedName)

  if (generated.length !== expectedGenerated.length) {
    throw new Error(`Expected ${expectedGenerated.length} generated migrations, found ${generated.length}.`)
  }

  for (let index = 0; index < expectedGenerated.length; index += 1) {
    if (generated[index] !== expectedGenerated[index]) {
      throw new Error(`Generated migration order mismatch at ${index + 1}: expected ${expectedGenerated[index]}, found ${generated[index]}`)
    }
  }

  for (const entry of manifest) {
    const [, sourceName] = entry
    const sourcePath = path.join(supabaseDir, sourceName)
    const targetPath = path.join(stagingDir, generatedName(entry))
    const sourceBody = await fs.readFile(sourcePath, 'utf8')
    const targetBody = await fs.readFile(targetPath, 'utf8')
    const expectedBody = `${headerFor(sourceName)}${sourceBody}`

    if (targetBody !== expectedBody) {
      throw new Error(`Generated copy does not match source plus header: ${generatedName(entry)}`)
    }
  }
}

async function replaceOutputAtomically(stagingDir) {
  await fs.mkdir(tempRoot, { recursive: true })
  const backupDir = path.join(tempRoot, `local-migrations-backup-${Date.now()}`)
  const outputExists = await exists(outputDir)

  if (outputExists) {
    await fs.rename(outputDir, backupDir)
  }

  try {
    await fs.rename(stagingDir, outputDir)
  } catch (error) {
    if (outputExists && await exists(backupDir)) {
      await fs.rename(backupDir, outputDir)
    }
    throw error
  }

  if (outputExists) {
    await fs.rm(backupDir, { recursive: true, force: true })
  }
}

async function main() {
  await assertSafeEnvironment()
  await assertManifestMatchesSupabaseDirectory()
  await fs.mkdir(tempRoot, { recursive: true })

  const stagingDir = await fs.mkdtemp(path.join(tempRoot, 'local-migrations-staging-'))

  try {
    await writeStagedCopies(stagingDir)
    await verifyStagedCopies(stagingDir)
    await replaceOutputAtomically(stagingDir)
  } catch (error) {
    await fs.rm(stagingDir, { recursive: true, force: true })
    throw error
  }

  console.log(`Generated ${manifest.length} local Supabase migration test artifacts in supabase/migrations/.`)
  console.log('These files are disposable, ignored by Git, and must not be used for production deployment.')
}

main().catch((error) => {
  console.error(error.message)
  process.exitCode = 1
})
