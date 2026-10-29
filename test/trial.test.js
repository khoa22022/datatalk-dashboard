import test from 'node:test';
import assert from 'node:assert/strict';
import { normalizeTrialEvent, aggregateTrialEvents } from '../src/trial.js';

test('normalizes a sandbox event with bounded metadata', () => {
  const event = normalizeTrialEvent({
    event: 'click',
    page: '/pricing',
    session_id: 'trial_session',
    element: 'BUTTON',
    metadata: { x: 12, y: 18, section: 'pricing-comparison' }
  });
  assert.equal(event.event, 'click');
  assert.equal(event.page, '/pricing');
  assert.equal(event.metadata.section, 'pricing-comparison');
});

test('aggregates trial events into dashboard-ready metrics', () => {
  const events = [
    { event:'page_view', page:'/pricing', metadata:{} },
    { event:'page_heartbeat', page:'/pricing', metadata:{duration_ms:30000} },
    { event:'section_view', page:'/pricing', metadata:{section:'pricing-comparison'} },
    { event:'section_heartbeat', page:'/pricing', metadata:{section:'pricing-comparison',duration_ms:20000} },
    { event:'rage_click', page:'/pricing', metadata:{section:'pricing-comparison'} },
    { event:'task_start', page:'/checkout', metadata:{task:'checkout'} },
    { event:'task_complete', page:'/checkout', metadata:{task:'checkout'} }
  ];
  const result = aggregateTrialEvents(events);
  assert.equal(result.overview.pageViews, 1);
  assert.equal(result.overview.activeTimeMs, 30000);
  assert.equal(result.overview.taskSuccessRate, 100);
  assert.equal(result.pages[0].page, '/pricing');
  assert.equal(result.sections[0].section, 'pricing-comparison');
  assert.equal(result.sections[0].attentionMs, 20000);
});

test('builds a deterministic realistic trial scenario payload', async () => {
  const { buildTrialScenario } = await import('../src/trial.js');
  const scenario = buildTrialScenario({
    visitor: 'trial_visitor_test',
    session: 'trial_session_test',
    nowMs: Date.parse('2026-09-17T00:00:00.000Z')
  });
  assert.equal(scenario.events.length, 16);
  assert.equal(scenario.heatmap.length, 3);
  assert.equal(scenario.session.session_key, 'trial_session_test');
  assert.equal(scenario.events[0].event, 'session_start');
  assert.equal(scenario.events.at(-1).event, 'session_end');
});
