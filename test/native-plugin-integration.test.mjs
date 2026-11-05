import assert from 'node:assert/strict';
import * as fs from 'node:fs/promises';
import { join, resolve } from 'node:path';
import { test } from 'node:test';
import { manageNativePlugin, nativePluginEvidence, nativePluginSources } from '../lib/native-plugin-integration.mjs';

async function fixture(t, tool = 'ponytail') {
  const home = await fs.mkdtemp(resolve('.agentvigor-test-native-'));
  t.after(() => fs.rm(home, { recursive: true, force: true }));
  const root = join(home, '.codex');
  await fs.mkdir(root);
  const original = 'model = "preserved"\n[plugins."other@existing"]\nenabled = true\n';
  await fs.writeFile(join(root, 'config.toml'), original);
  const source = nativePluginSources[tool];
  const prefix = `plugins/cache/${source.marketplace}/${tool}/${source.version}`;
  const nativeConfig = `[marketplaces.${source.marketplace}]\nsource_type = "git"\nsource = "https://github.com/${source.repository}.git"\nref = "${source.revision}"\n\n[plugins."${tool}@${source.marketplace}"]\nenabled = true\n`;
  const calls = [];
  const run = async (executable, args, { cwd, env }) => {
    calls.push(args);
    assert.notEqual(env.HOME, home);
    assert.equal(env.HOME, env.USERPROFILE);
    assert.equal(env.NATIVE_TEST_SECRET, undefined);
    assert.equal(env.DO_NOT_TRACK, '1');
    assert.equal(env.GIT_TERMINAL_PROMPT, '0');
    assert.equal(cwd, env.HOME);
    if (args[0] === '-C') return { code: 0, stdout: source.revision };
    assert.equal(args.at(-1), '--json');
    if (args[1] === 'marketplace') {
      assert.deepEqual(args, ['plugin', 'marketplace', 'add', source.repository, '--ref', source.revision, '--json']);
      const manifest = join(env.CODEX_HOME, '.tmp', 'marketplaces', source.marketplace, '.agents', 'plugins');
      await fs.mkdir(manifest, { recursive: true });
      await fs.writeFile(join(manifest, 'marketplace.json'), JSON.stringify({ name: source.marketplace,
        plugins: [{ name: tool, source: { url: './' } }],
      }));
      return { code: 0, stdout: JSON.stringify({ marketplaceName: source.marketplace, alreadyAdded: false }) };
    }
    if (args[1] === 'list') return { code: 0, stdout: JSON.stringify({ installed: [
      { pluginId: `${tool}@${source.marketplace}`, version: source.version, installed: true, enabled: true },
    ] }) };
    assert.deepEqual(args, ['plugin', 'add', `${tool}@${source.marketplace}`, '--json']);
    const path = join(env.CODEX_HOME, prefix);
    await fs.mkdir(join(path, '.codex-plugin'), { recursive: true });
    await fs.mkdir(join(path, '.git'), { recursive: true });
    await fs.mkdir(join(path, 'skills/example'), { recursive: true });
    await fs.writeFile(join(path, '.git/private-staging'), 'discarded staging metadata');
    await fs.writeFile(join(path, '.codex-plugin/plugin.json'), JSON.stringify({ name: tool, version: source.version, license: 'MIT' }));
    await fs.writeFile(join(path, 'LICENSE'), 'MIT upstream attribution');
    await fs.writeFile(join(path, 'skills/example/SKILL.md'), '---\nname: example\n---\n');
    await fs.writeFile(join(env.CODEX_HOME, 'config.toml'), nativeConfig);
    return { code: 0, stdout: JSON.stringify({ pluginId: `${tool}@${source.marketplace}`, version: source.version, installedPath: path }) };
  };
  return { home, root, original, prefix, calls, options: { home, tool, executable: process.execPath,
    env: { ...process.env, CODEX_HOME: root, NATIVE_TEST_SECRET: 'must-not-leak' }, run } };
}

for (const tool of ['superpowers', 'ponytail']) test(`native ${tool} plans, preserves unrelated settings, installs and rolls back offline`, async t => {
  const f = await fixture(t, tool);
  await assert.rejects(manageNativePlugin(f.options), { code: 'CONFIRMATION_REQUIRED' });
  assert.equal(f.calls.length, 0);
  const plan = await manageNativePlugin({ ...f.options, dryRun: true });
  assert.equal(plan.status, 'planned');
  assert.equal(plan.changes.length, 5);
  assert.equal(await fs.readFile(join(f.root, 'config.toml'), 'utf8'), f.original);
  await assert.rejects(fs.stat(join(f.home, '.agentvigor')), { code: 'ENOENT' });
  const installed = await manageNativePlugin({ ...f.options, expectedPlan: plan.planToken });
  assert.equal(installed.status, 'installed');
  assert.equal(installed.discovered.state, 'UNVERIFIED');
  const evidence = await nativePluginEvidence(f.options);
  assert.equal(evidence.installed.state, 'INSTALLED');
  assert.equal(evidence.configured.state, 'CONFIGURED');
  assert.equal(evidence.verified.state, 'UNVERIFIED');
  const calls = f.calls.length;
  const repeat = await manageNativePlugin({ ...f.options, dryRun: true });
  assert.equal((await manageNativePlugin({ ...f.options, expectedPlan: repeat.planToken })).status, 'unchanged');
  assert.equal(f.calls.length, calls);
  assert.ok((await fs.readFile(join(f.root, 'config.toml'), 'utf8')).startsWith(f.original));
  await assert.rejects(fs.stat(join(f.root, f.prefix, '.git')), { code: 'ENOENT' });
  const rollback = { ...f.options, mode: 'rollback', env: { CODEX_HOME: f.root, PATH: '' }, run: () => assert.fail('offline rollback') };
  const removal = await manageNativePlugin({ ...rollback, dryRun: true });
  assert.equal((await manageNativePlugin({ ...rollback, expectedPlan: removal.planToken })).status, 'rolled-back');
  assert.equal(await fs.readFile(join(f.root, 'config.toml'), 'utf8'), f.original);
  await assert.rejects(fs.stat(join(f.root, f.prefix)), { code: 'ENOENT' });
});

test('native lifecycle refuses stale plans, unmanaged installs, changed files and unexpected native settings', async t => {
  const f = await fixture(t);
  const plan = await manageNativePlugin({ ...f.options, dryRun: true });
  await fs.appendFile(join(f.root, 'config.toml'), '# concurrent user edit\n');
  await assert.rejects(manageNativePlugin({ ...f.options, expectedPlan: plan.planToken }), { code: 'PLAN_CHANGED' });
  assert.equal((await fs.readdir(f.root)).length, 1);
  await fs.writeFile(join(f.root, 'config.toml'), f.original);
  await assert.rejects(manageNativePlugin({ ...f.options, expectedPlan: plan.planToken,
    run: async (exe, args, execution) => {
      const result = await f.options.run(exe, args, execution);
      if (args[1] === 'add') await fs.appendFile(join(execution.env.CODEX_HOME, 'config.toml'), '\nmodel = "unexpected"\n');
      return result;
    } }), { code: 'INTEGRATION_FAILED' });
  await fs.appendFile(join(f.root, 'config.toml'), '# ponytail previously installed\n');
  await assert.rejects(manageNativePlugin({ ...f.options, dryRun: true }), { code: 'UNMANAGED_PLUGIN' });
  await fs.writeFile(join(f.root, 'config.toml'), f.original);
  await manageNativePlugin({ ...f.options, expectedPlan: plan.planToken });
  await fs.appendFile(join(f.root, f.prefix, 'LICENSE'), '\nuser change');
  await assert.rejects(manageNativePlugin({ ...f.options, mode: 'rollback', dryRun: true }), { code: 'SKILL_DRIFT' });
});

test('Claude lifecycle reports a concrete blocked handoff and does not run an installer', async () => {
  const result = await manageNativePlugin({ tool: 'superpowers', agent: 'claude', run: () => assert.fail('must not run') });
  assert.equal(result.status, 'BLOCKED');
  assert.equal(result.reason, 'CLAUDE_NATIVE_LIFECYCLE_UNVERIFIED');
  assert.equal(result.mutates, false);
  assert.equal(result.verified.state, 'UNVERIFIED');
});

for (const initialConfig of ['existing', 'absent']) test(`native plugins coexist and roll back out of order (${initialConfig} config)`, async t => {
  const first = await fixture(t, 'superpowers');
  const second = await fixture(t, 'ponytail');
  const a = first.options;
  const b = { ...second.options, home: first.home, env: { ...second.options.env, CODEX_HOME: first.root } };
  const config = join(first.root, 'config.toml');
  if (initialConfig === 'absent') await fs.unlink(config);
  async function apply(options) {
    const plan = await manageNativePlugin({ ...options, dryRun: true });
    return manageNativePlugin({ ...options, expectedPlan: plan.planToken });
  }
  assert.equal((await apply(a)).status, 'installed');
  assert.equal((await apply(b)).status, 'installed');
  assert.equal((await apply(a)).status, 'unchanged');
  assert.equal((await apply({ ...a, mode: 'rollback' })).status, 'rolled-back');
  assert.equal((await nativePluginEvidence(b)).configured.state, 'CONFIGURED');
  assert.equal((await apply(b)).status, 'unchanged');
  assert.equal((await apply({ ...b, mode: 'rollback' })).status, 'rolled-back');
  if (initialConfig === 'absent') await assert.rejects(fs.stat(config), { code: 'ENOENT' });
  else assert.equal(await fs.readFile(config, 'utf8'), first.original);
});
