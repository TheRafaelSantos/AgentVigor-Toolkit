import assert from 'node:assert/strict';
import { test } from 'node:test';
import { completedRootTurn } from '../scripts/codex-appserver.mjs';

test('native panel transport waits for the coordinator instead of a child turn', () => {
  const event = threadId => ({ method: 'turn/completed', params: { threadId, turn: { status: 'completed' } } });
  assert.equal(completedRootTurn(event('reviewer'), 'coordinator'), false);
  assert.equal(completedRootTurn(event('coordinator'), 'coordinator'), true);
  assert.equal(completedRootTurn({ method: 'turn/started', params: { threadId: 'coordinator' } }, 'coordinator'), false);
  assert.equal(completedRootTurn({ method: 'turn/completed', params: {} }, undefined), false);
});
