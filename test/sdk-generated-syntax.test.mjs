import test from 'node:test';
import assert from 'node:assert/strict';
import vm from 'node:vm';
import { buildSdk } from '../src/v2/sdk-v22.js';

test('generated browser SDK parses as JavaScript', () => {
  const sdk = buildSdk('https://example.test');
  assert.match(sdk, /DataTalk/);
  assert.doesNotThrow(() => new vm.Script(sdk));
});
