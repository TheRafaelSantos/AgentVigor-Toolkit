import assert from 'node:assert/strict';
import { test } from 'node:test';
import { integrations } from '../lib/integrations.mjs';

test('integration inventory separates executable, registration and client evidence', async () => {
  const result = await integrations({ env: { PATH: '' }, home: process.cwd() });
  assert.deepEqual(result.entries.map(entry => entry.id), ['rtk', 'superpowers', 'ponytail', 'find-skills', 'graphify']);
  for (const entry of result.entries) {
    assert.equal(entry.installed.state, ['superpowers', 'ponytail'].includes(entry.id) ? 'UNVERIFIED' : 'MISSING');
    assert.equal(entry.configured.state, 'UNVERIFIED');
    assert.equal(entry.discovered.state, 'UNVERIFIED');
    assert.equal(entry.verified.state, 'UNVERIFIED');
    assert.ok(entry.license && entry.source && entry.version);
  }
});

test('optional setup plans are scoped to exactly one tool and client', async () => {
  const result = await integrations({ tool: 'rtk', agent: 'codex', mode: 'plan', env: { PATH: '' } });
  assert.equal(result.entries.length, 1);
  assert.equal(result.agent, 'codex');
  assert.ok(result.entries[0].plan.some(step => step.args?.includes('--codex')));
  assert.ok(result.entries[0].plan.every(step => step.executed === false));
  assert.match(result.planToken, /^[a-f0-9]{64}$/);
  await assert.rejects(integrations({ tool: '../rtk' }), { code: 'INTEGRATION_TOOL' });
  await assert.rejects(integrations({ agent: 'both' }), { code: 'INVALID_AGENTS' });
  await assert.rejects(integrations({ mode: 'install' }), { code: 'INTEGRATION_MODE' });
});
