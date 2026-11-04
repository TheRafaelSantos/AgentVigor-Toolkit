import assert from 'node:assert/strict';
import { test } from 'node:test';
import { reportInstallation } from '../lib/telemetry.mjs';

const event = { endpoint: 'https://example.invalid/v1/installations', version: '0.1.0-rc.1', system: 'wsl',
  agents: ['codex'], home: 'private home', hostname: 'private host', project: 'private project' };

test('defaults to disabled and requires a plain HTTPS endpoint', async () => {
  const send = async () => assert.fail('Unexpected outbound request');
  assert.equal(await reportInstallation(event, send), 'disabled');
  assert.equal(await reportInstallation({ ...event, consent: true, endpoint: '' }, send), 'unconfigured');
  assert.equal(await reportInstallation({ ...event, consent: true, endpoint: 'http://example.invalid/' }, send), 'invalid');
  assert.equal(await reportInstallation({ ...event, consent: true, endpoint: event.endpoint + '?debug=1' }, send), 'invalid');
});

test('consent sends a minimal one-shot event without redirects or credentials', async () => {
  const outcome = await reportInstallation({ ...event, consent: true }, async (url, options) => {
    assert.equal(url.href, event.endpoint);
    assert.equal(options.method, 'POST');
    assert.equal(options.redirect, 'error');
    assert.equal(options.credentials, 'omit');
    assert.ok(options.signal instanceof AbortSignal);
    assert.deepEqual(JSON.parse(options.body), {
      event: 'installation_completed', schemaVersion: 1, version: event.version, system: event.system,
      agents: event.agents,
    });
    return { ok: true };
  });
  assert.equal(outcome, 'sent');
});

test('telemetry transport failure does not throw', async () => {
  assert.equal(await reportInstallation({ ...event, consent: true }, async () => {
    throw new Error('test network failure');
  }), 'unavailable');
});
