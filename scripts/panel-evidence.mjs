export function dispatchedReviewers(items) {
  return [...new Set(items.flatMap(item => {
    if (item?.type === 'subAgentActivity' && item.kind === 'started') {
      return typeof item.agentThreadId === 'string' && item.agentThreadId ? [item.agentThreadId] : [];
    }
    if (['collab_tool_call', 'collabAgentToolCall'].includes(item?.type)
      && ['spawn_agent', 'spawnAgent'].includes(item.tool) && item.status === 'completed') {
      return (item.receiver_thread_ids ?? item.receiverThreadIds ?? []).filter(id => typeof id === 'string' && id);
    }
    return [];
  }))];
}
