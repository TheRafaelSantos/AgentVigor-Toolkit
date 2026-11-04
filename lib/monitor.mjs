import { setTimeout as wait } from 'node:timers/promises';
import { stripVTControlCharacters } from 'node:util';
import { runFile } from './process.mjs';

const failure = (code, message) => Object.assign(new Error(message), { code });
const messages = {
  monitorUpdated: 'AgentVigor · RTK · Updated',
  monitorRetry: 'RTK refresh failed. Retrying',
};

function monitorEnv(env) {
  const allowed = /^(?:HOME|USERPROFILE|APPDATA|LOCALAPPDATA|XDG_(?:CONFIG|DATA|STATE|CACHE)_HOME|SYSTEMROOT|WINDIR|TEMP|TMP|TMPDIR|LANG|LANGUAGE|LC_[A-Z_]+|RTK_DB_PATH|RTK_SUPPRESS_HOOK_WARNING)$/i;
  return {
    ...Object.fromEntries(Object.entries(env).filter(([key]) => allowed.test(key))),
    NO_COLOR: '1',
    RTK_TELEMETRY_DISABLED: '1',
  };
}

function cleanOutput(text) {
  return stripVTControlCharacters(text)
    .replace(/\r\n?/g, '\n')
    .replace(/[\x00-\x08\x0b-\x1f\x7f-\x9f]/g, '')
    .replace(/-----BEGIN [^\n-]*PRIVATE KEY-----[\s\S]*?-----END [^\n-]*PRIVATE KEY-----/g, '[redacted]')
    .replace(/(\b(?:Bearer|Basic)[ \t]+)[\w.+/=-]+/gi, '$1[redacted]')
    .replace(/(\b[a-z][a-z0-9+.-]*:\/\/)[^\s/@]+:[^\s/@]+@/gi, '$1[redacted]@')
    .replace(/\b(?:gh[pousr]_[a-z0-9]+|github_pat_[a-z0-9_]+|sk-[a-z0-9_-]{16,}|xox[baprs]-[a-z0-9-]+)\b/gi, '[redacted]')
    .replace(/(\b[\w.-]*(?:password|secret|token|api[_-]?key)["']?\s*[:=]\s*)(?:"[^"\n]*"|'[^'\n]*'|[^\s,;"']+)/gi, '$1[redacted]');
}

function write(stream, text) {
  if (!text) return;
  const cleaned = cleanOutput(text);
  if (cleaned) stream.write(cleaned.endsWith('\n') ? cleaned : `${cleaned}\n`);
}

async function gainArgs(executable, run, options) {
  if (!executable) throw failure('RTK_MISSING', 'The RTK executable is unavailable.');
  const help = await run(executable, ['gain', '--help'], options);
  const usage = `${help.stdout}\n${help.stderr}`;
  if (help.code !== 0 || !/\busage:.*\brtk(?:\.exe)?\s+gain\b/i.test(usage)) {
    throw failure('RTK_UNRECOGNIZED', 'The detected executable does not expose the expected RTK gain command.');
  }
  // New RTK can start its interactive dashboard automatically when a proxy is active.
  return /(?:^|\s)--text(?:\s|,|$)/.test(usage) ? ['gain', '--text'] : ['gain'];
}

export async function probeRtk(executable, { env = process.env, signal, run = runFile } = {}) {
  const options = { signal, env: monitorEnv(env), timeoutMs: 3000, maxOutputBytes: 16 * 1024 };
  await gainArgs(executable, run, options);
  const result = await run(executable, ['--version'], options);
  return {
    version: result.code === 0 ? /^rtk (\d+\.\d+\.\d+(?:[-+][\w.-]+)?)\s*$/i.exec(result.stdout.trim())?.[1] ?? null : null,
  };
}

export async function monitor({
  executable, interval = 60, once = false, noClear = false, signal, env = process.env,
  stdout = process.stdout, stderr = process.stderr, t = (key, value) => `${messages[key]} ${value}`,
  run = runFile,
} = {}) {
  if (!Number.isInteger(interval) || interval < 1 || interval > 3600) {
    throw failure('MONITOR_INTERVAL', 'The interval must be an integer between 1 and 3600 seconds.');
  }
  if (signal?.aborted) return;

  const options = { signal, env: monitorEnv(env), timeoutMs: 10_000 };
  try {
    const args = await gainArgs(executable, run, options);
    const canClear = !once && !noClear && stdout.isTTY && env.TERM !== 'dumb'
      && (Boolean(env.TERM) || Boolean(env.WT_SESSION));
    let failures = 0;

    while (!signal?.aborted) {
      try {
        const result = await run(executable, args, options);
        if (signal?.aborted) return;
        if (result.code !== 0) {
          write(stderr, result.stderr);
          write(stderr, result.stdout);
          throw failure('RTK_FAILED', 'RTK gain returned an error.');
        }
        if (canClear) stdout.write('\u001b[2J\u001b[H');
        stdout.write(`${t('monitorUpdated', new Date().toISOString())}\n\n`);
        write(stdout, result.stdout);
        write(stderr, result.stderr);
        failures = 0;
      } catch (error) {
        if (once || error.code !== 'PROCESS_TIMEOUT' || ++failures >= 3) throw error;
        stderr.write(`${t('monitorRetry', error.code)}\n`);
      }
      if (once || signal?.aborted) return;
      await wait(interval * 1000, undefined, { signal });
    }
  } catch (error) {
    if (!signal?.aborted || !['PROCESS_ABORTED', 'ABORT_ERR'].includes(error.code)) throw error;
  }
}
