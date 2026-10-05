import test from 'node:test';import assert from 'node:assert/strict';import {readFileSync} from 'node:fs';
const migration=readFileSync(new URL('../database/v2/001_accounts_and_permissions.sql',import.meta.url),'utf8');
const bootstrap=readFileSync(new URL('../database/v2/002_bootstrap_super_admin.sql',import.meta.url),'utf8');
const server=readFileSync(new URL('../src/server.js',import.meta.url),'utf8');
test('migration is transactional and closes table and RPC access to browser roles',()=>{
 assert.match(migration,/begin;/);assert.match(migration,/commit;/);assert.match(migration,/enable row level security/);assert.match(migration,/as restrictive for all to anon,authenticated/);assert.match(migration,/revoke all on function/);assert.match(migration,/from public,anon,authenticated/);
});
test('bootstrap grants only after exact Auth ID, email and verification checks',()=>{
 assert.match(bootstrap,/1bc0d1b0-4de3-4243-964a-cf49aafee38c/);assert.match(bootstrap,/khoa3815@gmail.com/);assert.match(bootstrap,/email_confirmed_at is null/);assert.match(bootstrap,/is distinct from expected_email/);assert.doesNotMatch(bootstrap,/update auth\.users/);
});
test('all V2 functions pin their search_path',()=>{
 const functionCount=(migration.match(/create or replace function/g)||[]).length;
 assert.equal((migration.match(/security definer set search_path = ''/g)||[]).length,functionCount);
});
test('role changes and invitation acceptance serialize on the workspace',()=>{
 assert.match(migration,/where id=p_workspace for update/);assert.match(migration,/where id=v_workspace for update/);assert.match(migration,/datatalk_check_grant\(i.invited_by/);assert.match(migration,/on conflict\(workspace_id,user_id\) do nothing/);
});
test('no request-time email privilege escalation remains',()=>assert.doesNotMatch(server,/forcedRole|SUPER_ADMIN_EMAIL|email === superEmail/));
test('public tracking-key validation does not disclose project data',()=>{
 const block=server.slice(server.indexOf("app.get('/api/track/verify'"),server.indexOf("app.get('/sdk/datatalk.js'"));assert.match(block,/valid: true/);assert.doesNotMatch(block,/return \{.*project/);
});
test('private sandbox is disabled by default and requires a super admin',()=>{
 assert.match(server,/ENABLE_TRIAL_SANDBOX !== 'true'/);assert.match(server,/await auth.requireSuperAdmin\(request\)/);assert.match(server,/data.tracking_key === TRIAL_TRACKING_KEY/);
});
