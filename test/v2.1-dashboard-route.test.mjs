import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

const source = fs.readFileSync(new URL('../src/server.js', import.meta.url), 'utf8');
const analytics = fs.readFileSync(new URL('../src/v2/analytics-v22.js', import.meta.url), 'utf8');

test('real dashboard aggregates observed events and uses unique-issue UX health', () => {
  assert.match(source, /\/api\/projects\/:projectId\/dashboard/);
  assert.match(source, /const health = uxHealth\(currentEvents\)/);
  assert.match(source, /uxHealthScore: health\.score/);
  assert.match(analytics, /score: 100 - issues\.length/);
  assert.match(source, /frictionEvents/);
  assert.match(source, /deviceMix\(currentEvents\)/);
});
