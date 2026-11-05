import assert from 'node:assert/strict';
import { mkdir, mkdtemp, readFile, rm, writeFile } from 'node:fs/promises';
import { isAbsolute, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { runFile } from '../lib/process.mjs';

const executable = process.argv[2];
assert.ok(isAbsolute(executable || '') && process.argv.includes('--allow-network'),
  'Pass the absolute native Codex executable and --allow-network. Uses a disposable, unauthenticated profile.');
const home = await mkdtemp(resolve('.agentvigor-test-native-plugins-'));
const config = join(home, '.codex', 'config.toml');
const env = { ...process.env, HOME: home, USERPROFILE: home, CODEX_HOME: join(home, '.codex'),
  APPDATA: home, LOCALAPPDATA: home, AGENTVIGOR_CODEX_EXECUTABLE: executable };
const cli = fileURLToPath(new URL('../bin/agentvigor.mjs', import.meta.url));
const original = '# Existing user configuration\r\nmodel = "fixture-model"\r\n';
try {
  await mkdir(env.CODEX_HOME);
  await writeFile(config, original);
  async function apply(tool, mode) {
    const result = await runFile(process.execPath, [cli, 'integrations', '--tool', tool, '--agent', 'codex',
      '--mode', mode, '--yes', '--json'], { cwd: home, env, timeoutMs: 240000 });
    assert.equal(result.code, 0, result.stderr);
    return JSON.parse(result.stdout).status;
  }
  async function listed() {
    const result = await runFile(executable, ['plugin', 'list', '--json'], { cwd: home, env, timeoutMs: 20000 });
    assert.equal(result.code, 0, result.stderr);
    return JSON.parse(result.stdout).installed.filter(plugin => plugin.installed && plugin.enabled)
      .map(plugin => `${plugin.pluginId}:${plugin.version}`).sort();
  }
  assert.equal(await apply('superpowers', 'install'), 'installed');
  assert.equal(await apply('ponytail', 'install'), 'installed');
  assert.deepEqual(await listed(), ['ponytail@ponytail:5.3.3', 'superpowers@superpowers-dev:7.0.2']);
  assert.equal(await apply('superpowers', 'rollback'), 'rolled-back');
  assert.deepEqual(await listed(), ['ponytail@ponytail:5.3.3']);
  assert.equal(await apply('ponytail', 'rollback'), 'rolled-back');
  assert.equal(await readFile(config, 'utf8'), original);
  console.log('Codex registered both pinned plugins, preserved Ponytail when removing Superpowers, and restored the original config.');
} finally { await rm(home, { recursive: true, force: true }); }
