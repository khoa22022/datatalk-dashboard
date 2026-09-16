import assert from 'node:assert/strict';

const scenario = [
  'session_start','page_view','section_view','section_heartbeat','scroll',
  'click','rage_click','dead_click','page_heartbeat','task_start',
  'task_step','task_error','task_backtrack','task_step','task_complete','session_end'
];

assert.equal(scenario.length, 16);
assert.equal(scenario[0], 'session_start');
assert.equal(scenario.at(-1), 'session_end');
assert.ok(scenario.includes('section_heartbeat'));
assert.ok(scenario.includes('rage_click'));
assert.ok(scenario.includes('task_complete'));
console.log('RED TEST BASELINE: scenario contract expectations are defined.');
