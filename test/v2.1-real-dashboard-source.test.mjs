import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

const dashboard = fs.readFileSync(new URL('../app/dashboard/page.tsx', import.meta.url), 'utf8');
const component = fs.readFileSync(new URL('../components/RealOverviewDashboard.tsx', import.meta.url), 'utf8');

test('real dashboard uses live dashboard resource and not demo data', () => {
  assert.match(dashboard, /useLiveResource<RealDashboardData>\('dashboard'/);
  assert.doesNotMatch(dashboard, /demo-data|12,482|86 \/ 100/);
});

test('unsupported metrics render as double dash instead of fabricated values', () => {
  assert.match(component, /uxHealthScore/);
  assert.match(component, /No task start\/completion data yet/);
  assert.match(component, /Highest-priority issues from real data/);
});
