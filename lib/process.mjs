import { spawn } from 'node:child_process';
import { isAbsolute } from 'node:path';

const failure = (code, message) => Object.assign(new Error(message), { code });

export async function runFile(executable, args, {
  timeoutMs = 10_000, maxOutputBytes = 256 * 1024, signal, env = process.env, cwd,
} = {}) {
  if (typeof executable !== 'string' || !isAbsolute(executable)
    || (process.platform === 'win32' && (!/^[a-z]:[\\/]/i.test(executable) || !/\.(exe|com)$/i.test(executable)))) {
    throw failure('PROCESS_EXECUTABLE', 'Expected an absolute executable path.');
  }
  if (!Number.isInteger(timeoutMs) || timeoutMs < 1 || timeoutMs > 2_147_483_647
    || !Number.isSafeInteger(maxOutputBytes) || maxOutputBytes < 1) {
    throw failure('PROCESS_LIMIT', 'Invalid subprocess limit.');
  }
  if (signal?.aborted) throw failure('PROCESS_ABORTED', 'Subprocess cancelled.');

  let child;
  try {
    child = spawn(executable, args, { env, cwd, shell: false, windowsHide: true, stdio: ['ignore', 'pipe', 'pipe'] });
  } catch {
    throw failure('PROCESS_START', 'Unable to start the subprocess.');
  }

  return new Promise((resolve, reject) => {
    const stdout = [];
    const stderr = [];
    let size = 0;
    let error;

    function stop(code, message) {
      if (error) return;
      error = failure(code, message);
      child.kill('SIGKILL');
      child.stdout.destroy();
      child.stderr.destroy();
    }

    function append(chunks, chunk) {
      if (error) return;
      size += chunk.length;
      if (size > maxOutputBytes) {
        stop('PROCESS_OUTPUT_LIMIT', 'Subprocess output exceeded its limit.');
        return;
      }
      chunks.push(chunk);
    }

    const abort = () => stop('PROCESS_ABORTED', 'Subprocess cancelled.');
    const timer = setTimeout(() => stop('PROCESS_TIMEOUT', 'Subprocess timed out.'), timeoutMs);
    signal?.addEventListener('abort', abort, { once: true });
    if (signal?.aborted) abort();
    child.stdout.on('data', (chunk) => append(stdout, chunk));
    child.stderr.on('data', (chunk) => append(stderr, chunk));
    child.on('error', () => { error ??= failure('PROCESS_START', 'Unable to start the subprocess.'); });
    child.once('close', (code) => {
      clearTimeout(timer);
      signal?.removeEventListener('abort', abort);
      if (error) reject(error);
      else if (code === null) reject(failure('PROCESS_SIGNAL', 'Subprocess terminated by a signal.'));
      else resolve({ stdout: Buffer.concat(stdout).toString('utf8'), stderr: Buffer.concat(stderr).toString('utf8'), code });
    });
  });
}
