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
  const result = spawnSync(process.execPath, args, { cwd: root, encoding: 'utf8', timeout: 120_000,
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
    if (['skills/agentvigor-toolkit/references/upstream/templates/next/.env.example',
      'skills/agentvigor-toolkit/references/full/source/templates/next/.env.example'].includes(path)) continue;
    assert.doesNotMatch(path, /(?:^|\/)(?:\.env(?:\.|$)|.*\.(?:db|sqlite|pem|log|key)$)/i);
  }
  const tarball = join(temp, packed.filename);
  node([npm, 'install', '--global', '--prefix', prefix, '--no-audit', '--no-fund', ...opts, tarball]);
  const shim = isWindows ? join(prefix, 'agentvigor.cmd') : join(prefix, 'bin', 'agentvigor');
  await access(shim);
  const entry = isWindows ? join(prefix, 'node_modules', pkg.name, pkg.bin.agentvigor) : shim;
  const env = { HOME: home, USERPROFILE: home, CLAUDE_CONFIG_DIR: '', CODEX_HOME: '', CI: 'true' };
  assert.equal(node([entry, '--version'], env).trim(), pkg.version);
  const findSkills = JSON.parse(node([entry, 'integrations', '--tool', 'find-skills', '--agent', 'codex',
    '--mode', 'install', '--dry-run', '--json'], env));
  assert.equal(findSkills.changes.length, 2);
  assert.equal(findSkills.source.version, '1.7.6');
  assert.equal(findSkills.networkRequired, true);
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
  for (const [agent, client] of [['codex', '.agents'], ['claude', '.claude']]) {
    const router = join(home, client, 'skills', 'agentvigor-toolkit');
    await access(join(router, 'SKILL.md'));
    await access(join(router, 'references', 'provenance.json'));
    assert.ok(status.skills.some(skill => skill.agent === agent && skill.skill === 'agentvigor-toolkit' &&
      skill.path === 'scripts/project.mjs' && skill.status === 'ok'));
  }
  const catalog = JSON.parse(node([entry, 'catalog', '--lang', 'es', '--json'], env));
  assert.equal(catalog.entries.length, 16);
  const full = JSON.parse(node([entry, 'catalog', '--id', 'development-environment-setup',
    '--mode', 'full', '--lang', 'pt-BR', '--json'], env));
  assert.equal(full.mode, 'full');
  assert.ok(full.content.length > 10000);
  await access(join(home, '.agents', 'skills', 'agentvigor-toolkit', 'references', 'full',
    'source', 'templates', 'next', '.env.example'));
  const project = join(temp, 'example project');
  await mkdir(project);
  node([entry, 'project', '--mode', 'init', '--path', project, '--template', 'docs', '--yes'], env);
  await access(join(project, 'PRODUCT.md'));
  node([entry, 'rollback', '--all', '--yes', '--json'], env);
  assert.equal(JSON.parse(node([entry, 'status', '--json'], env)).status, 'not-installed');
  console.log(`Package smoke passed (${process.platform}/${process.arch}, ${packed.entryCount} files)`);
} finally {
  await rm(temp, { recursive: true, force: true });
}
