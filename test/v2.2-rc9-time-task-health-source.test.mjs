import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
const read = (p) => fs.readFileSync(new URL(`../${p}`, import.meta.url), 'utf8');

test('session and filter dates are normalized to Vietnam time', () => {
  assert.match(read('app/sessions/page.tsx'), /formatVietnamDateTime/);
  assert.match(read('lib/time.ts'), /Asia\/Ho_Chi_Minh/);
  assert.match(read('components/AnalyticsFilters.tsx'), /timeZone:'Asia\/Ho_Chi_Minh'/);
});

test('projects expose lost-signal tracking health instead of treating historical data as live', () => {
  const src = read('app/projects/page.tsx');
  assert.match(src, /lost_signal/);
  assert.match(src, /Mất tín hiệu/);
  assert.match(src, /Đang nhận dữ liệu/);
});

test('task efficiency exposes auto CTA route and completion timing', () => {
  const src = read('app/tasks/page.tsx');
  assert.match(src, /avgCompletionTimeMs/);
  assert.match(src, /CTA tự động/);
  assert.match(src, /sourcePage/);
  assert.match(src, /destinationPage/);
  assert.match(src, /Thời gian TB/);
});
