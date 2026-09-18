import assert from 'node:assert/strict';
import { buildTrialHeaders } from '../lib/trial-transport.mjs';

const noBody = buildTrialHeaders({ method: 'POST' });
assert.equal(noBody.Accept, 'application/json');
assert.equal(noBody['Content-Type'], undefined, 'POST without a body must not advertise application/json');

const withBody = buildTrialHeaders({ method: 'POST', body: JSON.stringify({ hello: 'world' }) });
assert.equal(withBody.Accept, 'application/json');
assert.equal(withBody['Content-Type'], 'application/json');

const custom = buildTrialHeaders({
  method: 'POST',
  body: JSON.stringify({ hello: 'world' }),
  headers: { 'X-Datatalk-Test': '1' },
});
assert.equal(custom['X-Datatalk-Test'], '1');
assert.equal(custom['Content-Type'], 'application/json');

console.log('PASS: trial requests only send JSON content-type when a body is present.');
