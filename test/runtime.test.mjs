import assert from 'node:assert/strict';
import { constants } from 'node:fs';
import { access, chmod, mkdtemp, rm, unlink, writeFile } from 'node:fs/promises';
import { delimiter, join } from 'node:path';
import { test } from 'node:test';
import { detectPlatform, detectTools } from '../lib/platform.mjs';
import { runFile } from '../lib/process.mjs';
import { monitor, probeRtk } from '../lib/monitor.mjs';

const result = (stdout, stderr = '', code = 0) => ({ stdout, stderr, code });
const gainHelp = 'Usage: rtk gain [OPTIONS]\n  --text  Force the static text view\n';

function output(isTTY = false) {
  return {
    isTTY, value: '',
    write(chunk) { this.value += chunk; },
  };
}

test('classifies Windows, Linux, WSL and both macOS architectures without probing agents', () => {
  for (const [platform, arch, release, env, system, gui] of [
    ['win32', 'x64', '10.0.26100', { SESSIONNAME: 'Console' }, 'windows', true],
    ['win32', 'arm64', '10.0.26100', { SESSIONNAME: 'Services' }, 'windows', false],
    ['linux', 'x64', '6.8.0', {}, 'linux', false],
    ['linux', 'x64', '6.6.87.2-microsoft-standard-WSL2', { WAYLAND_DISPLAY: 'wayland-0' }, 'wsl', true],
    ['linux', 'x64', '6.8.0', { WSL_DISTRO_NAME: 'Ubuntu', DISPLAY: ':0', CI: 'true' }, 'wsl', false],
    ['darwin', 'x64', '23.0.0', {}, 'macos', true],
    ['darwin', 'arm64', '25.0.0', { SSH_CONNECTION: 'remote' }, 'macos', false],
  ]) {
    const detected = detectPlatform({ env: { SHELL: '/bin/zsh', ...env }, platform, arch, release, home: '/test home' });
    assert.deepEqual(detected, { system, platform, arch, release, shell: 'zsh', home: '/test home', gui });
  }
});

test('finds tools on an absolute PATH with spaces and rejects missing or unusable RTK', async (t) => {
  const directory = await mkdtemp(join(process.cwd(), '.runtime fixtures '));
  t.after(() => rm(directory, { recursive: true, force: true }));
  const windows = process.platform === 'win32';
  const codex = join(directory, windows ? 'codex.cmd' : 'codex');
  const rtk = join(directory, windows ? 'rtk.cmd' : 'rtk');
  const opener = join(directory, windows ? 'xdg-open.exe' : 'xdg-open');
  await writeFile(codex, 'fixture');
  await chmod(codex, 0o700);
  await writeFile(rtk, 'fixture');
  await writeFile(opener, 'fixture');
  await chmod(opener, 0o700);
  const env = { [windows ? 'Path' : 'PATH']: ['.', `"${directory}"`].join(delimiter) };
  const tools = await detectTools({ env });
  assert.deepEqual(tools.codex, { available: true, path: codex });
  assert.deepEqual(tools.claude, { available: false });
  assert.deepEqual(tools['xdg-open'], { available: true, path: opener });
  assert.equal((await detectTools({ env: { PATH: directory.slice(process.cwd().length + 1) } })).codex.available, false);
  if (windows) {
    assert.deepEqual((await detectTools({ env })).rtk, { available: false });
  } else {
    await chmod(rtk, 0o600);
    const executableWithoutMode = await access(rtk, constants.X_OK).then(() => true, (error) => {
      if (error.code !== 'EACCES') throw error;
      return false;
    });
    if (executableWithoutMode) t.diagnostic('The filesystem grants X_OK despite chmod 0600.');
    else assert.deepEqual((await detectTools({ env })).rtk, { available: false });
  }
  const executable = windows ? join(directory, 'rtk.exe') : rtk;
  await writeFile(executable, 'fixture');
  await chmod(executable, 0o700);
  assert.deepEqual((await detectTools({ env })).rtk, { available: true, path: executable });
  await unlink(executable);
  assert.deepEqual((await detectTools({ env })).rtk, { available: false });
  assert.deepEqual(tools.node, { available: true, path: process.execPath });
});

test('runs argv literally and keeps stdout, stderr and exit status separate', async () => {
  const input = 'argument with spaces & | $(echo injected)';
  const script = 'process.stdout.write(process.argv[1]); process.stderr.write("warning"); process.exitCode = 7';
  assert.deepEqual(await runFile(process.execPath, ['-e', script, input]), result(input, 'warning', 7));
  await assert.rejects(runFile('rtk', ['gain']), { code: 'PROCESS_EXECUTABLE' });
  if (process.platform === 'win32') {
    await assert.rejects(runFile(join(process.cwd(), 'rtk.cmd'), ['gain']), { code: 'PROCESS_EXECUTABLE' });
  }
});

test('bounds wall time and aggregate output and terminates on abort', async () => {
  const forever = ['-e', 'setInterval(() => {}, 1000)'];
  await assert.rejects(runFile(process.execPath, forever, { timeoutMs: 80 }), { code: 'PROCESS_TIMEOUT' });
  await assert.rejects(runFile(process.execPath, ['-e', 'process.stdout.write("x".repeat(200)); process.stderr.write("y".repeat(200))'], { maxOutputBytes: 250 }), { code: 'PROCESS_OUTPUT_LIMIT' });
  const controller = new AbortController();
  const pending = runFile(process.execPath, forever, { signal: controller.signal });
  controller.abort();
  await assert.rejects(pending, { code: 'PROCESS_ABORTED' });
  await assert.rejects(runFile(process.execPath, forever, { signal: controller.signal }), { code: 'PROCESS_ABORTED' });
});

test('runs the static RTK summary once with visible time, estimates and warnings', async () => {
  const stdout = output(true);
  const stderr = output();
  const calls = [];
  await monitor({
    executable: process.execPath, once: true, stdout, stderr, t: (key, value) => `${key} ${value}`,
    run: async (_, args, options) => {
      calls.push(args);
      assert.ok(options.timeoutMs > 0);
      return calls.length === 1 ? result(gainHelp) : result('Saved: 432 tokens (60%)\n', 'Enable the hook to record more.\n');
    },
  });
  assert.deepEqual(calls, [['gain', '--help'], ['gain', '--text']]);
  assert.match(stdout.value, /monitorUpdated \d{4}-\d{2}-\d{2}T/);
  assert.match(stdout.value, /Saved: 432 tokens \(60%\)\n$/);
  assert.doesNotMatch(stdout.value, /\u001b/);
  assert.equal(stderr.value, 'Enable the hook to record more.\n');
});

test('retains legacy gain arguments and removes terminal controls and credential patterns', async () => {
  const stdout = output(true);
  const stderr = output();
  await monitor({
    executable: process.execPath, once: true, stdout, stderr,
    env: { TERM: 'dumb', RTK_DB_PATH: '/test home/history.db', GITHUB_TOKEN: 'unique-credential-for-test' },
    run: async (_, args, options) => {
      assert.equal(options.env.GITHUB_TOKEN, undefined);
      assert.equal(options.env.RTK_DB_PATH, '/test home/history.db');
      assert.equal(options.env.RTK_TELEMETRY_DISABLED, '1');
      if (args[1] === '--help') return result('Usage: rtk gain [OPTIONS]\n');
      assert.deepEqual(args, ['gain']);
      return result('\u001b[31mSavings: 25%\u001b[0m\n', 'Authorization: Bearer abc-secret\nhttps://alice:password@example.invalid\n');
    },
  });
  assert.match(stdout.value, /Savings: 25%/);
  assert.doesNotMatch(stdout.value, /\u001b/);
  assert.doesNotMatch(stderr.value, /abc-secret|password|alice/);
  assert.match(stderr.value, /\[redacted\]/);
});

test('validates intervals, missing RTK and a different executable with the same name', async () => {
  const io = { stdout: output(), stderr: output() };
  await assert.rejects(monitor(io), { code: 'RTK_MISSING' });
  for (const interval of [0, 1.5, -1, 3601, NaN, '30']) {
    await assert.rejects(monitor({ ...io, executable: process.execPath, interval }), { code: 'MONITOR_INTERVAL' });
  }
  await assert.rejects(monitor({ ...io, executable: process.execPath, run: async () => result('Rust Type Kit') }), { code: 'RTK_UNRECOGNIZED' });
  await assert.rejects(monitor({ ...io, executable: process.execPath, once: true, run: async (_, args) => args[1] === '--help' ? result(gainHelp) : result('', 'configuration invalid', 1) }), { code: 'RTK_FAILED' });
});

test('probes RTK capability and version without passing secrets or accessing its database', async () => {
  const calls = [];
  const options = {
    env: { GITHUB_TOKEN: 'fixture-private-value' },
    run: async (_, args, { env }) => {
      calls.push(args);
      assert.equal(env.GITHUB_TOKEN, undefined);
      assert.equal(env.RTK_TELEMETRY_DISABLED, '1');
      return args[0] === 'gain' ? result(gainHelp) : result('rtk 1.1.0\n');
    },
  };
  assert.deepEqual(await probeRtk(process.execPath, options), { version: '1.1.0' });
  assert.deepEqual(calls, [['gain', '--help'], ['--version']]);
  await assert.rejects(probeRtk(process.execPath, { run: async () => result('rtk 1.0.0') }), { code: 'RTK_UNRECOGNIZED' });
});

test('loop waits for each child, retries a timeout and stops on abort during a refresh', async () => {
  const controller = new AbortController();
  const stdout = output(true);
  const stderr = output();
  let calls = 0;
  let active = 0;
  await monitor({
    executable: process.execPath, interval: 1, noClear: true, signal: controller.signal, stdout, stderr, env: { TERM: 'xterm' },
    t: (key, value) => `${key} ${value}`,
    run: async (_, args, options) => {
      assert.equal(options.signal, controller.signal);
      if (args[1] === '--help') return result(gainHelp);
      assert.equal(active++, 0);
      try {
        calls += 1;
        if (calls === 1) throw Object.assign(new Error(), { code: 'PROCESS_TIMEOUT' });
        if (calls === 2) return result('Result\n');
        controller.abort();
        throw Object.assign(new Error(), { code: 'PROCESS_ABORTED' });
      } finally {
        active -= 1;
      }
    },
  });
  assert.equal(calls, 3);
  assert.doesNotMatch(stdout.value, /\u001b/);
  assert.match(stderr.value, /monitorRetry PROCESS_TIMEOUT/);
});

test('cancels during the wait between refreshes without running another child', async () => {
  const controller = new AbortController();
  let calls = 0;
  await monitor({
    executable: process.execPath, interval: 3600, signal: controller.signal, stdout: output(), stderr: output(),
    run: async (_, args) => {
      calls += 1;
      if (args[1] === '--help') return result(gainHelp);
      setImmediate(() => controller.abort());
      return result('Result\n');
    },
  });
  assert.equal(calls, 2);
});
