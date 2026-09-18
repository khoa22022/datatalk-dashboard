import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const read = (p) => readFileSync(new URL(`../${p}`, import.meta.url), 'utf8');

test('trial layout no longer renders a nested sidebar shell', () => {
  const src = read('app/try/layout.tsx');
  assert.doesNotMatch(src, /trial-shell|trial-side|TRIAL · SAMPLE DATA/);
});

test('global layout uses pathname-aware active navigation', () => {
  const src = read('components/LayoutShell.tsx');
  assert.match(src, /usePathname/);
  assert.match(src, /nav-item/);
  assert.match(src, /active/);
  assert.match(src, /\/try\/projects/);
});

test('add project is a guided platform-first flow', () => {
  const src = read('app/projects/new/page.tsx');
  assert.match(src, /Figma Site/);
  assert.match(src, /Mobile App/);
  assert.match(src, /project-wizard/);
  assert.match(src, /platform-card/);
});

test('i18n contains project and shell translations in English and Vietnamese', () => {
  const src = read('components/i18n.tsx');
  for (const key of ['projectsTitle','addProject','trackingActive','projectName','businessGoal','createProject','figmaSite','website','webApp','mobileApp']) {
    assert.ok(src.split(`${key}:`).length >= 3, `${key} must exist in both dictionaries`);
  }
});

test('styles include active indicator and motion classes', () => {
  const src = read('app/globals.css');
  assert.match(src, /\.nav-item\.active::before/);
  assert.match(src, /@keyframes pageIn/);
  assert.match(src, /\.project-wizard/);
  assert.match(src, /\.platform-card\.selected/);
});
