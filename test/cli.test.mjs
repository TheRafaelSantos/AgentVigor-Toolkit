import assert from 'node:assert/strict';
import { mkdtemp, rm, readdir, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { spawnSync } from 'node:child_process';
import { test } from 'node:test';

const bin = fileURLToPath(new URL('../bin/agentvigor.mjs', import.meta.url));
const testDir = fileURLToPath(new URL('.', import.meta.url));
const run = (args, env = {}) => spawnSync(process.execPath, [bin, ...args], {
  encoding: 'utf8', timeout: 90_000,
  env: { ...process.env, CI: 'true', LANG: 'en_US.UTF-8', LC_ALL: '', LC_MESSAGES: '', AGENTVIGOR_LANG: '', ...env },
});

test('help advertises every available command, and version matches the package', async () => {
  const help = run(['--help']);
  assert.equal(help.status, 0, help.stderr);
  for (const command of ['install', 'doctor', 'status', 'monitor', 'update', 'benchmark', 'rollback',
    'catalog', 'project', 'quality', 'harness']) {
    assert.match(help.stdout, new RegExp(`\\b${command}\\b`));
  }
  const { default: pkg } = await import('../package.json', { with: { type: 'json' } });
  assert.equal(run(['--version']).stdout.trim(), pkg.version);
});

test('CLI previews and evaluates a project harness from the local catalog', async (t) => {
  const path = await mkdtemp(join(testDir, '.tmp-harness-cli-'));
  t.after(() => rm(path, { recursive: true, force: true }));
  const catalog = run(['catalog', '--lang', 'pt-BR', '--json']);
  assert.equal(catalog.status, 0, catalog.stderr);
  assert.equal(JSON.parse(catalog.stdout).entries.length, 16);
  const created = run(['project', '--mode', 'init', '--template', 'harness', '--path', path, '--yes', '--json']);
  assert.equal(created.status, 0, created.stderr);
  assert.equal(JSON.parse(created.stdout).status, 'applied');
  const preview = run(['harness', '--path', path, '--dry-run', '--json']);
  assert.equal(preview.status, 0, preview.stderr);
  assert.equal(JSON.parse(preview.stdout).checks.length, 7);
  const denied = run(['harness', '--path', path, '--json']);
  assert.equal(denied.status, 2, denied.stderr);
  const baseline = run(['harness', '--path', path, '--yes', '--json']);
  assert.equal(baseline.status, 1, baseline.stderr);
  const results = JSON.parse(baseline.stdout);
  assert.equal(results.checks.filter(check => check.status === 'failed').length, 2);
  const missing = run(['quality', '--path', path, '--dry-run', '--json']);
  assert.equal(missing.status, 1, missing.stderr);
  assert.equal(JSON.parse(missing.stdout).error, 'QUALITY_MISSING');
});

test('locale detection, explicit override, and input errors', () => {
  assert.match(run(['--help'], { LANG: 'pt_BR.UTF-8' }).stdout, /Uso/);
  assert.match(run(['--help', '--lang', 'es'], { LANG: 'pt_BR.UTF-8' }).stdout, /Opciones/);
  const result = run(['install', '--profile', 'extra', '--lang', 'pt-BR']);
  assert.equal(result.status, 2);
  assert.match(result.stderr, /perfil/i);
  assert.equal(run(['status', '--yes']).status, 2);
  assert.equal(run(['monitor', '--interval', '2e1']).status, 2);
  assert.equal(run(['--lang', 'fr', '--help']).status, 2);
  assert.equal(run(['--help', 'unknown']).status, 2);
});

test('CLI installs and removes skills with consent in an isolated home with spaces', async (t) => {
  const home = await mkdtemp(join(testDir, '.tmp-cli with spaces-'));
  t.after(() => rm(home, { recursive: true, force: true }));
  const env = { HOME: home, USERPROFILE: home, CLAUDE_CONFIG_DIR: '', CODEX_HOME: '', Path: '', PATH: '' };
  const args = ['install', '--agent', 'codex', '--profile', 'minimal', '--json'];
  const preview = run([...args, '--dry-run'], env);
  assert.equal(preview.status, 0, preview.stderr);
  assert.equal(JSON.parse(preview.stdout).status, 'planned');
  assert.deepEqual(await readdir(home), []);
  const refusal = run(args, env);
  assert.equal(refusal.status, 2, refusal.stderr);
  assert.match(refusal.stderr, /CONFIRMATION_REQUIRED/);
  assert.deepEqual(await readdir(home), []);
  const applied = run([...args, '--yes'], env);
  assert.equal(applied.status, 0, applied.stderr);
  assert.equal(JSON.parse(applied.stdout).status, 'installed');
  const status = run(['status', '--json'], env);
  assert.equal(status.status, 0, status.stderr);
  assert.deepEqual(JSON.parse(status.stdout).agents, ['codex']);
  const updated = run(['update', '--yes', '--json'], env);
  assert.equal(updated.status, 0, updated.stderr);
  assert.equal(JSON.parse(updated.stdout).status, 'unchanged');
  const rollback = run(['rollback', '--all', '--yes', '--json'], env);
  assert.equal(rollback.status, 0, rollback.stderr);
  assert.equal(JSON.parse(run(['status', '--json'], env).stdout).status, 'not-installed');
});

test('doctor reports malformed Claude settings and duplicate hooks without leaking them', async (t) => {
  const home = await mkdtemp(join(testDir, '.tmp-doctor-'));
  t.after(() => rm(home, { recursive: true, force: true }));
  const env = { HOME: home, USERPROFILE: home, CLAUDE_CONFIG_DIR: home, CODEX_HOME: '', PATH: '', Path: '' };
  const secret = 'private-contents-which-must-stay-out-of-output';
  const malformed = join(home, 'settings.json');
  await writeFile(malformed, secret);
  let result = run(['doctor', '--json'], env);
  assert.equal(result.status, 0, result.stderr);
  assert.ok(JSON.parse(result.stdout).checks.some(({ id, state }) => id === 'claudeHooks' && state === 'invalid'));
  assert.ok(!result.stdout.includes(secret));
  const hook = { type: 'command', command: secret };
  await writeFile(malformed, JSON.stringify({ hooks: { PreToolUse: [{ matcher: 'Bash', hooks: [hook, hook] }] } }));
  result = run(['doctor', '--json'], env);
  assert.ok(JSON.parse(result.stdout).checks.some(({ id, duplicates }) => id === 'claudeHooks' && duplicates === 1));
  assert.ok(!result.stdout.includes(secret));
  assert.ok(!result.stdout.includes(home));
});
