import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {safeNext,workspaceStorageKey,projectStorageKey,assignableRoles,mayChangeMember,mayCreate} from '../lib/auth-utils.mjs';
const read=(name)=>readFileSync(new URL('../'+name,import.meta.url),'utf8');
test('auth redirect allowlist rejects external, encoded and protocol-relative destinations',()=>{
 for(const path of ['https://evil.example','//evil.example','/\\evil.example','/%2f%2fevil.example','javascript:alert(1)',undefined,'/admin/users','/dashboard?next=//evil.example']) assert.equal(safeNext(path),'/dashboard');
 for(const path of ['/dashboard','/projects','/settings/members','/reset-password']) assert.equal(safeNext(path),path);
});
test('workspace and project preferences are namespaced by user and workspace',()=>{
 assert.notEqual(workspaceStorageKey('A'),workspaceStorageKey('B'));
 assert.notEqual(projectStorageKey('A','W'),projectStorageKey('B','W'));
 assert.notEqual(projectStorageKey('A','W'),projectStorageKey('A','X'));
});
test('UI roles mirror the server hierarchy',()=>{
 assert.deepEqual(assignableRoles('OWNER'),['ADMIN','EDITOR','VIEWER']);assert.deepEqual(assignableRoles('ADMIN'),['EDITOR','VIEWER']);assert.deepEqual(assignableRoles('VIEWER'),[]);
 assert.equal(mayChangeMember('ADMIN','ADMIN'),false);assert.equal(mayChangeMember('OWNER','OWNER'),false);assert.equal(mayCreate('VIEWER'),false);assert.equal(mayCreate('EDITOR'),true);
});
test('browser auth uses PKCE and callback exchanges in the browser rather than a stateless server client',()=>{
 assert.match(read('lib/supabase.ts'),/flowType: 'pkce'/);assert.match(read('lib/supabase.ts'),/detectSessionInUrl: false/);
 assert.match(read('app/auth/complete/page.tsx'),/exchangeCodeForSession/);assert.doesNotMatch(read('app/auth/callback/route.ts'),/createClient|exchangeCodeForSession/);
});
test('live app is wrapped in the account gate and reset pages remain reachable',()=>{
 const shell=read('components/LayoutShell.tsx');assert.match(shell,/<AuthGate>/);assert.match(shell,/isSuperAdmin/);assert.match(shell,/\/forgot-password/);assert.match(shell,/\/reset-password/);
});
test('auth forms include real email sign-in, signup, Google and password reset handlers',()=>{
 const form=read('components/v2/AuthForm.tsx');for(const method of ['signInWithPassword','signUp','signInWithOAuth','resetPasswordForEmail','updateUser'])assert.ok(form.includes(method));assert.ok(form.includes('onSubmit={submit}'));
});
test('API helper always attaches session bearer tokens to protected calls',()=>{
 const api=read('lib/api.ts');assert.match(api,/headers.set\('Authorization', `Bearer/);assert.match(api,/credentials: 'omit'/);assert.match(api,/cache: 'no-store'/);
});
test('account pages do not use demo-data or nested AppShell',()=>{
 for(const name of ['app/admin/users/page.tsx','app/settings/page.tsx','app/dashboard/page.tsx','app/analytics/page.tsx','app/sessions/page.tsx','app/ai/page.tsx','app/heatmaps/page.tsx']){
  const source=read(name);assert.doesNotMatch(source,/demo-data|AppShell|12,482|92% CONFIDENCE|S-10482/);
 }
});
test('permissions mutations have a confirmation step',()=>{
 assert.match(read('app/admin/users/page.tsx'),/<ConfirmDialog/);assert.match(read('app/settings/members/page.tsx'),/<ConfirmDialog/);
});
test('no API client exposes a service role environment variable',()=>{
 assert.doesNotMatch(read('lib/supabase.ts'),/process\.env\.NEXT_PUBLIC_.*(?:SERVICE|SECRET)/);
});
