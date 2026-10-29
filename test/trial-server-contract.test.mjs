import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const source = readFileSync(new URL('../src/server.js', import.meta.url), 'utf8');
const start = source.indexOf('async function ensureTrialProject()');
const end = source.indexOf('async function trialEvents', start);
const bootstrap = source.slice(start, end);

test('trial bootstrap does not use PostgREST singular response mode', () => {
  assert.ok(start >= 0 && end > start, 'trial bootstrap block should exist');
  assert.equal(bootstrap.includes('.single()'), false);
  assert.equal(bootstrap.includes('.maybeSingle()'), false);
});

test('trial feedback insert does not require a singular PostgREST response', () => {
  const feedbackStart = source.indexOf("app.post('/api/try/feedback'");
  const seedStart = source.indexOf("app.post('/api/try/seed'", feedbackStart);
  const feedbackBlock = source.slice(feedbackStart, seedStart);
  assert.equal(feedbackBlock.includes('.single()'), false);
});

test('trial event insert does not require a singular PostgREST response', () => {
  const eventStart = source.indexOf("app.post('/api/try/event'");
  const feedbackStart = source.indexOf("app.post('/api/try/feedback'", eventStart);
  const eventBlock = source.slice(eventStart, feedbackStart);
  assert.equal(eventBlock.includes('.single()'), false);
});
