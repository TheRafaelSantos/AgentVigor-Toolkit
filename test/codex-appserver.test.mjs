import assert from 'node:assert/strict';
import { test } from 'node:test';
import { completedRootTurn, runAppServer } from '../scripts/codex-appserver.mjs';

test('native panel transport waits for the coordinator instead of a child turn', () => {
  const event = threadId => ({ method: 'turn/completed', params: { threadId, turn: { status: 'completed' } } });
  assert.equal(completedRootTurn(event('reviewer'), 'coordinator'), false);
  assert.equal(completedRootTurn(event('coordinator'), 'coordinator'), true);
  assert.equal(completedRootTurn({ method: 'turn/started', params: { threadId: 'coordinator' } }, 'coordinator'), false);
  assert.equal(completedRootTurn({ method: 'turn/completed', params: {} }, undefined), false);
});

test('native audit transport rejects broader sandbox access before spawning', async () => {
  await assert.rejects(runAppServer('unused', '', { sandbox: 'danger-full-access' }), /sandbox/);
});
