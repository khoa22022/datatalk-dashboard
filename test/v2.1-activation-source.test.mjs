import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
const read=(name)=>readFileSync(new URL('../'+name,import.meta.url),'utf8');

test('connect flow narrows project before async handlers and uses stable projectId',()=>{
  const source=read('app/projects/[id]/connect/page.tsx');
  assert.match(source,/if\(!project \|\| !status\)return/);
  assert.match(source,/const projectId=project\.id/);
  assert.match(source,/tracking\/status/);
  assert.match(source,/tracking\/setup/);
  assert.doesNotMatch(source,/api\(`\/api\/projects\/\$\{project\.id\}/);
});

test('account controls live in topbar and password fields have visibility toggles',()=>{
  const topbar=read('components/Topbar.tsx');
  const shell=read('components/LayoutShell.tsx');
  const auth=read('components/v2/AuthForm.tsx');
  assert.match(topbar,/account-dropdown/);
  assert.match(topbar,/auth\.signOut/);
  assert.match(topbar,/href="\/settings"/);
  assert.match(shell,/<Topbar/);
  assert.match(auth,/password-toggle/);
  assert.match(auth,/EyeOff/);
});

test('language switcher is consolidated into the account menu',()=>{
  const topbar=read('components/Topbar.tsx');
  const styles=read('app/globals.css');
  assert.doesNotMatch(topbar,/<LanguageSwitcher\s*\/>/);
  assert.match(topbar,/account-language-row/);
  assert.match(topbar,/setLang\('en'\)/);
  assert.match(topbar,/setLang\('vi'\)/);
  assert.match(styles,/\.account-language-switch/);
});
