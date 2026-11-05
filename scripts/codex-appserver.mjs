import { spawn } from 'node:child_process';
import { createInterface } from 'node:readline';

export function completedRootTurn(message, rootThreadId) {
  return typeof rootThreadId === 'string' && message.method === 'turn/completed' && message.params?.threadId === rootThreadId;
}

export async function runAppServer(executable, prompt, { cwd, env, timeoutMs }) {
  const child = spawn(executable, ['app-server'], { cwd, env, stdio: ['pipe', 'pipe', 'ignore'], windowsHide: true });
  const messages = [];
  let rootThreadId;
  let outputBytes = 0;
  const send = message => child.stdin.write(JSON.stringify(message) + '\n');
  try {
    return await new Promise((resolve, reject) => {
      const timer = setTimeout(() => resolve({ code: null, processError: 'PROCESS_TIMEOUT', stdout: messages.map(JSON.stringify).join('\n') }), timeoutMs);
      const finish = value => { clearTimeout(timer); resolve(value); };
      const record = value => {
        outputBytes += Buffer.byteLength(JSON.stringify(value));
        if (outputBytes > 4 * 1024 * 1024) {
          finish({ code: null, processError: 'PROCESS_OUTPUT_LIMIT', stdout: messages.map(JSON.stringify).join('\n'), rootThreadId });
        } else messages.push(value);
      };
      child.once('error', error => { clearTimeout(timer); reject(error); });
      child.once('exit', code => finish({ code: code ?? 1, stdout: messages.map(JSON.stringify).join('\n') }));
      createInterface({ input: child.stdout }).on('line', line => {
        let message; try { message = JSON.parse(line); } catch { return; }
        if (message.id === 1 && !message.error) {
          send({ method: 'initialized' });
          send({ id: 2, method: 'thread/start', params: { cwd, ephemeral: true, sandbox: 'read-only', approvalPolicy: 'never', experimentalRawEvents: true } });
        } else if (message.id === 2 && !message.error) {
          rootThreadId = message.result.thread.id;
          send({ id: 3, method: 'turn/start', params: { threadId: message.result.thread.id, input: [{ type: 'text', text: prompt }] } });
        } else if (message.error) {
          record({ type: 'error', message: message.error.message });
          finish({ code: 1, stdout: messages.map(JSON.stringify).join('\n') });
        }
        if (message.method === 'item/completed' || message.method === 'item/started') {
          const item = message.params.item;
          if (['commandExecution', 'agentMessage', 'collabAgentToolCall', 'subAgentActivity'].includes(item.type)) record({ type: message.method === 'item/completed' ? 'item.completed' : 'item.started', threadId: message.params.threadId, item: {
            ...item,
            type: ({ commandExecution: 'command_execution', agentMessage: 'agent_message', collabAgentToolCall: 'collab_tool_call' })[item.type] ?? item.type,
            exit_code: item.exitCode, aggregated_output: item.aggregatedOutput,
            receiver_thread_ids: item.receiverThreadIds,
          } });
        }
        if (message.method === 'error') record({ type: 'error', message: message.params.error?.message });
        if (message.method === 'turn/completed') {
          record({ type: 'turn.finished', threadId: message.params.threadId, turn: message.params.turn });
          if (completedRootTurn(message, rootThreadId)) finish({ code: message.params.turn.status === 'completed' ? 0 : 1, stdout: messages.map(JSON.stringify).join('\n'), rootThreadId });
        }
        if (message.id !== undefined && message.method) send({ id: message.id, error: { code: -32601, message: 'No interactive approvals in read-only fixture' } });
      });
      send({ id: 1, method: 'initialize', params: { clientInfo: { name: 'agentvigor-panel-observation', version: '0.3.0' }, capabilities: { experimentalApi: true } } });
    });
  } finally {
    if (child.exitCode === null) {
      child.kill();
      await new Promise(resolve => child.once('close', resolve));
    }
  }
}
