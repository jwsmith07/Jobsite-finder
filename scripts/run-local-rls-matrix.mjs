import { spawnSync } from 'node:child_process'

const container = 'supabase_db_jobsite-finder-v1-production-ready'
const marker = 'jsf_rls_matrix_20260808'

const ids = {
  worker: '10000000-0000-0000-0000-000000000001',
  worker2: '10000000-0000-0000-0000-000000000002',
  legacy: '10000000-0000-0000-0000-000000000003',
  owner: '10000000-0000-0000-0000-000000000004',
  orgAdmin: '10000000-0000-0000-0000-000000000005',
  hiring: '10000000-0000-0000-0000-000000000006',
  member: '10000000-0000-0000-0000-000000000007',
  invited: '10000000-0000-0000-0000-000000000008',
  suspended: '10000000-0000-0000-0000-000000000009',
  removed: '10000000-0000-0000-0000-000000000010',
  unrelated: '10000000-0000-0000-0000-000000000011',
  platformAdmin: '10000000-0000-0000-0000-000000000012',
  otherOwner: '10000000-0000-0000-0000-000000000013',
  companyCreator: '10000000-0000-0000-0000-000000000014',
}

const actors = {
  anonymous: { role: 'anon' },
  worker: { role: 'authenticated', sub: ids.worker },
  worker2: { role: 'authenticated', sub: ids.worker2 },
  legacy: { role: 'authenticated', sub: ids.legacy },
  owner: { role: 'authenticated', sub: ids.owner },
  orgAdmin: { role: 'authenticated', sub: ids.orgAdmin },
  hiring: { role: 'authenticated', sub: ids.hiring },
  member: { role: 'authenticated', sub: ids.member },
  invited: { role: 'authenticated', sub: ids.invited },
  suspended: { role: 'authenticated', sub: ids.suspended },
  removed: { role: 'authenticated', sub: ids.removed },
  unrelated: { role: 'authenticated', sub: ids.unrelated },
  platformAdmin: { role: 'authenticated', sub: ids.platformAdmin },
  service: { role: 'service_role', sub: ids.platformAdmin },
}

function psql(sql) {
  const result = spawnSync(
    'docker',
    ['exec', '-i', container, 'psql', '-U', 'postgres', '-d', 'postgres', '-v', 'ON_ERROR_STOP=1', '-Atq'],
    { input: `\\set VERBOSITY verbose\n${sql}`, encoding: 'utf8', maxBuffer: 1024 * 1024 * 20 },
  )

  return {
    ok: result.status === 0,
    stdout: result.stdout.trim(),
    stderr: result.stderr.trim(),
    status: result.status,
  }
}

function sqlString(value) {
  return `'${String(value).replaceAll("'", "''")}'`
}

function actorPrefix(actor) {
  const settings = [
    'begin;',
    `set local role ${actor.role};`,
  ]

  if (actor.sub) {
    settings.push(`do $jsf_claims$ begin`)
    settings.push(`  perform set_config('request.jwt.claim.sub', ${sqlString(actor.sub)}, true);`)
    settings.push(`  perform set_config('request.jwt.claims', ${sqlString(JSON.stringify({ sub: actor.sub, role: actor.role }))}, true);`)
    settings.push(`end $jsf_claims$;`)
  }

  return settings.join('\n')
}

function runAs(actorName, body) {
  const actor = actors[actorName]
  const sql = `${actorPrefix(actor)}
\\echo __JSF_PROTECTED_RESULT_START__
${body}
\\echo __JSF_PROTECTED_RESULT_END__
rollback;`
  return psql(sql)
}

function protectedOutput(stdout) {
  const start = '__JSF_PROTECTED_RESULT_START__'
  const end = '__JSF_PROTECTED_RESULT_END__'
  const lines = stdout.split(/\r?\n/)
  const startIndex = lines.indexOf(start)
  const endIndex = lines.indexOf(end)
  if (startIndex === -1 || endIndex === -1 || endIndex < startIndex) {
    return { ok: false, stdout: stdout.trim(), lines: stdout.split(/\r?\n/).filter(Boolean) }
  }

  const protectedLines = lines.slice(startIndex + 1, endIndex).filter(Boolean)
  return { ok: true, stdout: protectedLines.join('\n'), lines: protectedLines }
}

function classify(result, expected) {
  const protectedResult = result.ok ? protectedOutput(result.stdout) : { ok: true, stdout: '', lines: [] }

  if (expected.kind === 'error') {
    return result.ok ? { pass: false, actual: `allowed: ${protectedResult.stdout || 'no protected output'}` } : { pass: true, actual: `denied: ${firstError(result.stderr)}` }
  }

  if (expected.kind === 'deny') {
    if (!result.ok) return { pass: true, actual: `denied: ${firstError(result.stderr)}` }
    if (!protectedResult.ok) return { pass: false, actual: `harness output marker missing: ${protectedResult.stdout}` }
    const actual = protectedResult.lines.at(-1) ?? ''
    return { pass: actual === '' || actual === '0', actual: actual === '' ? 'zero rows/no protected output' : actual }
  }

  if (expected.kind === 'unresolved') {
    if (!result.ok) return { pass: false, unresolved: true, actual: `unresolved intent; SQL error: ${firstError(result.stderr)}` }
    if (!protectedResult.ok) return { pass: false, actual: `harness output marker missing: ${protectedResult.stdout}` }
    const actual = protectedResult.lines.at(-1) ?? ''
    return { pass: false, unresolved: true, actual: `unresolved intent; observed=${actual || 'zero rows/no protected output'}` }
  }

  if (!result.ok) {
    return { pass: false, actual: `error: ${firstError(result.stderr)}` }
  }

  if (!protectedResult.ok) return { pass: false, actual: `harness output marker missing: ${protectedResult.stdout}` }
  const actual = protectedResult.lines.at(-1) ?? ''

  if (expected.kind === 'scalar') {
    return { pass: actual === String(expected.value), actual: actual || '(empty)' }
  }

  return { pass: true, actual: actual || 'ok' }
}

function firstError(stderr) {
  return stderr.split(/\r?\n/).find((line) => /ERROR|permission denied|violates|requires|cannot|not authorized/i.test(line)) ?? stderr.split(/\r?\n/)[0] ?? ''
}

const setupSql = `
set session_replication_role = replica;

delete from public.membership_invitations where email like '${marker}%';
delete from public.organization_memberships where profile_id in (${Object.values(ids).map(sqlString).join(',')});
delete from public.organizations where id in (9101, 9102);
delete from public.gc_subcontractor_assignments where jobsite_id in (9101, 9102);
delete from public.gc_candidate_pipeline where project_id in (9101, 9102);
delete from public.saved_jobs where job_post_id in (9101, 9102);
delete from public.worker_certifications where worker_profile_id in (9101, 9102);
delete from public.applications where id in (9101, 9102);
delete from public.job_posts where id in (9101, 9102);
delete from public.jobsites where id in (9101, 9102);
delete from public.project_claims where id in (9101, 9102, 9103);
delete from public.project_images where project_id in (9101, 9102);
delete from public.projects where id in (9101, 9102);
delete from public.company_profiles where id in (9101, 9102, 9103);
delete from public.worker_profiles where id in (9101, 9102);
delete from public.profiles where id in (${Object.values(ids).map(sqlString).join(',')});
delete from auth.users where id in (${Object.values(ids).map(sqlString).join(',')});
delete from public.waitlist_signups where email like '${marker}%';

insert into auth.users (id, aud, role, email, email_confirmed_at, created_at, updated_at)
values
  (${sqlString(ids.worker)}, 'authenticated', 'authenticated', '${marker}+worker@example.test', now(), now(), now()),
  (${sqlString(ids.worker2)}, 'authenticated', 'authenticated', '${marker}+worker2@example.test', now(), now(), now()),
  (${sqlString(ids.legacy)}, 'authenticated', 'authenticated', '${marker}+legacy@example.test', now(), now(), now()),
  (${sqlString(ids.owner)}, 'authenticated', 'authenticated', '${marker}+owner@example.test', now(), now(), now()),
  (${sqlString(ids.orgAdmin)}, 'authenticated', 'authenticated', '${marker}+orgadmin@example.test', now(), now(), now()),
  (${sqlString(ids.hiring)}, 'authenticated', 'authenticated', '${marker}+hiring@example.test', now(), now(), now()),
  (${sqlString(ids.member)}, 'authenticated', 'authenticated', '${marker}+member@example.test', now(), now(), now()),
  (${sqlString(ids.invited)}, 'authenticated', 'authenticated', '${marker}+invited@example.test', now(), now(), now()),
  (${sqlString(ids.suspended)}, 'authenticated', 'authenticated', '${marker}+suspended@example.test', now(), now(), now()),
  (${sqlString(ids.removed)}, 'authenticated', 'authenticated', '${marker}+removed@example.test', now(), now(), now()),
  (${sqlString(ids.unrelated)}, 'authenticated', 'authenticated', '${marker}+unrelated@example.test', now(), now(), now()),
  (${sqlString(ids.platformAdmin)}, 'authenticated', 'authenticated', '${marker}+platformadmin@example.test', now(), now(), now()),
  (${sqlString(ids.otherOwner)}, 'authenticated', 'authenticated', '${marker}+otherowner@example.test', now(), now(), now()),
  (${sqlString(ids.companyCreator)}, 'authenticated', 'authenticated', '${marker}+creator@example.test', now(), now(), now());

insert into public.profiles (id, email, full_name, role)
values
  (${sqlString(ids.worker)}, '${marker}+worker@example.test', 'RLS Worker', 'worker'),
  (${sqlString(ids.worker2)}, '${marker}+worker2@example.test', 'RLS Worker Two', 'worker'),
  (${sqlString(ids.legacy)}, '${marker}+legacy@example.test', 'RLS Legacy Owner', 'gc'),
  (${sqlString(ids.owner)}, '${marker}+owner@example.test', 'RLS Org Owner', 'gc'),
  (${sqlString(ids.orgAdmin)}, '${marker}+orgadmin@example.test', 'RLS Org Admin', 'gc'),
  (${sqlString(ids.hiring)}, '${marker}+hiring@example.test', 'RLS Hiring Manager', 'gc'),
  (${sqlString(ids.member)}, '${marker}+member@example.test', 'RLS Org Member', 'gc'),
  (${sqlString(ids.invited)}, '${marker}+invited@example.test', 'RLS Invited', 'gc'),
  (${sqlString(ids.suspended)}, '${marker}+suspended@example.test', 'RLS Suspended', 'gc'),
  (${sqlString(ids.removed)}, '${marker}+removed@example.test', 'RLS Removed', 'gc'),
  (${sqlString(ids.unrelated)}, '${marker}+unrelated@example.test', 'RLS Unrelated', 'worker'),
  (${sqlString(ids.platformAdmin)}, '${marker}+platformadmin@example.test', 'RLS Platform Admin', 'admin'),
  (${sqlString(ids.otherOwner)}, '${marker}+otherowner@example.test', 'RLS Other Owner', 'gc'),
  (${sqlString(ids.companyCreator)}, '${marker}+creator@example.test', 'RLS Company Creator', 'gc');

insert into public.worker_profiles (id, profile_id, trade, experience_years, city, resume_url, bio, talent_visibility)
values
  (9101, ${sqlString(ids.worker)}, 'Electrician', 5, 'Calgary', '${ids.worker}/resume.pdf', '${marker} worker bio', 'approved_gcs'),
  (9102, ${sqlString(ids.worker2)}, 'Welder', 3, 'Edmonton', '${ids.worker2}/resume.pdf', '${marker} worker2 bio', 'approved_gcs');

insert into public.company_profiles (id, profile_id, company_name, company_type, verified, is_public)
values
  (9101, ${sqlString(ids.legacy)}, '${marker} Legacy GC', 'gc', true, true),
  (9102, ${sqlString(ids.companyCreator)}, '${marker} Org GC', 'gc', true, true),
  (9103, ${sqlString(ids.otherOwner)}, '${marker} Other GC', 'gc', true, true);

insert into public.projects (id, project_name, project_type, sector, city, province, latitude, longitude, status, estimated_value, is_active, is_public_project, review_status, is_public, source_type, created_by, map_eligible)
values
  (9101, '${marker} Project A', 'Commercial', 'Construction', 'Calgary', 'Alberta', 51, -114, 'upcoming', 6000000, true, true, 'approved', true, 'public_import', ${sqlString(ids.owner)}, true),
  (9102, '${marker} Project B', 'Commercial', 'Construction', 'Edmonton', 'Alberta', 53, -113, 'upcoming', 6000000, true, true, 'approved', true, 'public_import', ${sqlString(ids.otherOwner)}, true);

insert into public.jobsites (id, project_id, latitude, longitude, address, city, province)
values
  (9101, 9101, 51, -114, '${marker} Site A', 'Calgary', 'Alberta'),
  (9102, 9102, 53, -113, '${marker} Site B', 'Edmonton', 'Alberta');

insert into public.project_claims (id, project_id, company_profile_id, claim_type, status, company_role, is_primary_gc)
values
  (9101, 9101, 9102, 'gc', 'approved', 'gc', true),
  (9102, 9102, 9103, 'gc', 'approved', 'gc', true),
  (9103, 9101, 9101, 'gc', 'pending', 'gc', false);

insert into public.job_posts (id, jobsite_id, project_id, company_profile_id, title, trade, status, experience_level)
values
  (9101, 9101, 9101, 9102, '${marker} Job A', 'Electrician', 'open', 'journeyman'),
  (9102, 9102, 9102, 9103, '${marker} Job B', 'Welder', 'open', 'apprentice');

insert into public.applications (id, job_post_id, worker_profile_id, resume_url, message, status, company_notes)
values
  (9101, 9101, 9101, '${ids.worker}/resume.pdf', '${marker} app', 'pending', null),
  (9102, 9102, 9102, '${ids.worker2}/resume.pdf', '${marker} app2', 'pending', null);

insert into public.worker_certifications (id, worker_profile_id, certification_name, issuer)
values (9101, 9101, '${marker} Cert', 'Local Test');

insert into public.organizations (id, company_profile_id, name, organization_type, verification_status, status, created_by)
values
  (9101, 9102, '${marker} Org A', 'general_contractor', 'verified', 'active', ${sqlString(ids.owner)}),
  (9102, 9103, '${marker} Org B', 'general_contractor', 'verified', 'active', ${sqlString(ids.otherOwner)});

insert into public.organization_memberships (id, organization_id, profile_id, role, status, accepted_at)
values
  (9101, 9101, ${sqlString(ids.owner)}, 'owner', 'active', now()),
  (9102, 9101, ${sqlString(ids.orgAdmin)}, 'admin', 'active', now()),
  (9103, 9101, ${sqlString(ids.hiring)}, 'hiring_manager', 'active', now()),
  (9104, 9101, ${sqlString(ids.member)}, 'member', 'active', now()),
  (9105, 9101, ${sqlString(ids.invited)}, 'member', 'invited', null),
  (9106, 9101, ${sqlString(ids.suspended)}, 'admin', 'suspended', now()),
  (9107, 9101, ${sqlString(ids.removed)}, 'admin', 'removed', now()),
  (9108, 9102, ${sqlString(ids.otherOwner)}, 'owner', 'active', now());

insert into public.membership_invitations (id, organization_id, email, role, status, token_hash, invited_by, expires_at)
values ('20000000-0000-0000-0000-000000009101', 9101, '${marker}+new@example.test', 'member', 'invited', '${marker}_token', ${sqlString(ids.orgAdmin)}, now() + interval '7 days');

insert into public.gc_candidate_pipeline (id, gc_company_id, project_id, worker_profile_id, stage, notes)
values
  (9101, 9102, 9101, 9101, 'saved', '${marker} org pipeline'),
  (9102, 9101, 9101, 9101, 'saved', '${marker} legacy pipeline');

insert into public.gc_subcontractor_assignments (id, gc_company_id, subcontractor_company_id, jobsite_id, status)
values ('30000000-0000-0000-0000-000000009101', 9102, 9101, 9101, 'pending');

insert into public.site_settings (key, value)
values ('${marker}_maintenance', '{"enabled":false}'::jsonb)
on conflict (key) do update set value = excluded.value;

set session_replication_role = DEFAULT;
`

const cleanupSql = `
set session_replication_role = replica;
delete from public.membership_invitations where email like '${marker}%';
delete from public.organization_memberships where id between 9101 and 9108;
delete from public.organizations where id in (9101, 9102);
delete from public.gc_subcontractor_assignments where jobsite_id in (9101, 9102);
delete from public.gc_candidate_pipeline where id in (9101, 9102);
delete from public.saved_jobs where job_post_id in (9101, 9102);
delete from public.worker_certifications where id = 9101;
delete from public.applications where id in (9101, 9102);
delete from public.job_posts where id in (9101, 9102);
delete from public.jobsites where id in (9101, 9102);
delete from public.project_claims where id in (9101, 9102, 9103);
delete from public.project_images where project_id in (9101, 9102);
delete from public.projects where id in (9101, 9102);
delete from public.company_profiles where id in (9101, 9102, 9103);
delete from public.worker_profiles where id in (9101, 9102);
delete from public.profiles where id in (${Object.values(ids).map(sqlString).join(',')});
delete from auth.users where id in (${Object.values(ids).map(sqlString).join(',')});
delete from public.waitlist_signups where email like '${marker}%';
delete from public.site_settings where key = '${marker}_maintenance';
set session_replication_role = DEFAULT;
`

const tests = [
  ['RLS-001', 'profiles/select own', 'worker', 'select count(*) from public.profiles where id = auth.uid();', { kind: 'scalar', value: 1 }, 'profiles_select_own', `select count(*) from public.profiles where id = ${sqlString(ids.worker)};`],
  ['RLS-002', 'profiles/select other', 'worker', `select count(*) from public.profiles where id = ${sqlString(ids.worker2)};`, { kind: 'scalar', value: 0 }, 'profiles_select_own', `select count(*) from public.profiles where id = ${sqlString(ids.worker2)};`],
  ['RLS-003', 'profiles/self admin escalation', 'worker', "update public.profiles set role = 'admin' where id = auth.uid();", { kind: 'error' }, 'profiles_update_own + guard_profile_role_assignment'],
  ['RLS-004', 'profiles/update other role', 'worker', `update public.profiles set role = 'gc' where id = ${sqlString(ids.worker2)};`, { kind: 'deny' }, 'profiles_update_own'],
  ['RLS-005', 'profiles/admin select all', 'platformAdmin', 'select count(*)::int >= 10 from public.profiles;', { kind: 'scalar', value: 't' }, 'profiles_admin_select_all'],

  ['RLS-010', 'worker_profiles/select own', 'worker', 'select count(*) from public.worker_profiles where id = 9101;', { kind: 'scalar', value: 1 }, 'worker_profiles_select_own', 'select count(*) from public.worker_profiles where id = 9101;'],
  ['RLS-011', 'worker_profiles/update own', 'worker', "update public.worker_profiles set city = 'Local Test City' where id = 9101 returning id;", { kind: 'scalar', value: 9101 }, 'worker_profiles_update_own'],
  ['RLS-012', 'worker_profiles/update other', 'worker2', "update public.worker_profiles set city = 'Blocked' where id = 9101 returning id;", { kind: 'deny' }, 'worker_profiles_update_own'],
  ['RLS-013', 'worker_certifications/select own', 'worker', 'select count(*) from public.worker_certifications where worker_profile_id = 9101;', { kind: 'scalar', value: 1 }, 'worker_certifications_select_own', 'select count(*) from public.worker_certifications where worker_profile_id = 9101;'],
  ['RLS-014', 'worker_certifications/update other', 'worker2', "update public.worker_certifications set issuer = 'Blocked' where id = 9101 returning id;", { kind: 'deny' }, 'worker_certifications_update_own'],

  ['RLS-020', 'company_profiles/legacy update own', 'legacy', "update public.company_profiles set description = 'legacy update' where id = 9101 returning id;", { kind: 'deny' }, 'company_profiles_update_member_authorized'],
  ['RLS-021', 'company_profiles/org owner update', 'owner', "update public.company_profiles set description = 'owner update' where id = 9102 returning id;", { kind: 'scalar', value: 9102 }, 'company_profiles_update_member_authorized'],
  ['RLS-022', 'company_profiles/org admin update', 'orgAdmin', "update public.company_profiles set description = 'admin update' where id = 9102 returning id;", { kind: 'scalar', value: 9102 }, 'company_profiles_update_member_authorized'],
  ['RLS-023', 'company_profiles/hiring manager update', 'hiring', "update public.company_profiles set description = 'hm update' where id = 9102 returning id;", { kind: 'deny' }, 'company_profiles_update_member_authorized'],
  ['RLS-024', 'company_profiles/member update', 'member', "update public.company_profiles set description = 'member update' where id = 9102 returning id;", { kind: 'deny' }, 'company_profiles_update_member_authorized'],
  ['RLS-025', 'company_profiles/suspended update', 'suspended', "update public.company_profiles set description = 'suspended update' where id = 9102 returning id;", { kind: 'deny' }, 'company_profiles_update_member_authorized'],
  ['RLS-026', 'organization_memberships/member self elevate', 'member', "update public.organization_memberships set role = 'admin' where profile_id = auth.uid() returning id;", { kind: 'deny' }, 'organization_memberships_update_owner_admin_or_accept + guard'],
  ['RLS-027', 'membership_invitations/admin invite member', 'orgAdmin', `insert into public.membership_invitations (organization_id,email,role,token_hash,invited_by,expires_at) values (9101,'${marker}+invite2@example.test','member','${marker}_token2',auth.uid(),now()+interval '1 day') returning organization_id;`, { kind: 'scalar', value: 9101 }, 'membership_invitations_insert_org_admin'],
  ['RLS-028', 'membership_invitations/hiring invite denied', 'hiring', `insert into public.membership_invitations (organization_id,email,role,token_hash,invited_by,expires_at) values (9101,'${marker}+invite3@example.test','member','${marker}_token3',auth.uid(),now()+interval '1 day') returning organization_id;`, { kind: 'error' }, 'membership_invitations_insert_org_admin'],

  ['RLS-030', 'projects/public select anon', 'anonymous', 'select count(*) from public.projects where id = 9101;', { kind: 'scalar', value: 1 }, 'projects visible to everyone', 'select count(*) from public.projects where id = 9101;'],
  ['RLS-031', 'projects/ordinary update denied', 'worker', "update public.projects set city = 'Blocked' where id = 9101 returning id;", { kind: 'deny' }, 'projects update policies'],
  ['RLS-032', 'projects/platform admin update', 'platformAdmin', "update public.projects set city = 'Admin City' where id = 9101 returning id;", { kind: 'scalar', value: 9101 }, 'projects_admin_update_all'],
  ['RLS-033', 'project_claims/legacy insert own pending', 'legacy', "insert into public.project_claims (project_id, company_profile_id, claim_type, status, company_role) values (9102,9101,'gc','pending','gc') returning company_profile_id;", { kind: 'scalar', value: 9101 }, 'project_claims_insert_own_pending'],
  ['RLS-034', 'project_claims/unrelated insert denied', 'worker', "insert into public.project_claims (project_id, company_profile_id, claim_type, status, company_role) values (9102,9101,'gc','pending','gc') returning company_profile_id;", { kind: 'error' }, 'project_claims_insert_own_pending'],
  ['RLS-035', 'project_images/authorized insert', 'owner', "insert into public.project_images (project_id, company_id, image_url, uploaded_by) values (9101,9102,'https://example.test/image.jpg',auth.uid()) returning project_id;", { kind: 'scalar', value: 9101 }, 'project_images_insert_connected_or_admin'],
  ['RLS-036', 'project_images/cross org insert denied', 'owner', "insert into public.project_images (project_id, company_id, image_url, uploaded_by) values (9102,9102,'https://example.test/image.jpg',auth.uid()) returning project_id;", { kind: 'error' }, 'project_images_insert_connected_or_admin'],

  ['RLS-040', 'job_posts/public open select', 'worker', 'select count(*) from public.job_posts where id = 9101;', { kind: 'scalar', value: 1 }, 'job_posts_select_public', 'select count(*) from public.job_posts where id = 9101;'],
  ['RLS-041', 'job_posts/org owner insert', 'owner', "insert into public.job_posts (jobsite_id, project_id, company_profile_id, title, status) values (9101,9101,9102,'RLS temp job','open') returning company_profile_id;", { kind: 'scalar', value: 9102 }, 'job_posts_insert_own'],
  ['RLS-042', 'job_posts/hiring manager insert', 'hiring', "insert into public.job_posts (jobsite_id, project_id, company_profile_id, title, status) values (9101,9101,9102,'RLS temp job','open') returning company_profile_id;", { kind: 'scalar', value: 9102 }, 'job_posts_insert_own'],
  ['RLS-043', 'job_posts/member insert denied', 'member', "insert into public.job_posts (jobsite_id, project_id, company_profile_id, title, status) values (9101,9101,9102,'RLS temp job','open') returning company_profile_id;", { kind: 'error' }, 'job_posts_insert_own'],
  ['RLS-044', 'applications/worker insert own', 'worker', "insert into public.applications (job_post_id, worker_profile_id, resume_url, status) values (9101,9101,'10000000-0000-0000-0000-000000000001/new.pdf','pending') returning worker_profile_id;", { kind: 'scalar', value: 9101 }, 'applications_insert_own'],
  ['RLS-045', 'applications/worker insert other denied', 'worker2', "insert into public.applications (job_post_id, worker_profile_id, resume_url, status) values (9101,9101,'bad.pdf','pending') returning worker_profile_id;", { kind: 'error' }, 'applications_insert_own'],
  ['RLS-046', 'applications/worker withdraw own', 'worker', "update public.applications set status = 'withdrawn' where id = 9101 returning status;", { kind: 'scalar', value: 'withdrawn' }, 'applications_update_own + guard'],
  ['RLS-047', 'applications/worker hire self denied', 'worker', "update public.applications set status = 'hired' where id = 9101 returning status;", { kind: 'error' }, 'guard_application_update'],
  ['RLS-048', 'applications/hiring manager update status', 'hiring', "update public.applications set status = 'reviewing', company_notes = 'ok' where id = 9101 returning status;", { kind: 'scalar', value: 'reviewing' }, 'applications_update_company'],
  ['RLS-049', 'applications/member update denied', 'member', "update public.applications set status = 'reviewing' where id = 9101 returning status;", { kind: 'deny' }, 'applications_update_company'],

  ['RLS-050', 'pipeline/org owner select own org', 'owner', 'select count(*) from public.gc_candidate_pipeline where id = 9101;', { kind: 'unresolved' }, 'legacy gc_candidate_pipeline_select_own_company', 'select count(*) from public.gc_candidate_pipeline where id = 9101;'],
  ['RLS-050A', 'pipeline/legacy owner select own company', 'legacy', 'select count(*) from public.gc_candidate_pipeline where id = 9102;', { kind: 'scalar', value: 1 }, 'legacy gc_candidate_pipeline_select_own_company', 'select count(*) from public.gc_candidate_pipeline where id = 9102;'],
  ['RLS-050B', 'pipeline/org admin select own org', 'orgAdmin', 'select count(*) from public.gc_candidate_pipeline where id = 9101;', { kind: 'unresolved' }, 'legacy gc_candidate_pipeline_select_own_company', 'select count(*) from public.gc_candidate_pipeline where id = 9101;'],
  ['RLS-050C', 'pipeline/hiring manager select own org', 'hiring', 'select count(*) from public.gc_candidate_pipeline where id = 9101;', { kind: 'unresolved' }, 'legacy gc_candidate_pipeline_select_own_company', 'select count(*) from public.gc_candidate_pipeline where id = 9101;'],
  ['RLS-050D', 'pipeline/member select own org', 'member', 'select count(*) from public.gc_candidate_pipeline where id = 9101;', { kind: 'unresolved' }, 'legacy gc_candidate_pipeline_select_own_company', 'select count(*) from public.gc_candidate_pipeline where id = 9101;'],
  ['RLS-051', 'pipeline/legacy owner insert own', 'legacy', "insert into public.gc_candidate_pipeline (gc_company_id, project_id, worker_profile_id, stage) values (9101,9102,9102,'saved') returning gc_company_id;", { kind: 'scalar', value: 9101 }, 'legacy gc_candidate_pipeline_insert_own_company'],
  ['RLS-052', 'assignments/gc owner select', 'owner', 'select count(*) from public.gc_subcontractor_assignments where jobsite_id = 9101;', { kind: 'scalar', value: 1 }, 'gc_subcontractor_assignments_gc_select'],
  ['RLS-053', 'assignments/unrelated select denied', 'unrelated', 'select count(*) from public.gc_subcontractor_assignments where jobsite_id = 9101;', { kind: 'deny' }, 'assignment policies'],

  ['RLS-060', 'waitlist/anon insert', 'anonymous', `insert into public.waitlist_signups (name,email,role,message) values ('RLS Anon','${marker}+anonwait@example.test','Trades Worker','hi'); select 'ok';`, { kind: 'scalar', value: 'ok' }, 'waitlist_signups_insert_public'],
  ['RLS-061', 'waitlist/anon select denied', 'anonymous', 'select count(*) from public.waitlist_signups;', { kind: 'error' }, 'privilege/RLS'],
  ['RLS-062', 'site_settings/ordinary update denied', 'worker', `update public.site_settings set value = '{}'::jsonb where key = '${marker}_maintenance' returning key;`, { kind: 'deny' }, 'site_settings_admin_all', `select count(*) from public.site_settings where key = '${marker}_maintenance';`],
  ['RLS-062A', 'site_settings/platform admin update', 'platformAdmin', `update public.site_settings set value = '{"enabled":true}'::jsonb where key = '${marker}_maintenance' returning key;`, { kind: 'scalar', value: `${marker}_maintenance` }, 'site_settings_admin_all', `select count(*) from public.site_settings where key = '${marker}_maintenance';`],

  ['RLS-070', 'operational/import reports select denied', 'worker', 'select count(*) from public.project_import_reports;', { kind: 'error' }, '034 no client access'],
  ['RLS-071', 'operational/import review select denied', 'worker', 'select count(*) from public.project_import_review_items;', { kind: 'error' }, '034 no client access'],
  ['RLS-072', 'operational/quarantine select denied', 'worker', 'select count(*) from public.organization_backfill_quarantine;', { kind: 'error' }, '034 no client access'],
  ['RLS-073', 'import rpc anon denied', 'anonymous', "select * from public.run_canada_project_import('jobsite_project_import_staging','rls','rls');", { kind: 'error' }, '034 revoke execute'],
  ['RLS-074', 'import rpc authenticated denied', 'worker', "select * from public.run_canada_project_import('jobsite_project_import_staging','rls','rls');", { kind: 'error' }, '034 revoke execute'],
  ['RLS-075', 'truncate privilege absent', 'worker', "select has_table_privilege('authenticated','public.projects','TRUNCATE');", { kind: 'scalar', value: 'f' }, '034 privilege hardening'],
  ['RLS-076', 'sequence update absent', 'worker', "select has_sequence_privilege('authenticated','public.projects_id_seq','UPDATE');", { kind: 'scalar', value: 'f' }, '034 privilege hardening'],
]

function main() {
  let setup = psql(setupSql)
  if (!setup.ok) {
    console.error('Fixture setup failed')
    console.error(setup.stderr)
    process.exit(1)
  }

  const results = []
  try {
    for (const [id, action, actor, sql, expected, policy, fixtureSql] of tests) {
      if (fixtureSql) {
        const fixture = psql(fixtureSql)
        const fixtureCount = fixture.stdout.split(/\r?\n/).filter(Boolean).at(-1)
        if (!fixture.ok || fixtureCount !== '1') {
          results.push({ id, action, actor, expected, actual: `fixture defect: expected 1 target row, found ${fixture.ok ? fixtureCount || '(empty)' : firstError(fixture.stderr)}`, policy, pass: false, blocked: true })
          console.log(`BLOCKED|${id}|${actor}|${action}|expected=fixture|actual=${results.at(-1).actual}|policy=${policy}`)
          continue
        }
      }
      const result = runAs(actor, sql)
      const verdict = classify(result, expected)
      results.push({ id, action, actor, expected, actual: verdict.actual, policy, pass: verdict.pass, unresolved: verdict.unresolved })
      const status = verdict.unresolved ? 'UNRESOLVED' : verdict.pass ? 'PASS' : 'FAIL'
      console.log(`${status}|${id}|${actor}|${action}|expected=${expected.kind === 'scalar' ? expected.value : expected.kind}|actual=${verdict.actual}|policy=${policy}`)
    }
  } finally {
    const cleanup = psql(cleanupSql)
    if (!cleanup.ok) {
      console.error('Fixture cleanup failed')
      console.error(cleanup.stderr)
      process.exitCode = 1
    }
  }

  const passed = results.filter((r) => r.pass).length
  const blocked = results.filter((r) => r.blocked).length
  const unresolved = results.filter((r) => r.unresolved).length
  const failed = results.length - passed - blocked - unresolved
  console.log(`SUMMARY|original_scenarios=50|total_assertions=${results.length}|passed=${passed}|failed=${failed}|blocked=${blocked}|unresolved=${unresolved}`)
  if (failed > 0) process.exitCode = 1
}

main()
