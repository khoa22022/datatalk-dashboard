import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
const read = (p) => fs.readFileSync(new URL(`../${p}`, import.meta.url), 'utf8');

test('RC10 clamps long session and task labels without overflowing cards', () => {
  const sessions = read('app/sessions/page.tsx');
  const tasks = read('app/tasks/page.tsx');
  const css = read('app/globals.css');
  assert.match(sessions, /dt-clamp-2/);
  assert.match(sessions, /title=\{value\}/);
  assert.match(tasks, /dt-truncate-1/);
  assert.match(css, /text-overflow:ellipsis/);
  assert.match(css, /-webkit-line-clamp:2/);
});
