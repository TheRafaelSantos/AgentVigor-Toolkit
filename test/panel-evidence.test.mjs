import assert from 'node:assert/strict';
import { test } from 'node:test';
import { dispatchedReviewers } from '../scripts/panel-evidence.mjs';

test('panel evidence accepts actual starts and rejects waits or duplicate reviewers', () => {
  const activity = id => ({ type: 'subAgentActivity', kind: 'started', agentThreadId: id });
  assert.deepEqual(dispatchedReviewers([activity('a'), activity('a'), activity('b')]), ['a', 'b']);
  assert.deepEqual(dispatchedReviewers([{ type: 'collab_tool_call', tool: 'wait', receiver_thread_ids: ['a', 'b'] }]), []);
  assert.deepEqual(dispatchedReviewers([{ type: 'collabAgentToolCall', tool: 'spawnAgent', status: 'completed', receiverThreadIds: ['a'] }]), ['a']);
  assert.deepEqual(dispatchedReviewers([{ type: 'collab_tool_call', tool: 'spawn_agent', status: 'failed', receiver_thread_ids: ['a'] }]), []);
  assert.deepEqual(dispatchedReviewers([{ type: 'subAgentActivity', kind: 'completed', agentThreadId: 'a' }, { text: 'two reviewers launched' }, null]), []);
});
