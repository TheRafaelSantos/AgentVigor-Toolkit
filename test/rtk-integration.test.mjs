import assert from 'node:assert/strict';
import { mkdtemp, mkdir, writeFile, readFile, readdir, rm, symlink } from 'node:fs/promises';
import { resolve, join } from 'node:path';
import { test } from 'node:test';
import { fileURLToPath } from 'node:url';
import { runFile } from '../lib/process.mjs';
import { configureRtk } from '../lib/rtk-integration.mjs';

async function fixture(t) {
  const home = await mkdtemp(resolve('.agentvigor-test-rtk-'));
  t.after(() => rm(home, { recursive: true, force: true }));
  await mkdir(join(home, '.codex'));
  await writeFile(join(home, '.codex', 'AGENTS.md'), '# User rules\n');
  const run = async (_, args, { env }) => {
    if (args.includes('--version')) return { code: 0, stdout: 'rtk 1.1.0', stderr: '' };
    if (args.includes('--help')) return { code: 0, stdout: 'Usage: rtk gain [OPTIONS]', stderr: '' };
    assert.ok(!args.includes('--auto-patch'), 'Codex initializer cannot combine --codex with --auto-patch');
    await writeFile(join(env.CODEX_HOME, 'AGENTS.md'), '# User rules\n@' + join(env.CODEX_HOME, 'RTK.md') + '\n');
    await writeFile(join(env.CODEX_HOME, 'RTK.md'), '# RTK awareness\n');
    await writeFile(join(env.CODEX_HOME, 'hooks.json'), JSON.stringify({ hooks: { PreToolUse: [{ matcher: 'Bash', hooks: [{ type: 'command', command: 'rtk hook codex' }] }] } }));
    return { code: 0, stdout: '', stderr: '' };
  };
  return { home, env: {}, executable: process.execPath, run };
}

test('RTK configuration previews exact files, requires consent and restores user rules', async t => {
  const options = await fixture(t);
  const preview = await configureRtk({ ...options, dryRun: true });
  assert.equal(preview.status, 'planned');
  assert.equal(preview.changes.length, 3);
  assert.deepEqual(await readdir(join(options.home, '.codex')), ['AGENTS.md']);
  await assert.rejects(configureRtk(options), { code: 'CONFIRMATION_REQUIRED' });
  assert.equal((await configureRtk({ ...options, expectedPlan: preview.planToken })).status, 'configured');
  const rules = await readFile(join(options.home, '.codex', 'AGENTS.md'), 'utf8');
  assert.ok(rules.includes(join(options.home, '.codex', 'RTK.md')));
  const rollback = await configureRtk({ ...options, mode: 'rollback', dryRun: true });
  await configureRtk({ ...options, mode: 'rollback', expectedPlan: rollback.planToken });
  assert.equal(await readFile(join(options.home, '.codex', 'AGENTS.md'), 'utf8'), '# User rules\n');
  assert.deepEqual(await readdir(join(options.home, '.codex')), ['AGENTS.md']);
});

test('RTK refuses changed previews and preserves edits made after configuration', async t => {
  const options = await fixture(t);
  const preview = await configureRtk({ ...options, dryRun: true });
  await writeFile(join(options.home, '.codex', 'AGENTS.md'), '# New user rules\n');
  await assert.rejects(configureRtk({ ...options, expectedPlan: preview.planToken }), { code: 'PLAN_CHANGED' });
  const fresh = await configureRtk({ ...options, dryRun: true });
  await configureRtk({ ...options, expectedPlan: fresh.planToken });
  await writeFile(join(options.home, '.codex', 'RTK.md'), 'Edited awareness');
  await assert.rejects(configureRtk({ ...options, mode: 'rollback', dryRun: true }), { code: 'SKILL_DRIFT' });
  await assert.rejects(configureRtk({ ...options, dryRun: true }), { code: 'SKILL_DRIFT' });
});

test('an interrupted rollback recovers without the original executable', async t => {
  const options = await fixture(t);
  const preview = await configureRtk({ ...options, dryRun: true });
  await configureRtk({ ...options, expectedPlan: preview.planToken });
  const statePath = join(options.home, '.agentvigor', 'integrations', 'rtk-codex', 'state.json');
  const state = JSON.parse(await readFile(statePath, 'utf8'));
  const partial = { ...state, status: 'pending', interrupted: state.after, after: state.before };
  await writeFile(statePath, JSON.stringify(partial));
  await writeFile(join(options.home, '.codex', 'AGENTS.md'), Buffer.from(state.before['AGENTS.md'], 'base64'));
  const rollback = { ...options, executable: undefined, mode: 'rollback' };
  const plan = await configureRtk({ ...rollback, dryRun: true });
  assert.equal((await configureRtk({ ...rollback, expectedPlan: plan.planToken })).status, 'rolled-back');
  assert.deepEqual(await readdir(join(options.home, '.codex')), ['AGENTS.md']);
});

test('linked configuration files and failed official generation cannot modify the target', async t => {
  const options = await fixture(t);
  const target = join(options.home, 'custom-folder');
  await mkdir(target);
  await writeFile(join(target, 'rules.json'), '{}');
  await symlink(target, join(options.home, '.codex', 'hooks.json'), process.platform === 'win32' ? 'junction' : 'dir');
  await assert.rejects(configureRtk({ ...options, dryRun: true }), { code: 'UNSAFE_PATH' });
  assert.equal(await readFile(join(target, 'rules.json'), 'utf8'), '{}');
  await rm(join(options.home, '.codex', 'hooks.json'), { recursive: true });
  const run = async (_, args) => ({ code: args.includes('--version') ? 0 : 1, stdout: 'rtk 1.1.0', stderr: '' });
  await assert.rejects(configureRtk({ ...options, run, dryRun: true }), { code: 'RTK_FAILED' });
  assert.equal(await readFile(join(options.home, '.codex', 'AGENTS.md'), 'utf8'), '# User rules\n');
});

test('RTK accepts a linked operating-system temporary directory without trusting linked user files', async t => {
  const options = await fixture(t);
  const target = join(options.home, 'physical-temp');
  const alias = join(options.home, 'system-temp');
  await mkdir(target);
  await symlink(target, alias, process.platform === 'win32' ? 'junction' : 'dir');
  const result = await runFile(process.execPath, ['--test', '--test-name-pattern=RTK configuration previews',
    fileURLToPath(import.meta.url)], { env: { ...process.env, TMPDIR: alias, TMP: alias, TEMP: alias },
    timeoutMs: 15000, maxOutputBytes: 16384 });
  assert.equal(result.code, 0, result.stdout + result.stderr);
});
