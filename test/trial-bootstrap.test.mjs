import test from 'node:test';
import assert from 'node:assert/strict';
import { firstRow, requireFirstRow, TRIAL_TRACKING_KEY } from '../src/trial-bootstrap.js';

test('firstRow tolerates zero, one, or duplicate rows without PostgREST singular mode', () => {
  assert.equal(firstRow({ data: [], error: null }), null);
  assert.deepEqual(firstRow({ data: [{ id: 'a' }], error: null }), { id: 'a' });
  assert.deepEqual(firstRow({ data: [{ id: 'a' }, { id: 'b' }], error: null }), { id: 'a' });
});

test('requireFirstRow reports contextual missing-row errors', () => {
  assert.throws(() => requireFirstRow({ data: [], error: null }, 'trial project insert'), /trial project insert returned no row/);
});

test('firstRow propagates database errors', () => {
  const error = new Error('db failed');
  assert.throws(() => firstRow({ data: null, error }), /db failed/);
});

test('trial tracking key is deterministic for idempotent bootstrap', () => {
  assert.equal(TRIAL_TRACKING_KEY, 'dt_trial_internal_sandbox');
});
