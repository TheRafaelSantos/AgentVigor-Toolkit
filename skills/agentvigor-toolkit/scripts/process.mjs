import { execFile, spawn } from 'node:child_process';
import { createHash } from 'node:crypto';
import { constants } from 'node:fs';
import { lstat, open, realpath } from 'node:fs/promises';
import { isAbsolute, join } from 'node:path';
import { stripVTControlCharacters } from 'node:util';

const windows = process.platform === 'win32';
export const failure = (code, message = code) => Object.assign(new Error(message), { code });

async function terminate(child) {
  if (!child.pid) return;
  if (!windows) {
    try { process.kill(-child.pid, 'SIGKILL'); }
    catch { if (child.exitCode === null && child.signalCode === null) child.kill('SIGKILL'); }
    return;
  }
  if (child.exitCode !== null || child.signalCode !== null) return;
  const systemRoot = process.env.SystemRoot;
  if (systemRoot && /^[a-z]:[\\/]/i.test(systemRoot)) {
    const taskkill = join(systemRoot, 'System32', 'taskkill.exe');
    await new Promise(resolve => {
      execFile(taskkill, ['/PID', String(child.pid), '/T', '/F'], {
        env: minimalEnv(process.env), windowsHide: true, timeout: 2000, maxBuffer: 16_384,
      }, () => resolve());
    });
  }
  if (child.exitCode === null && child.signalCode === null) child.kill('SIGKILL');
}

export async function runFile(executable, args, {
  timeoutMs = 10_000, maxOutputBytes = 256 * 1024, signal, env = process.env, cwd,
} = {}) {
  if (typeof executable !== 'string' || !isAbsolute(executable)
    || (windows && (!/^[a-z]:[\\/]/i.test(executable) || !/\.(exe|com)$/i.test(executable)))) {
    throw failure('PROCESS_EXECUTABLE', 'Expected an absolute executable path.');
  }
  if (!Number.isInteger(timeoutMs) || timeoutMs < 1 || timeoutMs > 2_147_483_647
    || !Number.isSafeInteger(maxOutputBytes) || maxOutputBytes < 1) {
    throw failure('PROCESS_LIMIT', 'Invalid subprocess limit.');
  }
  if (signal?.aborted) throw failure('PROCESS_ABORTED', 'Subprocess cancelled.');

  let child;
  try {
    child = spawn(executable, args, {
      env, cwd, shell: false, detached: !windows, windowsHide: true, stdio: ['ignore', 'pipe', 'pipe'],
    });
  } catch {
    throw failure('PROCESS_START', 'Unable to start the subprocess.');
  }

  return new Promise((resolve, reject) => {
    const stdout = [];
    const stderr = [];
    let size = 0;
    let error;
    let stopping;

    function stop(code, message) {
      if (error) return;
      error = failure(code, message);
      stopping = terminate(child).catch(() => {
        if (child.exitCode === null && child.signalCode === null) child.kill('SIGKILL');
      }).finally(() => {
        child.stdout.destroy();
        child.stderr.destroy();
      });
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
    child.stdout.on('data', (chunk) => append(stdout, chunk));
    child.stderr.on('data', (chunk) => append(stderr, chunk));
    child.on('error', () => { error ??= failure('PROCESS_START', 'Unable to start the subprocess.'); });
    child.once('close', async (code) => {
      clearTimeout(timer);
      signal?.removeEventListener('abort', abort);
      await stopping;
      if (error) reject(error);
      else if (code === null) reject(failure('PROCESS_SIGNAL', 'Subprocess terminated by a signal.'));
      else resolve({ stdout: Buffer.concat(stdout).toString('utf8'), stderr: Buffer.concat(stderr).toString('utf8'), code });
    });
    if (signal?.aborted) abort();
  });
}

export const hash = bytes => createHash('sha256').update(bytes).digest('hex');
export const token = (...parts) => hash(JSON.stringify(parts));

export function requirePlan(expectedPlan, planToken) {
  if (expectedPlan === undefined) throw failure('CONFIRMATION_REQUIRED');
  if (expectedPlan !== planToken) throw failure('PLAN_CHANGED');
}

export async function projectDirectory(path) {
  try {
    const directory = await realpath(path);
    if ((await lstat(directory)).isDirectory()) return directory;
  } catch {
    // The caller gets a stable error without the machine path.
  }
  throw failure('PROJECT_PATH');
}

export async function readRegular(path, maxBytes, errorCode) {
  let file;
  try {
    const info = await lstat(path);
    if (!info.isFile() || info.size > maxBytes) throw failure(errorCode);
    const flags = windows ? constants.O_RDONLY : constants.O_RDONLY | constants.O_NOFOLLOW | constants.O_NONBLOCK;
    file = await open(path, flags);
    const opened = await file.stat();
    if (!opened.isFile() || opened.ino !== info.ino || opened.dev !== info.dev || opened.size > maxBytes) throw failure(errorCode);
    const bytes = Buffer.alloc(opened.size + 1);
    let offset = 0;
    while (offset < bytes.length) {
      const { bytesRead } = await file.read(bytes, offset, bytes.length - offset, offset);
      if (bytesRead === 0) break;
      offset += bytesRead;
    }
    if (offset !== opened.size) throw failure(errorCode);
    return bytes.subarray(0, offset);
  } catch (error) {
    if (error.code === 'ENOENT') return null;
    throw failure(errorCode);
  } finally {
    await file?.close();
  }
}

export async function readProjectFile(root, relative, maxBytes, errorCode) {
  const segments = relative.split('/');
  let path = root;
  for (const segment of segments.slice(0, -1)) {
    path = join(path, segment);
    try {
      if (!(await lstat(path)).isDirectory()) throw failure(errorCode);
    } catch (error) {
      if (error.code === 'ENOENT') return null;
      throw failure(errorCode);
    }
  }
  return readRegular(join(path, segments.at(-1)), maxBytes, errorCode);
}

const basicEnv = /^(?:PATH|PATHEXT|HOME|USERPROFILE|HOMEDRIVE|HOMEPATH|APPDATA|LOCALAPPDATA|SYSTEMROOT|WINDIR|COMSPEC|TEMP|TMP|TMPDIR|LANG|LANGUAGE|LC_[A-Z_]+|CI)$/i;

export function minimalEnv(env, names = []) {
  const selected = new Set(names.map(name => windows ? name.toUpperCase() : name));
  return {
    ...Object.fromEntries(Object.entries(env).filter(([name, value]) => typeof value === 'string'
      && (basicEnv.test(name) || selected.has(windows ? name.toUpperCase() : name)))),
    DISABLE_TELEMETRY: '1', NEXT_TELEMETRY_DISABLED: '1', RTK_TELEMETRY_DISABLED: '1',
  };
}

export function redactOutput(text, secrets = []) {
  let output = stripVTControlCharacters(text).replace(/[\x00-\x08\x0b\x0c\x0e-\x1f\x7f-\x9f]/g, '');
  for (const value of secrets.filter(Boolean).sort((first, second) => second.length - first.length)) {
    output = output.replaceAll(value, '[redacted]');
  }
  return output
    .replace(/-----BEGIN [^\n-]*PRIVATE KEY-----[\s\S]*?-----END [^\n-]*PRIVATE KEY-----/g, '[redacted]')
    .replace(/(\b(?:Bearer|Basic)[ \t]+)[\w.+/=-]+/gi, '$1[redacted]')
    .replace(/(\b[a-z][a-z0-9+.-]*:\/\/)[^\s/@]+:[^\s/@]+@/gi, '$1[redacted]@')
    .replace(/\b(?:gh[pousr]_[a-z0-9]+|github_pat_[a-z0-9_]+|sk-[a-z0-9_-]{16,}|xox[baprs]-[a-z0-9-]+)\b/gi, '[redacted]')
    .replace(/(\b[\w.-]*(?:password|secret|token|api[_-]?key)["']?\s*[:=]\s*)(?:"[^"\n]*"|'[^'\n]*'|[^\s,;"']+)/gi, '$1[redacted]');
}
