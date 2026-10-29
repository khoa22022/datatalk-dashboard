import assert from 'node:assert/strict';
import { isAllowedOrigin } from '../src/cors-policy.js';
assert.equal(isAllowedOrigin('https://datatalk-dashboard-qli5.vercel.app', []), true);
assert.equal(isAllowedOrigin('https://example.com', []), false);
assert.equal(isAllowedOrigin('https://example.com', ['https://example.com']), true);
assert.equal(isAllowedOrigin('http://localhost:3000', []), true);
console.log('CORS POLICY TEST: PASS');
