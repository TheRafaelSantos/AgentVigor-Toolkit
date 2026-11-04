import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { access, mkdir, mkdtemp, rm } from 'node:fs/promises';
import { delimiter, isAbsolute, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import pkg from '../package.json' with { type: 'json' };

const root = fileURLToPath(new URL('..', import.meta.url));
const temp = await mkdtemp(join(root, '.agentvigor-test-package with spaces-'));
const prefix = join(temp, 'local npm prefix');
const cache = join(temp, 'local npm cache');
const home = join(temp, 'isolated agent home');
const npm = process.env.npm_execpath;
const isWindows = process.platform === 'win32';

function node(args, overrides = {}) {
  const result = spawnSync(process.execPath, args, { cwd: root, encoding: 'utf8', timeout: 30_000,
    env: { ...process.env, ...overrides } });
  assert.equal(result.status, 0, result.stderr || String(result.error ?? ''));
  return result.stdout;
}

try {
  assert.ok(npm, 'Run via npm run smoke:package');
  await mkdir(home);
  const opts = ['--ignore-scripts', '--offline', '--cache', cache];
  const [packed] = JSON.parse(node([npm, 'pack', '--json', '--pack-destination', temp, ...opts]));
  assert.equal(packed.entryCount, packed.files.length);
  for (const { path } of packed.files) {
    assert.match(path, /^(LICENSE$|README[^/]*\.md$|CHANGELOG\.md$|CONTRIBUTING\.md$|THIRD_PARTY_NOTICES\.md$|package\.json$|(?:bin|lib|skills|docs|benchmarks)\/)/);
    assert.doesNotMatch(path, /(?:^|\/)(?:\.env(?:\.|$)|.*\.(?:db|sqlite|pem|log|key)$)/i);
  }
  const tarball = join(temp, packed.filename);
  node([npm, 'install', '--global', '--prefix', prefix, '--no-audit', '--no-fund', ...opts, tarball]);
  const shim = isWindows ? join(prefix, 'agentvigor.cmd') : join(prefix, 'bin', 'agentvigor');
  await access(shim);
  const entry = isWindows ? join(prefix, 'node_modules', pkg.name, pkg.bin.agentvigor) : shim;
  const env = { HOME: home, USERPROFILE: home, CLAUDE_CONFIG_DIR: '', CODEX_HOME: '', CI: 'true' };
  assert.equal(node([entry, '--version'], env).trim(), pkg.version);
  if (isWindows) {
    const command = process.env.ComSpec;
    assert.ok(isAbsolute(command ?? ''), 'ComSpec must identify cmd.exe');
    const pathKey = Object.keys(process.env).find(key => key.toUpperCase() === 'PATH') ?? 'Path';
    const result = spawnSync(command, ['/d', '/c', 'agentvigor --version'], {
      cwd: temp, encoding: 'utf8', timeout: 15_000,
      env: { ...process.env, ...env, [pathKey]: prefix + delimiter + (process.env[pathKey] ?? '') },
    });
    assert.equal(result.status, 0, result.stderr || String(result.error ?? ''));
    assert.equal(result.stdout.trim(), pkg.version);
  } else {
    const result = spawnSync(shim, ['--version'], { cwd: temp, encoding: 'utf8', timeout: 15_000,
      env: { ...process.env, ...env } });
    assert.equal(result.status, 0, result.stderr || String(result.error ?? ''));
    assert.equal(result.stdout.trim(), pkg.version);
  }
  const apply = JSON.parse(node([entry, 'install', '--agent', 'both', '--yes', '--json'], env));
  assert.equal(apply.status, 'installed');
  const status = JSON.parse(node([entry, 'status', '--json'], env));
  assert.deepEqual(status.agents, ['codex', 'claude']);
  node([entry, 'rollback', '--all', '--yes', '--json'], env);
  assert.equal(JSON.parse(node([entry, 'status', '--json'], env)).status, 'not-installed');
  console.log(`Package smoke passed (${process.platform}/${process.arch}, ${packed.entryCount} files)`);
} finally {
  await rm(temp, { recursive: true, force: true });
}
